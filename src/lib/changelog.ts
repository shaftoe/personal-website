import { readFileSync } from "node:fs"
import { join } from "node:path"
import { marked } from "marked"

const renderer = new marked.Renderer()

/**
 * Generate an id for h2 version headings like "## [1.12.1] - 2026-04-15".
 * The id is the bare version number (e.g. "1.12.1") so that we can link
 * to /changelog#1.12.1 from the footer.
 */
renderer.heading = function ({
  tokens,
  depth,
}: Parameters<typeof renderer.heading>[0]): string {
  const text = this.parser.parseInline(tokens)
  if (depth === 2) {
    const match = text.match(/^(?:\[|<[^>]*>)(\d+\.\d+\.\d+)/)
    if (match) {
      const id = match[1]
      return `<h2 id="${id}">${text}</h2>`
    }
  }
  return `<h${depth}>${text}</h${depth}>`
}

marked.setOptions({ renderer })

export function getChangelogContent() {
  const changelogPath = join(process.cwd(), "CHANGELOG.md")
  const markdown = readFileSync(changelogPath, "utf-8")
  // Strip the top-level "# Changelog" heading to avoid duplicating the page title
  const withoutTitle = markdown.replace(/^# Changelog\s*\n/i, "")
  return marked.parse(withoutTitle) as string
}
