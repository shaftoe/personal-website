/**
 * Lightweight ATproto / Bluesky client used at build time to collect
 * microblogging content (latest posts, postroll links, TIL entries) from the
 * author's account hosted on a self-hosted PDS.
 *
 * It talks directly to the Bluesky public AppView over plain `fetch` — no SDK
 * dependency — and degrades gracefully (returns empty results) on network
 * failures so that a build never breaks because the social API is unavailable.
 */
import { Temporal } from "temporal-polyfill"
import { siteConfig } from "../config"

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
}

export interface PostrollEntry {
  /** The shared link extracted from the post */
  url: string
  /** Web URL of the source post on bsky.app */
  postUrl: string
  createdAt: Temporal.Instant
}

// ---- ATproto response shapes (only the fields we consume) ----

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
}

interface PostRecord {
  text: string
  createdAt: string
  facets?: Facet[]
  embed?: {
    $type: string
    external?: PostEmbedExternal
  }
}

interface PostView {
  uri: string
  author: { handle: string }
  record: PostRecord
  likeCount?: number
  repostCount?: number
  replyCount?: number
}

interface FeedViewPost {
  post: PostView
  /** Present when the item is a repost */
  reason?: { $type: string }
}

interface GetAuthorFeedResponse {
  feed: FeedViewPost[]
  cursor?: string
}

const LINK_FACET = "app.bsky.richtext.facet#link"
const MENTION_FACET = "app.bsky.richtext.facet#mention"
const TAG_FACET = "app.bsky.richtext.facet#tag"

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
  embed?: PostRecord["embed"],
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

// ---- Generic API client ----

const FETCH_TIMEOUT = 8_000
const POSTS_PER_PAGE = 100
/** Safety cap so a misbehaving cursor can never cause an infinite loop. */
const MAX_PAGES = 10

async function fetchXrpc(
  method: string,
  params: Record<string, string>,
  label: string,
): Promise<unknown | null> {
  const url = `${siteConfig.atproto.appview}/xrpc/${method}?${new URLSearchParams(params)}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    if (!res.ok) {
      throw new Error(`ATproto API error: ${res.status} ${res.statusText}`)
    }
    return await res.json()
  } catch (error) {
    console.warn(
      `⚠️ ATproto API fetch failed: ${error instanceof Error ? error.message : String(error)} — ${label}`,
    )
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Pages through the author's feed, invoking `onPage` for each batch.
 *
 * @param onPage   Called with each page of feed items; return false to stop
 * @param label    Human-readable context used in warning messages
 */
async function fetchAuthorFeed(
  onPage: (items: FeedViewPost[]) => boolean,
  label: string,
): Promise<void> {
  let cursor: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string> = {
      actor: siteConfig.atproto.handle,
      filter: "posts_no_replies",
      limit: String(POSTS_PER_PAGE),
    }
    if (cursor) params.cursor = cursor

    const data = await fetchXrpc("app.bsky.feed.getAuthorFeed", params, label)
    if (!data) break

    const { feed, cursor: nextCursor } = data as GetAuthorFeedResponse
    const shouldContinue = onPage(feed ?? [])
    if (!shouldContinue) break
    if (!nextCursor || nextCursor === cursor) break
    cursor = nextCursor
  }
}

// ---- Helpers ----

/** Build the bsky.app web URL for a post from its AT URI. */
function postWebUrl(post: PostView): string {
  const rkey = post.uri.split("/").pop()
  return `https://bsky.app/profile/${siteConfig.atproto.handle}/post/${rkey}`
}

/** True for the author's own original posts (skips reposts). */
function isOriginalPost(item: FeedViewPost): boolean {
  return !item.reason
}

/** Convert a raw PostView into the public MicroPost shape. */
function toMicroPost(post: PostView): MicroPost {
  const record = post.record
  return {
    uri: post.uri,
    url: postWebUrl(post),
    text: record.text,
    content: renderRichText(record.text, record.facets),
    createdAt: Temporal.Instant.from(record.createdAt),
    likeCount: post.likeCount ?? 0,
    repostCount: post.repostCount ?? 0,
    replyCount: post.replyCount ?? 0,
  }
}

/** Whether a post carries the given hashtag (facet tag, without the #). */
function postHasTag(post: PostView, tag: string): boolean {
  return (post.record.facets ?? []).some((f) =>
    f.features.some((feat) => feat.$type === TAG_FACET && feat.tag === tag),
  )
}

// ---- Public API ----

/**
 * Fetches the latest N original posts (no replies, no reposts) from the
 * configured ATproto account.
 */
export async function getLatestPosts(limit = 3): Promise<MicroPost[]> {
  const posts: MicroPost[] = []

  await fetchAuthorFeed((items) => {
    for (const item of items) {
      if (!isOriginalPost(item)) continue
      posts.push(toMicroPost(item.post))
      if (posts.length >= limit) return false
    }
    return posts.length < limit
  }, "homepage will render without microblog posts")

  if (posts.length === 0) {
    console.warn(
      "⚠️ ATproto returned no posts — homepage will render without microblog posts",
    )
  }

  return posts
}

/**
 * Collects all posts tagged #postroll and extracts the first URL from each,
 * producing the entries shown on the /postroll page.
 */
export async function getPostrollEntries(): Promise<PostrollEntry[]> {
  const entries: PostrollEntry[] = []

  await fetchAuthorFeed((items) => {
    for (const item of items) {
      if (!isOriginalPost(item)) continue
      const post = item.post
      if (!postHasTag(post, "postroll")) continue

      const url = extractFirstUrl(post.record.facets, post.record.embed)
      if (url) {
        entries.push({
          url,
          postUrl: postWebUrl(post),
          createdAt: Temporal.Instant.from(post.record.createdAt),
        })
      }
    }
    return true // keep paginating
  }, `returning ${entries.length} postroll entries fetched so far`)

  return entries
}

/**
 * Collects all posts tagged #til (Today I Learned) for the /til page.
 */
export async function getTilPosts(): Promise<MicroPost[]> {
  const posts: MicroPost[] = []

  await fetchAuthorFeed((items) => {
    for (const item of items) {
      if (!isOriginalPost(item)) continue
      if (!postHasTag(item.post, "til")) continue
      posts.push(toMicroPost(item.post))
    }
    return true // keep paginating
  }, `returning ${posts.length} til posts fetched so far`)

  return posts
}
