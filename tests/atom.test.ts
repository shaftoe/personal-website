import { describe, expect, it } from "bun:test"
import { Temporal } from "temporal-polyfill"
import { buildEntryTitle, generateAtomFeed } from "../src/lib/atom"
import type { AtomEntry, AtomFeed } from "../src/lib/atom"

// ---- Fixtures ----

function instant(iso: string): Temporal.Instant {
  return Temporal.Instant.from(iso)
}

const baseFeed: AtomFeed = {
  title: "Test Microblog",
  subtitle: "A test feed.",
  site: "https://example.com",
  selfUrl: "https://example.com/microblog.xml",
  author: { name: "Test Author", uri: "https://example.com" },
  entries: [],
}

function makeEntry(overrides: Partial<AtomEntry> = {}): AtomEntry {
  return {
    id: "https://bsky.app/profile/test/post/abc",
    title: "Hello world",
    link: "https://bsky.app/profile/test/post/abc",
    published: instant("2026-07-10T12:00:00Z"),
    updated: instant("2026-07-10T12:00:00Z"),
    content: "<p>Hello world</p>",
    ...overrides,
  }
}

// ---- buildEntryTitle ----

describe("buildEntryTitle", () => {
  it("returns short text unchanged", () => {
    expect(buildEntryTitle("Hello world")).toBe("Hello world")
  })

  it("collapses whitespace into single spaces", () => {
    expect(buildEntryTitle("line one\nline two\tend")).toBe(
      "line one line two end",
    )
  })

  it("truncates long text with an ellipsis", () => {
    const long = "word ".repeat(30).trim()
    const result = buildEntryTitle(long)
    expect(result).toMatch(/…$/)
    // The visible text (excluding the ellipsis) must not exceed the cap
    expect(result.length).toBeLessThanOrEqual(81) // 80 chars + ellipsis
  })

  it("handles empty/whitespace-only text", () => {
    expect(buildEntryTitle("")).toBe("Untitled post")
    expect(buildEntryTitle("   \n\t  ")).toBe("Untitled post")
  })
})

// ---- generateAtomFeed ----

describe("generateAtomFeed", () => {
  it("produces the XML declaration and Atom namespace", () => {
    const xml = generateAtomFeed(baseFeed)
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true)
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">')
    expect(xml.trim().endsWith("</feed>")).toBe(true)
  })

  it("includes required feed metadata", () => {
    const xml = generateAtomFeed(baseFeed)
    expect(xml).toContain("<title>Test Microblog</title>")
    expect(xml).toContain("<subtitle>A test feed.</subtitle>")
    expect(xml).toContain(
      '<link rel="self" href="https://example.com/microblog.xml" />',
    )
    expect(xml).toContain(
      '<link rel="alternate" href="https://example.com" />',
    )
    expect(xml).toContain("<id>https://example.com/</id>")
    expect(xml).toContain("<name>Test Author</name>")
    expect(xml).toContain("<uri>https://example.com</uri>")
    expect(xml).toMatch(/<updated>\d{4}-\d{2}-\d{2}T/)
  })

  it("renders entries with all required elements", () => {
    const xml = generateAtomFeed({
      ...baseFeed,
      entries: [makeEntry()],
    })
    expect(xml).toContain("<entry>")
    expect(xml).toContain("<title>Hello world</title>")
    expect(xml).toContain(
      '<link rel="alternate" href="https://bsky.app/profile/test/post/abc" />',
    )
    expect(xml).toContain(
      "<id>https://bsky.app/profile/test/post/abc</id>",
    )
    expect(xml).toContain("<published>2026-07-10T12:00:00Z</published>")
    expect(xml).toContain("<updated>2026-07-10T12:00:00Z</updated>")
    expect(xml).toContain(
      '<content type="html">&lt;p&gt;Hello world&lt;/p&gt;</content>',
    )
  })

  it("uses the latest entry updated time for the feed-level updated", () => {
    const xml = generateAtomFeed({
      ...baseFeed,
      entries: [
        makeEntry({ updated: instant("2026-07-01T00:00:00Z") }),
        makeEntry({
          id: "https://bsky.app/profile/test/post/newer",
          title: "Newer",
          link: "https://bsky.app/profile/test/post/newer",
          updated: instant("2026-07-10T18:00:00Z"),
        }),
      ],
    })
    expect(xml).toContain("<updated>2026-07-10T18:00:00Z</updated>\n")
  })

  it("escapes special XML characters in text content", () => {
    const xml = generateAtomFeed({
      ...baseFeed,
      title: "<script>alert('x')</script>",
      entries: [
        makeEntry({
          title: 'Tom & "Jerry" <3',
          content: '<a href="https://evil.com">click</a>',
        }),
      ],
    })
    // Title in feed header is escaped
    expect(xml).toContain(
      "<title>&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;</title>",
    )
    // Entry title escaped
    expect(xml).toContain("Tom &amp; &quot;Jerry&quot; &lt;3")
    // HTML content is XML-escaped so it survives transport
    expect(xml).toContain(
      "&lt;a href=&quot;https://evil.com&quot;&gt;click&lt;/a&gt;",
    )
    // No raw script tag should appear
    expect(xml).not.toContain("<script>alert")
  })

  it("escapes special characters in attribute values", () => {
    const xml = generateAtomFeed({
      ...baseFeed,
      entries: [
        makeEntry({
          link: 'https://example.com/?a=1&b=2',
        }),
      ],
    })
    expect(xml).toContain(
      'href="https://example.com/?a=1&amp;b=2"',
    )
  })

  it("produces a valid feed when there are no entries", () => {
    const xml = generateAtomFeed(baseFeed)
    expect(xml).toContain("<feed")
    expect(xml).toContain("</feed>")
    expect(xml).not.toContain("<entry>")
    // Still has a valid updated element
    expect(xml).toMatch(/<updated>\d{4}-\d{2}-\d{2}T/)
  })

  it("omits the author uri element when not provided", () => {
    const xml = generateAtomFeed({
      ...baseFeed,
      author: { name: "No URI" },
    })
    expect(xml).toContain("<name>No URI</name>")
    expect(xml).not.toContain("<uri>")
  })

  it("renders multiple entries", () => {
    const xml = generateAtomFeed({
      ...baseFeed,
      entries: [
        makeEntry({ title: "First" }),
        makeEntry({
          id: "https://bsky.app/profile/test/post/second",
          title: "Second",
          link: "https://bsky.app/profile/test/post/second",
        }),
      ],
    })
    const entryCount = (xml.match(/<entry>/g) || []).length
    expect(entryCount).toBe(2)
    expect(xml).toContain("<title>First</title>")
    expect(xml).toContain("<title>Second</title>")
  })
})
