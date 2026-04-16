import type { CollectionEntry } from "astro:content"
import { z } from "astro/zod"
import { Temporal } from "temporal-polyfill"

/**
 * Converts a Date (as provided by Astro's content loader) to a Temporal.Instant.
 */
function dateToInstant(d: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(d.getTime())
}

/**
 * Blog collection schema + transform — shared between the Astro content
 * config and standalone CLI scripts.
 *
 * NOTE: Astro's content loader does NOT apply zod transforms at runtime.
 * The transform below is used by CLI scripts. In Astro pages/components,
 * use `toInstant()` from utils.ts to convert the Date to Temporal.Instant.
 */
export const blogSchema = z
  .object({
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
  .transform((data) => {
    const source = data.timestamp ?? data.date
    const instant = source ? dateToInstant(source) : Temporal.Now.instant()
    const slug =
      data.slug ??
      data.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
    return {
      title: data.title,
      slug,
      description: data.description ?? "",
      longDescription: data.longDescription,
      cardImage: data.cardImage,
      tags: data.tags,
      readTime: data.readTime,
      timestamp: instant,
    }
  })

export type BlogEntry = z.infer<typeof blogSchema>

export type ArticleFrontmatter = CollectionEntry<"blog">["data"]
