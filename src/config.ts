const blogroll = {
  "Geoff Blair": "https://www.geoffblair.com/",
  "Internals for Interns": "https://internals-for-interns.com/",
  Lobsters: "https://lobste.rs/",
  "Paged Out!": "https://pagedout.institute/",
  "Schneier on Security": "https://www.schneier.com/",
  "Simon Willison's Weblog": "https://simonwillison.net/",
  "Study Hacks Blog": "https://calnewport.com/blog/",
  "Vilson Vieira": "https://void.cc/",
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
      image: "/images/profile.png",
    },
    defaultOgImage: "/images/og/default.png" as const,
    blogOgImage: "/images/og/blog.png" as const,
    notFoundOgImage: "/images/og/not-found.png" as const,
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
    currencies: {
      DOP: "🇩🇴",
      USD: "🇺🇸",
      EUR: "🇪🇺",
      RON: "🇷🇴",
    } as const,
  },

  social: {
    Mastodon: {
      url: "https://fosstodon.org/@alex",
      rel: "me",
    },
    Contact: "/contact",
    Blogroll: "/blogroll",
    Postroll: "/postroll",
    Follow: "/follow",
  },

  mastodon: {
    instance: "https://fosstodon.org",
    accountId: 36187,
  },

  personalProjects: {
    Runvoy: "https://runvoy.site",
    "Save to Ink": "https://saveto.ink/",
  },

  code: {
    Blog: "/blog",
    GitHub: {
      url: "https://github.com/shaftoe",
      rel: "me",
    },
    NPM: "https://www.npmjs.com/settings/alexanderfortin/packages",
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
      "Mastodon Feed": {
        description: "My public posts on Mastodon (fosstodon.org/@alex).",
        url: "https://fosstodon.org/@alex.rss",
        type: "RSS" as const,
      },
    },
  },

  splashPages: [
    { label: "AI", href: "/ai" },
    { label: "Blog", href: "/blog" },
    { label: "Blogroll", href: "/blogroll" },
    { label: "Changelog", href: "/changelog" },
    { label: "Colophon", href: "/colophon" },
    { label: "Contact", href: "/contact" },
    { label: "Follow", href: "/follow" },
    { label: "Policy", href: "/policy" },
    { label: "Postroll", href: "/postroll" },
    { label: "Sitemap", href: "/sitemap" },
    { label: "Slashes", href: "/slashes" },
  ],
}

// Type definition for site config
export type SiteConfig = typeof siteConfig
