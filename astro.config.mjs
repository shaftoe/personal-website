import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config";
import { headingAnchorsPlugin } from "./src/lib/heading-anchors";
import blogRedirects from "./src/integrations/blog-redirects";
import ogImages from "./src/integrations/og-images";
import profileImage from "./src/integrations/profile-image";
import stripEmptySrcset from "./src/integrations/strip-empty-srcset";

// https://astro.build/config
export default defineConfig({
  site: siteConfig.globalMeta.baseUrl,
  markdown: {
    // Keep Astro's native Sätteri processor and extend it with a plugin that
    // appends a shareable anchor link (`#`) to every Markdown heading, so
    // individual sections of long pages (e.g. /colophon, /policy) and blog
    // posts can be linked to directly.
    processor: satteri({
      hastPlugins: [headingAnchorsPlugin()],
    }),
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
  },
  vite: {
    // @ts-ignore -- @tailwindcss/vite bundles its own Vite types
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['.netlify.app'],
    },
  },
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !page.includes("/expenses"),
    }),
    blogRedirects(),
    ogImages(),
    profileImage(),
    stripEmptySrcset(),
  ],
});
