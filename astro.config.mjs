import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config";
import blogRedirects from "./src/integrations/blog-redirects";
import ogImages from "./src/integrations/og-images";
import profileImage from "./src/integrations/profile-image";
import stripEmptySrcset from "./src/integrations/strip-empty-srcset";

// https://astro.build/config
export default defineConfig({
  site: siteConfig.globalMeta.baseUrl,
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
