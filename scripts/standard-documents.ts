/**
 * CLI script — syncs the long-form blog articles to `site.standard.document`
 * records on the self-hosted PDS, then persists the resulting AT URIs into the
 * committed sidecar so `BlogLayout` can emit a `<link rel="site.standard.
 * document">` tag per article at build time.
 *
 * Each Markdown post maps ~1:1 onto the document record fields (title,
 * description, path, tags, publishedAt, textContent). Records are keyed by a
 * stable rkey (reused across syncs via the sidecar) so re-running updates
 * records instead of creating duplicates.
 *
 * Usage:
 *   ATP_APP_PASSWORD=<app-password> bun run standard:documents
 *   ATP_APP_PASSWORD=<app-password> bun run standard:documents --dry-run
 *   ATP_APP_PASSWORD=<app-password> bun run standard:documents --slug <slug>
 *   ATP_APP_PASSWORD=<app-password> bun run standard:documents --force
 *   bun run standard:documents --check   # credential-free drift check (CI/pre-commit)
 *
 * Requires a Bluesky **app password** via `ATP_APP_PASSWORD` (except for
 * `--dry-run`/`--check`) and that the publication record already exists
 * (run `standard:publication` first).
 *
 * ## Pre-commit drift check (`--check`)
 *
 * `--check` compares the committed sidecar against the current posts **without
 * credentials or network access** and exits non-zero when any record is missing
 * (new post) or has drifted (edited post). It is wired into the lefthook
 * `pre-commit` hook so a forgotten sidecar update blocks the commit until the
 * committer re-syncs and stages `src/data/standard.json`. When everything is in
 * sync it prints "all good" and exits 0.
 *
 * ## Keeping it in sync
 *
 * The script is **idempotent**: each post reuses a stable record key (from the
 * sidecar, else a new TID) so re-runs update records instead of duplicating
 * them. It also **skips unchanged posts**: every record's source is hashed and
 * compared to the hash stored in the sidecar on the last sync, so only posts
 * whose frontmatter or body actually changed get re-written. Pass `--force` to
 * re-sync every post regardless (e.g. after a manual edit on the PDS).
 *
 * Recommended workflow:
 *   1. After publishing a new post or editing an existing one, re-run this
 *      script — or target just that post with `--slug <slug>`.
 *   2. Commit `src/data/standard.json` so the next build emits the article's
 *      `<link rel="site.standard.document">` tag.
 *
 * Re-running with no changes is safe and cheap (no PDS writes). See the
 * "Standard.site Publishing" section of `src/pages/colophon.md`.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import matter from "gray-matter"
import { siteConfig } from "../src/config"
import type { BlogEntry } from "../src/lib/blog-collection"
import { blogSchema } from "../src/lib/blog-collection"
import {
  buildDocumentRecord,
  createSession,
  DOCUMENT_COLLECTION,
  extractRkey,
  generateTid,
  getPublicationUri,
  hashRecordPayload,
  markdownToPlainText,
  putRecord,
  readStandardSidecar,
  writeStandardSidecar,
} from "../src/lib/standard"
import { toInstant } from "../src/lib/utils"

const POSTS_DIR = join(process.cwd(), "posts")

interface PostFile {
  slug: string
  data: BlogEntry
  body: string
}

/** Builds the `site.standard.document` record value for a single post. */
function buildPostDocument(post: PostFile, publicationUri: string) {
  return buildDocumentRecord({
    site: publicationUri,
    title: post.data.title,
    description: post.data.description,
    path: `/blog/${post.slug}/`,
    tags: post.data.tags,
    publishedAt: toInstant(post.data.timestamp).toString(),
    textContent: markdownToPlainText(post.body),
  })
}

/** Reads and validates every Markdown post, returning parsed frontmatter + body. */
function readPosts(): PostFile[] {
  const files = readdirSync(POSTS_DIR, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => join(d.parentPath || POSTS_DIR, d.name))
    .sort()

  return files
    .map((file) => {
      const raw = readFileSync(file, "utf-8")
      const { data, content } = matter(raw)
      const result = blogSchema.safeParse(data)
      if (!result.success) {
        console.warn(`  ⚠ skipping ${file}: invalid frontmatter`)
        return null
      }
      const slug = result.data.slug ?? file.replace(/\.md$/, "")
      return { slug, data: result.data, body: content }
    })
    .filter((p): p is PostFile => p !== null)
}

/**
 * Credential-free drift check: compares the committed sidecar against the
 * current posts and exits non-zero when any document record is missing (new
 * post) or has drifted (edited post). No PDS access, no writes — used by the
 * pre-commit hook so a forgotten sidecar update blocks the commit.
 */
