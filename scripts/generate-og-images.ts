import { existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const OUT_DIR = join(ROOT, "public", "images", "og")

// Ensure output directory exists
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true })
}

interface OgImageOptions {
  title: string
  subtitle?: string
  tags?: string
  url: string
}

function createSvg(opts: OgImageOptions): string {
  const { title, subtitle, tags, url } = opts

  // Wrap long titles (roughly 18 chars per line for the pixel font)
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
  <text x="600" y="68" font-family="'Press Start 2P', 'Courier New', monospace" font-size="11" fill="#666" text-anchor="middle">~/a.l3x.in</text>

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

async function generatePng(svg: string, outputPath: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(outputPath)
  console.log(`  ✓ Generated: ${outputPath}`)
}

async function main() {
  console.log("Generating OG images...\n")

  // Default / Home page
  const homeSvg = createSvg({
    title: "Alexander Fortin",
    subtitle: "Software Engineer",
    tags: "automation · serverless · cloud · devops",
    url: "https://a.l3x.in",
  })
  await generatePng(homeSvg, join(OUT_DIR, "default.png"))

  // Blog index
  const blogSvg = createSvg({
    title: "Tech Blog",
    subtitle: "Articles & Tutorials",
    tags: "serverless · cloud computing · devops · jamstack",
    url: "https://a.l3x.in/blog",
  })
  await generatePng(blogSvg, join(OUT_DIR, "blog.png"))

  // 404 page
  const notFoundSvg = createSvg({
    title: "404 - Not Found",
    subtitle: "This page does not exist",
    url: "https://a.l3x.in",
  })
  await generatePng(notFoundSvg, join(OUT_DIR, "not-found.png"))

  console.log("\n✅ All OG images generated successfully!")
}

main().catch((err) => {
  console.error("Failed to generate OG images:", err)
  process.exit(1)
})
