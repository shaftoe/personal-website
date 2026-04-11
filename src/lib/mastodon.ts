import { siteConfig } from "../config"

export interface Toot {
  id: string
  url: string
  content: string
  createdAt: Date
  favouritesCount: number
  reblogsCount: number
  repliesCount: number
}

interface MastodonStatus {
  id: string
  url: string
  content: string
  created_at: string
  favourites_count: number
  reblogs_count: number
  replies_count: number
}

/**
 * Strips potentially dangerous HTML and CSS classes from Mastodon toot content.
 * Removes <script> tags, on* event handler attributes, javascript: URLs,
 * and CSS classes that could interfere with site styling.
 * The Mastodon API already sanitizes content, but this adds a defense-in-depth
 * layer in case the instance is compromised.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    .replace(/\sclass\s*=\s*["'][^"']*["']/gi, "") // Remove all class attributes
}

/**
 * Fetches the latest N toots from the configured Mastodon account.
 * Excludes reblogs and replies.
 *
 * Includes a 5-second timeout to prevent builds from hanging,
 * and warns if the API returns no results (likely a network issue).
 */
export async function getLatestToots(limit = 3): Promise<Toot[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    exclude_reblogs: "true",
    exclude_replies: "true",
  })

  const url = `${siteConfig.mastodon.instance}/api/v1/accounts/${siteConfig.mastodon.accountId}/statuses?${params}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn(
        `⚠️ Mastodon API error: ${res.status} ${res.statusText} — homepage will render without toots`,
      )
      return []
    }

    const statuses: MastodonStatus[] = await res.json()

    if (statuses.length === 0) {
      console.warn(
        "⚠️ Mastodon API returned no toots — homepage will render without toots",
      )
    }

    return statuses.map((s) => ({
      id: s.id,
      url: s.url,
      content: sanitizeHtml(s.content),
      createdAt: new Date(s.created_at),
      favouritesCount: s.favourites_count,
      reblogsCount: s.reblogs_count,
      repliesCount: s.replies_count,
    }))
  } catch (error) {
    console.warn(
      `⚠️ Mastodon API fetch failed: ${error instanceof Error ? error.message : String(error)} — homepage will render without toots`,
    )
    return []
  }
}
