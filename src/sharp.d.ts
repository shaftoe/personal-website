/**
 * Type declarations for 'sharp' (v0.35+).
 *
 * sharp 0.35 introduced a package.json "exports" map without a "types" condition,
 * which breaks TypeScript resolution under moduleResolution "Bundler".
 * The actual types live at sharp/lib/index.d.ts but are unreachable via exports.
 * See https://github.com/lovell/sharp/issues/4296
 */
declare module "sharp" {
  import { Buffer } from "node:buffer"

  interface Sharp {
    png(options?: { quality?: number; compressionLevel?: number }): Sharp
    jpeg(options?: { quality?: number }): Sharp
    webp(options?: { quality?: number }): Sharp
    toBuffer(): Promise<Buffer>
    toFile(pathOut: string): Promise<{
      format: string
      width: number
      height: number
      channels: number
      premultiplied: boolean
      size: number
    }>
    resize(
      width?: number | null,
      height?: number | null,
      options?: { fit?: string; position?: string },
    ): Sharp
  }

  interface SharpConstructor {
    (
      input?:
        | Buffer
        | string
        | {
            create: {
              width: number
              height: number
              channels: number
              background: { r: number; g: number; b: number; alpha: number }
            }
          },
    ): Sharp
    (): Sharp
  }

  const sharp: SharpConstructor
  export default sharp
}
