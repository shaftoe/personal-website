/**
 * Lightweight ATproto client used at build time to collect microblogging
 * content (latest posts, postroll links, TIL entries) from the author's
 * self-hosted PDS.
 *
 * Every public function talks directly to the PDS via `com.atproto.repo.*`
 * XRPC methods (no auth required for reads) — zero dependency on Bluesky's
 * central AppView or any other network service. The sole exception is
 * {@link getAvatarBlob}, which also uses PDS-native endpoints.
 *
 * All data paths degrade gracefully (return empty results) on network
 * failures so that a build never breaks because the social API is unavailable.
 */
import { Temporal } from "temporal-polyfill"
import { siteConfig } from "../config"
import {
  readMicroblogImageSize,
  resizeMicroblogImage,
  writeMicroblogImage,
} from "./microblog-images"

// ---- Public types ----

export interface MicroPost {
  /** AT URI of the record, e.g. at://did:plc:…/app.bsky.feed.post/<rkey> */
  uri: string
  /** Human-friendly web URL on bsky.app */
  url: string
  /** Raw post text (plain text, with facets applied separately) */
  text: string
  /** Post content rendered as safe HTML (rich-text facets → anchors) */
  content: string
  createdAt: Temporal.Instant
  likeCount: number
  repostCount: number
  replyCount: number
  /** Embedded photos, hydrated with local WebP thumbnail paths (may be empty) */
  images: PostImage[]
  /** External link card (with a local thumbnail when one could be processed) */
  linkCard?: PostLinkCard
}

/** A post image served from this site as a size-capped WebP derivative. */
export interface PostImage {
  /** Blob CID — the deterministic filename stem under /images/microblog/ */
  cid: string
  alt: string
  /** Pixel dimensions of the processed file (for width/height attributes) */
  width: number
  height: number
}

/** External link card attached to a post (app.bsky.embed.external). */
export interface PostLinkCard {
  url: string
  title?: string
  description?: string
  thumb?: PostImage
}

export interface PostrollEntry {
  /** The shared link extracted from the post */
  url: string
  /** Web URL of the source post on bsky.app */
  postUrl: string
  createdAt: Temporal.Instant
}

// ---- PDS response shapes (only the fields we consume) ----

/** Blob reference embedded in an ATproto record (e.g. a profile avatar). */
interface BlobRef {
  $type: "blob"
  ref: { $link: string }
  mimeType: string
  size: number
}

interface DescribeRepoResponse {
  handle: string
  did: string
}

interface GetRecordResponse {
  uri: string
  cid?: string
  value: { avatar?: BlobRef } & Record<string, unknown>
}

// ---- PDS response shapes (only the fields we consume) ----

interface FacetFeature {
  $type: string
  /** Present on `app.bsky.richtext.facet#link` */
  uri?: string
  /** Present on `app.bsky.richtext.facet#mention` */
  did?: string
  /** Present on `app.bsky.richtext.facet#tag` */
  tag?: string
}

export interface Facet {
  index: { byteStart: number; byteEnd: number }
  features: FacetFeature[]
}

interface PostEmbedExternal {
  uri: string
  title?: string
  description?: string
  thumb?: BlobRef
}

/** A single image of an `app.bsky.embed.images` embed. */
interface EmbedImage {
  image: BlobRef
  alt?: string
  aspectRatio?: { width: number; height: number }
}

/** An `embed` on a post record — only the shapes we consume are modelled. */
interface PostEmbed {
  $type: string
  images?: EmbedImage[]
  external?: PostEmbedExternal
}

/** The `value` envelope of a record from `com.atproto.repo.listRecords`. */
interface PostRecordValue {
  text: string
  createdAt: string
  facets?: Facet[]
  reply?: { root: { uri: string }; parent: { uri: string } }
  embed?: PostEmbed
}

/** A single item from a `com.atproto.repo.listRecords` response. */
interface ListRecordsItem {
  uri: string
  cid: string
  value: PostRecordValue
}

interface ListRecordsResponse {
  records: ListRecordsItem[]
  cursor?: string
}

const LINK_FACET = "app.bsky.richtext.facet#link"
const MENTION_FACET = "app.bsky.richtext.facet#mention"
const TAG_FACET = "app.bsky.richtext.facet#tag"
const IMAGES_EMBED = "app.bsky.embed.images"
const EXTERNAL_EMBED = "app.bsky.embed.external"

// ---- HTML utilities ----

