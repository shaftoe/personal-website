/**
 * Astro Integration: Legacy Blog Post Redirects
 *
 * Generates a Netlify `_redirects` file at build time that maps legacy URLs
 * (blog post slugs served from the site root, e.g. `/my-article`) to their
 * current canonical location (`/blog/my-article`).
 *
 * Historically the blog lived on Tumblr and then Jekyll/Firebase where posts
 * were served from the root path. Old links shared on social media still use
 * those root paths and would 404 without these redirects.
 *
 * The redirect list is derived dynamically by scanning the generated
 * `dist/blog/` directory, so new posts are covered automatically — no manual
 * maintenance required.
 */
import { readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

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

        let slugs: string[] = []
        try {
          slugs = readdirSync(blogDir, { withFileTypes: true })
            .filter(
              (entry) =>
                entry.isDirectory() && !EXCLUDED_DIRS.includes(entry.name),
            )
            .map((entry) => entry.name)
            .sort()
        } catch {
          logger.info("No blog directory found — skipping redirect generation")
          return
        }

        if (slugs.length === 0) return

        // Netlify _redirects format: <from>  <to>  <status>
        // A 301 (permanent) redirect ensures search engines and link
        // aggregators update their canonical URLs over time.
        const lines = slugs.map((slug) => `/${slug}  /blog/${slug}  301`)

        writeFileSync(join(distDir, "_redirects"), `${lines.join("\n")}\n`)

        logger.info(`Generated ${slugs.length} legacy blog post redirects`)
      },
    },
  }
}
