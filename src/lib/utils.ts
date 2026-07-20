import type { CollectionEntry } from "astro:content"
import { Temporal } from "temporal-polyfill"

/**
 * Ensures a value is a Temporal.Instant, converting from Date if necessary.
 * Astro's content loader provides Date objects from frontmatter; this normalises
 * them to Temporal.Instant at the boundary.
 */
export function toInstant(value: unknown): Temporal.Instant {
  if (value instanceof Temporal.Instant) return value
  if (value instanceof Date) {
    return Temporal.Instant.fromEpochMilliseconds(value.getTime())
  }
  if (typeof value === "string") {
    return Temporal.Instant.from(value)
  }
  throw new TypeError(`Cannot convert ${typeof value} to Temporal.Instant`)
}

/**
 * Shortens a string by removing words at the end until it fits within a certain length.
 */
export const getShortDescription = (content: string, maxLength = 20) => {
  const splitByWord = content.split(" ")
  const length = splitByWord.length
  return length > maxLength
    ? `${splitByWord.slice(0, maxLength).join(" ")}...`
    : content
}

/**
 * Formats a Temporal.Instant as "2026-05-01" (UTC-based, ISO 8601).
 */
export const processArticleDate = (instant: Temporal.Instant): string =>
  instant.toZonedDateTimeISO("UTC").toPlainDate().toString()

/**
 * Sorts blog articles by timestamp, newest first.
 */
export const sortArticlesByDate = (
  articles: CollectionEntry<"blog">[],
): CollectionEntry<"blog">[] =>
  articles.toSorted((a, b) => {
    const ia = toInstant(a.data.timestamp)
    const ib = toInstant(b.data.timestamp)
    return Temporal.Instant.compare(ib, ia)
  })

/**
 * Approximate reading time (in minutes) for a markdown body.
 *
 * Runs at build time — the site is fully static, so this is computed once per
 * post when the pages are generated. Fenced and inline code are stripped
 * before counting so the estimate reflects prose rather than source listings.
 * The result is rounded and clamped to a minimum of 1 minute.
 */
const WORDS_PER_MINUTE = 200
export const readingTime = (body: string | undefined): number => {
  const prose = (body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .trim()
  const words = prose.length ? prose.split(/\s+/).length : 0
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}
