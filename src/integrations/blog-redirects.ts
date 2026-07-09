/**
 * Astro Integration: Legacy Blog Post Redirects
 *
 * Generates a Netlify `_redirects` file at build time that maps legacy URLs
 * to the current canonical location (`/blog/:slug`).
 *
 * Two URL patterns are covered for every published post:
 *
 * 1. **Root-slug** (Tumblr era) — `/my-article` → `/blog/my-article`
 * 2. **Jekyll date permalink** (Jekyll/Firebase era) —
 *    `/2020/06/17/my-article.html` → `/blog/my-article`
 *
 * Old links shared on social media (Bluesky, Twitter, etc.) still use these
 * legacy paths and would 404 without the redirects.
 *
 * The redirect list is derived dynamically by scanning the generated
 * `dist/blog/` directory and reading frontmatter timestamps from the source
 * posts, so new posts are covered automatically — no manual maintenance.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

// Subdirectories under /blog that are not individual articles.
const EXCLUDED_DIRS = ["tags"]

export default function blogRedirectsIntegration() {
  return {
    name: "blog-redirects",

    hooks: {
      "astro:build:done": ({
        dir,
        logger,
      }: {
        dir: URL
        logger: { info: (msg: string) => void }
      }) => {
        const distDir = fileURLToPath(dir)
        const blogDir = join(distDir, "blog")

        let publishedSlugs: Set<string>
        try {
          publishedSlugs = new Set(
            readdirSync(blogDir, { withFileTypes: true })
              .filter(
                (entry) =>
                  entry.isDirectory() && !EXCLUDED_DIRS.includes(entry.name),
              )
              .map((entry) => entry.name),
          )
        } catch {
          logger.info("No blog directory found — skipping redirect generation")
          return
        }

        if (publishedSlugs.size === 0) return

        // Read source frontmatter to obtain publish timestamps for Jekyll
        // date-based URL redirects.
        const postsDir = join(process.cwd(), "posts")
        const timestampBySlug = readPostTimestamps(postsDir)

        const lines: string[] = []

        for (const slug of [...publishedSlugs].sort()) {
          // 1. Root-slug redirect (Tumblr era): /slug → /blog/slug
          lines.push(`/${slug}  /blog/${slug}  301`)

          // 2. Jekyll date permalink: /YYYY/MM/DD/slug.html → /blog/slug
          const ts = timestampBySlug.get(slug)
          if (ts) {
            const datePath = formatJekyllDatePath(ts)
            lines.push(`/${datePath}/${slug}.html  /blog/${slug}  301`)
            // Also cover the extensionless variant just in case.
            lines.push(`/${datePath}/${slug}  /blog/${slug}  301`)
          }
        }

        // Netlify _redirects format: <from>  <to>  <status>
        // A 301 (permanent) redirect ensures search engines and link
        // aggregators update their canonical URLs over time.
        writeFileSync(join(distDir, "_redirects"), `${lines.join("\n")}\n`)

        logger.info(`Generated ${lines.length} legacy blog post redirects`)
      },
    },
  }
}

/**
 * Reads `posts/*.md` frontmatter and returns a map of slug → publish date.
 * Falls back to `date` frontmatter when `timestamp` is absent.
 */
function readPostTimestamps(postsDir: string): Map<string, Date> {
  const result = new Map<string, Date>()

  let files: string[]
  try {
    files = readdirSync(postsDir).filter((f) => f.endsWith(".md"))
  } catch {
    return result
  }

  for (const file of files) {
    try {
      const { data } = matter(readFileSync(join(postsDir, file), "utf-8"))
      const slug =
        (data.slug as string | undefined) ?? file.replace(/\.md$/, "")
      const date =
        (data.timestamp as Date | undefined) ?? (data.date as Date | undefined)
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        result.set(slug, date)
      }
    } catch {
      // Skip files that can't be parsed.
    }
  }

  return result
}

/** Formats a Date as a Jekyll-style path segment: `YYYY/MM/DD` (UTC). */
function formatJekyllDatePath(date: Date): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yyyy}/${mm}/${dd}`
}
