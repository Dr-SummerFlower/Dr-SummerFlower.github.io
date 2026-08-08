import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {useContentStore} from "@/store/content";
import MainGridLayout from "@/layouts/MainGridLayout";
import PostMeta from "@/components/PostMeta";
import Markdown from "@/components/misc/Markdown";
import Giscus from "@/components/Giscus";
import ImageLightbox from "@/components/ImageLightbox";
import {useDocumentTitle} from "@/utils/seo";
import {t} from "@/i18n";
import type {BlogPostHtmlPayload, BlogPostMeta, HeadingItem} from "@/types/post";

type InlinePostData = {
    meta?: BlogPostMeta;
    payload?: BlogPostHtmlPayload;
};

function readInlinePostData(slug: string): InlinePostData | null {
    if (typeof document === "undefined") return null;
    const id = `post:${slug}`;
    const el = document.head.querySelector<HTMLScriptElement>(
        `script[type="application/json"][data-inline-id="${id}"]`,
    ) || document.body.querySelector<HTMLScriptElement>(
        `script[type="application/json"][data-inline-id="${id}"]`,
    );
    if (!el?.textContent) return null;
    try {
        const raw = JSON.parse(el.textContent) as
            | {kind: "post"; value: InlinePostData}
            | InlinePostData;
        if ("kind" in raw && raw.kind === "post") return (raw as any).value;
        return raw as InlinePostData;
    } catch {
        return null;
    }
}

