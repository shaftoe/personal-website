// Site-wide configuration — import this directly in components/layouts.

export const siteConfig = {
  site: {
    baseUrl: "https://a.l3x.in" as const,
  },

  // NOTE: This token is embedded in the client-side bundle and is therefore public.
  // It acts as a simple rate-limiter for the serverless functions, not a secret.
  api: {
    baseUrl: "https://api-v2.l3x.in/.netlify/functions" as const,
    token: "01J62K2NATYJ93AD5XJYE6YEGZ" as const,
  },

  contact: {
    path: "/contact" as const,
  },

  expenses: {
    path: "/expense" as const,
    localStorageKey: "expenses-password",
    locale: "it-IT",
    currencies: {
      DOP: "🇩🇴",
      USD: "🇺🇸",
      EUR: "🇪🇺",
      RON: "🇷🇴",
    } as const,
  },

  globalMeta: {
    title: "Alexander Fortin's personal home page",
    description: "Alexander Fortin's personal web site",
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

  social: {
    Mastodon: {
      url: "https://fosstodon.org/@alex",
      rel: "me",
    },
    Contact: "/contact",
    Blogroll: "/blogroll",
    RSS: "/rss.xml",
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

  hero: {
    title: "Alexander Fortin",
    subtitle:
      "I'm a Software Engineer passionate about automation and all the things as Code",
    image: "/images/profile.png",
  },

  personal: {
    name: "Alexander Fortin",
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
    rss: "/rss.xml",
    cv: "https://cv.l3x.in",
  },

  blogroll: {
    "Schneier on Security": "https://www.schneier.com/",
    "Geoff Blair": "https://www.geoffblair.com/",
    "Simon Willison’s Weblog": "https://simonwillison.net/",
    Lobsters: "https://lobste.rs/",
  },

  splashPages: [
    { label: "Blog", href: "/blog" },
    { label: "Blogroll", href: "/blogroll" },
    { label: "Changelog", href: "/changelog" },
    { label: "Colophon", href: "/colophon" },
    { label: "Contact", href: "/contact" },
  ],
}

// Type definition for site config
export type SiteConfig = typeof siteConfig
