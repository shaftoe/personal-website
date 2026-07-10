import type { APIRoute } from "astro"
import { siteConfig } from "../config"
import { buildEntryTitle, generateAtomFeed } from "../lib/atom"
import { getLatestPosts } from "../lib/atproto"

/**
 * Atom 1.0 feed of the latest microblog posts, sourced from the author's
 * self-hosted ATproto PDS — the same data that powers the homepage's "Latest
 * microblog posts" section, exposed here for RSS/Atom readers.
 */

/** How many recent posts to include in the feed. */
const FEED_LIMIT = 20

export const GET: APIRoute = async (context) => {
  const posts = await getLatestPosts(FEED_LIMIT)
  // biome-ignore lint/style/noNonNullAssertion: site is always set in astro.config.mjs
  const site = context.site!

  const xml = generateAtomFeed({
    title: `${siteConfig.globalMeta.name}'s Microblog`,
    subtitle:
      "Latest microblog posts from my Bluesky / ATproto account — short thoughts, links, and updates.",
    site: site.origin,
    selfUrl: new URL("/microblog.xml", site).href,
    author: { name: siteConfig.globalMeta.name, uri: site.origin },
    entries: posts.map((post) => ({
      id: post.url,
      title: buildEntryTitle(post.text),
      link: post.url,
      published: post.createdAt,
      updated: post.createdAt,
      content: post.content,
    })),
  })

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  })
}
