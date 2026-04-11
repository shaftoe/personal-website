import { readFileSync } from "node:fs"
import { join } from "node:path"
import { marked } from "marked"

export function getChangelogContent() {
  const changelogPath = join(process.cwd(), "CHANGELOG.md")
  const markdown = readFileSync(changelogPath, "utf-8")
  // Strip the top-level "# Changelog" heading to avoid duplicating the page title
  const withoutTitle = markdown.replace(/^# Changelog\s*\n/i, "")
  return marked.parse(withoutTitle) as string
}
