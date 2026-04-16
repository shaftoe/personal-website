import { describe, expect, it } from "bun:test"

// The sanitizeHtml and extractFirstUrl helpers in src/lib/mastodon.ts are
// module-scoped (not exported). We duplicate the pure logic here so we can
// unit-test it directly. The integration tests (HTML validation) cover the
// end-to-end rendering.

// --- Duplicate of the internal sanitizeHtml for direct testing ---
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    .replace(/\sclass\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<span[^>]*>/gi, "")
}

// --- Duplicate of extractFirstUrl ---
function extractFirstUrlTest(html: string): string | null {
  const match = html.match(/href="(https?:\/\/[^"]+)"/)
  return match ? match[1] : null
}

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
    expect(sanitizeHtml(input)).toBe("<p>Hello</p><p>World</p>")
  })

  it("removes on* event handler attributes", () => {
    const input = '<a onclick="evil()" href="#">Click</a>'
    expect(sanitizeHtml(input)).toBe('<a href="#">Click</a>')
  })

  it("removes onmouseover attributes with single quotes", () => {
    const input = "<div onmouseover='evil()'>Hover</div>"
    expect(sanitizeHtml(input)).toBe("<div>Hover</div>")
  })

  it("neutralises javascript: URLs", () => {
    const input = '<a href="javascript:alert(1)">Bad</a>'
    expect(sanitizeHtml(input)).toBe('<a href="#">Bad</a>')
  })

  it("removes class attributes", () => {
    const input = '<p class="mention hashtag">text</p>'
    expect(sanitizeHtml(input)).toBe("<p>text</p>")
  })

  it("removes span tags but keeps inner text", () => {
    const input = '<span class="foo">bar</span>'
    expect(sanitizeHtml(input)).toBe("bar")
  })

  it("leaves safe HTML intact", () => {
    const input = '<p>Hello <a href="https://example.com">world</a></p>'
    expect(sanitizeHtml(input)).toBe(input)
  })

  it("handles empty string", () => {
    expect(sanitizeHtml("")).toBe("")
  })
})

describe("extractFirstUrl", () => {
  it("extracts HTTPS URL", () => {
    expect(
      extractFirstUrlTest('<a href="https://example.com">link</a>'),
    ).toBe("https://example.com")
  })

  it("extracts HTTP URL", () => {
    expect(
      extractFirstUrlTest('<a href="http://example.com">link</a>'),
    ).toBe("http://example.com")
  })

  it("returns null when no URL is found", () => {
    expect(extractFirstUrlTest("<p>no link here</p>")).toBeNull()
  })

  it("returns the first URL when multiple are present", () => {
    const html =
      '<a href="https://first.com">1</a> and <a href="https://second.com">2</a>'
    expect(extractFirstUrlTest(html)).toBe("https://first.com")
  })
})
