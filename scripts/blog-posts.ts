/**
 * CLI script — lists all blog posts after applying the same schema + transform
 * used by Astro's content layer.
 *
 * Usage:
 *   bun run blog-posts
 *   bun run blog-posts --json
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import matter from "gray-matter"
import type { BlogEntry } from "../src/lib/blog-collection"
import { blogSchema } from "../src/lib/blog-collection"
import { readingTime } from "../src/lib/utils"

const POSTS_DIR = new URL("../posts", import.meta.url).pathname

function readMarkdownFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => join(d.parentPath || dir, d.name))
}

interface PostParseResult {
  file: string
  entry: BlogEntry
  readTime: number
  errors: string[]
}

function parsePost(filePath: string): PostParseResult {
  const raw = readFileSync(filePath, "utf-8")
  const { data: frontmatter, content } = matter(raw)

  const result = blogSchema.safeParse(frontmatter)

  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => `  - ${i.path.join(".")}: ${i.message}`,
    )
    return {
      file: filePath,
      entry: null as unknown as BlogEntry,
      readTime: 0,
      errors,
    }
  }

  return {
    file: filePath,
    entry: result.data,
    readTime: readingTime(content),
    errors: [],
  }
}

function main() {
  const json = process.argv.includes("--json")
  const files = readMarkdownFiles(POSTS_DIR).sort()

  if (files.length === 0) {
    console.log("No .md files found in posts/")
    process.exit(0)
  }

  const results = files.map(parsePost)
  const successes = results.filter((r) => r.errors.length === 0)
  const failures = results.filter((r) => r.errors.length > 0)

  if (json) {
    const output = successes.map((r) => ({
      file: r.file,
      ...r.entry,
      readTime: r.readTime,
    }))
    console.log(JSON.stringify(output, null, 2))
  } else {
    console.log(
      `\n  📝 ${successes.length} blog post${successes.length !== 1 ? "s" : ""} found\n`,
    )

    for (const { file, entry, readTime } of successes) {
      const tags = entry.tags?.length ? ` [${entry.tags.join(", ")}]` : ""
      console.log(`  ${entry.title}`)
      console.log(
        `    slug: ${
          entry.slug ??
          entry.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "")
        }${tags} · ${readTime} min`,
      )
      const dateStr = entry.timestamp
        ? entry.timestamp.toISOString().slice(0, 10)
        : entry.date
          ? entry.date.toISOString().slice(0, 10)
          : "unknown"
      console.log(`    date: ${dateStr}`)
      if (entry.description) {
        console.log(`    desc: ${entry.description}`)
      }
      console.log(`    file: ${file}`)
      console.log()
    }

    if (failures.length > 0) {
      console.log(
        `\n  ⚠️  ${failures.length} file${failures.length !== 1 ? "s" : ""} with schema errors:\n`,
      )
      for (const { file, errors } of failures) {
        console.log(`  ${file}`)
        console.log(errors.join("\n"))
        console.log()
      }
      process.exit(1)
    }
  }
}

main()
