# Using an Obsidian vault (Live Sync) as the source for blog posts

Status: **design / feasibility study** (issue #419). Nothing here changes the
default build yet — the included `scripts/sync-posts.ts` is opt-in and a no-op
until an environment variable is set.

## TL;DR

- **Don't point the build at CouchDB directly.** Obsidian Live Sync stores its
  internal, chunked (and optionally end-to-end encrypted) representation in
  CouchDB — *not* plain `.md` files. Reassembling plain files from those docs
  means re-implementing plugin internals that change between releases. It is the
  brittle path.
- **Do keep Git as the build's source-of-record**, and mirror the relevant
  Obsidian vault folder into `posts/` from a device that already has the
  reconstructed plain-files vault (e.g. the always-on Raspberry Pi). This
  preserves every existing Git-centric workflow (ATproto `standard` sidecar,
  pre-commit drift check, lefthook build/test, semantic-release) and keeps the
  build working **offline, locally, and on Netlify** with zero new build-time
  network dependency.
- **Optionally**, for instant publish (without waiting for the Git round-trip),
  the build can fetch a *plain-file mirror* over plain HTTPS at build time.
  `scripts/sync-posts.ts` implements exactly that seam today: it is inert unless
  `OBSIDIAN_POSTS_MANIFEST_URL` is set, and falls back to the committed
  `posts/` otherwise.
- **S3 does simplify the design — but not as a Live Sync backend.** See
  ["Does S3 make this simpler?"](#does-s3-make-this-simpler).

---

## The decisive constraint: Live Sync stores internals, not files

[obsidian-livesync](https://github.com/vrtmrz/obsidian-livesync) syncs a vault
*between devices*. Each device runs the Obsidian plugin, which **reconstructs
plain files on a local filesystem**. The CouchDB database the devices talk to
does **not** contain the vault as readable `.md` files. Instead it contains the
plugin's internal representation:

- every file is split into **chunks** (a small piece/leaf tree, for efficient
  incremental sync, deduplication and conflict resolution), stored as separate
  CouchDB documents keyed by content hashes;
- when **end-to-end encryption** is enabled (it usually is, for an
  internet-exposed CouchDB), every chunk is encrypted with a passphrase that
  only the Obsidian plugin knows.

Consequences for a "build reads CouchDB" approach:

1. You cannot `GET` a document and get Markdown back. You get base64 chunk docs
   that must be reassembled using the plugin's tree logic.
2. With E2E encryption on, the data is opaque without the passphrase.
3. That tree/chunk/encryption format is **plugin-internal and version-specific.**
   Tracking it is a maintenance trap — every plugin upgrade can change it.

So no matter which backend the plugin writes to, the build would need to
reimplement the plugin's file reconstruction. That is the part to avoid.

> The plugin author's own intended way to obtain plain files is: **run Obsidian
> with the plugin on a device.** That device *has* the reconstructed vault on
> disk. We simply reuse one such device as the publisher.

---

## Does S3 make this simpler?

Two different questions tend to get conflated. Separating them:

**1. Can Live Sync use S3 (or an object store) as its *sync backend* instead of
CouchDB?** obsidian-livesync's sync protocol is CouchDB's replication model
(`_changes` feed, `_rev` generations, `_bulk_docs`). The canonical backend is
CouchDB (self-hosted, or hosted on fly.io / Cloudant). Even if/where an
S3-compatible surface exists, **it would still hold the internal chunked
representation**, not plain files — so it does not help the build read Markdown.

**2. Can we use S3 as the *publish/transport* layer between Obsidian and the
build?** **Yes, and this is where S3 genuinely helps.** Instead of exposing a
self-hosted CouchDB (or a Raspberry Pi) directly to Netlify/GitHub Actions, the
publisher device exports the **plain-files** blog folder to an S3 bucket on a
schedule. The build then reads from S3 over plain HTTPS (presigned URLs or a
public-read prefix), which:

- is far more available and lower-latency than a home-hosted CouchDB;
- needs **no CouchDB credentials, no plugin knowledge, no decryption** in the
  build — just an HTTPS GET of plain files;
- is trivially reachable from Netlify and GitHub Actions (no allow-listing of
  build egress IPs, no self-signed certs, etc.);
- can be served cache-friendly behind CloudFront/Cloudflare if desired.

In short: **S3 as a plain-file export target simplifies the build enormously;
S3 as a Live Sync backend would not.** The build code does not care whether the
HTTPS source is S3, a Pi endpoint, or anything else — see the contract below.

---

## Architecture options evaluated

### Option A — build reads CouchDB directly

The build authenticates to CouchDB, replicates the vault DB, reconstructs plain
files, writes them into `posts/`.

- ❌ Requires reimplementing the plugin's chunk-tree reassembly.
- ❌ Requires the E2E passphrase in CI (Netlify + GitHub Actions).
- ❌ Adds a hard build-time dependency on an internet-exposed home CouchDB
  (latency, uptime, egress allow-listing).
- ❌ Brittle across plugin upgrades.
- ✅ Truly "live", no Git round-trip.

**Verdict: rejected.** The cost/risk is unjustifiable; the liveness benefit is
available via cheaper options.

### Option B — Git remains the build source; a publisher device mirrors Obsidian → Git *(recommended baseline)*

An always-on device that already runs Obsidian + Live Sync (e.g. the Raspberry
Pi referenced throughout the site) watches the vault's blog folder and commits
new/changed files into `posts/` in this repo on a schedule (cron + `git`, or a
tiny webhook → GitHub Action).

- The build, lefthook, `standard:documents` drift check, semantic-release —
  **all unchanged.** Git stays the source-of-record.
- Locally: `git pull` → `posts/` is current. No network at build time.
- Netlify: builds from Git. No new secrets, no new network dependency.
- Freshness cadence = mirror interval + the existing scheduled deploys (every
  few hours). Good enough for a blog.
- ✅ Lowest risk; preserves the entire existing toolchain.
- ⚠️ Requires the publisher device to be on and able to push.

### Option C — build fetches a plain-file mirror over HTTPS at build time *(optional enhancement)*

The publisher device additionally exposes the blog folder as plain files over
HTTPS (an S3 bucket, a small Pi endpoint, or a presigned URL). The build, when
configured with that URL, pulls the files into `posts/` before Astro's content
collection is read. When the URL is **not** configured, the build uses the
committed `posts/` — identical to today.

`scripts/sync-posts.ts` implements this seam now (see below). It is the
"instant publish" knob: combine it with the Netlify scheduled build hook and a
new post appears on the site minutes after it is written in Obsidian, with no
Git commit in the critical path.

- ✅ Build stays a single `bun run build`; opt-in via one env var.
- ✅ Works locally (no env → uses Git `posts/`), on Netlify (env set → fetch),
  and in GitHub Actions tests (no env → uses Git `posts/`, no network).
- ✅ Source-agnostic: S3 presigned URL, CloudFront, or a Pi endpoint are all the
  same to the build.
- ⚠️ Adds a build-time network dependency **only when opted in**; failure is
  fatal (we never silently serve stale canonical content), matching the policy
  already used for the PDS profile picture.

### Recommended: **B as the baseline, C as the freshness knob**

Keep Git as source-of-record (Option B) so the rich Git-centric workflows keep
working unchanged, and enable Option C on Netlify for near-real-time publishing.
The two compose perfectly: C fetches into the working `posts/`; if the fetch is
unavailable and you fall back to B's committed state, the site is merely a bit
less fresh, never broken.

---

## How it satisfies "must build locally and on Netlify"

| Environment | Option B (baseline) | Option C (opt-in fetch) |
| --- | --- | --- |
| Local `bun run build` | reads committed `posts/` (offline) | if `OBSIDIAN_POSTS_MANIFEST_URL` unset → same; if set → fetch then build |
| GitHub Actions `test` workflow | reads committed `posts/` (no new secrets/network) | unset by default → identical to today |
| Netlify build | reads committed `posts/` (already mirrored from Obsidian) | set the env var → fetch the live mirror, then build |

No environment regresses. Enabling C anywhere is a single env var and is
independently revertible.

---

## Interactions with existing subsystems

These all currently read `posts/` and must keep working:

- **Astro content collection** (`src/content.config.ts`, `glob({ base: "./posts" })`):
  unaffected. Whether `posts/` is populated by Git checkout or by the sync
  script, the loader sees the same files.
- **`src/integrations/blog-redirects.ts`**: reads `posts/*.md` frontmatter at
  `astro:build:done`. Works as long as `posts/` is populated before/during
  build (it is, in both B and C).
- **`scripts/blog-posts.ts`** and **`scripts/standard-documents.ts`**: read
  `posts/` from `process.cwd()`. Work identically.
- **ATproto `standard` sidecar + pre-commit drift check** (`lefthook.yml` →
  `standard:documents --check`): this is the one that **anchors posts to Git**.
  The drift check runs against the *committed* sidecar vs the *checked-out*
  `posts/`. Under Option B this is exactly right (Git is source-of-record).
  Under Option C *alone* (posts fetched at build, not committed), the drift
  check would compare against stale Git posts — so **C does not replace B**;
  B must still keep Git's `posts/` current. This is why B is the baseline.
- **Scheduled deploys** (`.github/workflows/scheduled-deploy.yml`, every few
  hours → Netlify build hook): with B, these automatically surface newly
  mirrored posts. With C enabled, they additionally pull the latest mirror.
- **Images / binary attachments** (`whois_poller.png`, etc.): posts reference
  assets by relative path. The export **must include the assets alongside the
  `.md`** (see the vault contract). `scripts/sync-posts.ts` writes both.

---

## The vault → `posts/` contract

For the mirror to be a drop-in for the current `posts/` layout, the published
subset of the vault should follow these rules (enforced/mirrored by the
publisher, validated by the sync script):

1. **One folder** in the vault is the "blog" root (e.g. `_blog/` or `posts/`).
   Only that folder is mirrored; everything else in the vault is private.
2. **Frontmatter matches `blogSchema`** (`src/lib/blog-collection.ts`):
   `title` (required), `slug`, `description`, `longDescription`, `cardImage`,
   `tags`, `readTime`, `timestamp`/`date`. Unknown fields are ignored.
3. **Slug** comes from `slug` frontmatter, else the note filename (minus `.md`),
   matching today's convention.
4. **Attachments live next to the note** (set Obsidian's "Default location for
   new attachments" → *Same folder as current file*) so relative image links
   like `![alt](whois_poller.png)` resolve identically to the current repo.
5. **Private notes** are excluded (drafts kept out of the mirrored folder, or
  gated by a frontmatter flag the publisher filters on).

---

## Implementation included here: `scripts/sync-posts.ts`

A small, dependency-free pre-build fetcher that materialises `posts/` from a
plain-file mirror over HTTPS. It is **opt-in and inert by default**.

**Manifest format.** The source URL returns a small JSON document:

```jsonc
{
  "files": {
    "free-whois-monitoring-with-serverless-on-aws.md": {
      "encoding": "utf8",
      "content": "---\ntitle: ...\n---\n\nBody…"
    },
    "whois_poller.png": { "encoding": "base64", "content": "iVBORw0KG…" }
  }
}
```

- `utf8` for text (Markdown), `base64` for binaries (images). One HTTP request.
- Any publisher can produce this: an S3-backed Lambda listing a prefix, a tiny
  script on the Pi, or even a GitHub Actions job that reads a checked-out vault
  subset and uploads the JSON to S3.

**Environment variables.**

| Var | Required | Purpose |
| --- | --- | --- |
| `OBSIDIAN_POSTS_MANIFEST_URL` | no | HTTPS URL to the manifest JSON. Unset ⇒ no-op (use committed `posts/`). |
| `OBSIDIAN_POSTS_TOKEN` | no | Bearer token sent as `Authorization: Bearer …`. |

**Behaviour.**

- Unset URL → logs a one-liner and exits 0. The committed `posts/` is used.
  This is the state of CI and local builds today.
- Set URL → fetches the manifest, **path-sanitises** every entry (rejects `..`,
  absolute paths, backslashes — prevents traversal outside `posts/`),
  validates each `.md` against `blogSchema` (warns + skips invalid, never
  crashes the build on a single bad note), writes Markdown + binaries into
  `posts/`, and prints a summary. Fetch failure is fatal (opted-in = required).

**Wiring on Netlify (opt-in only).** In `netlify.toml` (or the site UI) set
`OBSIDIAN_POSTS_MANIFEST_URL` and optionally `OBSIDIAN_POSTS_TOKEN`, and change
the build command to fetch-then-build:

```toml
[build]
  command = "bun run sync:posts && bun run build"
```

Locally you can run `bun run sync:posts` manually before `bun run build` to
preview the live vault. The default `build` script is **not** changed, so the
repo builds unchanged until you opt in.

**Why a JSON manifest and not a tarball/zip?** Zero dependencies and one
request. The manifest is trivial to generate from any backend (S3 list, Pi).
For very large vaults a streamed `.tar.gz` (via `node:zlib` + a tiny tar reader)
is a straightforward future enhancement behind the same env-var seam.

**Security.** All write paths are constrained to `posts/` after normalisation
and rejection of traversal sequences. The token is sent only over HTTPS.

---

## Open decisions for the maintainer

1. **Mirror cadence & device.** Confirm the Pi (or another always-on device) as
   the publisher for Option B, and the mirror interval.
2. **Private-note gating.** Pick a convention (a dedicated vault subfolder, or a
   `published: true` frontmatter flag the publisher filters on).
3. **S3 vs. self-hosted manifest endpoint** for Option C. S3 + presigned URLs is
   the most robust and keeps zero secrets in the build (the URL itself is the
   credential). A Pi endpoint is fine for a personal site but couples build
   uptime to home infrastructure.
4. **Do we keep `posts/` committed?** Recommendation: **yes** (B as baseline).
   Removing it would break the `standard` drift check and lose the offline/local
   fallback.
5. **Failure policy for C.** Currently fatal when opted in. Could be made
   non-fatal with an explicit `OBSIDIAN_POSTS_FALLBACK=1` to serve Git's
   `posts/` on fetch failure — but silent staleness is arguably worse for a
   canonical source, so the default is to fail loudly.

---

## Future work (out of scope here)

- A GitHub Action that runs on the publisher's signal, pulls the latest vault
  subset, and commits `posts/` (closes the Option B loop automatically).
- Streaming tarball source for large vaults.
- Cross-posting/round-trip: writing build-derived artifacts (e.g. the
  `standard.document` AT-URIs) back into the vault's frontmatter.
