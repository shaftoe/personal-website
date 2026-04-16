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
