import type { APIRoute } from "astro"
import { getPublicationUri } from "../../lib/standard"

/**
 * Standard.site domain verification endpoint.
 *
 * Standard.site reader/indexer apps fetch `/.well-known/site.standard.publication`
 * to confirm that the domain named in a publication record's `url` field
 * actually points back to that record. The expected response is the bare
 * publication AT URI as plain text (this mirrors how standard.site itself
 * serves the endpoint).
 *
 * The URI is read from the committed `standard.json` sidecar, populated by the
 * `standard:publication` CLI script — so no PDS access or credentials are
 * required at build time. Before adoption the endpoint responds `404`.
 */
export const GET: APIRoute = async () => {
  const uri = getPublicationUri()
  if (!uri) {
    return new Response(
      "Standard.site publication not configured. Run `bun run standard:publication`.\n",
      {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    )
  }
  return new Response(uri, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  })
}
