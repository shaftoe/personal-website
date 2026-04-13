import { siteConfig } from "../config"

export interface PostrollEntry {
  url: string
  tootUrl: string
  createdAt: Date
}

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
 * Extracts the first HTTP(S) URL from the HTML content of a Mastodon status.
 * Returns null if no URL is found.
 */
function extractFirstUrl(html: string): string | null {
  const match = html.match(/href="(https?:\/\/[^"]+)"/)
  return match ? match[1] : null
}

// --- Generic Mastodon API client ---

const FETCH_TIMEOUT = 5_000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Mastodon API error: ${res.status} ${res.statusText}`)
    }
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Paginates through the account statuses endpoint, calling `onPage`
 * for each batch of results. Follows Mastodon's Link header for pagination.
 *
 * @param params  Query parameters for the first request
 * @param onPage  Callback invoked with each page of statuses;
 *                return true to continue paginating, false to stop
 * @param label   Human-readable label used in warning messages
 */
async function paginateAccountStatuses(
  params: Record<string, string>,
  onPage: (statuses: MastodonStatus[]) => boolean,
  label: string,
): Promise<void> {
  const baseUrl = `${siteConfig.mastodon.instance}/api/v1/accounts/${siteConfig.mastodon.accountId}/statuses`

  let nextUrl: string | null = `${baseUrl}?${new URLSearchParams(params)}`

  try {
    while (nextUrl) {
      const res = await fetchWithTimeout(nextUrl)
      const statuses: MastodonStatus[] = await res.json()

      const shouldContinue = onPage(statuses)

      if (!shouldContinue) break

      // Mastodon signals more pages via the Link header:
      //   Link: <https://...?max_id=123>; rel="next"
      const linkHeader = res.headers.get("link")
      const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)
      nextUrl = nextMatch?.[1] ?? null
    }
  } catch (error) {
    console.warn(
      `⚠️ Mastodon API fetch failed: ${error instanceof Error ? error.message : String(error)} — ${label}`,
    )
  }
}

// --- Public API ---

/**
 * Fetches the latest N toots from the configured Mastodon account.
 * Excludes reblogs and replies.
 */
export async function getLatestToots(limit = 3): Promise<Toot[]> {
  const toots: Toot[] = []

  await paginateAccountStatuses(
    {
      limit: String(limit),
      exclude_reblogs: "true",
      exclude_replies: "true",
    },
    (statuses) => {
      for (const s of statuses) {
        toots.push({
          id: s.id,
          url: s.url,
          content: sanitizeHtml(s.content),
          createdAt: new Date(s.created_at),
          favouritesCount: s.favourites_count,
          reblogsCount: s.reblogs_count,
          repliesCount: s.replies_count,
        })
      }
      return false // single page only
    },
    "homepage will render without toots",
  )

  if (toots.length === 0) {
    console.warn(
      "⚠️ Mastodon API returned no toots — homepage will render without toots",
    )
  }

  return toots
}

/**
 * Fetches all toots tagged with #postroll from the configured Mastodon account.
 * Extracts the first URL from each toot's content and returns it as a PostrollEntry.
 * Paginates through all available results using the Mastodon Link header.
 */
export async function getPostrollEntries(): Promise<PostrollEntry[]> {
  const entries: PostrollEntry[] = []

  await paginateAccountStatuses(
    {
      limit: "40",
      exclude_reblogs: "true",
      tagged: "postroll",
    },
    (statuses) => {
      for (const s of statuses) {
        const extractedUrl = extractFirstUrl(s.content)
        if (extractedUrl) {
          entries.push({
            url: extractedUrl,
            tootUrl: s.url,
            createdAt: new Date(s.created_at),
          })
        }
      }
      return true // keep paginating
    },
    `returning ${entries.length} postroll entries fetched so far`,
  )

  return entries
}
