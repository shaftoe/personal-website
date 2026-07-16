import Slugger from "github-slugger"
import type { HastPluginDefinition } from "satteri"

/**
 * A Sätteri `hast` plugin that appends a shareable anchor link (`#`) to every
 * Markdown heading so individual sections of long pages (e.g. `/colophon`,
 * `/policy`) and blog posts can be linked to directly.
 *
 * Astro's default Markdown pipeline (Sätteri) already adds `id`s to headings
 * via a built-in plugin that runs *after* user `hastPlugins`. That means the
 * `id` is not present yet when this plugin visits a heading, so we compute the
 * slug ourselves with `github-slugger` (the exact algorithm the built-in plugin
 * uses) and set the `id`. The built-in heading-ids plugin then sees the
 * existing `id` and reuses it as-is, keeping the two in perfect sync.
 *
 * The appended link is styled (see `global.css`) to stay invisible until the
 * heading is hovered or focused, so it never clutters the page.
 */
export function headingAnchorsPlugin(): HastPluginDefinition {
  // A fresh slugger per document, matching the built-in heading-ids plugin.
  const slugger = new Slugger()
  return {
    name: "heading-anchors",
    element: {
      filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
      visit(node, ctx) {
        const existingId = node.properties?.id
        const text = ctx.textContent(node)
        // Mirror the built-in heading-ids plugin: reuse an explicit id, otherwise
        // slug the text. We only advance the slugger for headings without an id,
        // keeping de-duplication counters aligned with the built-in plugin.
        const slug =
          typeof existingId === "string" ? existingId : slugger.slug(text)

        if (typeof existingId !== "string") {
          ctx.setProperty(node, "id", slug)
        }

        ctx.appendChild(node, {
          type: "element",
          tagName: "a",
          properties: {
            href: `#${slug}`,
            className: ["heading-anchor"],
            ariaLabel: "Permalink to this section",
          },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { ariaHidden: "true" },
              children: [{ type: "text", value: "#" }],
            },
          ],
        })
      },
    },
  }
}