/**
 * Escapes the five significant HTML characters. Used on every piece of
 * untrusted post text before it reaches the DOM, so user-controlled content
 * can never inject markup.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Escapes text for safe inline display (also converts line breaks). */
function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />")
}

/**
 * Renders a Bluesky rich-text post (plain `text` plus byte-offset `facets`)
 * into safe HTML, turning link / mention / tag facets into anchors.
 *
 * Facet ranges use UTF-8 byte offsets, so the text is sliced on its encoded
 * byte representation (via TextEncoder/TextDecoder) to stay correct for any
 * Unicode content.
 */
export function renderRichText(text: string, facets: Facet[] = []): string {
  const bytes = new TextEncoder().encode(text)
  const decoder = new TextDecoder("utf-8", { fatal: false })

  const sorted = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart,
  )

  let cursor = 0
  let html = ""

  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index
    // Skip malformed or overlapping ranges defensively
    if (byteStart < cursor || byteEnd < byteStart) continue

    html += textToHtml(decoder.decode(bytes.subarray(cursor, byteStart)))

    const segment = decoder.decode(bytes.subarray(byteStart, byteEnd))
    const link = facet.features.find((f) => f.$type === LINK_FACET)
    const mention = facet.features.find((f) => f.$type === MENTION_FACET)
    const tag = facet.features.find((f) => f.$type === TAG_FACET)

    if (link?.uri) {
      html += `<a href="${escapeHtml(link.uri)}" target="_blank" rel="noopener noreferrer nofollow">${textToHtml(segment)}</a>`
    } else if (mention?.did) {
      html += `<a href="https://bsky.app/profile/${escapeHtml(mention.did)}" target="_blank" rel="noopener noreferrer">${textToHtml(segment)}</a>`
    } else if (tag?.tag) {
      html += `<a href="https://bsky.app/search?q=${encodeURIComponent(`#${tag.tag}`)}" target="_blank" rel="noopener noreferrer">${textToHtml(segment)}</a>`
    } else {
      html += textToHtml(segment)
    }

    cursor = byteEnd
  }

  html += textToHtml(decoder.decode(bytes.subarray(cursor)))
  return html
}

/**
 * Extracts the first URL from a post by taking the first HTTP(S) link in the
 * content. Prefers link facets (ordered by their position in the text) and
 * falls back to an external card embed.
 */
export function extractFirstUrl(
  facets: Facet[] = [],
  embed?: { $type: string; external?: PostEmbedExternal },
): string | null {
  const linkFacets = facets
    .filter((f) => f.features.some((feat) => feat.$type === LINK_FACET))
    .sort((a, b) => a.index.byteStart - b.index.byteStart)

  for (const facet of linkFacets) {
    const link = facet.features.find((feat) => feat.$type === LINK_FACET)
    if (link?.uri) return link.uri
  }

  if (embed?.external?.uri) return embed.external.uri
  return null
}

/** An image blob referenced by a post embed, before local processing. */
export interface RawPostImage {
  cid: string
  alt: string
  mimeType: string
  aspectRatio?: { width: number; height: number }
}

/** An external link card before its thumbnail (if any) is processed. */
export interface RawPostLinkCard {
  url: string
  title?: string
  description?: string
  thumb?: RawPostImage
}

/** Media extracted from a post embed, awaiting local image processing. */
export interface RawPostMedia {
  images: RawPostImage[]
  linkCard?: RawPostLinkCard
}

/**
 * Extracts the displayable media from a post embed: attached photos
 * (`app.bsky.embed.images`) and external link cards
 * (`app.bsky.embed.external`, with an optional thumbnail blob). Other embed
 * types (video, quoted posts, …) are intentionally ignored.
 */
export function extractPostMedia(embed?: PostEmbed): RawPostMedia {
  if (!embed) return { images: [] }

  if (embed.$type === IMAGES_EMBED && Array.isArray(embed.images)) {
    const images = embed.images
      .filter((image) => image.image?.ref?.$link)
      .map((image) => ({
        cid: image.image.ref.$link,
        alt: image.alt ?? "",
        mimeType: image.image.mimeType,
        ...(image.aspectRatio ? { aspectRatio: image.aspectRatio } : {}),
      }))
    return { images }
  }

  if (embed.$type === EXTERNAL_EMBED && embed.external?.uri) {
    const external = embed.external
    const thumb = external.thumb?.ref?.$link
      ? {
          cid: external.thumb.ref.$link,
          alt: external.title ?? external.description ?? "",
          mimeType: external.thumb.mimeType,
        }
      : undefined
    return {
      images: [],
      linkCard: {
        url: external.uri,
        ...(external.title ? { title: external.title } : {}),
        ...(external.description ? { description: external.description } : {}),
        ...(thumb ? { thumb } : {}),
      },
    }
  }

  return { images: [] }
}

