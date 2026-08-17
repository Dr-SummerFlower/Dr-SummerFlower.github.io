import {useEffect, useMemo} from "react";
import {Link} from "react-router-dom";
import {useContentStore} from "@/store/content";
import {useUIStore} from "@/store/ui";
import {formatDateToYYYYMMDD} from "@/utils/date-utils";
import {useDocumentTitle} from "@/utils/seo";
import {t} from "@/i18n";
import type {YearlyArchive} from "@/types/post";

function readInlineArchive(): YearlyArchive[] | null {
    if (typeof document === "undefined") return null;
    const el = document.head.querySelector<HTMLScriptElement>(
        'script[type="application/json"][data-inline-id="yearly-archive"]',
    ) || document.body.querySelector<HTMLScriptElement>(
        'script[type="application/json"][data-inline-id="yearly-archive"]',
    );
    if (!el?.textContent) return null;
    try {
        const raw = JSON.parse(el.textContent) as
            | {kind: "yearly-archive"; value: YearlyArchive[]}
            | YearlyArchive[];
        if (raw && typeof raw === "object" && "kind" in (raw as any) && (raw as any).kind === "yearly-archive") {
            return (raw as any).value;
        }
        return Array.isArray(raw) ? raw : null;
    } catch {
        return null;
    }
}

export default function ArchivePage() {
    const ensureMeta = useContentStore((s) => s.ensureMeta);
    const tryApplyInline = useContentStore((s) => s.tryApplyInline);
    const yearlyArchiveStore = useContentStore((s) => s.yearlyArchive);
    const setLayoutHeadings = useUIStore((s) => s.setLayoutHeadings);

    const inline = useMemo(() => readInlineArchive(), []);

    useEffect(() => {
        setLayoutHeadings([]);
        return () => setLayoutHeadings([]);
    }, [setLayoutHeadings]);

    useEffect(() => {
        tryApplyInline();
        ensureMeta().catch(() => undefined);
    }, [ensureMeta, tryApplyInline]);

    useDocumentTitle(
        t("archive.title"),
        t("archive.metadataDescription"),
        "/archive",
    );

    const yearlyArchive = useMemo(
        () => (yearlyArchiveStore.length > 0 ? yearlyArchiveStore : (inline ?? [])),
        [yearlyArchiveStore, inline],
    );

    const sorted = useMemo(
        () =>
            [...yearlyArchive]
                .map((group) => ({
                    year: group.year,
                    items: [...group.items].sort(
                        (left, right) =>
                            new Date(right.published).getTime() -
                            new Date(left.published).getTime(),
                    ),
                }))
                .sort((left, right) => right.year - left.year),
        [yearlyArchive],
    );

    return (
        <section className="card px-6 py-6 md:px-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {t("archive.title")}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
                {t("archive.description")}
            </p>

            <div className="mt-8 space-y-10">
                {sorted.map((group) => (
                    <section key={group.year}>
                        <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full bg-[var(--primary)] ring-4 ring-black/10 dark:ring-white/20"/>
                            <h2 className="text-xl font-semibold text-[var(--foreground)]">
                                {t("archive.yearTitle", {year: group.year})}
                            </h2>
                            <span className="text-sm text-[var(--muted)]">
                                {t("archive.postCount", {count: group.items.length})}
                            </span>
                        </div>

                        <ul className="mt-5 ml-1 border-l border-black/10 pl-5 dark:border-white/10">
                            {group.items.map((post) => (
                                <li
                                    key={post.slug}
                                    className="relative pb-4 last:pb-0"
                                >
                                    <span className="absolute top-5 -left-[1.65rem] h-2.5 w-2.5 rounded-full border border-[var(--primary)] bg-[var(--background)]"/>
                                    <Link
                                        to={`/posts/${post.slug}`}
                                        className="flex flex-col gap-2 rounded-2xl border border-black/8 px-4 py-3 transition hover:border-[var(--primary)] hover:bg-black/4 dark:border-white/8 dark:hover:bg-white/6 md:flex-row md:items-center md:justify-between"
                                    >
                                        <span className="font-medium text-[var(--foreground)]">
                                            {post.title}
                                        </span>
                                        <time
                                            dateTime={post.published}
                                            className="text-sm text-[var(--muted)]"
                                        >
                                            {formatDateToYYYYMMDD(post.published)}
                                        </time>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </section>
    );
}
