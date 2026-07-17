/**
 * CLI script — optional pre-build fetcher that materialises `posts/` from a
 * plain-file mirror of an Obsidian vault, exposed over plain HTTPS.
 *
 * It is the build-time seam described in `docs/obsidian-source.md` (Option C).
 * The build never talks to CouchDB or knows anything about obsidian-livesync's
 * internal format: a publisher device that already has the *reconstructed*
 * plain-files vault (e.g. the always-on Raspberry Pi) exports the blog folder
 * as a small JSON manifest (Markdown as UTF-8, images as base64), and this
 * script downloads it and writes the files into `posts/` before Astro's content
 * collection is read.
 *
 * The source URL can point anywhere: an S3 presigned URL, CloudFront, or a
 * self-hosted endpoint — the build treats them identically.
 *
 * ## Opt-in & inert by default
 *
 * When `OBSIDIAN_POSTS_MANIFEST_URL` is unset the script logs a one-liner and
 * exits 0, so the committed `posts/` is used. This keeps local builds, the
 * GitHub Actions test workflow, and any environment that hasn't opted in
 * behaviourally identical to today (no new network dependency, no secrets).
 *
 * ## Usage
 *
 *   bun run sync:posts                                   # no-op without env
 *   OBSIDIAN_POSTS_MANIFEST_URL=https://… bun run sync:posts
 *   OBSIDIAN_POSTS_MANIFEST_URL=https://… \              # with auth
 *     OBSIDIAN_POSTS_TOKEN=secret bun run sync:posts
 *
 * On Netlify, opt in by setting the env vars and building with:
 *   command = "bun run sync:posts && bun run build"
 *
 * The default `build` script is intentionally **not** changed, so the repo
 * builds unchanged until you opt in.
 *
 * ## Manifest format
 *
 *   {
 *     "files": {
 *       "my-post.md":            { "encoding": "utf8",  "content": "…" },
 *       "my-post/diagram.png":   { "encoding": "base64", "content": "iVBOR…" }
 *     }
 *   }
 *
 * ## Failure policy
 *
 * Fetch failure is fatal once opted in: a canonical source must not silently
 * serve stale content. Individual notes with invalid frontmatter are skipped
 * with a warning rather than aborting the whole sync.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, relative } from "node:path"
import matter from "gray-matter"
import { blogSchema } from "../src/lib/blog-collection"

const POSTS_DIR = join(process.cwd(), "posts")

const MANIFEST_URL_ENV = "OBSIDIAN_POSTS_MANIFEST_URL"
const MANIFEST_TOKEN_ENV = "OBSIDIAN_POSTS_TOKEN"

type Logger = { info: (msg: string) => void; warn: (msg: string) => void }

export interface ManifestFile {
  encoding: "utf8" | "base64"
  content: string
}

export interface Manifest {
  files: Record<string, ManifestFile>
}

export interface ApplyResult {
  written: number
  skipped: number
  markdown: number
  assets: number
}

/**
 * Normalises a manifest entry name to a safe path relative to `posts/`.
 * Returns `null` for anything that could escape the target directory:
 * empty names, NUL/backslash characters, Windows drive letters, absolute
 * paths, and any `..` traversal segment.
 *
 * Exported for unit testing (see `tests/sync-posts.test.ts`).
 */
export function sanitizeEntryPath(name: string): string | null {
  if (typeof name !== "string" || name.trim() === "") return null
  if (name.includes("\0") || name.includes("\\")) return null
  if (/^[a-zA-Z]:[/\\]/.test(name)) return null

  // Drop leading slashes so absolute-looking keys become relative.
  const cleaned = name.replace(/^\/+/, "")
  if (cleaned === "") return null

  // Reject empty segments (e.g. "a//b", trailing "/") and traversal ("..").
  const segments = cleaned.split("/")
  if (segments.some((segment) => segment === ".." || segment === "")) {
    return null
  }
  return cleaned
}

/**
 * Validates the manifest JSON shape, throwing a descriptive error on any
 * malformed entry. Exported for unit testing.
 */
