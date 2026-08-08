export type HeadingItem = {
  depth: number;
  slug: string;
  text: string;
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  published: string;
  updated?: string;
  draft: boolean;
  description: string;
  image: string;
  tags: string[];
  category: string | null;
  lang: string;
  excerpt: string;
  readingMinutes: number;
  words: number;
  prevPost?: { slug: string; title: string };
  nextPost?: { slug: string; title: string };
};

export type BlogPostHtmlPayload = {
    slug: string;
    html: string;
    headings: HeadingItem[];
};

export type CustomPageContent = {
  slug: string;
  title: string;
  description: string;
  sourcePath?: string;
  content?: string;
  html: string;
  headings: HeadingItem[];
};

export type CountItem = { name: string; count: number };

export type ArchiveGroupItem = {
  key: string;
  year: number;
  month: number;
  items: BlogPostMeta[];
};

export type YearlyArchive = {
  year: number;
  items: BlogPostMeta[];
};
