/**
 * Profile picture image processing — the single source of truth for the
 * pipeline shared between:
 *
 *  - the build-time Astro integration (src/integrations/profile-image.ts),
 *    which writes the avatars into `dist/images/`; and
 *  - the local dev helper (scripts/profile-image.ts), which writes them into
 *    `public/images/` so the Hero avatar renders under `astro dev`.
 *
 * Both produce the same pair of avatars from a source image, guaranteeing dev
 * and production output stay in sync:
 *
 *  - `profile.webp`       — clean 400×400 avatar
 *  - `profile-pixel.webp` — pixelated 400×400 variant used by the Hero reveal
 */
import sharp from "sharp"

/** Output size (both dimensions) for every avatar variant. */
export const OUTPUT_SIZE = 400
/**
 * Downscale grid for the pixelated variant (e.g. 8 → an 8×8 mosaic of 64
 * blocks, ~50px each on a 400px image). Lower = chunkier and less recognisable.
 */
export const PIXEL_GRID = 36

export interface ProfileImages {
  /** Clean, square-cropped avatar as a WebP buffer. */
  clean: Buffer
  /** Pixelated avatar variant as a WebP buffer. */
  pixel: Buffer
}

/**
 * Generates the clean and pixelated WebP avatars from raw image bytes.
 *
 * @param source Raw decoded image bytes (any format Sharp can read).
 */
export async function generateProfileImages(
  source: ArrayBuffer | Buffer,
): Promise<ProfileImages> {
  // Clean avatar — square crop, EXIF orientation honoured, WebP
  const clean = await sharp(source)
    .rotate() // honour EXIF orientation before resizing
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 85 })
    .toBuffer()

  const pixel = await pixelate(source, PIXEL_GRID, OUTPUT_SIZE)
  return { clean, pixel }
}

/**
 * Produces a hard-edged pixelated mosaic of `source`.
 *
 * Sharp has **no dedicated "pixelate" filter**, and the textbook
 * downscale/upscale trick only works if the upscale is true nearest-neighbour
 * replication. Unfortunately libvips' `resize({ kernel: "nearest" })` silently
 * *interpolates* (smooth gradient) when upscaling by a large factor, which
 * turns the mosaic back into a blurry, barely-pixelated image — see
 * <https://github.com/lovell/sharp/issues>. To get real chunky blocks we
 * therefore:
 *
 *  1. downscale to a `grid`×`grid` area-averaged thumbnail (default kernel
 *     averages each block to a single representative colour), then
 *  2. replicate every thumbnail pixel by hand into a hard `out`×`out` grid,
 *     mapping each output pixel to its source cell so edges stay crisp.
 *
 * The result is encoded as **lossless WebP**: the flat colour blocks compress
 * to a few hundred bytes and survive encoding without the DCT artefacts that a
 * lossy encode would smear across block boundaries.
 */
async function pixelate(
  source: ArrayBuffer | Buffer,
  grid: number,
  out: number,
): Promise<Buffer> {
  // 1. Area-averaged thumbnail → one representative colour per block
  const { data: cells, info } = await sharp(source)
    .rotate()
    .resize(grid, grid, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const channels = info.channels

  // 2. Replicate each cell into a hard tile (nearest-neighbour by hand)
  const raw = Buffer.alloc(out * out * channels)
  for (let y = 0; y < out; y++) {
    const gy = Math.floor((y * grid) / out)
    for (let x = 0; x < out; x++) {
      const gx = Math.floor((x * grid) / out)
      const src = (gy * grid + gx) * channels
      const dst = (y * out + x) * channels
      raw[dst] = cells[src]
      raw[dst + 1] = cells[src + 1]
      raw[dst + 2] = cells[src + 2]
    }
  }

  return sharp(raw, { raw: { width: out, height: out, channels } })
    .webp({ lossless: true })
    .toBuffer()
}
