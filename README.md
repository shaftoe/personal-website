# Personal Website

Source code for [a.l3x.in](https://a.l3x.in) — Alexander Fortin's personal website and tech blog.

See <https://a.l3x.in/colophon> for more details.

## Tech stack

- [Astro](https://astro.build) with Svelte islands and Tailwind CSS v4
- [Biome](https://biomejs.dev) for linting and formatting
- [Vitest](https://vitest.dev) for unit and HTML validation tests
- [semantic-release](https://semantic-release.gitbook.io) with a keep-a-changelog preset
- Deployed to [Netlify](https://netlify.com) (see `netlify.toml`)

## Development

Requirements: [Node.js](https://nodejs.org) (see `NODE_VERSION` in `netlify.toml`) and [pnpm](https://pnpm.io).

```sh
pnpm install       # install dependencies
pnpm run dev       # start the dev server
pnpm run build     # production build to dist/
pnpm run preview   # preview the production build
```

### Validation

Any change is only considered valid if the following pass without errors or warnings:

```sh
pnpm run validate  # lint + format + astro check
pnpm run build     # production build
pnpm run test      # unit + HTML validation tests
```

### Utility scripts

```sh
pnpm run blog-posts             # blog posts helper
pnpm run bluesky                # Bluesky/ATProto helpers
pnpm run changelog              # changelog helpers
pnpm run postroll               # regenerate the postroll
pnpm run standard:publication   # standard publication documents
pnpm run standard:documents     # standard documents
pnpm run profile-image          # generate profile images
pnpm run build:tracker          # build the self-hosted umami tracker
```

## Licence

See [LICENSE](./LICENSE)
