import { describe, expect, it } from "vitest"
import { blogSchema } from "../src/lib/blog-collection"

describe("blogSchema transform", () => {
  it("uses provided slug", () => {
    const result = blogSchema.parse({
      title: "My Article",
      slug: "custom-slug",
    })
    expect(result.slug).toBe("custom-slug")
  })

  it("derives slug from title when slug is not provided", () => {
    const result = blogSchema.parse({
      title: "Hello World!",
    })
    expect(result.slug).toBe("hello-world")
  })

  it("strips non-word characters from derived slug", () => {
    const result = blogSchema.parse({
      title: "AWS Lambda: A Guide (2024)",
    })
    expect(result.slug).toBe("aws-lambda-a-guide-2024")
  })

  it("defaults description to empty string", () => {
    const result = blogSchema.parse({ title: "Test" })
    expect(result.description).toBe("")
  })

  it("preserves provided description", () => {
    const result = blogSchema.parse({
      title: "Test",
      description: "A short desc",
    })
    expect(result.description).toBe("A short desc")
  })

  it("uses provided timestamp", () => {
    const date = new Date("2024-06-15")
    const result = blogSchema.parse({ title: "Test", timestamp: date })
    expect(result.timestamp).toEqual(date)
  })

  it("falls back to date when timestamp is missing", () => {
    const date = new Date("2023-03-10")
    const result = blogSchema.parse({ title: "Test", date: date.toISOString() })
    expect(result.timestamp.getFullYear()).toBe(2023)
    expect(result.timestamp.getMonth()).toBe(2) // March = 2
    expect(result.timestamp.getDate()).toBe(10)
  })

  it("falls back to now when both timestamp and date are missing", () => {
    const before = Date.now()
    const result = blogSchema.parse({ title: "Test" })
    const after = Date.now()
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after)
  })

  it("preserves optional fields when provided", () => {
    const result = blogSchema.parse({
      title: "Full Article",
      description: "desc",
      longDescription: "long desc",
      tags: ["aws", "cdk"],
      readTime: 10,
    })
    expect(result.longDescription).toBe("long desc")
    expect(result.tags).toEqual(["aws", "cdk"])
    expect(result.readTime).toBe(10)
  })

  it("sets optional fields to undefined when not provided", () => {
    const result = blogSchema.parse({ title: "Minimal" })
    expect(result.longDescription).toBeUndefined()
    expect(result.tags).toBeUndefined()
    expect(result.readTime).toBeUndefined()
    expect(result.cardImage).toBeUndefined()
  })
})
