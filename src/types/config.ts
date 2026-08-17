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

export type CustomPageBase = {
  slug: string;
  title: string;
  description?: string;
  showInNavbar?: boolean;
  showInSitemap?: boolean;
};

export type MarkdownCustomPage = CustomPageBase & {
  type?: "markdown";
  filePath?: string;
};

export type ComponentCustomPage = CustomPageBase & {
  type: "component";
  path?: string;
  componentId?: string;
};

export type CustomPageItem = MarkdownCustomPage | ComponentCustomPage;

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