export function parseManifest(input: unknown): Manifest {
  if (typeof input !== "object" || input === null) {
    throw new Error("manifest must be a JSON object")
  }

  const { files } = input as { files?: unknown }
  if (typeof files !== "object" || files === null) {
    throw new Error("manifest must contain a 'files' object")
  }

  const result: Manifest = { files: {} }
  for (const [name, raw] of Object.entries(files as Record<string, unknown>)) {
    if (typeof raw !== "object" || raw === null) {
      throw new Error(`manifest entry '${name}' must be an object`)
    }
    const entry = raw as { encoding?: unknown; content?: unknown }
    if (entry.encoding !== "utf8" && entry.encoding !== "base64") {
      throw new Error(
        `manifest entry '${name}' has invalid encoding (expected 'utf8' or 'base64')`,
      )
    }
    if (typeof entry.content !== "string") {
      throw new Error(`manifest entry '${name}' content must be a string`)
    }
    result.files[name] = { encoding: entry.encoding, content: entry.content }
  }
  return result
}

/** Decodes a manifest entry's content to bytes according to its encoding. */
export function decodeContent(file: ManifestFile): Buffer {
  return file.encoding === "base64"
    ? Buffer.from(file.content, "base64")
    : Buffer.from(file.content, "utf8")
}

/**
 * Validates Markdown frontmatter against the same `blogSchema` used by the
 * content collection and the other CLI scripts. Returns parsed error messages.
 */
export function validateMarkdownFrontmatter(body: string): {
  ok: boolean
  errors: string[]
} {
  const { data } = matter(body)
  const result = blogSchema.safeParse(data)
  if (result.success) return { ok: true, errors: [] }
  return {
    ok: false,
    errors: result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    ),
  }
}

/**
 * Writes every manifest entry into `postsDir`. Unsafe paths and notes with
 * invalid frontmatter are skipped (with a warning); everything else is written,
 * creating parent directories as needed. Markdown notes are schema-validated;
 * binary assets (images, etc.) are written as-is.
 */
export function applyManifest(
  manifest: Manifest,
  postsDir: string,
  log: Logger,
): ApplyResult {
  const result: ApplyResult = { written: 0, skipped: 0, markdown: 0, assets: 0 }

  const entries = Object.entries(manifest.files).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  for (const [name, file] of entries) {
    const safe = sanitizeEntryPath(name)
    if (!safe) {
      log.warn(`  ✖ skipped   ${name}  (unsafe path)`)
      result.skipped++
      continue
    }

    const target = join(postsDir, safe)
    // Defence in depth: the sanitiser already rejects traversal, but assert
    // containment once more relative to the target directory.
    const rel = relative(postsDir, target)
    if (rel.startsWith("..") || isAbsolute(rel)) {
      log.warn(`  ✖ skipped   ${name}  (escapes posts/)`)
      result.skipped++
      continue
    }

    let bytes: Buffer
    try {
      bytes = decodeContent(file)
    } catch {
      log.warn(`  ✖ skipped   ${safe}  (decode error)`)
      result.skipped++
      continue
    }

    const isMarkdown = safe.toLowerCase().endsWith(".md")
    if (isMarkdown) {
      const { ok, errors } = validateMarkdownFrontmatter(file.content)
      if (!ok) {
        log.warn(
          `  ✖ skipped   ${safe}  (invalid frontmatter):\n${errors.join("\n")}`,
        )
        result.skipped++
        continue
      }
      result.markdown++
    } else {
      result.assets++
    }

    if (!existsSync(dirname(target))) {
      mkdirSync(dirname(target), { recursive: true })
    }
    writeFileSync(target, bytes)
    result.written++
    log.info(`  ✓ wrote     ${safe}`)
  }

  return result
}

async function main() {
  const url = process.env[MANIFEST_URL_ENV]
  if (!url) {
    console.log(
      "  · OBSIDIAN_POSTS_MANIFEST_URL not set — using committed posts/.",
    )
    return
  }

  const token = process.env[MANIFEST_TOKEN_ENV]
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  console.log(`Fetching posts manifest from ${url}…`)
  const res = await fetch(url, { headers })
  if (!res.ok) {
    console.error(
      `✖ manifest fetch failed: HTTP ${res.status} ${res.statusText}`,
    )
    process.exit(1)
  }

  const json = await res.json()
  let manifest: Manifest
  try {
    manifest = parseManifest(json)
  } catch (error) {
    console.error(`✖ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  const result = applyManifest(manifest, POSTS_DIR, {
    info: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
  })

  console.log(
    `\n  ✓ ${result.written} written ` +
      `(${result.markdown} markdown, ${result.assets} assets), ` +
      `${result.skipped} skipped.`,
  )
}

main().catch((error) => {
  console.error(
    `\n✖ ${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exit(1)
})
