import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  applyManifest,
  decodeContent,
  parseManifest,
  sanitizeEntryPath,
  validateMarkdownFrontmatter,
  type Manifest,
} from "../scripts/sync-posts"

describe("sanitizeEntryPath", () => {
  it("accepts a simple filename", () => {
    expect(sanitizeEntryPath("whois_poller.png")).toBe("whois_poller.png")
  })

  it("accepts a nested relative path", () => {
    expect(sanitizeEntryPath("notes/sub/diagram.svg")).toBe(
      "notes/sub/diagram.svg",
    )
  })

  it("strips a single leading slash", () => {
    expect(sanitizeEntryPath("/my-post.md")).toBe("my-post.md")
  })

  it("rejects parent-directory traversal", () => {
    expect(sanitizeEntryPath("../escape.md")).toBeNull()
    expect(sanitizeEntryPath("a/../../b.md")).toBeNull()
    expect(sanitizeEntryPath("ok/../bad.md")).toBeNull()
  })

  it("rejects backslashes, NUL, drive letters, and empty names", () => {
    expect(sanitizeEntryPath("a\\b.md")).toBeNull()
    expect(sanitizeEntryPath("a\0b.md")).toBeNull()
    expect(sanitizeEntryPath("C:\\evil.md")).toBeNull()
    expect(sanitizeEntryPath("")).toBeNull()
    expect(sanitizeEntryPath("   ")).toBeNull()
  })

  it("rejects empty segments (double slashes / trailing slash)", () => {
    expect(sanitizeEntryPath("a//b.md")).toBeNull()
    expect(sanitizeEntryPath("a/")).toBeNull()
  })
})

describe("parseManifest", () => {
  it("parses a well-formed manifest", () => {
    const manifest = parseManifest({
      files: {
        "a.md": { encoding: "utf8", content: "hello" },
        "a.png": { encoding: "base64", content: "AAAA" },
      },
    })
    expect(Object.keys(manifest.files)).toEqual(["a.md", "a.png"])
    expect(manifest.files["a.md"].encoding).toBe("utf8")
  })

  it("rejects a non-object root", () => {
    expect(() => parseManifest("nope")).toThrow()
    expect(() => parseManifest(null)).toThrow()
  })

  it("rejects a manifest without a files object", () => {
    expect(() => parseManifest({})).toThrow()
  })

  it("rejects entries with bad encoding or non-string content", () => {
    expect(() =>
      parseManifest({ files: { "a.md": { encoding: "hex", content: "x" } } }),
    ).toThrow()
    expect(() =>
      parseManifest({ files: { "a.md": { encoding: "utf8", content: 42 } } }),
    ).toThrow()
  })
})

describe("decodeContent", () => {
  it("decodes utf8 as text", () => {
    const bytes = decodeContent({ encoding: "utf8", content: "héllo" })
    expect(bytes.toString("utf8")).toBe("héllo")
  })

  it("decodes base64 to bytes", () => {
    const bytes = decodeContent({ encoding: "base64", content: "AAEC" })
    expect(Array.from(bytes)).toEqual([0, 1, 2])
  })
})

describe("validateMarkdownFrontmatter", () => {
  it("passes for valid frontmatter", () => {
    const { ok, errors } = validateMarkdownFrontmatter(
      "---\ntitle: Hello\ntimestamp: 2020-01-01\n---\n\nBody",
    )
    expect(ok).toBe(true)
    expect(errors).toEqual([])
  })

  it("fails when required fields are missing", () => {
    const { ok, errors } = validateMarkdownFrontmatter("just some text")
    expect(ok).toBe(false)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe("applyManifest", () => {
  let dir: string

  beforeEach(() => {
    dir = join(tmpdir(), `sync-posts-${Math.random().toString(36).slice(2)}`)
    mkdirSync(dir, { recursive: true })
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("writes valid markdown and assets, skips invalid", () => {
    const manifest: Manifest = {
      files: {
        "good.md": {
          encoding: "utf8",
          content: "---\ntitle: Good\n---\n\nbody",
        },
        "bad.md": { encoding: "utf8", content: "no frontmatter here" },
        "pic.png": { encoding: "base64", content: "AAEC" },
        "../escape.md": {
          encoding: "utf8",
          content: "---\ntitle: Evil\n---\n",
        },
      },
    }

    const logs: string[] = []
    const result = applyManifest(manifest, dir, {
      info: (m) => logs.push(m),
      warn: (m) => logs.push(m),
    })

    expect(result.written).toBe(2)
    expect(result.markdown).toBe(1)
    expect(result.assets).toBe(1)
    expect(result.skipped).toBe(2)

    const written = readdirSync(dir).sort()
    expect(written).toEqual(["good.md", "pic.png"])

    // The traversal entry must have been skipped, not written.
    expect(logs.some((l) => l.includes("escape.md"))).toBe(true)
    expect(existsSync(join(dir, "escape.md"))).toBe(false)
  })

  it("creates nested directories for sub-paths", () => {
    const manifest: Manifest = {
      files: {
        "sub/dir/note.md": {
          encoding: "utf8",
          content: "---\ntitle: Nested\n---\n",
        },
      },
    }
    const result = applyManifest(manifest, dir, {
      info: () => {},
      warn: () => {},
    })
    expect(result.written).toBe(1)
    expect(existsSync(join(dir, "sub", "dir", "note.md"))).toBe(true)
  })
})
