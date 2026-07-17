const blogroll = {
  "Matt Hackett": "http://richtaur.com/",
  "Redowan's Reflections": "https://rednafi.com/",
  "Geoff Blair": "https://www.geoffblair.com/",
  "Internals for Interns": "https://internals-for-interns.com/",
  Lobsters: "https://lobste.rs/",
  "Paged Out!": "https://pagedout.institute/",
  "Schneier on Security": "https://www.schneier.com/",
  "Simon Willison's Weblog": "https://simonwillison.net/",
  "Study Hacks Blog": "https://calnewport.com/blog/",
  "Vilson Vieira": "https://void.cc/",
  "Yan Cui": "https://theburningmonk.com/posts/",
} as const

// Site-wide configuration - import this directly in components/layouts.
export const siteConfig = {
  globalMeta: {
    baseUrl: "https://a.l3x.in" as const,
    title: "Alexander Fortin's personal home page",
    name: "Alexander Fortin",
    description: "Alexander Fortin's personal web site",
    hero: {
      subtitle:
        "I'm a Software Engineer passionate about automation and all the things as Code",
      image: "/images/profile.webp",
    },

    longDescription:
      "Software Engineer with a passion for automation and all the things as Code. Writing about Serverless, Jamstack, Cloud Computing and more.",
    keywords: [
      "software engineering",
      "serverless",
      "cloud computing",
      "devops",
      "automation",
    ],
    maxArticles: 3,
  },

  // NOTE: This token is embedded in the client-side bundle and is therefore public.
  // It acts as a simple rate-limiter for the serverless functions, not a secret.
  api: {
    baseUrl: "https://api-v2.l3x.in/.netlify/functions" as const,
    token: "01J62K2NATYJ93AD5XJYE6YEGZ" as const,
  },

  analytics: {
    umami: {
      src: "/scripts/umami.js" as const,
      websiteId: "d2f0933f-644c-42ea-8b50-ad2766838043" as const,
    },
  },

  expenses: {
    path: "/expense" as const,
    localStorageKey: "expenses-password" as const,
    locale: "it-IT" as const,
    defaultCurrency: "RON" as const,
    currencies: {
      RON: "🇷🇴",
      USD: "🇺🇸",
      EUR: "🇪🇺",
      DOP: "🇩🇴",
    } as const,
  },

  social: {
    Bluesky: {
      url: "https://bsky.app/profile/l3x.in",
      rel: "me",
    },
    Contact: "/contact",
    Follow: "/follow",
  },

  // Public keys — advertised in the document head and on /keys so visitors
  // can verify signatures and encrypt messages.
  crypto: {
    pgpKey: "https://gpg.l3x.in/" as const,
  },

  // ATproto / Bluesky identity — the source for build-time microblogging
  // content (latest posts, /postroll, /til). Hosted on a self-hosted PDS.
  // All reads go directly to the PDS via public `com.atproto.repo.*` XRPC
  // methods — no dependency on Bluesky's central AppView.
  atproto: {
    handle: "l3x.in" as const,
    pds: "https://social.l3x.in" as const,
  },

  // Standard.site lexicon publishing — extends the existing ATproto
  // integration to the long-form blog. `site.standard.publication` and
  // `site.standard.document` records are written to the self-hosted PDS by the
  // `standard:publication` / `standard:documents` CLI scripts; their resulting
  // AT-URIs are committed to a sidecar file (`standard.sidecarPath`) that the
  // build reads to emit the `/.well-known/site.standard.publication` domain
  // verification endpoint and the per-article `<link rel="site.standard.
  // document">` tags. This makes the blog's articles discoverable across the
  // ATmosphere without changing where the canonical content lives (Git).
  standard: {
    publicationCollection: "site.standard.publication" as const,
    documentCollection: "site.standard.document" as const,
    sidecarPath: "src/data/standard.json" as const,
  },

  personalProjects: {
    "Awesome Pi": "https://awesome-pi.site",
    "Pi GitHub action": "https://github.com/shaftoe/pi-coding-agent-action",
    "Save to Ink": "https://saveto.ink",
    Runvoy: "https://runvoy.site",
  },

  code: {
    Blog: "/blog",
    "My Forge": {
      url: "https://forge.l3x.in/alex",
      rel: "me",
    },
    GitHub: {
      url: "https://github.com/shaftoe",
      rel: "me",
    },
    NPM: {
      url: "https://www.npmjs.com/~alexanderfortin",
      packages: "https://www.npmjs.com/~alexanderfortin?activeTab=packages",
      rel: "me",
    },
  },

  blogMeta: {
    title: "Alexander Fortin's Tech Blog",
    description: "A techincal blog about Software Engineering.",
    longDescription:
      "Tech articles about Serverless architectures, AWS CDK, Terraform, DevOps, Jamstack and Cloud Computing.",
    keywords: [
      "coding agents",
      "serverless",
      "cloud computing",
      "devops",
      "automation",
      "jamstack",
    ],
  },

  notFoundMeta: {
    title: "404",
    description: "The page you are looking for does not exist.",
    longDescription:
      "The page you are looking for does not exist. Maybe it never existed.",
  },

  texts: {
    articlesName: "Latest blog articles",
    viewAll: "View All",
    noArticles: "No articles found.",
  },

  menu: {
    home: "/",
    blog: "/blog",
    contact: "/contact",
    follow: "/follow",
    cv: "https://cv.l3x.in",
  },

  blogroll,

  follow: {
    feeds: {
      "Blog RSS Feed": {
        description: "All published blog articles.",
        url: "/rss.xml",
        type: "RSS" as const,
      },
      "Microblog RSS Feed": {
        description:
          "Latest microblog posts from my Bluesky / ATproto account.",
        url: "/microblog.xml",
        type: "RSS" as const,
      },
    },
  },

  slashPages: [
    {
      label: "ai",
      description: "How I use AI and coding agents in my projects.",
    },
    {
      label: "blogroll",
      description: "Blogs and technical journals I follow.",
    },
    {
      label: "changelog",
      description: "Version history and release notes for this website.",
    },
    { label: "colophon", description: "How this website is built." },
    { label: "contact", description: "Get in touch with me." },
    {
      label: "keys",
      description:
        "My public GPG and SSH keys for verifying identity and encrypting communications.",
    },
    { label: "follow", description: "RSS feeds to subscribe to my content." },
    {
      label: "postroll",
      description: "Links worth sharing, collected from Bluesky.",
    },
    { label: "sitemap", description: "Sitemap index for search engines." },
    {
      label: "til",
      description: "Today I Learned — short things I learn day to day.",
    },
    {
      label: "slashes",
      description:
        "An index of all the slash pages on this website (this page).",
    },
  ] as const,
}

// Type definition for site config
export type SiteConfig = typeof siteConfig
