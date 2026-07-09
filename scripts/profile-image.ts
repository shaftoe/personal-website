/**
 * CLI script — fetches the author's avatar from the self-hosted PDS and writes
 * the clean and pixelated WebP variants into `public/images/`, so the Hero
 * profile picture renders under `astro dev`.
 *
 * The build-time integration (src/integrations/profile-image.ts) only writes to
 * `dist/`, so without this step the avatar 404s in development. It uses the
 * exact same pipeline (src/lib/profile-image.ts), guaranteeing dev and
 * production output stay in sync.
 *
 * Usage:
 *   bun run profile-image
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { getAvatarBlob } from "../src/lib/atproto"
import { generateProfileImages, OUTPUT_SIZE } from "../src/lib/profile-image"

const PUBLIC_IMAGES_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "public",
  "images",
)

async function main() {
  if (!existsSync(PUBLIC_IMAGES_DIR)) {
    mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true })
  }

  console.log("Fetching profile picture from PDS…")
  const { data } = await getAvatarBlob()

  console.log("Generating WebP variants…")
  const { clean, pixel } = await generateProfileImages(data)

  writeFileSync(join(PUBLIC_IMAGES_DIR, "profile.webp"), clean)
  writeFileSync(join(PUBLIC_IMAGES_DIR, "profile-pixel.webp"), pixel)

  console.log(
    `\n  ✓ public/images/profile.webp (${OUTPUT_SIZE}×${OUTPUT_SIZE})`,
  )
  console.log("  ✓ public/images/profile-pixel.webp (pixelated)")
  console.log("\n  Run `bun run dev` to preview.\n")
}

main()
