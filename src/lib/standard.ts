/**
 * Standard.site lexicon publishing support.
 *
 * Standard.site is a community-maintained set of AT Protocol lexicons for
 * long-form publishing (`site.standard.publication`, `site.standard.document`,
 * …). This module is the "write side" counterpart to {@link "./atproto"}: it
 * gives the long-form blog articles the same ATproto presence the microblog
 * already has.
 *
 * Responsibilities:
 *
 * - **Record builders** — turn `siteConfig` + blog frontmatter into
 *   `site.standard.*` record values, mapped ~1:1 onto the lexicon fields.
 * - **Sidecar** — read/write the committed `standard.json` that stores the
 *   AT-URIs returned by the PDS so the build (which has no write credentials)
 *   can emit the domain-verification endpoint and the per-article `<link>` tags.
 * - **PDS write client** — authenticated `createSession` / `putRecord` /
 *   `uploadBlob` used by the CLI sync scripts (reads stay unauthenticated, see
 *   {@link "./atproto"}).
 * - **Utilities** — TID generation for record keys and Markdown → plain-text
 *   conversion for the document `textContent` field.
 *
 * The schema field shapes below mirror the live lexicons published by
 * `did:plc:re3ebnp5v7ffagz6rb6xfei4` (standard.site).
 */
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { siteConfig } from "../config"

// ---- Public constants ----

export const PUBLICATION_COLLECTION = siteConfig.standard.publicationCollection
export const DOCUMENT_COLLECTION = siteConfig.standard.documentCollection

// ---- Sidecar types ----

export interface RecordRef {
  /** Full AT URI of the record, e.g. `at://did:plc:…/site.standard.document/<rkey>` */
  uri: string
  /** Content ID (CID) of the record, used for strong references. */
  cid: string
  /**
   * SHA-256 of the record's source at the last sync, used to skip no-op
   * re-syncs. Absent on records written before change-tracking was introduced.
   */
  hash?: string
}

export interface StandardSidecar {
  /** The single publication record for this site, once created. */
  publication: RecordRef | null
  /** Document records keyed by blog post slug. */
  documents: Record<string, RecordRef>
}

// ---- AT Protocol blob / record shapes (only what we consume) ----

export interface BlobRef {
  $type: "blob"
  ref: { $link: string }
  mimeType: string
  size: number
}

// ---- Sidecar persistence ----

/** Absolute path to the committed standard.json sidecar. */
function sidecarPath(): string {
  return join(process.cwd(), siteConfig.standard.sidecarPath)
}

/**
 * Reads the committed sidecar. Degrades to an empty sidecar if the file is
 * missing or unparseable so the build never breaks before adoption.
 */
export function readStandardSidecar(): StandardSidecar {
  try {
    const raw = readFileSync(sidecarPath(), "utf-8")
    const data = JSON.parse(raw) as Partial<StandardSidecar>
    return {
      publication: data.publication ?? null,
      documents: data.documents ?? {},
    }
  } catch {
    return { publication: null, documents: {} }
  }
}

/** Writes the sidecar, creating parent directories as needed. */
export function writeStandardSidecar(data: StandardSidecar): void {
  writeFileSync(sidecarPath(), `${JSON.stringify(data, null, 2)}\n`)
}

// ---- Build-time readers (used by the endpoint + BlogLayout) ----

/** The publication record's AT URI, or `null` if not yet created. */
export function getPublicationUri(): string | null {
  return readStandardSidecar().publication?.uri ?? null
}

/** The document record AT URI for a given post slug, or `null`. */
export function getDocumentUri(slug: string): string | null {
  return readStandardSidecar().documents[slug]?.uri ?? null
}

// ---- TID generation (base32-sortable record keys) ----

const TID_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz"

/**
 * Encodes a non-negative 64-bit integer as a 13-character base32-sortable
 * string — the same encoding AT Protocol uses for TIDs.
 */
function encodeBase32Sortable(value: bigint): string {
  let result = ""
  let v = value
  for (let i = 0; i < 13; i++) {
    result = TID_ALPHABET[Number(v & 31n)] + result
    v >>= 5n
  }
  return result
}

