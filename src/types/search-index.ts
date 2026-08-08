export type SearchIndexItem = {
  slug: string;
  title: string;
  excerpt: string;
  text: string;
  tags: string;
};

export type SearchIndexPayload = {
  version: 1;
  items: SearchIndexItem[];
};
