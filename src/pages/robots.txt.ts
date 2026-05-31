import type { APIRoute } from "astro"
import { siteConfig } from "../config"

export const GET: APIRoute = async () => {
  const baseUrl = siteConfig.globalMeta.baseUrl

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /expenses

Sitemap: ${baseUrl}/sitemap-index.xml
`

  return new Response(robotsTxt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
