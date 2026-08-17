/**
 * Microblog post image pipeline — the single source of truth for turning
 * ATproto image blobs (attached photos and external link-card thumbnails)
 * into local, size-capped WebP assets. It is the microblog counterpart of
 * `src/lib/profile-image.ts` and is consumed by `src/lib/atproto.ts` when
 * posts are hydrated at build time (`getLatestPosts` / `getTilPosts`) — which
 * in turn feed the homepage's "Latest microblog posts" section, the /til page,
 * the microblog RSS feed, and the `bun run bluesky` dev helper.
 *
 * Blobs are content-addressed by their CID, so every derived WebP gets an
 * immutable, deterministic name: `/images/microblog/<cid>.webp`. Processed
 * files are written to `public/images/microblog/` (this serves `astro dev`
 * and doubles as a cache across builds — CID names never go stale) and,
 * during a production build, to `dist/images/microblog/` as well so they
 * ship with the static output. Note the `dist/` assumption: it matches this
 * project's default Astro outDir (also Netlify's publish directory).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

/** Maximum width (px) of every processed microblog image. */
export const MICROBLOG_IMAGE_MAX_WIDTH = 640

/** WebP encoder quality for processed microblog images. */
const WEBP_QUALITY = 80

/**
 * Resolves the project root directory.
 *
 * `import.meta.url` is not reliable for this under `astro build` (page
 * modules are loaded from a location inside `dist/`, so relative URLs point
 * at the wrong place), and `process.cwd()` depends on where the process was
 * started. Walking up from this file until `package.json` is found works in
 * every context (bun scripts, `astro dev`, `astro build`) without depending
 * on either.
 */
function resolveProjectRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (true) {
    if (existsSync(join(dir, "package.json"))) return dir
    const parent = dirname(dir)
    if (parent === dir) return process.cwd()
    dir = parent
  }
}

const PROJECT_ROOT = resolveProjectRoot()

export interface ProcessedImage {
  /** Encoded WebP bytes. */
  buffer: Buffer
  /** Output pixel dimensions, used for `width`/`height` attributes. */
  width: number
  height: number
}

/** Public web path for a microblog image derived from its blob CID. */
export function microblogImageUrl(cid: string): string {
  return `/images/microblog/${cid}.webp`
}

function publicFilePath(cid: string): string {
  return join(PROJECT_ROOT, "public", "images", "microblog", `${cid}.webp`)
}

function distFilePath(cid: string): string {
  return join(PROJECT_ROOT, "dist", "images", "microblog", `${cid}.webp`)
}

/**
 * Whether we are rendering pages as part of `astro build` (as opposed to
 * `astro dev` or a plain `bun run` CLI script) — in that case processed
 * images must also be emitted into the build output directory.
 */
function isProductionBuild(): boolean {
  return import.meta.env?.PROD === true
}

/**
 * Downscales a raw image blob to at most {@link MICROBLOG_IMAGE_MAX_WIDTH}px
 * wide, honouring EXIF rotation, and encodes it as WebP.
 */
export async function resizeMicroblogImage(
  source: ArrayBuffer | Buffer,
): Promise<ProcessedImage> {
  const { data, info } = await sharp(source)
    .rotate() // honour EXIF orientation before resizing
    .resize({ width: MICROBLOG_IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true })
  return { buffer: data, width: info.width, height: info.height }
}

/**
 * Persists a processed image under its deterministic CID-based name. Always
 * writes to `public/` (dev server + local cache across builds) and, when
 * running inside a production build, to `dist/` as well.
 */
export function writeMicroblogImage(cid: string, image: ProcessedImage): void {
  const publicPath = publicFilePath(cid)
  mkdirSync(dirname(publicPath), { recursive: true })
  writeFileSync(publicPath, image.buffer)

  if (isProductionBuild()) {
    const distPath = distFilePath(cid)
    mkdirSync(dirname(distPath), { recursive: true })
    writeFileSync(distPath, image.buffer)
  }
}

/**
 * Returns the pixel dimensions of an already-processed microblog image (from
 * the `public/` cache), or `null` when the CID has not been processed yet.
 */
export async function readMicroblogImageSize(
  cid: string,
): Promise<{ width: number; height: number } | null> {
  const path = publicFilePath(cid)
  if (!existsSync(path)) return null
  try {
    const meta = await sharp(path).metadata()
    if (!meta.width || !meta.height) return null
    return { width: meta.width, height: meta.height }
  } catch {
    return null
  }
}
