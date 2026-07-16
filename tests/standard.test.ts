import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  buildDocumentRecord,
  buildPublicationRecord,
  extractRkey,
  generateTid,
  getDocumentUri,
  getPublicationUri,
  hashRecordPayload,
  markdownToPlainText,
  publicationSyncHash,
  putRecord,
  readPublicationIcon,
  readStandardSidecar,
  writeStandardSidecar,
} from "../src/lib/standard"
import { siteConfig } from "../src/config"

const SIDECAR = join(process.cwd(), siteConfig.standard.sidecarPath)
const TID_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz"

describe("generateTid", () => {
  it("produces a 13-character base32-sortable string", () => {
    const tid = generateTid()
    expect(tid).toHaveLength(13)
    for (const char of tid) {
      expect(TID_ALPHABET).toContain(char)
    }
  })

  it("is monotonically sortable for later timestamps", () => {
    const early = generateTid(new Date("2020-01-01T00:00:00Z"))
    const late = generateTid(new Date("2026-01-01T00:00:00Z"))
    expect(late > early).toBe(true)
  })

  it("produces distinct values within the same microsecond", () => {
    const now = new Date()
    const values = new Set(
      Array.from({ length: 50 }, () => generateTid(now)),
    )
    // Clock-id randomness should make the overwhelming majority unique.
    expect(values.size).toBeGreaterThan(40)
  })
})

describe("extractRkey", () => {
  it("returns the final path segment of an AT URI", () => {
    expect(
      extractRkey("at://did:plc:abc/site.standard.document/3mmdfzlqhvs2h"),
    ).toBe("3mmdfzlqhvs2h")
  })

  it("handles bare strings", () => {
    expect(extractRkey("foo/bar/baz")).toBe("baz")
  })
})

describe("markdownToPlainText", () => {
  it("strips ATX heading markers", () => {
    expect(markdownToPlainText("## Hello\n### World")).toBe(
      "Hello\nWorld",
    )
  })

  it("strips bold and italic emphasis", () => {
    expect(markdownToPlainText("**bold** and *italic* __u__ _i_")).toBe(
      "bold and italic u i",
    )
  })

  it("keeps underscores inside identifiers intact", () => {
    expect(markdownToPlainText("use my_variable_name here")).toBe(
      "use my_variable_name here",
    )
  })

  it("converts inline links to their text", () => {
    expect(
      markdownToPlainText("see [Google](https://google.com) now"),
    ).toBe("see Google now")
  })

  it("converts reference-style links to their text", () => {
    const md = "see [Google][1] and [Yahoo][]\n\n[1]: https://google.com"
    expect(markdownToPlainText(md)).toBe("see Google and Yahoo")
  })

  it("converts images to their alt text", () => {
    expect(markdownToPlainText("![a logo](/logo.png)")).toBe("a logo")
  })

  it("unwraps autolinks in angle brackets", () => {
    expect(markdownToPlainText("<https://example.com>")).toBe(
      "https://example.com",
    )
  })

  it("removes fenced code delimiters but keeps content", () => {
    expect(markdownToPlainText("```js\nconst x = 1\n```")).toBe("const x = 1")
  })

  it("removes inline code backticks but keeps content", () => {
    expect(markdownToPlainText("run `bun install`")).toBe("run bun install")
  })

  it("strips blockquote markers", () => {
    expect(markdownToPlainText("> a quote")).toBe("a quote")
  })

  it("strips list markers", () => {
    expect(markdownToPlainText("- one\n- two\n1. three")).toBe(
      "one\ntwo\nthree",
    )
  })

  it("strips HTML tags", () => {
    expect(markdownToPlainText("<b>bold</b> <a href='x'>link</a>")).toBe(
      "bold link",
    )
  })

  it("strips HTML comments", () => {
    expect(markdownToPlainText("a <!-- comment --> b")).toBe("a  b")
  })

  it("handles a realistic mixed-content snippet", () => {
    const md = [
      "## Title",
      "",
      "Some *emphasis* with a [link](https://x.com).",
      "",
      "```",
      "code block",
      "```",
      "",
      "- bullet",
    ].join("\n")
    const out = markdownToPlainText(md)
    expect(out).not.toContain("#")
    expect(out).not.toContain("[")
    expect(out).not.toContain("```")
    expect(out).toContain("Title")
    expect(out).toContain("emphasis")
    expect(out).toContain("link")
    expect(out).toContain("code block")
    expect(out).toContain("bullet")
  })
})

