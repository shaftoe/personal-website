import { describe, expect, it } from "bun:test"
import { Temporal } from "temporal-polyfill"
import {
  blogPostingSchema,
  homepageGraph,
  personSchema,
  websiteSchema,
} from "../src/lib/jsonld"
import { siteConfig } from "../src/config"

const baseUrl = siteConfig.globalMeta.baseUrl

describe("personSchema", () => {
  it("uses the correct @type and @id", () => {
    expect(personSchema["@type"]).toBe("Person")
    expect(personSchema["@id"]).toBe(`${baseUrl}/#person`)
  })

  it("includes name, url, and absolute image URL", () => {
    expect(personSchema.name).toBe(siteConfig.globalMeta.name)
    expect(personSchema.url).toBe(baseUrl)
    expect(personSchema.image).toBe(
      `${baseUrl}${siteConfig.globalMeta.hero.image}`,
    )
  })

  it("includes social profiles in sameAs", () => {
    expect(personSchema.sameAs).toContain(siteConfig.social.Bluesky.url)
    expect(personSchema.sameAs).toContain(siteConfig.code.GitHub.url)
    expect(personSchema.sameAs).toContain(siteConfig.code.NPM.url)
  })
})

describe("websiteSchema", () => {
  it("uses the correct @type and @id", () => {
    expect(websiteSchema["@type"]).toBe("WebSite")
    expect(websiteSchema["@id"]).toBe(`${baseUrl}/#website`)
  })

  it("references the Person node as publisher via @id", () => {
    expect(websiteSchema.publisher).toEqual({ "@id": `${baseUrl}/#person` })
  })

  it("includes url and name", () => {
    expect(websiteSchema.url).toBe(baseUrl)
    expect(websiteSchema.name).toBe(siteConfig.globalMeta.title)
  })
})

describe("homepageGraph", () => {
  it("wraps Person and WebSite in a single @graph", () => {
    expect(homepageGraph["@context"]).toBe("https://schema.org")
    expect(homepageGraph["@graph"]).toHaveLength(2)
    expect(homepageGraph["@graph"][0]).toBe(personSchema)
    expect(homepageGraph["@graph"][1]).toBe(websiteSchema)
  })

  it("is valid JSON (no circular references)", () => {
    expect(() => JSON.stringify(homepageGraph)).not.toThrow()
  })
})

describe("blogPostingSchema", () => {
  const url = `${baseUrl}/blog/test-post`

  it("produces a BlogPosting with required fields", () => {
    const schema = blogPostingSchema(
      {
        title: "Test Post",
        timestamp: new Date("2026-01-15T10:00:00Z"),
      },
      url,
    )

    expect(schema["@type"]).toBe("BlogPosting")
    expect(schema.headline).toBe("Test Post")
    expect(schema.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": url,
    })
  })

  it("references the Person node for author and publisher", () => {
    const schema = blogPostingSchema(
      { title: "T", timestamp: new Date("2026-01-01") },
      url,
    )

    expect(schema.author).toEqual({ "@id": `${baseUrl}/#person` })
    expect(schema.publisher).toEqual({ "@id": `${baseUrl}/#person` })
  })

  it("serialises datePublished as ISO 8601", () => {
    const schema = blogPostingSchema(
      { title: "T", timestamp: new Date("2026-01-15T10:00:00Z") },
      url,
    )

    expect(schema.datePublished).toBe(
      Temporal.Instant.from("2026-01-15T10:00:00Z").toString(),
    )
  })

  it("includes keywords as a comma-separated string", () => {
    const schema = blogPostingSchema(
      {
        title: "T",
        timestamp: new Date("2026-01-01"),
        tags: ["aws", "cdk", "serverless"],
      },
      url,
    )

    expect(schema.keywords).toBe("aws, cdk, serverless")
  })

  it("falls back to description when longDescription is absent", () => {
    const schema = blogPostingSchema(
      { title: "T", description: "Short desc", timestamp: new Date("2026-01-01") },
      url,
    )

    expect(schema.description).toBe("Short desc")
  })

  it("omits optional fields when not provided", () => {
    const schema = blogPostingSchema({ title: "T" }, url)

    expect(schema.datePublished).toBeUndefined()
    expect(schema.keywords).toBeUndefined()
    expect(schema.image).toBeUndefined()
  })

  it("includes image when cardImage is present", () => {
    const schema = blogPostingSchema(
      {
        title: "T",
        timestamp: new Date("2026-01-01"),
        cardImage: "https://example.com/card.png",
      },
      url,
    )

    expect(schema.image).toBe("https://example.com/card.png")
  })

  it("is fully JSON-serialisable", () => {
    const schema = blogPostingSchema(
      {
        title: "Test",
        description: "Desc",
        timestamp: new Date("2026-01-01"),
        tags: ["a", "b"],
      },
      url,
    )

    expect(() => JSON.stringify(schema)).not.toThrow()
  })
})
