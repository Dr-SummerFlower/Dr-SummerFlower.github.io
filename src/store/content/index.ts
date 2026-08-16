import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {
    ArchiveGroupItem,
    BlogPostHtmlPayload,
    BlogPostMeta,
    CustomPageContent,
    YearlyArchive,
} from "@/types/post";
import {withSiteBasePath} from "@/lib/config/helpers/url.ts";
import type {
    ContentState,
    CustomPageMeta,
    MetaBundle,
    PersistedV1,
} from "./types.js";
import {readInlinePayload} from "./inline-reader.js";
import {
    CONTENT_STORE_VERSION,
    META_CACHE_TTL_MS,
    META_FILES,
    fetchJson,
} from "./fetchers.js";

export type {ContentStatus} from "./types.js";

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
            name: "summer-blog-content",
            version: CONTENT_STORE_VERSION,
            migrate: (persistedState: unknown, version): PersistedV1 => {
                const state = (persistedState ?? {}) as PersistedV1;
                if (version < 2) {
                    delete state.postsHtmlBySlug;
                    delete state.customPagesHtmlBySlug;
                }
                return state;
            },
            partialize: (state) => {
                const base: PersistedV1 = {
                    posts: state.posts,
                    categories: state.categories,
                    tags: state.tags,
                    archiveGroups: state.archiveGroups,
                    yearlyArchive: state.yearlyArchive,
                    customPages: state.customPages,
                    loadedMetaAt: state.loadedMetaAt,
                };
                if (import.meta.env.PROD) {
                    base.postsHtmlBySlug = state.postsHtmlBySlug;
                    base.customPagesHtmlBySlug = state.customPagesHtmlBySlug;
                }
                return base;
            },
        },
    ),
);
