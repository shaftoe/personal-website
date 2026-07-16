/**
 * CLI script — creates or updates the `site.standard.publication` record on
 * the self-hosted PDS, then persists the resulting AT URI into the committed
 * sidecar so the `/.well-known/site.standard.publication` endpoint can serve
 * it at build time.
 *
 * The record value is derived from `siteConfig` (blog title, base URL,
 * description) and the profile image (uploaded as the publication icon), so it
 * always stays in sync with the site.
 *
 * Usage:
 *   ATP_APP_PASSWORD=<app-password> bun run standard:publication
 *   ATP_APP_PASSWORD=<app-password> bun run standard:publication --dry-run
 *
 * Requires a Bluesky **app password** (not the account password) via the
 * `ATP_APP_PASSWORD` environment variable.
 */

import { siteConfig } from "../src/config"
import {
  buildPublicationRecord,
  createSession,
  extractRkey,
  findPublicationRecord,
  generateTid,
  PUBLICATION_COLLECTION,
  putRecord,
  readStandardSidecar,
  resolveDid,
  uploadPublicationIcon,
  writeStandardSidecar,
} from "../src/lib/standard"

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  console.log(`Resolving DID for ${siteConfig.atproto.handle}…`)
  const did = await resolveDid()
  console.log(`  → ${did}`)

  if (dryRun) {
    const record = buildPublicationRecord()
    console.log("\nDry run — would create/replace publication record:\n")
    console.log(JSON.stringify({ did, rkey: "<auto>", ...record }, null, 2))
    return
  }

  const appPassword = process.env.ATP_APP_PASSWORD
  if (!appPassword) {
    console.error(
      "✖ ATP_APP_PASSWORD env var is required (a Bluesky app password).",
    )
    process.exit(1)
  }

  console.log("Authenticating…")
  const session = await createSession(appPassword)

  // Reuse an existing record key (sidecar → PDS lookup → new TID) so re-runs
  // update the same record instead of creating duplicates.
  const sidecar = readStandardSidecar()
  let rkey: string | undefined
  let createdAt: string | undefined
  if (sidecar.publication?.uri) {
    rkey = extractRkey(sidecar.publication.uri)
    console.log(`  → reusing rkey from sidecar: ${rkey}`)
  } else {
    const existing = await findPublicationRecord(did)
    if (existing) {
      rkey = existing.rkey
      createdAt = existing.createdAt
      console.log(`  → found existing record on PDS: ${existing.uri}`)
    }
  }
  if (!rkey) {
    rkey = generateTid()
    console.log(`  → generated new rkey: ${rkey}`)
  }

  console.log("Uploading publication icon…")
  const icon = await uploadPublicationIcon(session)

  console.log(`Putting ${PUBLICATION_COLLECTION}/${rkey}…`)
  const record = buildPublicationRecord({ icon: icon ?? undefined, createdAt })
  const ref = await putRecord(session, PUBLICATION_COLLECTION, rkey, record)

  writeStandardSidecar({ ...sidecar, publication: ref })

  console.log(`\n  ✓ publication published`)
  console.log(`    uri: ${ref.uri}`)
  console.log(`    cid: ${ref.cid}`)
  console.log(
    `\n  Commit ${siteConfig.standard.sidecarPath} to publish the .well-known endpoint.\n`,
  )
}

main().catch((error) => {
  console.error(
    `\n✖ ${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exit(1)
})
