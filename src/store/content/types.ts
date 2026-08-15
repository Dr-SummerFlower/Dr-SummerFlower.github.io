import type {
    ArchiveGroupItem,
    BlogPostHtmlPayload,
    BlogPostMeta,
    CountItem,
    CustomPageContent,
    YearlyArchive,
} from "@/types/post";

export type ContentStatus = "idle" | "loading" | "ready" | "error";

export type CustomPageMeta = {
    slug: string;
    title: string;
    description: string;
    filePath?: string;
    showInNavbar?: boolean;
    showInSitemap?: boolean;
};

export type MetaBundle = {
    posts: BlogPostMeta[];
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
    customPages: CustomPageMeta[];
};

export type InlineDataShape =
    | {kind: "meta"; value: MetaBundle}
    | {kind: "post"; value: {meta?: BlogPostMeta; payload: BlogPostHtmlPayload}}
    | {kind: "custom-page"; value: {meta?: CustomPageMeta; payload: CustomPageContent}}
    | {kind: "yearly-archive"; value: YearlyArchive[]}
    | {kind: "archive-groups"; value: ArchiveGroupItem[]};

export type ContentState = {
    status: ContentStatus;
    error: string | null;
    posts: BlogPostMeta[];
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
    customPages: CustomPageMeta[];
    postsHtmlBySlug: Record<string, BlogPostHtmlPayload>;
    customPagesHtmlBySlug: Record<string, CustomPageContent>;
    loadedMetaAt: number | null;
    inlineRead: {
        meta: boolean;
        post: Record<string, boolean>;
        customPage: Record<string, boolean>;
        yearlyArchive: boolean;
        archiveGroups: boolean;
    };
    tryApplyInline: () => void;
    ensureMeta: (opts?: {force?: boolean}) => Promise<void>;
    getPostHtml: (slug: string) => Promise<BlogPostHtmlPayload | null>;
    getCustomPageHtml: (slug: string) => Promise<CustomPageContent | null>;
    invalidate: () => void;
};

export type PersistedV1 = Partial<Pick<ContentState,
    "posts" | "categories" | "tags" | "archiveGroups" | "yearlyArchive"
    | "customPages" | "loadedMetaAt" | "postsHtmlBySlug" | "customPagesHtmlBySlug"
>>;
