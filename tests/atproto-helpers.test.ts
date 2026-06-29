import { describe, expect, it } from "bun:test"
import {
  escapeHtml,
  extractFirstUrl,
  renderRichText,
} from "../src/lib/atproto"
import type { Facet } from "../src/lib/atproto"

// Local helper to build facets concisely. Byte offsets are computed from the
// UTF-8 encoding of the text so the tests stay readable.
function makeFacet(
  text: string,
  needle: string,
  feature: { $type: string; [k: string]: unknown },
): Facet {
  const byteStart = new TextEncoder().encode(
    text.slice(0, text.indexOf(needle)),
  ).length
  const byteEnd = byteStart + new TextEncoder().encode(needle).length
  return { index: { byteStart, byteEnd }, features: [feature] }
}

describe("escapeHtml", () => {
  it("escapes the five significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    )
  })

  it("leaves safe text intact", () => {
    expect(escapeHtml("hello world")).toBe("hello world")
  })

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("")
  })
})

describe("renderRichText", () => {
  it("escapes HTML in plain text with no facets", () => {
    expect(renderRichText("<script>x</script>")).toBe(
      "&lt;script&gt;x&lt;/script&gt;",
    )
  })

  it("converts line breaks to <br />", () => {
    expect(renderRichText("line one\nline two")).toBe(
      "line one<br />line two",
    )
  })

  it("wraps a link facet in an anchor", () => {
    const text = "see https://example.com now"
    const facets = [
      makeFacet(text, "https://example.com", {
        $type: "app.bsky.richtext.facet#link",
        uri: "https://example.com",
      }),
    ]
    expect(renderRichText(text, facets)).toBe(
      'see <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">https://example.com</a> now',
    )
  })

  it("wraps a mention facet in a profile anchor", () => {
    const text = "hello @bob.bsky.social!"
    const facets = [
      makeFacet(text, "@bob.bsky.social", {
        $type: "app.bsky.richtext.facet#mention",
        did: "did:plc:abc",
      }),
    ]
    expect(renderRichText(text, facets)).toBe(
      'hello <a href="https://bsky.app/profile/did:plc:abc" target="_blank" rel="noopener noreferrer">@bob.bsky.social</a>!',
    )
  })

  it("wraps a tag facet in a search anchor", () => {
    const text = "check this #postroll out"
    const facets = [
      makeFacet(text, "#postroll", {
        $type: "app.bsky.richtext.facet#tag",
        tag: "postroll",
      }),
    ]
    expect(renderRichText(text, facets)).toBe(
      'check this <a href="https://bsky.app/search?q=%23postroll" target="_blank" rel="noopener noreferrer">#postroll</a> out',
    )
  })

  it("renders multiple facets in the correct order", () => {
    const text = "#postroll https://example.com"
    const facets = [
      makeFacet(text, "https://example.com", {
        $type: "app.bsky.richtext.facet#link",
        uri: "https://example.com",
      }),
      makeFacet(text, "#postroll", {
        $type: "app.bsky.richtext.facet#tag",
        tag: "postroll",
      }),
    ]
    expect(renderRichText(text, facets)).toBe(
      '<a href="https://bsky.app/search?q=%23postroll" target="_blank" rel="noopener noreferrer">#postroll</a> <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">https://example.com</a>',
    )
  })

  it("escapes a malicious URL in the href attribute", () => {
    const text = "click link"
    const facets = [
      makeFacet(text, "link", {
        $type: "app.bsky.richtext.facet#link",
        uri: '"><script>alert(1)</script>',
      }),
    ]
    const rendered = renderRichText(text, facets)
    expect(rendered).not.toContain("<script>")
    expect(rendered).toContain("&quot;&gt;&lt;script&gt;")
  })

  it("handles multibyte (emoji) text with correct byte offsets", () => {
    const text = "🎉 https://example.com"
    const facets = [
      makeFacet(text, "https://example.com", {
        $type: "app.bsky.richtext.facet#link",
        uri: "https://example.com",
      }),
    ]
    expect(renderRichText(text, facets)).toBe(
      '🎉 <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">https://example.com</a>',
    )
  })

  it("skips malformed/overlapping facet ranges gracefully", () => {
    const text = "abc def"
    const facets: Facet[] = [
      // byteEnd before byteStart — invalid
      { index: { byteStart: 4, byteEnd: 1 }, features: [] },
    ]
    // Should just render the escaped text without breaking
    expect(renderRichText(text, facets)).toBe("abc def")
  })
})

describe("extractFirstUrl", () => {
  it("returns the first link facet by position", () => {
    const text = "https://first.com and https://second.com"
    const facets = [
      makeFacet(text, "https://second.com", {
        $type: "app.bsky.richtext.facet#link",
        uri: "https://second.com",
      }),
      makeFacet(text, "https://first.com", {
        $type: "app.bsky.richtext.facet#link",
        uri: "https://first.com",
      }),
    ]
    expect(extractFirstUrl(facets)).toBe("https://first.com")
  })

  it("falls back to an external embed", () => {
    const embed = {
      $type: "app.bsky.embed.external",
      external: { uri: "https://embed.example.com" },
    }
    expect(extractFirstUrl([], embed)).toBe("https://embed.example.com")
  })

  it("prefers a link facet over an embed", () => {
    const text = "https://facet.example.com"
    const facets = [
      makeFacet(text, "https://facet.example.com", {
        $type: "app.bsky.richtext.facet#link",
        uri: "https://facet.example.com",
      }),
    ]
    const embed = {
      $type: "app.bsky.embed.external",
      external: { uri: "https://embed.example.com" },
    }
    expect(extractFirstUrl(facets, embed)).toBe("https://facet.example.com")
  })

  it("returns null when no URL is present", () => {
    expect(extractFirstUrl([], undefined)).toBeNull()
  })
})