describe("buildPublicationRecord", () => {
  it("maps siteConfig onto the required publication fields", () => {
    const record = buildPublicationRecord()
    expect(record.$type).toBe(siteConfig.standard.publicationCollection)
    expect(record.url).toBe(siteConfig.globalMeta.baseUrl)
    expect(record.name).toBe(siteConfig.blogMeta.title)
    expect(record.description).toBe(
      siteConfig.blogMeta.longDescription ?? siteConfig.blogMeta.description,
    )
    expect(record.preferences).toEqual({ showInDiscover: true })
    expect(typeof record.createdAt).toBe("string")
  })

  it("includes the icon blob when provided", () => {
    const icon = {
      $type: "blob" as const,
      ref: { $link: "bafy123" },
      mimeType: "image/webp",
      size: 1234,
    }
    const record = buildPublicationRecord({ icon })
    expect(record.icon).toEqual(icon)
  })

  it("preserves a provided createdAt", () => {
    const record = buildPublicationRecord({ createdAt: "2020-01-01T00:00:00.000Z" })
    expect(record.createdAt).toBe("2020-01-01T00:00:00.000Z")
  })
})

describe("buildDocumentRecord", () => {
  const base = {
    site: "at://did:plc:abc/site.standard.publication/self",
    title: "My Article",
    publishedAt: "2020-05-30T00:00:00.000Z",
    path: "/blog/my-article/",
  }

  it("includes the required fields", () => {
    const record = buildDocumentRecord(base)
    expect(record.$type).toBe(siteConfig.standard.documentCollection)
    expect(record.site).toBe(base.site)
    expect(record.title).toBe(base.title)
    expect(record.publishedAt).toBe(base.publishedAt)
    expect(record.path).toBe(base.path)
  })

  it("omits optional fields when not supplied", () => {
    const record = buildDocumentRecord(base)
    expect(record.description).toBeUndefined()
    expect(record.tags).toBeUndefined()
    expect(record.textContent).toBeUndefined()
    expect(record.updatedAt).toBeUndefined()
  })

  it("includes optional fields when supplied", () => {
    const record = buildDocumentRecord({
      ...base,
      description: "A short summary.",
      tags: ["aws", "cdk"],
      textContent: "plain text body",
    })
    expect(record.description).toBe("A short summary.")
    expect(record.tags).toEqual(["aws", "cdk"])
    expect(record.textContent).toBe("plain text body")
  })

  it("omits tags when the array is empty", () => {
    const record = buildDocumentRecord({ ...base, tags: [] })
    expect(record.tags).toBeUndefined()
  })
})

describe("sidecar read/write", () => {
  let original: string

  beforeEach(() => {
    original = readFileSync(SIDECAR, "utf-8")
  })

  afterEach(() => {
    writeFileSync(SIDECAR, original)
  })

  it("round-trips a populated sidecar", () => {
    const data = {
      publication: { uri: "at://did:plc:abc/site.standard.publication/x", cid: "c1" },
      documents: {
        "a-post": { uri: "at://did:plc:abc/site.standard.document/y", cid: "c2" },
      },
    }
    writeStandardSidecar(data)
    expect(readStandardSidecar()).toEqual(data)
  })

  it("persists the change-detection hash on each record ref", () => {
    const data = {
      publication: {
        uri: "at://did:plc:abc/site.standard.publication/x",
        cid: "c1",
        hash: "deadbeef",
      },
      documents: {
        "a-post": {
          uri: "at://did:plc:abc/site.standard.document/y",
          cid: "c2",
          hash: "cafebabe",
        },
      },
    }
    writeStandardSidecar(data)
    expect(readStandardSidecar()).toEqual(data)
    expect(readStandardSidecar().publication?.hash).toBe("deadbeef")
    expect(readStandardSidecar().documents["a-post"]?.hash).toBe("cafebabe")
  })

  it("getPublicationUri / getDocumentUri read the committed sidecar", () => {
    writeStandardSidecar({
      publication: {
        uri: "at://did:plc:abc/site.standard.publication/p",
        cid: "cp",
      },
      documents: {
        hello: { uri: "at://did:plc:abc/site.standard.document/d", cid: "cd" },
      },
    })
    expect(getPublicationUri()).toBe(
      "at://did:plc:abc/site.standard.publication/p",
    )
    expect(getDocumentUri("hello")).toBe(
      "at://did:plc:abc/site.standard.document/d",
    )
    expect(getDocumentUri("missing")).toBeNull()
  })
})

