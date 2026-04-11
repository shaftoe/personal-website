import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { blogSchema } from "./lib/blog-collection"

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./posts" }),
  schema: blogSchema,
})

export const collections = { blog }
