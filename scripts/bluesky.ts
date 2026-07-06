/**
 * CLI script — fetches and displays the microblog posts that will appear on
 * the homepage, using the same ATproto / Bluesky API logic used at build time.
 *
 * Usage:
 *   bun run bluesky
 *   bun run bluesky --json
 */
import { getLatestPosts } from "../src/lib/atproto"

// Must mirror the limit used on the homepage (src/pages/index.astro).
const HOMEPAGE_LIMIT = 3

async function main() {
  const json = process.argv.includes("--json")
  const posts = await getLatestPosts(HOMEPAGE_LIMIT)

  if (posts.length === 0) {
    console.log("\n  No microblog posts found.\n")
    process.exit(0)
  }

  if (json) {
    console.log(JSON.stringify(posts, null, 2))
  } else {
    console.log(
      `\n  🐝 ${posts.length} microblog post${posts.length !== 1 ? "s" : ""} found\n`,
    )

    for (const post of posts) {
      console.log(`  ${post.text.replace(/\n/g, " ")}`)
      console.log(`    url:   ${post.url}`)
      console.log(`    date:  ${post.createdAt.toString().slice(0, 10)}`)
      console.log(
        `    stats: ${post.likeCount} like${post.likeCount !== 1 ? "s" : ""} · ${post.repostCount} repost${post.repostCount !== 1 ? "s" : ""} · ${post.replyCount} repl${post.replyCount !== 1 ? "ies" : "y"}`,
      )
      console.log()
    }
  }
}

main()
