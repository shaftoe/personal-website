/**
 * Astro Integration: Dynamic OG Image Generation
 *
 * Hooks into `astro:build:done`, reads every generated HTML page,
 * extracts <head> metadata (title, description, keywords, canonical URL),
 * and produces a branded PNG for each page using the SVG terminal template.
 *
 * Zero per-page configuration required — adding a new page automatically
 * gets its own OG image on the next build.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

// ---------------------------------------------------------------------------
// SVG template (same visual as the old script, extracted here for reuse)
// ---------------------------------------------------------------------------

interface OgImageOptions {
  title: string
  subtitle?: string
  tags?: string
  url: string
  siteHost: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function createSvg(opts: OgImageOptions): string {
  const { title, subtitle, tags, url, siteHost } = opts

  const titleLines = wrapText(title, 22)
  const titleBlock = titleLines
    .map(
      (line, i) =>
        `<text x="90" y="${220 + i * 56}" font-family="'Press Start 2P', 'Courier New', monospace" font-size="36" fill="#e5e5e5">${escapeXml(line)}</text>`,
    )
    .join("\n    ")

  const subtitleY = 220 + titleLines.length * 56 + 30
  const tagsY = subtitleY + 40
  const urlY = 540

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#171717"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Terminal window -->
  <rect x="40" y="40" width="1120" height="550" fill="#1e1e1e" rx="10" stroke="#333" stroke-width="2"/>

  <!-- Title bar -->
  <rect x="40" y="40" width="1120" height="45" fill="#262626" rx="10"/>
  <rect x="40" y="75" width="1120" height="10" fill="#262626"/>

  <!-- Traffic lights -->
  <circle cx="72" cy="62" r="8" fill="#ff5f57"/>
  <circle cx="97" cy="62" r="8" fill="#febc2e"/>
  <circle cx="122" cy="62" r="8" fill="#28c840"/>

  <!-- Title bar text -->
  <text x="600" y="68" font-family="'Press Start 2P', 'Courier New', monospace" font-size="11" fill="#666" text-anchor="middle">~/${siteHost}</text>

  <!-- Separator -->
  <line x1="40" y1="85" x2="1160" y2="85" stroke="#333" stroke-width="1"/>

  <!-- Prompt line -->
  <text x="70" y="140" font-family="'Press Start 2P', 'Courier New', monospace" font-size="18" fill="#28c840">❯</text>
  <text x="100" y="140" font-family="'Press Start 2P', 'Courier New', monospace" font-size="18" fill="#28c840">cat page.txt</text>

  <!-- Separator -->
  <line x1="70" y1="160" x2="1130" y2="160" stroke="#28c840" stroke-width="1" opacity="0.3"/>

  <!-- Title -->
  ${titleBlock}

  ${
    subtitle
      ? `<text x="90" y="${subtitleY}" font-family="'Press Start 2P', 'Courier New', monospace" font-size="16" fill="#a3a3a3">${escapeXml(subtitle)}</text>`
      : ""
  }

  ${
    tags
      ? `<text x="90" y="${tagsY}" font-family="'Press Start 2P', 'Courier New', monospace" font-size="12" fill="#525252">${escapeXml(tags)}</text>`
      : ""
  }

  <!-- Bottom bar -->
  <line x1="70" y1="510" x2="1130" y2="510" stroke="#333" stroke-width="1"/>

  <!-- URL -->
  <text x="90" y="${urlY}" font-family="'Press Start 2P', 'Courier New', monospace" font-size="13" fill="#525252">${escapeXml(url)}</text>

  <!-- Cursor -->
  <rect x="90" y="${urlY + 10}" width="12" height="3" fill="#28c840"/>
</svg>`
}

// ---------------------------------------------------------------------------
// HTML metadata extraction
// ---------------------------------------------------------------------------

interface PageMeta {
  title: string
  description: string
  keywords?: string
  canonical: string
  pathname: string
}

/** Extract only the <head> section from an HTML document. */
function extractHead(html: string): string {
  const end = html.indexOf("</head>")
  if (end === -1) return html.slice(0, 2000)
  return html.slice(0, end)
}

/** Derive OG image filename from a page pathname.
 *  Astro v6 gives paths like "blog/tags/aws/" or "/" for home.
 */
