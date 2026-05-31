import type { APIRoute } from "astro"
import { siteConfig } from "../config"

export const GET: APIRoute = async () => {
  const baseUrl = siteConfig.globalMeta.baseUrl

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /expenses

# AI crawlers explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Omgilibot
Allow: /

User-agent: Omgili
Allow: /

User-agent: FacebookBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${baseUrl}/sitemap-index.xml
`

  return new Response(robotsTxt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
