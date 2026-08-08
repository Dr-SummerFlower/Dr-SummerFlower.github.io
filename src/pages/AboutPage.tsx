import {useEffect, useMemo, useState} from "react";
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

export default function AboutPage() {
    const ensureMeta = useContentStore((s) => s.ensureMeta);
    const getCustomPageHtml = useContentStore((s) => s.getCustomPageHtml);
    const tryApplyInline = useContentStore((s) => s.tryApplyInline);
    const categories = useContentStore((s) => s.categories);
    const tags = useContentStore((s) => s.tags);

    const inline = useMemo(() => readInlineCustomPage("about"), []);
    const [page, setPage] = useState<CustomPageContent | null>(inline?.payload ?? null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        tryApplyInline();
    }, [tryApplyInline]);

    useEffect(() => {
        if (inline?.payload) return;
        let cancelled = false;
        ensureMeta()
            .then(() => getCustomPageHtml("about"))
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
        };
    }, [ensureMeta, getCustomPageHtml, inline]);

    useDocumentTitle(
        notFound ? t("customPageNotFound") : t("aboutTitle"),
        t("aboutDescription"),
        "/about",
    );

    const headings: HeadingItem[] = page?.headings ?? [];

    if (notFound) {
        return (
            <MainGridLayout categories={categories} tags={tags}>
                <section className="card px-6 py-8 text-center text-sm text-[var(--muted)]">
                    {t("customPageNotFound")}
                </section>
            </MainGridLayout>
        );
    }

    return (
        <MainGridLayout categories={categories} tags={tags} headings={headings}>
            <section className="card px-6 py-6 md:px-9">
                {page ? <Markdown html={page.html}/> : null}
            </section>
        </MainGridLayout>
    );
}