/**
 * Generates a base32-sortable TID (13 chars) suitable for an AT Protocol
 * record key. The upper 53 bits encode microseconds since the Unix epoch; the
 * lower 11 bits are random to avoid collisions within the same microsecond.
 */
export function generateTid(now: Date = new Date()): string {
  const micros = BigInt(now.getTime()) * 1000n
  const clockId = BigInt(Math.floor(Math.random() * 0x800)) // 0–2047
  return encodeBase32Sortable((micros << 11n) | clockId)
}

/** Extracts the record key (final path segment) from an AT URI. */
export function extractRkey(uri: string): string {
  return uri.split("/").pop() ?? ""
}

// ---- Markdown → plain text ----

/**
 * Reduces Markdown to a plain-text representation suitable for the document
 * `textContent` field (the lexicon requires plain text, no formatting).
 *
 * Strips headings, emphasis, code fences, link/image syntax, blockquotes, list
 * markers and HTML, while preserving the readable prose. The result is not a
 * perfect rendering — it is meant for indexing/search, not display.
 */
export function markdownToPlainText(markdown: string): string {
  let text = markdown

  // HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "")
  // Reference link definitions:  [id]: https://example.com "Title"
  text = text.replace(/^[ \t]*\[[^\]]+\]:[ \t]*\S+.*$/gm, "")
  // Fenced code block delimiters (keep the inner content)
  text = text.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*$/gm, "")
  // Images:  ![alt text](url)  →  alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
  // Reference-style links:  [text][id] / [text][]  →  text
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
  // Inline links:  [text](url)  →  text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  // Autolinks in angle brackets:  <https://…>  →  https://…
  text = text.replace(/<(https?:\/\/[^>]+)>/g, "$1")
  // Inline code backticks (keep content)
  text = text.replace(/`([^`]+)`/g, "$1")
  // Remaining HTML tags
  text = text.replace(/<[^>]+>/g, "")
  // ATX heading markers
  text = text.replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
  // Blockquote markers
  text = text.replace(/^[ \t]*>[ \t]?/gm, "")
  // Unordered + ordered list markers
  text = text.replace(/^[ \t]*[-*+][ \t]+/gm, "")
  text = text.replace(/^[ \t]*\d+\.[ \t]+/gm, "")
  // Horizontal rules
  text = text.replace(/^[ \t]*([-*_][ \t]?){3,}[ \t]*$/gm, "")
  // Bold, then italic (lookarounds keep underscores inside identifiers intact)
  text = text.replace(/\*\*(.+?)\*\*/g, "$1")
  text = text.replace(/__(.+?)__/g, "$1")
  text = text.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "$1")
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, "$1")

  // Collapse runs of blank lines and trim
  return text.replace(/\n{3,}/g, "\n\n").trim()
}

// ---- Record builders ----

/** Builds the `site.standard.publication` record value from `siteConfig`. */
export function buildPublicationRecord(
  opts: { icon?: BlobRef; createdAt?: string } = {},
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    $type: PUBLICATION_COLLECTION,
    // Lexicon requires no trailing slash on the base url; baseUrl has none.
    url: siteConfig.globalMeta.baseUrl,
    name: siteConfig.blogMeta.title,
    description:
      siteConfig.blogMeta.longDescription ?? siteConfig.blogMeta.description,
    preferences: { showInDiscover: true },
    createdAt: opts.createdAt ?? new Date().toISOString(),
  }
  if (opts.icon) record.icon = opts.icon
  return record
}

/**
 * Builds a `site.standard.document` record value from a blog post.
 *
 * `publishedAt` should be an ISO-8601 datetime string. `site` must be the
 * publication record's AT URI (see {@link getPublicationUri}).
 */
export function buildDocumentRecord(opts: {
  site: string
  title: string
  description?: string
  path: string
  tags?: string[]
  publishedAt: string
  updatedAt?: string
  textContent?: string
}): Record<string, unknown> {
  // The canonical URL is not a record field: the lexicon derives it from the
  // publication `url` combined with the document `path`, so we only set `path`.
  const record: Record<string, unknown> = {
    $type: DOCUMENT_COLLECTION,
    site: opts.site,
    title: opts.title,
    publishedAt: opts.publishedAt,
    path: opts.path,
  }
  if (opts.description) record.description = opts.description
  if (opts.tags && opts.tags.length > 0) record.tags = opts.tags
  if (opts.updatedAt) record.updatedAt = opts.updatedAt
  if (opts.textContent) record.textContent = opts.textContent
  return record
}

/**
 * Stable signature of the publication's *source* — used to skip no-op
 * re-syncs. It covers the site-derived fields plus the icon file's own content
 * hash, but deliberately excludes `createdAt` (set once and then reused) and
 * the icon's PDS blob ref (content-addressed, but assigned by the PDS), so the
 * hash only changes when the publication's actual content changes.
 */
export function publicationSyncHash(iconHash: string | null): string {
  return hashRecordPayload({
    url: siteConfig.globalMeta.baseUrl,
    name: siteConfig.blogMeta.title,
    description:
      siteConfig.blogMeta.longDescription ?? siteConfig.blogMeta.description,
    preferences: { showInDiscover: true },
    iconHash,
  })
}

// ---- Change detection (content hashing) ----

/**
 * Canonical JSON serialization that sorts object keys at every depth, so the
 * output (and therefore the hash) is independent of property enumeration order.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }
  const obj = value as Record<string, unknown>
  const entries = Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
  return `{${entries.join(",")}}`
}

/**
 * Stable SHA-256 digest of a record's source payload. Two syncs that would
 * produce the same record yield the same hash, so the sync scripts can skip the
 * PDS write entirely when nothing has changed (pass `--force` to override).
 */
export function hashRecordPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex")
}

// ---- PDS read/write client ----

const PDS_TIMEOUT = 15_000

/** `fetch` wrapper for PDS XRPC calls; throws on network error / non-2xx. */
async function pdsFetch(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PDS_TIMEOUT)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(
        `PDS request failed (${label}): ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`,
      )
    }
    return res
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") {
      throw new Error(`PDS fetch error (${label}): ${error.message}`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Resolves the configured handle to its DID via the self-hosted PDS. */
export async function resolveDid(): Promise<string> {
  const { pds, handle } = siteConfig.atproto
  const res = await pdsFetch(
    `${pds}/xrpc/com.atproto.identity.resolveHandle?${new URLSearchParams({ handle })}`,
    { headers: { Accept: "application/json" } },
    "resolve handle → DID",
  )
  const data = (await res.json()) as { did?: string }
  if (!data.did) throw new Error(`PDS returned no DID for handle "${handle}"`)
  return data.did
}

export interface Session {
  did: string
  accessJwt: string
}

/**
 * Creates an authenticated session against the self-hosted PDS using a Bluesky
 * app password. The access JWT is required for all write operations.
 */
export async function createSession(appPassword: string): Promise<Session> {
  const { pds, handle } = siteConfig.atproto
  const res = await pdsFetch(
    `${pds}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    },
    "create session",
  )
  const data = (await res.json()) as { did: string; accessJwt: string }
  return { did: data.did, accessJwt: data.accessJwt }
}

