import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config";

// https://astro.build/config
export default defineConfig({
  site: siteConfig.site.baseUrl,
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
    sitemap(),
  ],
});
