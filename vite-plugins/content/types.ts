import {z} from "zod";

import type {
    BlogPostHtmlPayload,
    BlogPostMeta,
    CountItem,
    CustomPageContent,
    HeadingItem,
    YearlyArchive,
} from "../../src/types/post.ts";
import type {ArchiveGroupItem} from "../../src/types/post.ts";
import type {SearchIndexItem, SearchIndexPayload} from "../../src/types/search-index.ts";

export const EC_VIRTUAL_ID = "virtual:expressive-code.css";
export const EC_RESOLVED_ID = "\0" + EC_VIRTUAL_ID;

export type RawMarkdownFile = {
    slug: string;
    sourcePath: string;
    frontmatter: z.infer<typeof frontmatterSchema>;
    content: string;
};

export type CompiledPostFile = RawMarkdownFile & {
    html: string;
    headings: HeadingItem[];
    excerpt: string;
    readingMinutes: number;
    words: number;
    normalizedImage: string;
};

export type CompiledCustomPage = {
    slug: string;
    title: string;
    description: string;
    sourcePath: string;
    content: string;
    html: string;
    headings: HeadingItem[];
    showInSitemap: boolean;
};

export const frontmatterSchema = z.object({
    title: z.string(),
    published: z.union([z.string(), z.date()]),
    updated: z.union([z.string(), z.date()]).optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional().default(""),
    image: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().nullable().optional().default(""),
    lang: z.string().optional().default(""),
    showInNavbar: z.boolean().optional().default(false),
    showInSitemap: z.boolean().optional().default(true),
});

export type CompiledArtifacts = {
    postsMeta: BlogPostMeta[];
    postsHtmlBySlug: Map<string, BlogPostHtmlPayload>;
    customPagesMeta: Array<{slug: string; title: string; description: string; headings: HeadingItem[]}>;
    customPagesHtmlBySlug: Map<string, CustomPageContent>;
    sitemapCustomPages: CompiledCustomPage[];
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
    searchIndex: SearchIndexPayload;
    rssXml: string;
    sitemapXml: string;
    robotsTxt: string;
    llmsTxt: string;
    llmsFullTxt: string;
    expressiveCodeCss: string;
    cnameContent: string | null;
};

export type {SearchIndexItem};
