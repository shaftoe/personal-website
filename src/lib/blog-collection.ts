import type { CollectionEntry } from "astro:content"
import { z } from "astro/zod"

/**
 * Blog collection schema — validates frontmatter fields from markdown posts.
 *
 * Do NOT use zod transforms here. Transforms run during `astro sync` and the
 * resulting data is serialised with `devalue` into `.astro/data-store.json`.
 * If the transform produces objects that devalue cannot revive in the Vite
 * runtime (e.g. Temporal.Instant), the dev server will silently fail to load
 * the collection. Instead, keep the schema output as plain JSON-compatible
 * values and convert to Temporal.Instant at render time via `toInstant()` in
 * utils.ts.
 */
export const blogSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  cardImage: z.url().optional(),
  tags: z.array(z.string()).optional(),
  readTime: z.number().optional(),
  timestamp: z.date().optional(),
  date: z.coerce.date().optional(),
})

export type BlogEntry = z.infer<typeof blogSchema>

export type ArticleFrontmatter = CollectionEntry<"blog">["data"]
