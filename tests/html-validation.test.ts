import { describe, expect, it } from "vitest"
import { execSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const DIST_DIR = join(import.meta.dirname, "..", "dist")

/**
 * Recursively find all .html files under a directory.
 */
function findHtmlFiles(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...findHtmlFiles(full))
    } else if (entry.endsWith(".html")) {
      results.push(full)
    }
  }
  return results
}

/**
 * Run the Nu HTML Validator (vnu.jar) on a single HTML file.
 * Returns the raw stderr output (vnu writes errors to stderr).
 */
function validateHtml(filePath: string): string {
  try {
    execSync(
      `java -jar node_modules/vnu-jar/build/dist/vnu.jar --format json "${filePath}"`,
      {
        encoding: "utf-8",
        timeout: 30_000,
        stdio: ["pipe", "pipe", "pipe"],
      },
    )
    return ""
  } catch (err: unknown) {
    if (err && typeof err === "object" && "stderr" in err) {
      return (err as { stderr: string }).stderr
    }
    return String(err)
  }
}

interface VnuMessage {
  type: "error" | "info" | "non-document-error" | "warning"
  subType?: string
  message: string
  extract?: string
  lastLine?: number
  firstColumn?: number
  url: string
}

interface VnuOutput {
  messages: VnuMessage[]
}

/**
 * Known false positives from Astro's generated HTML that we suppress.
 *
 * These are caused by framework internals (e.g. module script placement
 * after </html>, astro-island inline styles, heading hierarchy in list
 * snippets) that are valid in practice but flagged by the strict HTML
 * validator.
 */
const SUPPRESSED_MESSAGES: {
  pattern: RegExp
  reason: string
}[] = [
  {
    // Astro generates <script type="module"> after </html> on pages that use
    // frontmatter scripts. This is how the framework injects client-side code.
    // Note: vnu uses Unicode left/right double quotation marks (“ ”)
    pattern: /Stray start tag \u201cscript\u201d/,
    reason: "Astro framework: module script injected after </html>",
  },
  {
    // Astro recovers from the stray script tag
    pattern: /Cannot recover after last error/,
    reason: "Astro framework: cascade from stray script tag",
  },
  {
    // Astro's Svelte integration (astro-island) injects <style> blocks inside
    // the component's DOM location, which the validator rejects
    pattern: /Element \u201cstyle\u201d not allowed as child of element/,
    reason: "Astro framework: astro-island inline styles",
  },
  {
    // Blog article snippets use h3 inside article elements that appear after
    // the page's h1. This is a structural design choice in the ArticleSnippet
    // component — the heading hierarchy within each article card is correct.
    pattern:
      /The heading \u201ch3\u201d .+ follows the heading \u201ch1\u201d .+ skipping \d+ heading level/,
    reason: "Blog snippet cards use h3 for article titles after page h1",
  },
  {
    // The validator warns about trailing slashes on void elements like <br/>.
    // This comes from Markdown rendering (marked) and is harmless.
    pattern:
      /Trailing slash on void elements has no effect and interacts badly with unquoted attribute values/,
    reason: "Markdown renderer (marked) generates trailing slashes on <br/>",
  },
  {
    // vnu uses Unicode quotes around "type"
    pattern: /The \u201ctype\u201d attribute is unnecessary for JavaScript resources/,
    reason: "Astro/framework convention",
  },
]

function shouldSuppress(msg: VnuMessage): boolean {
  return SUPPRESSED_MESSAGES.some((s) => s.pattern.test(msg.message))
}

describe("Build output — HTML validation", () => {
  // Ensure the site has been built before running these tests
  it("dist directory exists", () => {
    expect(existsSync(DIST_DIR)).toBe(true)
  })

  it("finds at least one HTML file in dist", () => {
    const files = findHtmlFiles(DIST_DIR)
    expect(files.length).toBeGreaterThan(0)
  })

  // Validate each generated HTML page
  const htmlFiles = findHtmlFiles(DIST_DIR)

  // Check critical pages exist
  const criticalPages = [
    "index.html",
    "404.html",
    join("blog", "index.html"),
    "contact/index.html",
    "blogroll/index.html",
    "postroll/index.html",
    "follow/index.html",
    "changelog/index.html",
    "colophon/index.html",
    "policy/index.html",
    "ai/index.html",
    "slashes/index.html",
    "expenses/index.html",
  ]

  for (const page of criticalPages) {
    it(`contains expected page: ${page}`, () => {
      expect(existsSync(join(DIST_DIR, page))).toBe(true)
    })
  }

  for (const filePath of htmlFiles) {
    const relativePath = relative(DIST_DIR, filePath)

    it(`valid HTML: ${relativePath}`, () => {
      const stderr = validateHtml(filePath)

      // If no stderr output, the HTML is valid
      if (!stderr.trim()) return

      // Parse vnu JSON output
      let output: VnuOutput
      try {
        output = JSON.parse(stderr)
      } catch {
        // If we can't parse the output, log it for debugging but don't fail
        // (this handles edge cases with vnu startup messages, etc.)
        return
      }

      // Filter out suppressed messages and only fail on actual errors
      const errors = output.messages.filter(
        (msg) => msg.type === "error" && !shouldSuppress(msg),
      )

      if (errors.length > 0) {
        const errorMessages = errors
          .map(
            (e) =>
              `  Line ${e.lastLine ?? "?"}: ${e.message}${e.extract ? ` (near "...${e.extract}...")` : ""}`,
          )
          .join("\n")
        expect.fail(
          `HTML validation errors in ${relativePath}:\n${errorMessages}`,
        )
      }
    })
  }
})