function pathnameToSlug(pathname: string): string {
  const cleaned = pathname.replace(/^\/+/, "").replace(/\/+$/, "")
  if (cleaned === "") return "home"
  return cleaned.replace(/\//g, "--")
}

/** Parse generated HTML and extract metadata from <head>. */
function extractMeta(html: string, pathname: string): PageMeta | null {
  const head = extractHead(html)

  // Title — match the <title> inside <head> only
  const titleMatch = head.match(/<title>([^<]*)<\/title>/)
  if (!titleMatch) return null
  const title = decodeHtmlEntities(titleMatch[1]).trim()
  if (!title) return null

  // Description
  const descMatch = head.match(/<meta\s+name="description"\s+content="([^"]*)"/)
  const description = descMatch ? decodeHtmlEntities(descMatch[1]).trim() : ""

  // Keywords
  const kwMatch = head.match(/<meta\s+name="keywords"\s+content="([^"]*)"/)
  const keywords = kwMatch ? kwMatch[1] : undefined

  // Canonical URL
  const canonMatch = head.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)
  const canonical = canonMatch ? canonMatch[1] : pathname

  return { title, description, keywords, canonical, pathname }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
}

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The Astro Integration
// ---------------------------------------------------------------------------

export default function ogImagesIntegration() {
  let siteUrl: string | undefined

  return {
    name: "og-images",

    hooks: {
      "astro:config:done": ({ config }: { config: { site?: URL } }) => {
        siteUrl = config.site?.toString().replace(/\/$/, "")
      },

      "astro:build:done": async ({
        dir,
        pages,
        logger,
      }: {
        dir: URL
        pages: { pathname: string }[]
        logger: { info: (msg: string) => void; warn: (msg: string) => void }
      }) => {
        const distDir = fileURLToPath(dir)
        const rootDir = join(distDir, "..")
        const publicOgDir = join(rootDir, "public", "images", "og")
        const distOgDir = join(distDir, "images", "og")

        // Ensure output directories exist
        for (const d of [distOgDir, publicOgDir]) {
          if (!existsSync(d)) mkdirSync(d, { recursive: true })
        }

        logger.info(`Generating OG images for ${pages.length} pages…`)

        // Collect metadata from all generated HTML pages
        const metas: (PageMeta & { htmlFile: string })[] = []

        for (const page of pages) {
          const { pathname } = page

          // Skip non-HTML pages (rss.xml, etc.)
          if (pathname.endsWith(".xml") || pathname.endsWith(".json")) continue

          // Compute HTML file path
          // Astro outputs: /foo/bar → dist/foo/bar/index.html
          // Special cases: 404/ → dist/404.html, / → dist/index.html
          // Note: Astro v6 pages have paths WITHOUT leading /, e.g. "blog/tags/aws/"
          let htmlFile: string
          const cleanPath = pathname.replace(/^\/+/, "").replace(/\/+$/, "")
          if (cleanPath === "404") {
            htmlFile = join(distDir, "404.html")
          } else if (cleanPath === "" || cleanPath === "/") {
            htmlFile = join(distDir, "index.html")
          } else {
            htmlFile = join(distDir, cleanPath, "index.html")
          }

          if (!existsSync(htmlFile)) {
            logger.warn(`HTML file not found for ${pathname}: ${htmlFile}`)
            continue
          }

          const html = readFileSync(htmlFile, "utf-8")
          const meta = extractMeta(html, pathname)
          if (!meta?.description) {
            logger.warn(`Skipping ${pathname} — missing title or description`)
            continue
          }

          metas.push({ ...meta, htmlFile })
        }

        // Generate OG images
        let count = 0
        for (const meta of metas) {
          const slug = pathnameToSlug(meta.pathname)
          const filename = `${slug}.png`

          // Build a display URL for the SVG — strip protocol, show host + path
          const baseUrl = siteUrl ?? ""
          const displayUrl = meta.canonical.startsWith("http")
            ? meta.canonical
            : `${baseUrl}${meta.canonical}`
          const displayHost = displayUrl
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "")

          const siteHost = (siteUrl ?? "").replace(/^https?:\/\//, "")

          const svg = createSvg({
            title: meta.title,
            subtitle: meta.description,
            tags: meta.keywords,
            url: displayHost,
            siteHost,
          })

          const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

          // Write to dist (deployment artifact)
          writeFileSync(join(distOgDir, filename), pngBuffer)
          // Write to public (dev mode + git tracking)
          writeFileSync(join(publicOgDir, filename), pngBuffer)

          count++
          logger.info(`  ✓ ${filename} — ${meta.title}`)
        }

        logger.info(`Generated ${count} OG images.`)
      },
    },
  }
}
