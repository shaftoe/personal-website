---
layout: ../layouts/ProseLayout.astro
title: Colophon
description: How this website is built — the tools, technologies, and principles behind it.
keywords: ["colophon", "about this site", "tech stack"]
subtitle: "How this website is built."
---

## Framework & Language

The site is built with [Astro](https://astro.build), a modern static-site generator. Content is authored in [TypeScript](https://www.typescriptlang.org) and [Astro components](https://astro.build). The output is a fully static site — no client-side JavaScript framework, no runtime server. You can find the full source code and CI/CD setup at <https://github.com/shaftoe/personal-website>.

## Styling

Theme forked from [zaggonaut](https://github.com/RATIU5/zaggonaut). All styling uses [Tailwind CSS](https://tailwindcss.com) v4, processed through the [@tailwindcss/vite](https://tailwindcss.com/docs/vite-plugin) plugin. Typography is handled by [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin). Icons provided by [@lucide/astro](https://lucide.dev). _Dark mode_ respects the user's system preference and can be toggled manually, the choice is persisted in `localStorage`.

## Fonts

- **IBM Plex Mono** — the primary body font, loaded from [Fontsource](https://fontsource.org) CDN.
- **Press Start 2P** — the display/heading font (pixel art style), loaded from [Fontsource](https://fontsource.org) CDN.
- **Literata Variable** — a variable serif font for reading, also from Fontsource.

## Content

Blog posts live as Markdown files with YAML frontmatter, managed through Astro's [content collections](https://docs.astro.build/en/guides/content-collections/). The [changelog](/changelog) is parsed directly from the project's `CHANGELOG.md` file at build time using [marked](https://github.com/markedjs/marked).

## Tooling

- **[Bun](https://bun.sh)** — JavaScript runtime and package manager.
- **[Biome](https://biomejs.dev)** — fast linter and formatter, replacing ESLint + Prettier.
- **[Astro](https://astro.build) · Check** — static type analysis for `.astro` files.
- **[Vitest](https://vitest.dev)** — unit tests and integration tests.
- **[Nu HTML Validator](https://validator.github.io/validator/)** (vnu-jar) — validates all generated HTML pages against the W3C spec.
- **[Netlify](https://www.netlify.com)** — hosting and continuous deployment.

## Infrastructure

Versioning and deploys are fully automated. Every push to master triggers a [release workflow](https://github.com/shaftoe/personal-website/actions/workflows/release.yml) powered by [semantic-release](https://semantic-release.gitbook.io), which analyzes [conventional commit](https://www.conventionalcommits.org/) messages, bumps `package.json` version, updates `CHANGELOG.md`, and publishes a GitHub Release.

When a new version tag is created, a [deploy workflow](https://github.com/shaftoe/personal-website/actions/workflows/deploy.yml) triggers a [Netlify](https://www.netlify.com) build that runs `bun run build` and publishes the resulting `dist/` directory to their CDN. The same workflow also runs on a schedule every four hours to keep the homepage's Bluesky posts and blog content up to date without manual intervention.

## Analytics

Web analytics are powered by [Umami](https://umami.is), a simple, fast, privacy-focused, open-source alternative to Google Analytics. It gives total control over the data and does not violate the privacy of visitors. The tracking script is built from source and served self-hosted — see the [Privacy Policy](/policy) for details. It is loaded conditionally and skipped on the expenses page when the user is authenticated.

## HTML Validation

Generated HTML is validated against the [W3C Markup Validator](https://validator.github.io/validator/) ([vnu-jar](https://www.npmjs.com/package/vnu-jar)) to ensure standards compliance. Every page produced by the build is checked automatically as part of the test suite. Known framework-level exceptions (Astro module script placement after `</html>`, `astro-island` inline styles, heading hierarchy in blog snippet cards) are suppressed with documented justifications.

## Social Images

Open Graph and Twitter Card images are generated at build time as PNGs using [Sharp](https://sharp.pixelplumbing.com/) (which leverages librsvg for SVG rendering). Each image is a 1200×630 terminal-style banner using the **Press Start 2P** pixel font, with a dark background, traffic-light window chrome, and green accent colors matching the site's theme. Three variants are generated: a default banner for the homepage and general pages, a blog-specific banner, and a 404 page banner. The images are referenced via `og:image` and `twitter:image` meta tags in the `<head>` of every page.

## Performance & SEO

- **Preconnect to font CDN** — A `<link rel="preconnect">` hint for `cdn.jsdelivr.net` eliminates DNS and TCP latency on first font load.
- **Theme color & color-scheme** — `<meta name="theme-color">` and `<meta name="color-scheme">` meta tags eliminate the white flash for dark-mode users and tint the browser chrome to match.
- **Sitemap link in head** — A `<link rel="sitemap">` tag in every page's `<head>` helps crawlers discover the sitemap without parsing `robots.txt`.

## Structured Data (JSON-LD)

The site emits [JSON-LD](https://schema.org/) structured data to help search engines understand its content and enable rich results:

- **`Person` + `WebSite`** on the homepage — a `@graph` block gives search engines a machine-readable identity (name, avatar, job title, social profiles via `sameAs`) and identifies the site root. The Person node is referenced by `@id` throughout, so authorship data is defined once and linked, not duplicated.
- **`BlogPosting`** on every article page — includes headline, description, publish date, keywords, and an `author`/`publisher` back-reference to the homepage Person node. This makes posts eligible for Google rich results.

The schemas are built by `src/lib/jsonld.ts` from `siteConfig` (the same single source of truth used everywhere else) and rendered via a small `JsonLd.astro` component using Astro's `set:html` directive — no third-party dependency required.

## IndieWeb Compatibility

This site tries to follows [IndieWeb](https://indieweb.org) principles and be a good citizen of the independent web:

- **Microformats2** — Blog posts and article snippets are marked up with [microformats2](https://microformats.org/wiki/microformats2) classes (`h-entry`, `h-card`, `p-name`, `e-content`, `p-summary`, `dt-published`, `u-url`, `p-uid`, `p-category`, `p-author`). This makes the content machine-readable and consumable by IndieWeb tools, readers, and search engines.
- **`rel="me"` links** — Profile links to [Mastodon](https://fosstodon.org/@alex), [Bluesky](https://bsky.app/profile/social.l3x.in), [my Forge](https://forge.l3x.in/alex), and [GitHub](https://github.com/shaftoe) include `rel="me"`, enabling [IndieAuth](https://indieauth.com/) identity verification and cross-site identity proof.
- **RSS feed** — A full blog feed at [/rss.xml](/rss.xml) ensures content is syndication-friendly and subscribable from any RSS reader.
- **Blogroll** — The [/blogroll](/blogroll) page follows the tradition of linking to other personal websites and independent blogs.
- **Postroll** — The [/postroll](/postroll) page curates link recommendations, a pattern aligned with the IndieWeb ethos of sharing discovery.
- **TIL** — The [/til](/til) page collects short "Today I Learned" entries from [Bluesky](https://bsky.app/profile/social.l3x.in) posts tagged `#til`, acting as a microblog-style knowledge log — a form of [personal wiki](https://indieweb.org/personal_wiki) native to the IndieWeb.
- **Canonical URLs** — Every page includes a `<link rel="canonical">` tag for unambiguous permalink identity.
- **Semantic HTML** — Proper use of `<article>`, `<nav>`, `<main>`, `<time>` (with `datetime` attributes), and other semantic elements ensures structural clarity for parsers and assistive technology.
- **Open Graph & Twitter Cards** — Rich `og:*` and `twitter:*` meta tags provide accurate social previews when content is shared.

## Other Bits

- **Sitemap** generated by [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/). A `301` redirect from [/sitemap](/sitemap) points to the sitemap index XML.
- **[/expenses](/expenses)** — a private, password-protected expense tracker backed by a serverless API. Built as a [Svelte](https://svelte.dev) 5 SPA island embedded in the Astro page via `client:load`.
- **[/usage](/usage)** — a live dashboard showing current quota usage and remaining balance for the author's LLM accounts (e.g. Z.ai, DeepSeek), fetched on load from a public serverless API. Built as a [Svelte](https://svelte.dev) 5 island via `client:load`.
