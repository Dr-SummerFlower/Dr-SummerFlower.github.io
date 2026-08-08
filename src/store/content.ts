import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {
    ArchiveGroupItem,
    BlogPostHtmlPayload,
    BlogPostMeta,
    CountItem,
    CustomPageContent,
    YearlyArchive,
} from "@/types/post";
import {withSiteBasePath} from "@/config";

export type ContentStatus = "idle" | "loading" | "ready" | "error";

type CustomPageMeta = {
    slug: string;
    title: string;
    description: string;
    filePath?: string;
    showInNavbar?: boolean;
    showInSitemap?: boolean;
};

type MetaBundle = {
    posts: BlogPostMeta[];
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
    customPages: CustomPageMeta[];
};

type InlineDataShape =
    | {kind: "meta"; value: MetaBundle}
    | {kind: "post"; value: {meta?: BlogPostMeta; payload: BlogPostHtmlPayload}}
    | {kind: "custom-page"; value: {meta?: CustomPageMeta; payload: CustomPageContent}}
    | {kind: "yearly-archive"; value: YearlyArchive[]}
    | {kind: "archive-groups"; value: ArchiveGroupItem[]};

type ContentState = {
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

const META_FILES = [
    {key: "posts", url: "/generated/posts.json"},
    {key: "categories", url: "/generated/categories.json"},
    {key: "tags", url: "/generated/tags.json"},
    {key: "archiveGroups", url: "/generated/archive-groups.json"},
    {key: "yearlyArchive", url: "/generated/yearly-archive.json"},
    {key: "customPages", url: "/generated/custom-pages.json"},
] as const;

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} while loading ${url}`);
    return (await res.json()) as T;
}

function readInlinePayload<T extends InlineDataShape>(slug: string | null): T | null {
    if (typeof document === "undefined") return null;
    const selector = slug ? `script[type="application/json"][data-inline-id="${slug}"]`
        : 'script[type="application/json"][data-inline-id="root"]';
    const el = document.head.querySelector<HTMLScriptElement>(selector)
        || document.body.querySelector<HTMLScriptElement>(selector);
    if (!el?.textContent) return null;
    try {
        return JSON.parse(el.textContent) as T;
    } catch {
        return null;
    }
}

const META_CACHE_TTL_MS = 5 * 60 * 1000;

export const useContentStore = create<ContentState>()(
    persist(
        (set, get) => ({
            status: "idle",
            error: null,
            posts: [],
            categories: [],
            tags: [],
            archiveGroups: [],
            yearlyArchive: [],
            customPages: [],
            postsHtmlBySlug: {},
            customPagesHtmlBySlug: {},
            loadedMetaAt: null,
            inlineRead: {
                meta: false,
                post: {},
                customPage: {},
                yearlyArchive: false,
                archiveGroups: false,
            },
            tryApplyInline() {
                const st = get();
                if (st.inlineRead.meta) return;
                const root = readInlinePayload<{kind: "meta"; value: MetaBundle}>(null);
                if (root && root.kind === "meta") {
                    const v = root.value;
                    set({
                        posts: v.posts,
                        categories: v.categories,
                        tags: v.tags,
                        archiveGroups: v.archiveGroups,
                        yearlyArchive: v.yearlyArchive,
                        customPages: v.customPages,
                        status: "ready",
                        loadedMetaAt: Date.now(),
                        inlineRead: {...st.inlineRead, meta: true},
                    });
                } else {
                    set({inlineRead: {...st.inlineRead, meta: true}});
                }
                const ya = readInlinePayload<{kind: "yearly-archive"; value: YearlyArchive[]}>("yearly-archive");
                if (ya && ya.kind === "yearly-archive") {
                    set((s) => ({
                        yearlyArchive: ya.value,
                        inlineRead: {...s.inlineRead, yearlyArchive: true},
                    }));
                }
                const ag = readInlinePayload<{kind: "archive-groups"; value: ArchiveGroupItem[]}>("archive-groups");
                if (ag && ag.kind === "archive-groups") {
                    set((s) => ({
                        archiveGroups: ag.value,
                        inlineRead: {...s.inlineRead, archiveGroups: true},
                    }));
                }
            },
            async ensureMeta(opts) {
                get().tryApplyInline();
                const now = Date.now();
                const s0 = get();
                if (
                    !opts?.force &&
                    s0.status === "ready" &&
                    s0.loadedMetaAt !== null &&
                    now - s0.loadedMetaAt < META_CACHE_TTL_MS
                ) {
                    return;
                }
                if (get().status === "loading") return;
                set({status: "loading", error: null});
                try {
                    const results = await Promise.all(
                        META_FILES.map((f) =>
                            fetchJson<unknown>(withSiteBasePath(f.url)).then((data) => ({
                                key: f.key,
                                data,
                            })),
                        ),
                    );
                    const patch: Partial<ContentState> = {};
                    for (const r of results) {
                        (patch as any)[r.key] = r.data;
                    }
                    set({
                        ...patch,
                        status: "ready",
                        loadedMetaAt: now,
                        error: null,
                    });
                } catch (e: any) {
                    set({status: "error", error: e?.message ?? "failed to load content"});
                    throw e;
                }
            },
            async getPostHtml(slug) {
                get().tryApplyInline();
                const cached = get().postsHtmlBySlug[slug];
                if (cached) return cached;
                const inline = readInlinePayload<{kind: "post"; value: {meta?: BlogPostMeta; payload: BlogPostHtmlPayload}}>(`post:${slug}`);
                if (inline && inline.kind === "post") {
                    const {meta, payload} = inline.value;
                    set((state) => ({
                        postsHtmlBySlug: {...state.postsHtmlBySlug, [slug]: payload},
                        posts:
                            meta && !state.posts.some((p) => p.slug === slug)
                                ? [meta, ...state.posts].sort((a, b) => b.published.localeCompare(a.published))
                                : state.posts,
                        inlineRead: {
                            ...state.inlineRead,
                            post: {...state.inlineRead.post, [slug]: true},
                        },
                    }));
                    return payload;
                }
                try {
                    const payload = await fetchJson<BlogPostHtmlPayload>(
                        withSiteBasePath(`/generated/posts-html/${encodeURIComponent(slug)}.json`),
                    );
                    set((state) => ({
                        postsHtmlBySlug: {...state.postsHtmlBySlug, [slug]: payload},
                    }));
                    return payload;
                } catch {
                    return null;
                }
            },
            async getCustomPageHtml(slug) {
                get().tryApplyInline();
                const cached = get().customPagesHtmlBySlug[slug];
                if (cached) return cached;
                const inline = readInlinePayload<{kind: "custom-page"; value: {meta?: CustomPageMeta; payload: CustomPageContent}}>(`custom-page:${slug}`);
                if (inline && inline.kind === "custom-page") {
                    const {meta, payload} = inline.value;
                    set((state) => ({
                        customPagesHtmlBySlug: {...state.customPagesHtmlBySlug, [slug]: payload},
                        customPages:
                            meta && !state.customPages.some((p) => p.slug === slug)
                                ? [meta, ...state.customPages]
                                : state.customPages,
                        inlineRead: {
                            ...state.inlineRead,
                            customPage: {...state.inlineRead.customPage, [slug]: true},
                        },
                    }));
                    return payload;
                }
                try {
                    const payload = await fetchJson<CustomPageContent>(
                        withSiteBasePath(
                            `/generated/custom-pages-html/${encodeURIComponent(slug)}.json`,
                        ),
                    );
                    set((state) => ({
                        customPagesHtmlBySlug: {
                            ...state.customPagesHtmlBySlug,
                            [slug]: payload,
                        },
                    }));
                    return payload;
                } catch {
                    return null;
                }
            },
            invalidate: () => {
                set({
                    status: "idle",
                    error: null,
                    posts: [],
                    categories: [],
                    tags: [],
                    archiveGroups: [],
                    yearlyArchive: [],
                    customPages: [],
                    postsHtmlBySlug: {},
                    customPagesHtmlBySlug: {},
                    loadedMetaAt: null,
                    inlineRead: {
                        meta: false,
                        post: {},
                        customPage: {},
                        yearlyArchive: false,
                        archiveGroups: false,
                    },
                });
            },
        }),
        {
            name: "summer-blog-content-v1",
            partialize: (state) => ({
                posts: state.posts,
                categories: state.categories,
                tags: state.tags,
                archiveGroups: state.archiveGroups,
                yearlyArchive: state.yearlyArchive,
                customPages: state.customPages,
                postsHtmlBySlug: state.postsHtmlBySlug,
                customPagesHtmlBySlug: state.customPagesHtmlBySlug,
                loadedMetaAt: state.loadedMetaAt,
            }),
        },
    ),
);
