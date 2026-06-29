/**
 * JSON-LD structured-data builders.
 *
 * These factory functions produce schema.org objects from `siteConfig` so that
 * structured data always stays in sync with the single source of truth. The
 * homepage emits a Person + WebSite graph; each blog post emits a BlogPosting
 * that references the Person node via `@id`, keeping the knowledge graph DRY.
 *
 * Render the returned objects with the `JsonLd.astro` component.
 */
import { siteConfig } from "../config"
import type { ArticleFrontmatter } from "./blog-collection"
import { toInstant } from "./utils"

const baseUrl = siteConfig.globalMeta.baseUrl

/** Social/profile URLs for the `sameAs` property (identity proofing). */
const sameAs = [
  siteConfig.social.Bluesky.url,
  siteConfig.code["My Forge"].url,
  siteConfig.code.GitHub.url,
  siteConfig.code.NPM.url,
].filter(Boolean)

/**
 * Person schema — the author's identity node.
 * Referenced as `@id` by WebSite and BlogPosting nodes across the site.
 */
export const personSchema = {
  "@type": "Person",
  "@id": `${baseUrl}/#person`,
  name: siteConfig.globalMeta.name,
  url: baseUrl,
  image: `${baseUrl}${siteConfig.globalMeta.hero.image}`,
  jobTitle: siteConfig.globalMeta.hero.subtitle,
  description: siteConfig.globalMeta.longDescription,
  sameAs,
} as const

/**
 * WebSite schema — identifies the site root as a publishable entity.
 * The `publisher` back-reference links to the Person node.
 */
export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  url: baseUrl,
  name: siteConfig.globalMeta.title,
  description: siteConfig.globalMeta.longDescription,
  publisher: { "@id": `${baseUrl}/#person` },
} as const

/**
 * Homepage JSON-LD — Person + WebSite wrapped in a single `@graph` so Google
 * validates them as one coherent knowledge graph.
 */
export const homepageGraph = {
  "@context": "https://schema.org",
  "@graph": [personSchema, websiteSchema],
} as const

/**
 * BlogPosting schema for an individual article.
 *
 * The author/publisher reference the Person node by `@id` rather than
 * duplicating the full identity, which is the schema.org-recommended pattern.
 */
export function blogPostingSchema(
  frontmatter: ArticleFrontmatter,
  url: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.longDescription ?? frontmatter.description ?? "",
    author: { "@id": `${baseUrl}/#person` },
    publisher: { "@id": `${baseUrl}/#person` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  }

  if (frontmatter.timestamp) {
    schema.datePublished = toInstant(frontmatter.timestamp).toString()
  }

  if (frontmatter.tags && frontmatter.tags.length > 0) {
    schema.keywords = frontmatter.tags.join(", ")
  }

  if (frontmatter.cardImage) {
    schema.image = frontmatter.cardImage
  }

  return schema
}
