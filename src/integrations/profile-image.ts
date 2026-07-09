/**
 * Astro Integration: Profile Picture from the PDS
 *
 * Hooks into `astro:build:done`, fetches the author's avatar blob from the
 * self-hosted PDS (`siteConfig.atproto.pds`), and writes two WebP images to
 * the build output:
 *
 *  - `profile.webp`       — clean 400×400 avatar
 *  - `profile-pixel.webp` — pixelated 400×400 variant (generated from the same
 *                           source via nearest-neighbour downscale + upscale)
 *
 * Unlike the OG-images integration this does **not** fall back to a committed
 * asset: if the PDS is unreachable or the profile has no avatar the build
 * fails (see issue #397). Both images are derived from the upstream blob so
 * they always stay in sync.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { getAvatarBlob } from "../lib/atproto"

const OUTPUT_SIZE = 400
/** Downscale target for the pixelated variant — gives ~50px blocks. */
const PIXEL_GRID = 8

export default function profileImageIntegration() {
  return {
    name: "profile-image",

    hooks: {
      "astro:build:done": async ({
        dir,
        logger,
      }: {
        dir: URL
        logger: { info: (msg: string) => void }
      }) => {
        const distImagesDir = join(fileURLToPath(dir), "images")
        if (!existsSync(distImagesDir)) {
          mkdirSync(distImagesDir, { recursive: true })
        }

        logger.info("Fetching profile picture from PDS…")
        const { data } = await getAvatarBlob()

        // Clean avatar — square crop, EXIF stripped, WebP
        const cleanBuffer = await sharp(data)
          .rotate() // honour EXIF orientation before resizing
          .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
            fit: "cover",
            position: "centre",
          })
          .webp({ quality: 85 })
          .toBuffer()

        // Pixelated variant — shrink to a tiny grid then upscale, both
        // with nearest-neighbour to produce chunky retro blocks.
        const pixelBuffer = await sharp(data)
          .rotate()
          .resize(PIXEL_GRID, PIXEL_GRID, { kernel: "nearest" })
          .resize(OUTPUT_SIZE, OUTPUT_SIZE, { kernel: "nearest" })
          .webp({ quality: 85 })
          .toBuffer()

        writeFileSync(join(distImagesDir, "profile.webp"), cleanBuffer)
        writeFileSync(join(distImagesDir, "profile-pixel.webp"), pixelBuffer)

        logger.info("  ✓ profile.webp (400×400)")
        logger.info("  ✓ profile-pixel.webp (pixelated)")
      },
    },
  }
}