// ---- Generic API client ----

const PDS_TIMEOUT = 10_000
const RECORDS_PER_PAGE = 100
/** Safety cap so a misbehaving cursor can never cause an infinite loop. */
const MAX_PAGES = 10

/**
 * `fetch` wrapper for PDS XRPC calls. **Throws** on network errors and
 * non-2xx responses — the public data paths (feed, postroll, TIL) wrap this
 * in `fetchPdsRecords` which degrades gracefully; {@link getAvatarBlob} lets
 * the throw propagate so a missing avatar fails the build.
 */
async function pdsFetch(url: string, label: string): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PDS_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    if (!res.ok) {
      throw new Error(
        `PDS request failed (${label}): ${res.status} ${res.statusText}`,
      )
    }
    return res
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDS fetch error (${label}): ${error.message}`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Pages through `com.atproto.repo.listRecords` on the self-hosted PDS,
 * invoking `onPage` for each batch of records. Returns gracefully on error.
 *
 * This is the PDS-native replacement for the Bluesky AppView's
 * `app.bsky.feed.getAuthorFeed` — no auth required, no central dependency.
 */
async function fetchPdsRecords(
  onPage: (items: ListRecordsItem[]) => boolean,
  label: string,
): Promise<void> {
  // Resolve handle to DID first (also validates the PDS is reachable)
  const did = await resolveDid(label)
  if (!did) {
    console.warn(
      `⚠️ PDS did not return a DID for handle "${siteConfig.atproto.handle}" — ${label}`,
    )
    return
  }

  let cursor: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string> = {
      repo: did,
      collection: "app.bsky.feed.post",
      limit: String(RECORDS_PER_PAGE),
    }
    if (cursor) params.cursor = cursor

    try {
      const res = await pdsFetch(
        `${siteConfig.atproto.pds}/xrpc/com.atproto.repo.listRecords?${new URLSearchParams(params)}`,
        `${label} — page ${page + 1}`,
      )
      const data = (await res.json()) as ListRecordsResponse

      const shouldContinue = onPage(data.records ?? [])
      if (!shouldContinue) break
      if (!data.cursor || data.cursor === cursor) break
      cursor = data.cursor
    } catch (error) {
      console.warn(
        `⚠️ Failed to fetch records from PDS: ${error instanceof Error ? error.message : String(error)} — ${label}`,
      )
      return
    }
  }
}

// ---- Helpers ----

/** Cached handle → DID resolution, shared by every data path below. */
let didCache: string | undefined

/**
 * Resolves the configured handle to its DID on the self-hosted PDS.
 * Returns `null` (with a console warning) on failure — callers degrade
 * gracefully rather than breaking the build.
 */
async function resolveDid(label: string): Promise<string | null> {
  if (didCache) return didCache
  try {
    const describeRes = await pdsFetch(
      `${siteConfig.atproto.pds}/xrpc/com.atproto.repo.describeRepo?${new URLSearchParams({ repo: siteConfig.atproto.handle })}`,
      `${label} — resolve handle`,
    )
    const describe = (await describeRes.json()) as DescribeRepoResponse
    if (!describe.did) return null
    didCache = describe.did
    return didCache
  } catch (error) {
    console.warn(
      `⚠️ Could not resolve handle "${siteConfig.atproto.handle}" on PDS — ${label} (${error instanceof Error ? error.message : String(error)})`,
    )
    return null
  }
}

/** Downloads raw blob bytes (e.g. an embedded image) from the PDS. */
async function getBlob(did: string, cid: string): Promise<ArrayBuffer> {
  const res = await pdsFetch(
    `${siteConfig.atproto.pds}/xrpc/com.atproto.sync.getBlob?${new URLSearchParams({ did, cid })}`,
    `download blob ${cid.slice(0, 12)}…`,
  )
  return res.arrayBuffer()
}

/** Per-process cache so each blob is downloaded and processed at most once. */
const blobCache = new Map<string, Promise<PostImage | null>>()

/**
 * Ensures a local, size-capped WebP derivative exists for a post image blob
 * (see src/lib/microblog-images.ts), returning its displayable shape — or
 * `null` when the blob cannot be fetched or processed, in which case the
 * post simply renders without that image.
 */
function ensureLocalImage(
  did: string,
  raw: RawPostImage,
): Promise<PostImage | null> {
  let pending = blobCache.get(raw.cid)
  if (!pending) {
    pending = processBlob(did, raw)
    blobCache.set(raw.cid, pending)
  }
  return pending
}

async function processBlob(
  did: string,
  raw: RawPostImage,
): Promise<PostImage | null> {
  const cached = await readMicroblogImageSize(raw.cid)
  if (cached) return { cid: raw.cid, alt: raw.alt, ...cached }

  try {
    const data = await getBlob(did, raw.cid)
    const image = await resizeMicroblogImage(data)
    writeMicroblogImage(raw.cid, image)
    return {
      cid: raw.cid,
      alt: raw.alt,
      width: image.width,
      height: image.height,
    }
  } catch (error) {
    console.warn(
      `⚠️ Could not fetch or process blob ${raw.cid} — post will render without it (${error instanceof Error ? error.message : String(error)})`,
    )
    return null
  }
}

/**
 * Hydrates posts with locally-processed media: every referenced image blob
 * is downloaded from the PDS, converted to a size-capped WebP under
 * `/images/microblog/`, and described with its final pixel dimensions.
 * Images that cannot be fetched are dropped, so pages never reference
 * missing files — the post just renders text-only.
 */
async function hydratePostMedia(
  posts: MicroPost[],
  rawMedia: Map<string, RawPostMedia>,
): Promise<void> {
  const withMedia = posts.filter((post) => {
    const media = rawMedia.get(post.uri)
    return (
      media !== undefined &&
      (media.images.length > 0 || media.linkCard?.thumb !== undefined)
    )
  })
  if (withMedia.length === 0) return

  const did = await resolveDid("hydrate post media")
  if (!did) {
    console.warn("⚠️ Skipping microblog post media — could not resolve DID")
    return
  }

  await Promise.all(
    withMedia.map(async (post) => {
      const media = rawMedia.get(post.uri)
      if (!media) return

      const images = await Promise.all(
        media.images.map((raw) => ensureLocalImage(did, raw)),
      )
      post.images = images.filter((image): image is PostImage => image !== null)

      if (post.linkCard && media.linkCard?.thumb) {
        const thumb = await ensureLocalImage(did, media.linkCard.thumb)
        if (thumb) post.linkCard = { ...post.linkCard, thumb }
      }
    }),
  )
}

/** Build the bsky.app web URL for a post from its AT URI. */
function postWebUrl(uri: string): string {
  const rkey = uri.split("/").pop()
  return `https://bsky.app/profile/${siteConfig.atproto.handle}/post/${rkey}`
}