describe("putRecord", () => {
  // The community site.standard.* lexicons are not bundled in the PDS's
  // built-in validator store, so the request MUST be sent with
  // `validate: false` or the PDS rejects it as an "Unknown lexicon type".
  it("sends validate:false so the PDS skips unknown-lexicon validation", async () => {
    const fetchMock = mock(
      (_url: unknown, _init: RequestInit): Promise<Response> =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              uri: "at://did:plc:abc/site.standard.publication/r",
              cid: "c1",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    )
    const realFetch = globalThis.fetch
    globalThis.fetch = fetchMock as unknown as typeof fetch

    try {
      const session = { did: "did:plc:abc", accessJwt: "jwt" }
      await putRecord(
        session,
        "site.standard.publication",
        "r",
        buildPublicationRecord(),
      )

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [, init] = fetchMock.mock.calls[0]
      const body = JSON.parse(init!.body as string)
      expect(body.validate).toBe(false)
      expect(body.collection).toBe("site.standard.publication")
    } finally {
      globalThis.fetch = realFetch
    }
  })
})

describe("hashRecordPayload", () => {
  it("produces a 64-char hex digest", () => {
    expect(hashRecordPayload({ a: 1 })).toMatch(/^[0-9a-f]{64}$/)
  })

  it("is deterministic for identical input", () => {
    expect(hashRecordPayload({ a: 1, b: ["x"] })).toBe(
      hashRecordPayload({ a: 1, b: ["x"] }),
    )
  })

  it("is independent of object key order", () => {
    // Two records built with the same fields in a different insertion order
    // must hash identically — this is what lets the sync skip no-op re-writes.
    expect(hashRecordPayload({ a: 1, b: 2, c: { d: 3 } })).toBe(
      hashRecordPayload({ c: { d: 3 }, b: 2, a: 1 }),
    )
  })

  it("changes when any value changes", () => {
    expect(hashRecordPayload({ title: "A" })).not.toBe(
      hashRecordPayload({ title: "B" }),
    )
    expect(hashRecordPayload({ tags: ["a", "b"] })).not.toBe(
      hashRecordPayload({ tags: ["a", "c"] }),
    )
  })

  it("ignores undefined-valued keys", () => {
    expect(hashRecordPayload({ a: 1, b: undefined })).toBe(
      hashRecordPayload({ a: 1 }),
    )
  })

  it("hashes a realistic document record deterministically", () => {
    const record = buildDocumentRecord({
      site: "at://did:plc:abc/site.standard.publication/p",
      title: "My Article",
      description: "A summary.",
      path: "/blog/my-article/",
      tags: ["aws", "cdk"],
      publishedAt: "2020-05-30T00:00:00.000Z",
      textContent: "body text",
    })
    expect(hashRecordPayload(record)).toBe(hashRecordPayload(record))
  })
})

describe("publicationSyncHash", () => {
  it("is deterministic for the same icon hash", () => {
    expect(publicationSyncHash("abc")).toBe(publicationSyncHash("abc"))
  })

  it("changes when the icon hash changes", () => {
    expect(publicationSyncHash(null)).not.toBe(publicationSyncHash("abc"))
    expect(publicationSyncHash("abc")).not.toBe(publicationSyncHash("def"))
  })

  it("produces a 64-char hex digest", () => {
    expect(publicationSyncHash(null)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("readPublicationIcon", () => {
  it("returns null when the icon file is absent (graceful degradation)", () => {
    // public/images/profile.webp is generated at build time, not committed,
    // so it is absent in the test/CI environment — the reader must cope.
    expect(readPublicationIcon()).toBeNull()
  })
})
