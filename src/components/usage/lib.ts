import { siteConfig } from "../../config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single quota window within a subscription service (e.g. "5h", "weekly"). */
export interface UsageQuota {
  /** Human-readable window label, e.g. `"5h"`, `"weekly"`, `"tools"`. */
  label: string
  /** Quota kind, e.g. `"TOKENS_LIMIT"` or `"TIME_LIMIT"`. */
  type?: string
  /** Optional numeric limit / unit count for the window. */
  unit?: number
  /** Quota consumed, as a percentage (0–100). */
  percentage: number
  /** ISO-8601 timestamp when this window resets. */
  reset_at?: string
}

/** A single LLM service usage entry. */
export interface UsageService {
  service: string
  /** Billing model: `"sub"` for subscription, `"top_up"` for prepaid credit. */
  kind: "sub" | "top_up"
  /** Subscription tier, e.g. `"lite"`, `"pro"`. Only for `kind: "sub"`. */
  level?: string
  /** Per-window quotas for subscription services. */
  quotas?: UsageQuota[]
  /** Quota consumed, as a percentage (0–100), for rate-limited services (legacy, prefer `quotas`). */
  percentage?: number
  /** Remaining credit balance, for prepaid/pay-as-you-go services. */
  balance?: number
  /** Currency/unit prefix for the balance, e.g. `"HC"`. Defaults to `"$"` when absent. */
  unit?: string
  /** ISO-8601 timestamp when the quota resets (legacy, prefer `quotas[].reset_at`). */
  reset_at?: string
}

/** Full payload returned by the public usage API. */
export interface UsageResponse {
  timestamp: string
  services: UsageService[]
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

/** Public endpoint — no token or authentication required. */
export async function fetchUsage(): Promise<UsageResponse> {
  const url = `${siteConfig.api.baseUrl}/usage`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json() as Promise<UsageResponse>
}

// ---------------------------------------------------------------------------
// Formatting helpers (Temporal-only)
// ---------------------------------------------------------------------------

/** Format the API's UTC timestamp into a readable, localized date/time. */
export function formatTimestamp(iso: string): string {
  const instant = Temporal.Instant.from(iso)
  return instant.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a compact relative countdown until the given ISO timestamp, e.g.
 * `"2h 05m"`, `"45m"`, `"<1m"`. Returns `"imminent"` when the moment has
 * already passed (or is within a second).
 */
export function formatRelativeUntil(iso: string): string {
  const target = Temporal.Instant.from(iso)
  const now = Temporal.Now.instant()
  const diffNs = target.epochNanoseconds - now.epochNanoseconds
  if (diffNs <= 0n) return "imminent"
  const totalSeconds = Number(diffNs / 1_000_000_000n)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`
  if (minutes > 0) return `${minutes}m`
  return "<1m"
}