/** Convert a `ListRecordsItem` into the public MicroPost shape. */
function itemToMicroPost(
  item: ListRecordsItem,
  media: RawPostMedia,
): MicroPost {
  const value = item.value
  return {
    uri: item.uri,
    url: postWebUrl(item.uri),
    text: value.text,
    content: renderRichText(value.text, value.facets),
    createdAt: Temporal.Instant.from(value.createdAt),
    likeCount: 0,
    repostCount: 0,
    replyCount: 0,
    images: [],
    ...(media.linkCard
      ? {
          linkCard: {
            url: media.linkCard.url,
            ...(media.linkCard.title ? { title: media.linkCard.title } : {}),
            ...(media.linkCard.description
              ? { description: media.linkCard.description }
              : {}),
          },
        }
      : {}),
  }
}

/** Whether a post record carries the given hashtag (facet tag, without #). */
function recordHasTag(value: PostRecordValue, tag: string): boolean {
  return (value.facets ?? []).some((f) =>
    f.features.some((feat) => feat.$type === TAG_FACET && feat.tag === tag),
  )
}

/** True when the record is a top-level post (not a reply). */
function isTopLevelPost(value: PostRecordValue): boolean {
  return !value.reply
}

// ---- Public API ----

/**
 * Fetches the raw avatar bytes from the self-hosted PDS.
 *
 * Unlike the feed helpers below this does **not** degrade gracefully — if the
 * PDS is unreachable, returns a non-200, or the profile has no avatar, it
 * throws so that the build fails loudly (see issue #397).
 *
 * Flow (all against `siteConfig.atproto.pds`, zero dependency on Bluesky's
 * central infrastructure):
 *  1. `com.atproto.repo.describeRepo` → resolve handle to DID
 *  2. `com.atproto.repo.getRecord`    → get the avatar blob reference
 *  3. `com.atproto.sync.getBlob`      → download raw image bytes
 */