/**
 * Idempotently creates or replaces a record (`com.atproto.repo.putRecord`).
 * Using an explicit `rkey` makes re-running a sync update the same record
 * instead of creating duplicates.
 *
 * Validation is explicitly disabled (`validate: false`) because the `site.
 * standard.*` lexicons are community-maintained and are **not** bundled in the
 * PDS's built-in lexicon store (which only ships `com.atproto.*` / `app.bsky.*`).
 * With validation enabled the PDS rejects the record as an "Unknown lexicon
 * type". The record shapes are instead validated client-side against the live
 * schemas (see {@link buildPublicationRecord} / {@link buildDocumentRecord}),
 * which is the standard approach for custom-lexicon records.
 */
export async function putRecord(
  session: Session,
  collection: string,
  rkey: string,
  record: Record<string, unknown>,
): Promise<RecordRef> {
  const res = await pdsFetch(
    `${siteConfig.atproto.pds}/xrpc/com.atproto.repo.putRecord`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection,
        rkey,
        record,
        validate: false,
      }),
    },
    `put ${collection}/${rkey}`,
  )
  const data = (await res.json()) as { uri: string; cid: string }
  return { uri: data.uri, cid: data.cid }
}

/** Uploads a blob to the PDS and returns its reference. */
export async function uploadBlob(
  session: Session,
  bytes: Uint8Array,
  mimeType: string,
): Promise<BlobRef> {
  // Copy into a standalone ArrayBuffer (the Buffer from readFileSync may
  // reference a shared pool) so the body is portable across runtimes.
  const body = new Uint8Array(bytes.byteLength)
  body.set(bytes)
  const res = await pdsFetch(
    `${siteConfig.atproto.pds}/xrpc/com.atproto.repo.uploadBlob`,
    {
      method: "POST",
      headers: {
        "Content-Type": mimeType,
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: body.buffer,
    },
    "upload blob",
  )
  const data = (await res.json()) as { blob: BlobRef }
  return data.blob
}

export interface ListedRecord {
  uri: string
  rkey: string
  value: Record<string, unknown>
}

/**
 * Pages through `com.atproto.repo.listRecords` (unauthenticated read) for a
 * collection in the author's repo. Used to discover existing records so syncs
 * reuse their record keys.
 */
export async function listRecords(
  did: string,
  collection: string,
  maxPages = 10,
): Promise<ListedRecord[]> {
  const pds = siteConfig.atproto.pds
  const out: ListedRecord[] = []
  let cursor: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      repo: did,
      collection,
      limit: "100",
    })
    if (cursor) params.set("cursor", cursor)
    const res = await pdsFetch(
      `${pds}/xrpc/com.atproto.repo.listRecords?${params}`,
      { headers: { Accept: "application/json" } },
      `list ${collection} — page ${page + 1}`,
    )
    const data = (await res.json()) as {
      records: { uri: string; value: Record<string, unknown> }[]
      cursor?: string
    }
    for (const r of data.records ?? []) {
      out.push({ uri: r.uri, rkey: extractRkey(r.uri), value: r.value })
    }
    if (!data.cursor || data.cursor === cursor) break
    cursor = data.cursor
  }
  return out
}

