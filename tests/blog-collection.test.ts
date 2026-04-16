import { describe, expect, it } from "bun:test"
import { blogSchema } from "../src/lib/blog-collection"

describe("blogSchema", () => {
  it("uses provided slug", () => {
    const result = blogSchema.parse({
      title: "My Article",
      slug: "custom-slug",
    })
    expect(result.slug).toBe("custom-slug")
  })

  it("preserves optional fields when provided", () => {
    const result = blogSchema.parse({
      title: "Full Article",
      description: "desc",
      longDescription: "long desc",
      tags: ["aws", "cdk"],
      readTime: 10,
    })
    expect(result.description).toBe("desc")
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
    expect(result.description).toBeUndefined()
    expect(result.slug).toBeUndefined()
    expect(result.timestamp).toBeUndefined()
  })

  it("parses timestamp as Date", () => {
    const date = new Date("2024-06-15")
    const result = blogSchema.parse({ title: "Test", timestamp: date })
    expect(result.timestamp).toBeInstanceOf(Date)
    expect(result.timestamp!.toISOString()).toBe("2024-06-15T00:00:00.000Z")
  })

  it("parses date field via coerce", () => {
    const result = blogSchema.parse({
      title: "Test",
      date: "2023-03-10",
    })
    expect(result.date).toBeInstanceOf(Date)
    expect(result.date!.toISOString()).toBe("2023-03-10T00:00:00.000Z")
  })

  it("preserves title", () => {
    const result = blogSchema.parse({ title: "Hello World!" })
    expect(result.title).toBe("Hello World!")
  })
})
