import {useEffect, useMemo, useState} from "react";
import {useParams, Navigate} from "react-router-dom";
import {useContentStore} from "@/store/content";
import MainGridLayout from "@/layouts/MainGridLayout";
import Markdown from "@/components/misc/Markdown";
import {useDocumentTitle} from "@/utils/seo";
import {t} from "@/i18n";
import type {CustomPageContent, HeadingItem} from "@/types/post";

type InlinePage = {
    payload: CustomPageContent;
    meta?: {slug: string; title: string; description: string};
};

function readInlineCustomPage(slug: string): InlinePage | null {
    if (typeof document === "undefined") return null;
    const id = `custom-page:${slug}`;
    const el = document.head.querySelector<HTMLScriptElement>(
        `script[type="application/json"][data-inline-id="${id}"]`,
    ) || document.body.querySelector<HTMLScriptElement>(
        `script[type="application/json"][data-inline-id="${id}"]`,
    );
    if (!el?.textContent) return null;
    try {
        const raw = JSON.parse(el.textContent) as
            | {kind: "custom-page"; value: InlinePage}
            | InlinePage;
        if (raw && typeof raw === "object" && "kind" in (raw as any) && (raw as any).kind === "custom-page") {
            return (raw as any).value;
        }
        if (raw && typeof raw === "object" && "payload" in (raw as any)) return raw as InlinePage;
        return null;
    } catch {
        return null;
    }
}

export default function CustomPage() {
    const {slug = ""} = useParams();
    const ensureMeta = useContentStore((s) => s.ensureMeta);
    const getCustomPageHtml = useContentStore((s) => s.getCustomPageHtml);
    const tryApplyInline = useContentStore((s) => s.tryApplyInline);
    const categories = useContentStore((s) => s.categories);
    const tags = useContentStore((s) => s.tags);

    const inline = useMemo(() => (slug ? readInlineCustomPage(slug) : null), [slug]);

    const [page, setPage] = useState<CustomPageContent | null>(inline?.payload ?? null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        tryApplyInline();
    }, [tryApplyInline]);

    useEffect(() => {
        if (slug === "about") {
            return;
        }
        if (inline?.payload) return;
        let cancelled = false;
        ensureMeta()
            .then(() => getCustomPageHtml(slug))
            .then((payload) => {
                if (cancelled) return;
                if (!payload) {
                    setNotFound(true);
                    return;
                }
                setPage(payload);
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            });
        return () => {
            cancelled = true;
            setPage(inline?.payload ?? null);
            setNotFound(false);
        };
    }, [ensureMeta, getCustomPageHtml, inline, slug]);

    useDocumentTitle(
        notFound ? t("error.customPageNotFound") : page?.title,
        page?.description,
        `/pages/${slug}`,
    );

    if (slug === "about") {
        return <Navigate to="/about" replace/>;
    }

    const headings: HeadingItem[] = page?.headings ?? [];

    if (notFound) {
        return (
            <MainGridLayout categories={categories} tags={tags}>
                <section className="card px-6 py-8 text-center text-sm text-[var(--muted)]">
                    {t("error.customPageNotFound")}
                </section>
            </MainGridLayout>
        );
    }

    return (
        <MainGridLayout categories={categories} tags={tags} headings={headings}>
            <section className="card px-6 py-6 md:px-9">
                {page ? (
                    <>
                        <h1 className="mb-6 text-3xl font-bold text-[var(--foreground)]">
                            {page.title}
                        </h1>
                        <Markdown html={page.html}/>
                    </>
                ) : null}
            </section>
        </MainGridLayout>
    );
}