export default function PostPage() {
    const {slug = ""} = useParams();
    const ensureMeta = useContentStore((s) => s.ensureMeta);
    const getPostHtml = useContentStore((s) => s.getPostHtml);
    const tryApplyInline = useContentStore((s) => s.tryApplyInline);
    const posts = useContentStore((s) => s.posts);
    const categories = useContentStore((s) => s.categories);
    const tags = useContentStore((s) => s.tags);

    const inline = useMemo(() => (slug ? readInlinePostData(slug) : null), [slug]);

    const [postMeta, setPostMeta] = useState<BlogPostMeta | null>(inline?.meta ?? null);
    const [htmlPayload, setHtmlPayload] = useState<BlogPostHtmlPayload | null>(inline?.payload ?? null);
    const [notFound, setNotFound] = useState(false);
    const [resolvedMeta, setResolvedMeta] = useState(false);
    const [coverLightboxSrc, setCoverLightboxSrc] = useState<string | null>(null);

    useEffect(() => {
        tryApplyInline();
    }, [tryApplyInline]);

    useEffect(() => {
        if (slug && inline?.payload) {
            void getPostHtml(slug);
        }
    }, [slug, inline?.payload, getPostHtml]);

    useEffect(() => {
        let cancelled = false;
        if (inline?.meta && inline?.payload) {
            setResolvedMeta(true);
        }
        ensureMeta()
            .then(() => {
                const meta = posts.find((p) => p.slug === slug) ?? inline?.meta ?? null;
                if (cancelled) return;
                setPostMeta((prev) => prev ?? meta);
                if (!meta) {
                    setNotFound(true);
                    return;
                }
                if (inline?.payload) {
                    setResolvedMeta(true);
                    return;
                }
                return getPostHtml(slug).then((payload) => {
                    if (cancelled) return;
                    if (!payload) {
                        setNotFound(true);
                        return;
                    }
                    setHtmlPayload(payload);
                    setResolvedMeta(true);
                });
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            });
        return () => {
            cancelled = true;
            setPostMeta(inline?.meta ?? null);
            setHtmlPayload(inline?.payload ?? null);
            setNotFound(false);
            setResolvedMeta(false);
        };
    }, [ensureMeta, getPostHtml, inline, posts, slug]);

    useDocumentTitle(
        notFound
            ? t("postNotFound")
            : postMeta
              ? postMeta.title
              : undefined,
        postMeta?.description || postMeta?.excerpt,
        `/posts/${slug}`,
        postMeta?.image || undefined,
    );

    const headings: HeadingItem[] = htmlPayload?.headings ?? [];
    const meta = notFound ? null : postMeta;
    const prevPost = meta?.prevPost;
    const nextPost = meta?.nextPost;
    const ready = Boolean(
        (resolvedMeta || notFound) && ((meta && htmlPayload) || notFound),
    );

    if (!ready) {
        return (
            <MainGridLayout categories={categories} tags={tags}>
                <article className="card overflow-hidden px-6 py-6 md:px-9 md:py-8">
                    <div
                        aria-busy
                        aria-live="polite"
                        className="block h-10 w-3/4 rounded-2xl bg-[var(--foreground)]/8"
                        style={{animation: "pulsate 1.6s ease-in-out infinite"}}
                    />
                    <div className="mt-5 flex flex-wrap gap-3">
                        <span
                            className="inline-block h-4 w-24 rounded-full bg-[var(--foreground)]/8"
                            style={{animation: "pulsate 1.6s ease-in-out infinite"}}
                        />
                        <span
                            className="inline-block h-4 w-16 rounded-full bg-[var(--foreground)]/8"
                            style={{animation: "pulsate 1.6s ease-in-out infinite", animationDelay: ".2s"}}
                        />
                        <span
                            className="inline-block h-4 w-20 rounded-full bg-[var(--foreground)]/8"
                            style={{animation: "pulsate 1.6s ease-in-out infinite", animationDelay: ".4s"}}
                        />
                    </div>
                </article>
            </MainGridLayout>
        );
    }

    if (notFound) {
        return (
            <MainGridLayout categories={categories} tags={tags}>
                <section className="card px-6 py-8 text-center">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                        {t("postNotFound")}
                    </h2>
                    <div className="mt-5 flex justify-center gap-3">
                        <Link
                            to="/"
                            className="rounded-full bg-[var(--primary-text)] px-5 py-2 text-sm font-medium text-white dark:bg-[var(--primary)]"
                        >
                            {t("backHome")}
                        </Link>
                        <Link
                            to="/archive"
                            className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-[var(--foreground)] dark:border-white/15"
                        >
                            {t("viewArchive")}
                        </Link>
                    </div>
                </section>
            </MainGridLayout>
        );
    }

    return (
        <MainGridLayout categories={categories} tags={tags} headings={headings}>
            {meta && htmlPayload ? (
                <>
                    <article className="card overflow-hidden px-6 py-6 md:px-9 md:py-8">
                        <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] md:text-[2.25rem]">
                            {meta.title}
                        </h1>

                        <div className="mt-4">
                            <PostMeta
                                published={meta.published}
                                updated={meta.updated}
                                category={meta.category}
                                tags={meta.tags}
                                words={meta.words}
                                readingMinutes={meta.readingMinutes}
                            />
                        </div>

                        {meta.image ? (
                            <div className="mt-8 overflow-hidden rounded-[1.25rem]">
                                <button
                                    type="button"
                                    onClick={() => setCoverLightboxSrc(meta.image!)}
                                    className="group block w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
                                    aria-label={`${meta.title} cover preview`}
                                >
                                    <img
                                        src={meta.image}
                                        alt={meta.title}
                                        width={1200}
                                        height={630}
                                        className="h-auto w-full cursor-zoom-in object-cover transition duration-300 group-hover:scale-[1.01]"
                                        fetchPriority="high"
                                        loading="eager"
                                        decoding="async"
                                    />
                                </button>
                            </div>
                        ) : null}

                        <div className="mt-8">
                            <Markdown html={htmlPayload.html}/>
                        </div>
                    </article>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            {nextPost ? (
                                <Link
                                    to={`/posts/${nextPost.slug}`}
                                    className="card block px-5 py-4 transition hover:border-[var(--primary)]"
                                >
                                    <div className="text-xs text-[var(--muted)]">
                                        {t("prevPost")}
                                    </div>
                                    <div className="mt-1 font-medium text-[var(--foreground)]">
                                        {nextPost.title}
                                    </div>
                                </Link>
                            ) : null}
                        </div>
                        <div>
                            {prevPost ? (
                                <Link
                                    to={`/posts/${prevPost.slug}`}
                                    className="card block px-5 py-4 text-right transition hover:border-[var(--primary)]"
                                >
                                    <div className="text-xs text-[var(--muted)]">
                                        {t("nextPost")}
                                    </div>
                                    <div className="mt-1 font-medium text-[var(--foreground)]">
                                        {prevPost.title}
                                    </div>
                                </Link>
                            ) : null}
                        </div>
                    </div>
                    <Giscus/>
                </>
            ) : null}
            <ImageLightbox
                src={coverLightboxSrc}
                alt={meta?.title || undefined}
                onClose={() => setCoverLightboxSrc(null)}
            />
        </MainGridLayout>
    );
}
