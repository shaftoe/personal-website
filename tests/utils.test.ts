import { describe, expect, it } from "vitest"
import {
  getShortDescription,
  processArticleDate,
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
  it("formats a date as 'Mon Day, Year'", () => {
    const date = new Date("2026-04-15T12:00:00Z")
    const result = processArticleDate(date)
    expect(result).toBe("Apr 15, 2026")
  })

  it("formats January 1 correctly", () => {
    const date = new Date("2025-01-01T00:00:00Z")
    const result = processArticleDate(date)
    expect(result).toBe("Jan 1, 2025")
  })

  it("formats December 31 correctly", () => {
    const date = new Date("2025-12-31T23:59:59Z")
    const result = processArticleDate(date)
    expect(result).toBe("Dec 31, 2025")
  })
})

describe("sortArticlesByDate", () => {
  // Minimal mock satisfying the shape expected by sortArticlesByDate
  function makeArticle(
    title: string,
    timestamp: Date,
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
        readTime: undefined,
        timestamp,
      },
      body: "",
      render: async () => ({ Content: {} as never }),
    } as unknown as CollectionEntry<"blog">
  }

  it("sorts articles newest first", () => {
    const articles = [
      makeArticle("old", new Date("2020-01-01")),
      makeArticle("new", new Date("2026-01-01")),
      makeArticle("mid", new Date("2023-01-01")),
    ]

    const sorted = sortArticlesByDate(articles)
    expect(sorted[0].data.title).toBe("new")
    expect(sorted[1].data.title).toBe("mid")
    expect(sorted[2].data.title).toBe("old")
  })

  it("does not mutate the original array", () => {
    const articles = [
      makeArticle("old", new Date("2020-01-01")),
      makeArticle("new", new Date("2026-01-01")),
    ]

    const originalOrder = articles.map((a) => a.data.title)
    sortArticlesByDate(articles)
    expect(articles.map((a) => a.data.title)).toEqual(originalOrder)
  })

  it("handles empty array", () => {
    expect(sortArticlesByDate([])).toEqual([])
  })
})