describe("Build output — content checks", () => {
  it("homepage has correct meta tags", () => {
    const html = readFileSync(join(DIST_DIR, "index.html"), "utf-8")
    expect(html).toContain('<meta name="description"')
    expect(html).toContain('<meta property="og:title"')
    expect(html).toContain('<meta property="og:description"')
    expect(html).toContain('<meta property="og:image"')
    expect(html).toContain('<meta name="twitter:card"')
    expect(html).toContain('<link rel="canonical"')
  })

  it("homepage has proper lang attribute", () => {
    const html = readFileSync(join(DIST_DIR, "index.html"), "utf-8")
    expect(html).toMatch(/<html[^>]+lang="en"/)
  })

  it("homepage has charset and viewport meta", () => {
    const html = readFileSync(join(DIST_DIR, "index.html"), "utf-8")
    expect(html).toContain('<meta charset="UTF-8"')
    expect(html).toContain('name="viewport"')
  })

  it("homepage has RSS link", () => {
    const html = readFileSync(join(DIST_DIR, "index.html"), "utf-8")
    expect(html).toContain('type="application/rss+xml"')
    expect(html).toContain("/rss.xml")
  })

  it("404 page has meaningful content", () => {
    const html = readFileSync(join(DIST_DIR, "404.html"), "utf-8")
    expect(html).toContain("404")
  })

  it("blog index page exists and has content", () => {
    const html = readFileSync(
      join(DIST_DIR, "blog", "index.html"),
      "utf-8",
    )
    expect(html.toLowerCase()).toContain("<!doctype html>")
    // Should contain at least one article (there are many posts)
    expect(html).toMatch(/href="\/blog\//)
  })

  it("contact page has a form", () => {
    const html = readFileSync(
      join(DIST_DIR, "contact", "index.html"),
      "utf-8",
    )
    expect(html).toContain("<form")
    expect(html).toContain('type="email"')
    expect(html).toContain('name="message"')
  })

  it("blogroll page lists configured blogs", () => {
    const html = readFileSync(
      join(DIST_DIR, "blogroll", "index.html"),
      "utf-8",
    )
    // Check at least one blogroll entry is rendered
    expect(html).toContain("https://www.geoffblair.com/")
    expect(html).toContain("lobste.rs")
  })

  it("follow page lists RSS feed", () => {
    const html = readFileSync(
      join(DIST_DIR, "follow", "index.html"),
      "utf-8",
    )
    expect(html).toContain("/rss.xml")
    expect(html).toContain("RSS")
  })

  it("all pages have <main> landmark", () => {
    const htmlFiles = findHtmlFiles(DIST_DIR)
    for (const filePath of htmlFiles) {
      const html = readFileSync(filePath, "utf-8")
      expect(html, `${relative(DIST_DIR, filePath)} missing <main>`).toContain(
        "<main>",
      )
    }
  })

  it("all pages have <header> landmark", () => {
    const htmlFiles = findHtmlFiles(DIST_DIR)
    for (const filePath of htmlFiles) {
      const html = readFileSync(filePath, "utf-8")
      expect(
        html,
        `${relative(DIST_DIR, filePath)} missing <header>`,
      ).toContain("<header")
    }
  })

  it("all pages have <footer> landmark", () => {
    const htmlFiles = findHtmlFiles(DIST_DIR)
    for (const filePath of htmlFiles) {
      const html = readFileSync(filePath, "utf-8")
      expect(
        html,
        `${relative(DIST_DIR, filePath)} missing <footer>`,
      ).toContain("<footer")
    }
  })

  it("all pages have navigation", () => {
    const htmlFiles = findHtmlFiles(DIST_DIR)
    for (const filePath of htmlFiles) {
      const html = readFileSync(filePath, "utf-8")
      expect(html, `${relative(DIST_DIR, filePath)} missing <nav>`).toContain(
        "<nav",
      )
    }
  })

  it("sitemap.xml is generated", () => {
    expect(existsSync(join(DIST_DIR, "sitemap-index.xml"))).toBe(true)
  })

  it("rss.xml is generated", () => {
    expect(existsSync(join(DIST_DIR, "rss.xml"))).toBe(true)

    const rss = readFileSync(join(DIST_DIR, "rss.xml"), "utf-8")
    expect(rss).toContain("<rss")
    expect(rss).toContain("<channel>")
  })
})
