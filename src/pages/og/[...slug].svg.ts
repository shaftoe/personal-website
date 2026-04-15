import { getCollection } from "astro:content"
import type { APIRoute } from "astro"
import { siteConfig } from "../../config"
import { generateSocialImage } from "../../lib/social-image"

interface PageDef {
  slug: string[]
  title: string
}

export async function getStaticPaths() {
  const posts = await getCollection("blog")
  const tags = new Set(posts.flatMap((p) => p.data.tags ?? []))

  const staticPages: PageDef[] = [
    { slug: ["default"], title: siteConfig.globalMeta.name },
    { slug: ["blog"], title: siteConfig.blogMeta.title },
    { slug: ["contact"], title: "Contact" },
    { slug: ["follow"], title: "Follow" },
    { slug: ["blogroll"], title: "Blogroll" },
    { slug: ["postroll"], title: "Postroll" },
    { slug: ["changelog"], title: "Changelog" },
    { slug: ["expenses"], title: "Expenses" },
    { slug: ["404"], title: "404 — Not Found" },
    { slug: ["colophon"], title: "Colophon" },
    { slug: ["ai"], title: "AI" },
    { slug: ["policy"], title: "Privacy Policy" },
    { slug: ["slashes"], title: "Slashes" },
  ]

  const blogPages: PageDef[] = posts.map((post) => ({
    slug: ["blog", post.data.slug],
    title: post.data.title,
  }))

  const tagPages: PageDef[] = [...tags].map((tag) => ({
    slug: ["blog", "tags", tag],
    title: `#${tag}`,
  }))

  return [...staticPages, ...blogPages, ...tagPages].map(({ slug, title }) => ({
    params: { slug: slug.join("/") },
    props: { title },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const svg = generateSocialImage({ title: props.title as string })
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  })
}
