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
 *
 * Requires a Bluesky **app password** via `ATP_APP_PASSWORD` and that the
 * publication record already exists (run `standard:publication` first).
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

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const slugArgIdx = process.argv.indexOf("--slug")
  const onlySlug = slugArgIdx !== -1 ? process.argv[slugArgIdx + 1] : undefined

  const publicationUri = getPublicationUri()
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

  if (dryRun) {
    console.log(
      `\nDry run — would sync ${posts.length} document record${posts.length !== 1 ? "s" : ""}:\n`,
    )
    for (const post of posts) {
      const record = buildDocumentRecord({
        site: publicationUri,
        title: post.data.title,
        description: post.data.description,
        path: `/blog/${post.slug}/`,
        tags: post.data.tags,
        publishedAt: toInstant(post.data.timestamp).toString(),
        textContent: markdownToPlainText(post.body),
      })
      console.log(`  ${post.slug}`)
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

  for (const post of posts) {
    const existing = documents[post.slug]?.uri
    const rkey = existing ? extractRkey(existing) : generateTid()

    const record = buildDocumentRecord({
      site: publicationUri,
      title: post.data.title,
      description: post.data.description,
      path: `/blog/${post.slug}/`,
      tags: post.data.tags,
      publishedAt: toInstant(post.data.timestamp).toString(),
      textContent: markdownToPlainText(post.body),
    })

    const ref = await putRecord(session, DOCUMENT_COLLECTION, rkey, record)
    documents[post.slug] = ref

    if (existing) {
      updated++
      console.log(`  ↻ updated  ${post.slug}`)
    } else {
      created++
      console.log(`  + created  ${post.slug}`)
    }
  }

  writeStandardSidecar({ ...sidecar, documents })

  console.log(`\n  ✓ ${created} created, ${updated} updated`)
  console.log(
    `\n  Commit ${siteConfig.standard.sidecarPath} so the article <link> tags resolve.\n`,
  )
}

main().catch((error) => {
  console.error(
    `\n✖ ${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exit(1)
})