export async function getAvatarBlob(): Promise<{
  data: ArrayBuffer
  mimeType: string
}> {
  const pds = siteConfig.atproto.pds
  const handle = siteConfig.atproto.handle

  // 1. Resolve handle → DID
  const describeRes = await pdsFetch(
    `${pds}/xrpc/com.atproto.repo.describeRepo?${new URLSearchParams({ repo: handle })}`,
    "resolve handle → DID",
  )
  const describe = (await describeRes.json()) as DescribeRepoResponse
  if (!describe.did) {
    throw new Error(`PDS did not return a DID for handle "${handle}"`)
  }

  // 2. Get profile record → avatar blob ref
  const recordRes = await pdsFetch(
    `${pds}/xrpc/com.atproto.repo.getRecord?${new URLSearchParams({
      repo: describe.did,
      collection: "app.bsky.actor.profile",
      rkey: "self",
    })}`,
    "fetch profile record",
  )
  const record = (await recordRes.json()) as GetRecordResponse
  const avatar = record.value?.avatar
  if (!avatar?.ref?.$link) {
    throw new Error("Profile record has no avatar blob")
  }

  // 3. Download the blob bytes
  const blobRes = await pdsFetch(
    `${pds}/xrpc/com.atproto.sync.getBlob?${new URLSearchParams({
      did: describe.did,
      cid: avatar.ref.$link,
    })}`,
    "download avatar blob",
  )
  const data = await blobRes.arrayBuffer()
  return { data, mimeType: avatar.mimeType }
}

/**
 * Fetches the latest N original posts (no replies, no reposts) from the
 * author's self-hosted PDS, with embedded media hydrated into local
 * size-capped WebP images.
 */
export async function getLatestPosts(limit = 3): Promise<MicroPost[]> {
  const posts: MicroPost[] = []
  const rawMedia = new Map<string, RawPostMedia>()

  await fetchPdsRecords((items) => {
    for (const item of items) {
      if (!isTopLevelPost(item.value)) continue
      const media = extractPostMedia(item.value.embed)
      rawMedia.set(item.uri, media)
      posts.push(itemToMicroPost(item, media))
      if (posts.length >= limit) return false
    }
    return posts.length < limit
  }, "getLatestPosts — homepage will render without microblog posts")

  if (posts.length === 0) {
    console.warn(
      "⚠️ PDS returned no posts — homepage will render without microblog posts",
    )
    return posts
  }

  await hydratePostMedia(posts, rawMedia)
  return posts
}

/**
 * Collects all posts tagged #postroll and extracts the first URL from each,
 * producing the entries shown on the /postroll page.
 */
export async function getPostrollEntries(): Promise<PostrollEntry[]> {
  const entries: PostrollEntry[] = []

  await fetchPdsRecords((items) => {
    for (const item of items) {
      const value = item.value
      if (!isTopLevelPost(value)) continue
      if (!recordHasTag(value, "postroll")) continue

      const url = extractFirstUrl(value.facets, value.embed)
      if (url) {
        entries.push({
          url,
          postUrl: postWebUrl(item.uri),
          createdAt: Temporal.Instant.from(value.createdAt),
        })
      }
    }
    return true // keep paginating
  }, `getPostrollEntries — returning ${entries.length} entries fetched so far`)

  return entries
}

/**
 * Collects all posts tagged #til (Today I Learned) for the /til page,
 * with embedded media hydrated into local size-capped WebP images.
 */
export async function getTilPosts(): Promise<MicroPost[]> {
  const posts: MicroPost[] = []
  const rawMedia = new Map<string, RawPostMedia>()

  await fetchPdsRecords((items) => {
    for (const item of items) {
      const value = item.value
      if (!isTopLevelPost(value)) continue
      if (!recordHasTag(value, "til")) continue
      const media = extractPostMedia(value.embed)
      rawMedia.set(item.uri, media)
      posts.push(itemToMicroPost(item, media))
    }
    return true // keep paginating
  }, `getTilPosts — returning ${posts.length} posts fetched so far`)

  await hydratePostMedia(posts, rawMedia)
  return posts
}
