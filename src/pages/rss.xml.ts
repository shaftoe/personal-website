import { getCollection } from "astro:content"
import rss from "@astrojs/rss"
import type { APIRoute } from "astro"
import { siteConfig } from "../config"
import { sortArticlesByDate } from "../lib/utils"

export const GET: APIRoute = async (context) => {
  const posts = sortArticlesByDate(await getCollection("blog"))

  return rss({
    title: siteConfig.blogMeta.title,
    description:
      siteConfig.blogMeta.longDescription ?? siteConfig.blogMeta.description,
    // biome-ignore lint/style/noNonNullAssertion: site is always set in astro.config.mjs
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.timestamp,
      description: post.data.description,
      link: `/blog/${post.data.slug}/`,
    })),
  })
}
