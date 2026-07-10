import rss, { rssSchema } from "@astrojs/rss"
import type { APIRoute } from "astro"
import { siteConfig } from "../config"
import { getLatestPosts } from "../lib/atproto"

/**
 * RSS feed of the latest microblog posts, sourced from the author's
 * self-hosted ATproto PDS — the same data that powers the homepage's "Latest
 * microblog posts" section, exposed here for RSS readers.
 */

/** How many recent posts to include in the feed. */
const FEED_LIMIT = 20

/** Maximum number of characters used for an auto-generated item title. */
const TITLE_MAX_LENGTH = 80

/**
 * Builds a concise title from a post's plain text by collapsing whitespace and
 * truncating to {@link TITLE_MAX_LENGTH} characters. Microblog posts rarely
 * have an explicit title, so this derives one from the body text.
 */
function buildItemTitle(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim()
  if (!flat) return "Untitled post"
  if (flat.length <= TITLE_MAX_LENGTH) return flat
  return `${flat.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
}

export const GET: APIRoute = async (context) => {
  const posts = await getLatestPosts(FEED_LIMIT)

  return rss({
    title: `${siteConfig.globalMeta.name}'s Microblog`,
    description:
      "Latest microblog posts from my Bluesky / ATproto account — short thoughts, links, and updates.",
    // biome-ignore lint/style/noNonNullAssertion: site is always set in astro.config.mjs
    site: context.site!,
    // rssSchema.parse() lets us hand off the Temporal epoch milliseconds
    // directly — the library's zod schema accepts number | string | Date and
    // constructs the Date itself, so our code never touches the Date
    // constructor (per the project convention of using Temporal exclusively).
    items: posts.map((post) =>
      rssSchema.parse({
        title: buildItemTitle(post.text),
        pubDate: post.createdAt.epochMilliseconds,
        description: post.text,
        content: post.content,
        link: post.url,
      }),
    ),
  })
}
