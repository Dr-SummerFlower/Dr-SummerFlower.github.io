export type NavLink = {
  name: string;
  href: string;
  external?: boolean;
};

export type SocialLink = {
  name: string;
  url: string;
  icon?: string;
};

export type CustomPageItem = {
  slug: string;
  title: string;
  filePath?: string;
  description?: string;
  showInNavbar?: boolean;
  showInSitemap?: boolean;
};

export type GiscusConfig = {
  enable: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
  strict: "0" | "1";
  reactionsEnabled: "0" | "1";
  emitMetadata: "0" | "1";
  inputPosition: "top" | "bottom";
  theme: "preferred_color_scheme" | "light" | "dark";
  lang: string;
};

export type SeoConfig = {
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage?: string;
  robots: {
    allow: string;
    disallow: string[];
  };
};
