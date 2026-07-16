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
 *   ATP_APP_PASSWORD=<app-password> bun run standard:publication --force
 *
 * Requires a Bluesky **app password** (not the account password) via the
 * `ATP_APP_PASSWORD` environment variable — but only when something actually
 * needs writing (see below).
 *
 * ## Keeping it in sync
 *
 * The script is **idempotent**: it reuses the publication's stable record key
 * (sidecar → PDS lookup → new TID) so re-runs update the same record instead of
 * creating duplicates. It also **skips the write when nothing has changed**:
 * the publication's source (title, base URL, description and the icon image) is
 * hashed and compared to the hash stored in the sidecar on the last sync, so a
 * no-op run performs no PDS calls and needs no credentials. Pass `--force` to
 * re-publish regardless (e.g. after a manual edit to the record on the PDS).
 *
 * Run it whenever the site title/description or the hero/profile image changes.
 * See the "Standard.site Publishing" section of `src/pages/colophon.md`.
 */

import { siteConfig } from "../src/config"
import {
  type BlobRef,
  buildPublicationRecord,
  createSession,
  extractRkey,
  findPublicationRecord,
  generateTid,
  PUBLICATION_COLLECTION,
  PUBLICATION_ICON_MIME,
  publicationSyncHash,
  putRecord,
  readPublicationIcon,
  readStandardSidecar,
  resolveDid,
  uploadBlob,
  writeStandardSidecar,
} from "../src/lib/standard"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const force = process.argv.includes("--force")

  console.log(`Resolving DID for ${siteConfig.atproto.handle}…`)
  const did = await resolveDid()
  console.log(`  → ${did}`)

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

  // Change detection: hash the publication's source (site-derived fields + the
  // icon file's own content hash) and compare it to the last sync's hash.
  const icon = readPublicationIcon()
  const syncHash = publicationSyncHash(icon?.hash ?? null)

  if (dryRun) {
    const record = buildPublicationRecord({ createdAt })
    console.log("\nDry run — would create/replace publication record:\n")
    console.log(JSON.stringify({ did, rkey, syncHash, ...record }, null, 2))
    return
  }

  if (
    !force &&
    sidecar.publication?.uri &&
    sidecar.publication.hash === syncHash
  ) {
    console.log(
      "\n  ↻ publication unchanged — nothing to sync (use --force to override).\n",
    )
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

  let iconBlob: BlobRef | null = null
  if (icon) {
    console.log("Uploading publication icon…")
    iconBlob = await uploadBlob(session, icon.bytes, PUBLICATION_ICON_MIME)
  }

  console.log(`Putting ${PUBLICATION_COLLECTION}/${rkey}…`)
  const record = buildPublicationRecord({
    icon: iconBlob ?? undefined,
    createdAt,
  })
  const ref = await putRecord(session, PUBLICATION_COLLECTION, rkey, record)

  writeStandardSidecar({
    ...sidecar,
    publication: { ...ref, hash: syncHash },
  })

  console.log(
    `\n  ✓ publication ${sidecar.publication?.uri ? "updated" : "published"}`,
  )
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