function runCheck(publicationUri: string, posts: PostFile[]): void {
  const sidecar = readStandardSidecar()
  const documents = sidecar.documents
  const drift: string[] = []

  for (const post of posts) {
    const record = buildPostDocument(post, publicationUri)
    const syncHash = hashRecordPayload(record)
    const existing = documents[post.slug]
    if (!existing?.uri) {
      drift.push(`  + new       ${post.slug}`)
    } else if (existing.hash !== syncHash) {
      drift.push(`  ~ changed   ${post.slug}`)
    }
  }

  if (drift.length === 0) {
    console.log(
      `\n  ✓ all good — ${siteConfig.standard.sidecarPath} is in sync with the posts` +
        ` (${posts.length} document${posts.length !== 1 ? "s" : ""}).\n`,
    )
    return
  }

  console.error(
    `\n  ✖ ${siteConfig.standard.sidecarPath} is out of sync with the posts:\n`,
  )
  for (const line of drift) console.error(line)
  console.error(
    "\n  Re-sync the records and commit the updated sidecar:\n" +
      "    ATP_APP_PASSWORD=<app-password> bun run standard:documents\n" +
      `    git add ${siteConfig.standard.sidecarPath}\n`,
  )
  process.exit(1)
}

async function main() {
  const check = process.argv.includes("--check")
  const dryRun = process.argv.includes("--dry-run")
  const force = process.argv.includes("--force")
  const slugArgIdx = process.argv.indexOf("--slug")
  const onlySlug = slugArgIdx !== -1 ? process.argv[slugArgIdx + 1] : undefined

  const publicationUri = getPublicationUri()

  // Before adoption (empty sidecar) there is nothing to verify or sync, so the
  // check passes — this keeps the pre-commit hook from blocking unrelated
  // commits on a repo that hasn't run `standard:publication` yet.
  if (check && !publicationUri) {
    console.log(
      "\n  · standard.site not adopted yet — skipping document sync check.\n",
    )
    return
  }

  if (!publicationUri) {
    console.error(
      "✖ No publication record found. Run `bun run standard:publication` first.",
    )
    process.exit(1)
  }

  let posts = readPosts()
  if (onlySlug) {
    posts = posts.filter((p) => p.slug === onlySlug)
    if (posts.length === 0) {
      console.error(`✖ No post found with slug "${onlySlug}".`)
      process.exit(1)
    }
  }

  if (check) {
    runCheck(publicationUri, posts)
    return
  }

  if (dryRun) {
    const sidecar = readStandardSidecar()
    console.log(
      `\nDry run — would sync ${posts.length} document record${posts.length !== 1 ? "s" : ""}:\n`,
    )
    for (const post of posts) {
      const record = buildPostDocument(post, publicationUri)
      const existing = sidecar.documents[post.slug]
      const state = force
        ? "forced"
        : existing?.uri && existing.hash === hashRecordPayload(record)
          ? "unchanged"
          : "changed"
      console.log(`  ${post.slug}  (${state})`)
      console.log(JSON.stringify(record, null, 2))
      console.log()
    }
    return
  }

  const appPassword = process.env.ATP_APP_PASSWORD
  if (!appPassword) {
    console.error(
      "✖ ATP_APP_PASSWORD env var is required (a Bluesky app password).",
    )
    process.exit(1)
  }

  console.log("Authenticating…")
  const session = await createSession(appPassword)

  const sidecar = readStandardSidecar()
  const documents = { ...sidecar.documents }

  console.log(
    `\nSyncing ${posts.length} document${posts.length !== 1 ? "s" : ""}…\n`,
  )
  let created = 0
  let updated = 0
  let skipped = 0

  for (const post of posts) {
    const existing = documents[post.slug]
    const rkey = existing?.uri ? extractRkey(existing.uri) : generateTid()

    const record = buildPostDocument(post, publicationUri)

    // Change detection: skip the PDS write when the record's source is
    // unchanged since the last sync (override with --force).
    const syncHash = hashRecordPayload(record)
    if (!force && existing?.uri && existing.hash === syncHash) {
      skipped++
      console.log(`  · skipped   ${post.slug}`)
      continue
    }

    const ref = await putRecord(session, DOCUMENT_COLLECTION, rkey, record)
    documents[post.slug] = { ...ref, hash: syncHash }

    if (existing?.uri) {
      updated++
      console.log(`  ↻ updated   ${post.slug}`)
    } else {
      created++
      console.log(`  + created   ${post.slug}`)
    }
  }

  writeStandardSidecar({ ...sidecar, documents })

  console.log(
    `\n  ✓ ${created} created, ${updated} updated, ${skipped} skipped`,
  )
  if (created + updated > 0) {
    console.log(
      `\n  Commit ${siteConfig.standard.sidecarPath} so the article <link> tags resolve.\n`,
    )
  }
}

main().catch((error) => {
  console.error(
    `\n✖ ${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exit(1)
})
