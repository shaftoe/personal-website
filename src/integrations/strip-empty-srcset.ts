import { glob, readFile, writeFile } from "node:fs/promises"
import type { AstroIntegration } from "astro"

/**
 * Astro integration that strips empty `srcset=""` attributes from built HTML files.
 *
 * Workaround for an Astro 6 issue where the noop image service produces
 * `srcset=""` on content-collection images rendered from markdown.
 *
 * Upstream fix: https://github.com/withastro/astro/pull/16860
 * TODO: remove this integration once the fix is released.
 */
export default function stripEmptySrcset(): AstroIntegration {
  return {
    name: "strip-empty-srcset",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const htmlFiles = await Array.fromAsync(
          glob("**/*.html", { cwd: dir.pathname }),
        )
        for (const file of htmlFiles) {
          const filePath = new URL(file, dir).pathname
          const content = await readFile(filePath, "utf-8")
          if (content.includes('srcset=""')) {
            await writeFile(filePath, content.replaceAll('srcset=""', ""))
          }
        }
      },
    },
  }
}