/**
 * Finds the existing publication record for this site on the PDS (matched by
 * `url`), so a sync can reuse its record key. Returns `null` if none exists.
 */
export async function findPublicationRecord(
  did: string,
): Promise<{ uri: string; rkey: string; createdAt?: string } | null> {
  const records = await listRecords(did, PUBLICATION_COLLECTION)
  const match = records.find(
    (r) => r.value?.url === siteConfig.globalMeta.baseUrl,
  )
  if (!match) return null
  const createdAt =
    typeof match.value?.createdAt === "string"
      ? (match.value.createdAt as string)
      : undefined
  return { uri: match.uri, rkey: match.rkey, createdAt }
}

/** MIME type used when uploading the publication icon. */
export const PUBLICATION_ICON_MIME = "image/webp"

/** Absolute path to the publication icon (the committed profile image). */
export function publicationIconPath(): string {
  return join(process.cwd(), "public", siteConfig.globalMeta.hero.image)
}

/**
 * Reads the publication icon from disk, returning its bytes and a SHA-256
 * content hash. The hash feeds {@link publicationSyncHash} so a sync only
 * re-uploads the icon when it has actually changed; the bytes are then handed
 * to {@link uploadBlob}. Returns `null` when no icon file is available, in
 * which case the publication record is published without an icon.
 */
export function readPublicationIcon(): {
  bytes: Uint8Array
  hash: string
} | null {
  const iconPath = publicationIconPath()
  if (!existsSync(iconPath)) return null
  const bytes = readFileSync(iconPath)
  return {
    bytes: new Uint8Array(bytes),
    hash: createHash("sha256").update(bytes).digest("hex"),
  }
}
