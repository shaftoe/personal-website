import { describe, expect, it } from "bun:test"
import { Temporal } from "temporal-polyfill"
import {
  getShortDescription,
  processArticleDate,
  readingTime,
  sortArticlesByDate,
} from "../src/lib/utils"
import type { CollectionEntry } from "astro:content"

describe("getShortDescription", () => {
  it("returns the content unchanged when word count is within limit", () => {
    const content = "hello world foo bar"
    expect(getShortDescription(content)).toBe("hello world foo bar")
  })

  it("returns the content unchanged when word count equals the limit", () => {
    const words = Array.from({ length: 20 }, (_, i) => `word${i}`)
    const content = words.join(" ")
    expect(getShortDescription(content)).toBe(content)
  })

  it("truncates content and appends ellipsis when word count exceeds limit", () => {
    const words = Array.from({ length: 25 }, (_, i) => `word${i}`)
    const content = words.join(" ")
    const result = getShortDescription(content)
    expect(result).toBe("word0 word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19...")
  })

  it("respects custom maxLength", () => {
    const content = "one two three four five"
    expect(getShortDescription(content, 3)).toBe("one two three...")
  })

  it("handles single word content", () => {
    expect(getShortDescription("hello")).toBe("hello")
  })

  it("handles empty string", () => {
    expect(getShortDescription("")).toBe("")
  })
})

describe("processArticleDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const instant = Temporal.Instant.from("2026-04-15T12:00:00Z")
    const result = processArticleDate(instant)
    expect(result).toBe("2026-04-15")
  })

  it("formats January 1 correctly", () => {
    const instant = Temporal.Instant.from("2025-01-01T00:00:00Z")
    const result = processArticleDate(instant)
    expect(result).toBe("2025-01-01")
  })

  it("formats December 31 correctly", () => {
    const instant = Temporal.Instant.from("2025-12-31T23:59:59Z")
    const result = processArticleDate(instant)
    expect(result).toBe("2025-12-31")
  })
})

describe("readingTime", () => {
  it("returns 1 minute for an empty body (clamped minimum)", () => {
    expect(readingTime("")).toBe(1)
  })

  it("estimates 200 words per minute", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`)
    expect(readingTime(words.join(" "))).toBe(2)
  })

  it("rounds to the nearest minute", () => {
    // 500 words / 200 = 2.5 -> rounds to 3
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`)
    expect(readingTime(words.join(" "))).toBe(3)
  })

  it("excludes fenced code blocks from the word count", () => {
    const prose = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ")
    const code =
      "```js\n" +
      Array.from({ length: 1000 }, (_, i) => `tok${i}`).join(" ") +
      "\n```"
    // 200 prose words -> 1 min; the 1000 code tokens must not inflate it
    expect(readingTime(`${prose}\n\n${code}`)).toBe(1)
  })

  it("excludes inline code from the word count", () => {
    const prose = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ")
    const inline = "`const x = getValueFromSomeReallyLongIdentifier()`"
    expect(readingTime(`${prose} ${inline}`)).toBe(1)
  })
})

describe("sortArticlesByDate", () => {
  // Minimal mock satisfying the shape expected by sortArticlesByDate
  function makeArticle(
    title: string,
    timestamp: Temporal.Instant,
  ): CollectionEntry<"blog"> {
    return {
      id: title,
      collection: "blog" as const,
      data: {
        title,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        description: "",
        longDescription: undefined,
        cardImage: undefined,
        tags: undefined,
        timestamp,
      },
      body: "",
      render: async () => ({ Content: {} as never }),
    } as unknown as CollectionEntry<"blog">
  }

  it("sorts articles newest first", () => {
    const articles = [
      makeArticle("old", Temporal.Instant.from("2020-01-01T00:00:00Z")),
      makeArticle("new", Temporal.Instant.from("2026-01-01T00:00:00Z")),
      makeArticle("mid", Temporal.Instant.from("2023-01-01T00:00:00Z")),
    ]

    const sorted = sortArticlesByDate(articles)
    expect(sorted[0].data.title).toBe("new")
    expect(sorted[1].data.title).toBe("mid")
    expect(sorted[2].data.title).toBe("old")
  })

  it("does not mutate the original array", () => {
    const articles = [
      makeArticle("old", Temporal.Instant.from("2020-01-01T00:00:00Z")),
      makeArticle("new", Temporal.Instant.from("2026-01-01T00:00:00Z")),
    ]

    const originalOrder = articles.map((a) => a.data.title)
    sortArticlesByDate(articles)
    expect(articles.map((a) => a.data.title)).toEqual(originalOrder)
  })

  it("handles empty array", () => {
    expect(sortArticlesByDate([])).toEqual([])
  })
})
