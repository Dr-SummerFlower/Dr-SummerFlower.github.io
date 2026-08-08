import {useEffect, useMemo, useState} from "react";
import type {HeadingItem} from "@/types/post";
import {classNames} from "@/utils/common-utils";
import {buildNumberedTocHeadings} from "@/utils/toc-utils";
import {t} from "@/i18n";

type Props = {
    headings: HeadingItem[];
    maxDepth?: number;
};

export default function TOC({headings, maxDepth = 3}: Props) {
    const filteredHeadings = useMemo(
        () => buildNumberedTocHeadings(headings, maxDepth),
        [headings, maxDepth],
    );

    const [activeId, setActiveId] = useState<string>("");

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

    if (filteredHeadings.length === 0) {
        return null;
    }

    const linkClassName = (slug: string) =>
        classNames(
            "flex min-h-11 items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition active:scale-[0.99]",
            slug === activeId
                ? "bg-[var(--primary-bg)] text-[var(--primary-text)]"
                : "text-[color-mix(in_srgb,var(--foreground)_82%,var(--primary)_18%)] hover:bg-[var(--primary-bg)] hover:text-[var(--primary-text)]",
        );

    return (
        <nav
            aria-label={t("tocAriaLabel")}
            className="main-feed-layout__toc card sticky top-[calc(var(--nav-offset)+0.5rem)] hidden max-h-[calc(100vh-var(--nav-offset)-1rem)] overflow-y-auto p-4 xl:block"
        >
            <div className="mb-3 text-sm font-semibold tracking-wide text-[var(--primary-text)]">
                {t("tocTitle")}
            </div>
            <div className="space-y-1">
                {filteredHeadings.map((heading) => (
                    <a
                        key={heading.slug}
                        href={`#${heading.slug}`}
                        className={linkClassName(heading.slug)}
                        style={{
                            paddingLeft: `${0.75 + heading.level}rem`,
                        }}
                    >
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--primary-bg)] text-[11px] font-bold text-[var(--primary-text)]">
                            {heading.marker}
                        </span>
                        <span>{heading.text}</span>
                    </a>
                ))}
            </div>
        </nav>
    );
}
