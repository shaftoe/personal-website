/**
 * CLI script — fetches and displays postroll entries using the same
 * Mastodon API logic used at build time.
 *
 * Usage:
 *   bun run postroll
 *   bun run postroll --json
 */
import { getPostrollEntries } from "../src/lib/mastodon"

async function main() {
  const json = process.argv.includes("--json")
  const entries = await getPostrollEntries()

  if (entries.length === 0) {
    console.log("\n  No postroll entries found.\n")
    process.exit(0)
  }

  if (json) {
    console.log(JSON.stringify(entries, null, 2))
  } else {
    console.log(
      `\n  🔗 ${entries.length} postroll entr${entries.length !== 1 ? "ies" : "y"} found\n`,
    )

    for (const entry of entries) {
      console.log(`  ${entry.url}`)
      console.log(`    source: ${entry.tootUrl}`)
      console.log(`    date:   ${entry.createdAt.toISOString().slice(0, 10)}`)
      console.log()
    }
  }
}

main()
