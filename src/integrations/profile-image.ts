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
 * The actual image pipeline lives in `src/lib/profile-image.ts` and is shared
 * with `scripts/profile-image.ts` (which regenerates the same pair into
 * `public/images/` for local `astro dev`).
 *
 * Unlike the OG-images integration this does **not** fall back to a committed
 * asset: if the PDS is unreachable or the profile has no avatar the build
 * fails (see issue #397). Both images are derived from the upstream blob so
 * they always stay in sync.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { getAvatarBlob } from "../lib/atproto"
import { generateProfileImages } from "../lib/profile-image"

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
        const { clean, pixel } = await generateProfileImages(data)

        writeFileSync(join(distImagesDir, "profile.webp"), clean)
        writeFileSync(join(distImagesDir, "profile-pixel.webp"), pixel)

        logger.info("  ✓ profile.webp (400×400)")
        logger.info("  ✓ profile-pixel.webp (pixelated)")
      },
    },
  }
}
