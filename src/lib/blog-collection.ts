import type { CollectionEntry } from "astro:content"
import { z } from "astro/zod"

/**
 * Blog collection schema + transform — shared between the Astro content
 * config and standalone CLI scripts.
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
    const timestamp = data.timestamp ?? data.date ?? new Date()
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
      timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    }
  })

export type BlogEntry = z.infer<typeof blogSchema>

export type ArticleFrontmatter = CollectionEntry<"blog">["data"] & {
  url: string
}
