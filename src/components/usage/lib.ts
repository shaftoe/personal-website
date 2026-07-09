import { siteConfig } from "../../config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single LLM service usage entry. */
export interface UsageService {
  service: string
  /** Billing model: `"sub"` for subscription, `"top_up"` for prepaid credit. */
  kind: "sub" | "top_up"
  /** Quota consumed, as a percentage (0–100), for rate-limited services. */
  percentage?: number
  /** Remaining credit balance, for prepaid/pay-as-you-go services. */
  balance?: number
  /** ISO-8601 timestamp when the quota resets (rate-limited services). */
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

/**
 * Provider names that should be hidden from the /usage dashboard even when
 * the upstream API still reports them. Stored lowercased and matched
 * case-insensitively so the exclusion lives in a single, well-typed place.
 */
const HIDDEN_PROVIDERS: ReadonlySet<string> = new Set(["stepfun"])

/** Public endpoint — no token or authentication required. */
export async function fetchUsage(): Promise<UsageResponse> {
  const url = `${siteConfig.api.baseUrl}/usage`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const payload = (await response.json()) as UsageResponse
  payload.services = payload.services.filter(
    (svc) => !HIDDEN_PROVIDERS.has(svc.service.toLowerCase()),
  )
  return payload
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
