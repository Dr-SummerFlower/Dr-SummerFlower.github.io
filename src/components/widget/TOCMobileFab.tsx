import {useEffect, useMemo, useState} from "react";
import Icon from "../Icon";
import type {HeadingItem} from "@/types/post";
import {classNames} from "@/utils/common-utils";
import {buildNumberedTocHeadings} from "@/utils/toc-utils";
import {t} from "@/i18n";

type Props = {
    headings: HeadingItem[];
    maxDepth?: number;
};

export default function TOCMobileFab({headings, maxDepth = 3}: Props) {
    const filteredHeadings = useMemo(
        () => buildNumberedTocHeadings(headings, maxDepth),
        [headings, maxDepth],
    );

    const [activeId, setActiveId] = useState<string>("");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (filteredHeadings.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (left, right) =>
                            right.intersectionRatio - left.intersectionRatio ||
                            left.boundingClientRect.top - right.boundingClientRect.top,
                    );

                if (visible[0]?.target.id) {
                    setActiveId(visible[0].target.id);
                }
            },
            {rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1]},
        );

        for (const heading of filteredHeadings) {
            const element = document.getElementById(heading.slug);
            if (element) {
                observer.observe(element);
            }
        }

        return () => observer.disconnect();
    }, [filteredHeadings]);

    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileOpen]);

    if (filteredHeadings.length === 0) {
        return null;
    }

    const linkClassName = (slug: string) =>
        classNames(
            "flex min-h-11 items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition active:scale-[0.99] max-xl:min-h-12 max-xl:py-3",
            slug === activeId
                ? "bg-[var(--primary-bg)] text-[var(--primary-text)]"
                : "text-[color-mix(in_srgb,var(--foreground)_82%,var(--primary)_18%)] hover:bg-[var(--primary-bg)] hover:text-[var(--primary-text)]",
        );

    return (
        <>
            <button
                type="button"
                aria-label={t("tocTitle")}
                aria-expanded={mobileOpen}
                aria-controls="mobile-toc-panel"
                onClick={() => setMobileOpen((open) => !open)}
                className={classNames(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[var(--card-bg)] text-[var(--primary-text)] shadow-[0_12px_30px_-20px_rgba(15,23,42,0.7)] backdrop-blur transition active:scale-[0.97]",
                )}
            >
                <Icon
                    name="material-symbols:format-list-numbered-rounded"
                    className="h-6 w-6"
                    aria-hidden
                />
            </button>

            {mobileOpen ? (
                <>
                    <button
                        type="button"
                        aria-label={t("closeMenu")}
                        className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-[2px] transition"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div
                        id="mobile-toc-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t("tocAriaLabel")}
                        className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(78vh,32rem)] flex-col rounded-t-[1.35rem] border border-black/10 bg-[var(--float-panel-bg)] shadow-[0_-8px_40px_-12px_rgba(15,23,42,0.45)] dark:border-white/10"
                        style={{
                            paddingBottom:
                                "max(0.75rem, env(safe-area-inset-bottom, 0px))",
                        }}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
                            <div className="text-sm font-semibold text-[var(--primary-text)]">
                                {t("tocTitle")}
                            </div>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="btn-plain inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                                aria-label={t("closeMenu")}
                            >
                                <Icon
                                    name="material-symbols:close-rounded"
                                    className="h-5 w-5"
                                />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
                            <div className="space-y-0.5 pb-2">
                                {filteredHeadings.map((heading) => (
                                    <a
                                        key={`m-${heading.slug}`}
                                        href={`#${heading.slug}`}
                                        className={linkClassName(heading.slug)}
                                        style={{
                                            paddingLeft: `${0.75 + heading.level}rem`,
                                        }}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--primary-bg)] text-[11px] font-bold text-[var(--primary-text)]">
                                            {heading.marker}
                                        </span>
                                        <span>{heading.text}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </>
    );
}
