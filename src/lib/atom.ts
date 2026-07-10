/**
 * Atom 1.0 (RFC 4287) feed generation.
 *
 * Unlike the blog RSS feed — which uses `@astrojs/rss` — the microblog feed is
 * served as Atom so that it is natively compatible with the widest range of
 * feed readers. `@astrojs/rss` only emits RSS 2.0, so the XML is built here
 * from scratch using the same `escapeHtml` helper that sanitises all other
 * user-controlled content on the site.
 */
import { Temporal } from "temporal-polyfill"
import { escapeHtml } from "./atproto"

// ---- Public types ----

export interface AtomEntry {
  /** Stable, universally-unique identifier for the entry (a permanent URL). */
  id: string
  /** Human-readable title; Atom requires one for every entry. */
  title: string
  /** Permalink URL of the entry on the web. */
  link: string
  /** When the entry was first published (RFC 3339 via Temporal.Instant). */
  published: Temporal.Instant
  /** When the entry was last meaningfully updated. */
  updated: Temporal.Instant
  /** Full HTML content of the entry (will be XML-escaped for transport). */
  content: string
}

export interface AtomFeed {
  /** Feed title shown by RSS readers. */
  title: string
  /** Short subtitle / tagline. */
  subtitle: string
  /** Base URL of the website the feed belongs to. */
  site: string
  /** Absolute URL of the feed itself (used for `rel="self"`). */
  selfUrl: string
  /** Author of the feed content. */
  author: { name: string; uri?: string }
  /** Feed entries, newest first. */
  entries: AtomEntry[]
}

// ---- Helpers ----

/** Maximum number of characters used for an auto-generated entry title. */
const TITLE_MAX_LENGTH = 80

/**
 * Builds a concise title from a post's plain text by collapsing whitespace and
 * truncating to {@link TITLE_MAX_LENGTH} characters. Microblog posts rarely
 * have an explicit title, so this derives one from the body text.
 */
export function buildEntryTitle(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim()
  if (!flat) return "Untitled post"
  if (flat.length <= TITLE_MAX_LENGTH) return flat
  return `${flat.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
}

/**
 * Computes the most recent `updated` timestamp across all entries. When the
 * feed is empty, falls back to the current instant so the (required) feed
 * `<updated>` element is always present.
 */
function feedUpdated(entries: AtomEntry[]): Temporal.Instant {
  if (entries.length === 0) return Temporal.Now.instant()
  return entries.reduce<Temporal.Instant>(
    (max, entry) =>
      Temporal.Instant.compare(entry.updated, max) > 0 ? entry.updated : max,
    entries[0].updated,
  )
}

// ---- Public API ----

/**
 * Generates a valid Atom 1.0 (RFC 4287) XML document from the given feed
 * definition. All text and attribute values are escaped so that untrusted
 * content (Bluesky post text, URLs) can never break the XML structure.
 */
export function generateAtomFeed(feed: AtomFeed): string {
  const updated = feedUpdated(feed.entries)

  const header = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeHtml(feed.title)}</title>`,
    `  <subtitle>${escapeHtml(feed.subtitle)}</subtitle>`,
    `  <link rel="alternate" href="${escapeHtml(feed.site)}" />`,
    `  <link rel="self" href="${escapeHtml(feed.selfUrl)}" />`,
    `  <id>${escapeHtml(feed.site)}/</id>`,
    `  <updated>${updated.toString()}</updated>`,
    "  <author>",
    `    <name>${escapeHtml(feed.author.name)}</name>`,
    feed.author.uri ? `    <uri>${escapeHtml(feed.author.uri)}</uri>` : null,
    "  </author>",
  ]

  const entries = feed.entries.map((entry) =>
    [
      "  <entry>",
      `    <title>${escapeHtml(entry.title)}</title>`,
      `    <link rel="alternate" href="${escapeHtml(entry.link)}" />`,
      `    <id>${escapeHtml(entry.id)}</id>`,
      `    <published>${entry.published.toString()}</published>`,
      `    <updated>${entry.updated.toString()}</updated>`,
      `    <content type="html">${escapeHtml(entry.content)}</content>`,
      "  </entry>",
    ].join("\n"),
  )

  return [...header, ...entries, "</feed>"].filter(Boolean).join("\n")
}
