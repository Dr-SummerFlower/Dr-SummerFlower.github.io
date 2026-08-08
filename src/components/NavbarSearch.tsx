import {Link, useNavigate} from "react-router-dom";
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type KeyboardEvent,
} from "react";
import {Icon} from "@iconify/react";
import {withSiteBasePath} from "@/config";
import {t} from "@/i18n";
import type {SearchIndexItem, SearchIndexPayload} from "@/types/search-index";
import {classNames} from "@/utils/common-utils";
import type Fuse from "fuse.js";

type Props = {
    className?: string;
    onPickResult?: () => void;
    autoFocus?: boolean;
};

const MAX_RESULTS = 8;
const BLUR_CLOSE_MS = 180;
const SEARCH_DEBOUNCE_MS = 280;

function buildPostHref(slug: string): string {
    return `/posts/${slug}`;
}

export default function NavbarSearch({
    className,
    onPickResult,
    autoFocus = false,
}: Props) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const reactId = useId();
    const safeId = reactId.replace(/:/g, "");
    const inputId = `navbar-search-q-${safeId}`;
    const listboxId = `navbar-search-lb-${safeId}`;

    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fuseRef = useRef<Fuse<SearchIndexItem> | null>(null);
    const itemsRef = useRef<SearchIndexItem[] | null>(null);

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [status, setStatus] = useState<
        "idle" | "loading" | "ready" | "unavailable"
    >("idle");
    const [candidates, setCandidates] = useState<
        Array<{href: string; title: string; excerpt: string}>
    >([]);

    const clearBlurTimeout = useCallback(() => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
    }, []);

    const clearSearchDebounce = useCallback(() => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
    }, []);

    const ensureSearchIndex = useCallback(async () => {
        if (fuseRef.current && itemsRef.current) {
            return fuseRef.current;
        }
        setStatus("loading");
        try {
            const url = withSiteBasePath("/generated/search-index.json");
            const response = await fetch(url);
            if (!response.ok) {
                setStatus("unavailable");
                return null;
            }
            const payload = (await response.json()) as SearchIndexPayload;
            if (payload.version !== 1 || !Array.isArray(payload.items)) {
                setStatus("unavailable");
                return null;
            }
            itemsRef.current = payload.items;
            const Fuse = (await import("fuse.js")).default;
            fuseRef.current = new Fuse(payload.items, {
                keys: [
                    {name: "title", weight: 0.35},
                    {name: "text", weight: 0.35},
                    {name: "excerpt", weight: 0.2},
                    {name: "tags", weight: 0.1},
                ],
                threshold: 0.32,
                ignoreLocation: true,
                minMatchCharLength: 1,
                includeScore: true,
            });
            setStatus("ready");
            return fuseRef.current;
        } catch {
            setStatus("unavailable");
            return null;
        }
    }, []);

    const runSearchImmediate = useCallback(
        async (term: string) => {
            const trimmed = term.trim();
            if (!trimmed) {
                setCandidates([]);
                setActiveIndex(-1);
                return;
            }

            const fuse = await ensureSearchIndex();
            if (!fuse) {
                setCandidates([]);
                return;
            }

            const hits = fuse.search(trimmed, {limit: MAX_RESULTS});
            const rows = hits.map((hit) => {
                const item = hit.item;
                const excerpt =
                    item.excerpt.trim() ||
                    (item.text.length > 140
                        ? `${item.text.slice(0, 140)}…`
                        : item.text);
                return {
                    href: buildPostHref(item.slug),
                    title: item.title || t("searchUntitled"),
                    excerpt,
                };
            });

            setCandidates(rows);
            setActiveIndex(rows.length > 0 ? 0 : -1);
        },
        [ensureSearchIndex],
    );

    const scheduleSearch = useCallback(
        (term: string) => {
            clearSearchDebounce();
            searchDebounceRef.current = setTimeout(() => {
                void runSearchImmediate(term);
            }, SEARCH_DEBOUNCE_MS);
        },
        [clearSearchDebounce, runSearchImmediate],
    );

    useEffect(() => {
        return () => {
            clearBlurTimeout();
            clearSearchDebounce();
        };
    }, [clearBlurTimeout, clearSearchDebounce]);

    useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus]);

    const handleInput = (value: string) => {
        setQuery(value);
        if (!value.trim()) {
            setCandidates([]);
            setActiveIndex(-1);
            setOpen(false);
            clearSearchDebounce();
            return;
        }
        setOpen(true);
        void ensureSearchIndex();
        scheduleSearch(value);
    };

    const handleFocus = () => {
        void ensureSearchIndex();
        if (query.trim()) {
            setOpen(true);
        }
    };

    const handleBlur = () => {
        blurTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, BLUR_CLOSE_MS);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!open || candidates.length === 0) {
            if (event.key === "Escape") {
                setOpen(false);
            }
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % candidates.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) =>
                current <= 0 ? candidates.length - 1 : current - 1,
            );
        } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
        } else if (event.key === "Enter" && activeIndex >= 0) {
            const picked = candidates[activeIndex];
            if (picked) {
                event.preventDefault();
                setOpen(false);
                setQuery("");
                setCandidates([]);
                navigate(picked.href);
                onPickResult?.();
            }
        }
    };

    const showPanel = open && query.trim().length > 0;
    const showLoading =
        showPanel && status === "loading" && candidates.length === 0;
    const showEmpty =
        showPanel && status === "ready" && candidates.length === 0;
    const showHint = status === "unavailable";

    return (
        <div className={classNames("relative", className)}>
            <div
                className={classNames(
                    "flex w-full min-w-0 items-center gap-2.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/90 px-3.5 py-2 shadow-[0_8px_28px_-20px_rgba(15,23,42,0.28)] backdrop-blur-md dark:shadow-[0_10px_32px_-22px_rgba(2,6,23,0.75)]",
                )}
            >
                <Icon
                    icon="material-symbols:search-rounded"
                    className="h-[1.125rem] w-[1.125rem] shrink-0 text-[var(--primary)] opacity-90"
                    aria-hidden
                />
                <input
                    ref={inputRef}
                    id={inputId}
                    type="search"
                    enterKeyHint="search"
                    inputMode="search"
                    role="combobox"
                    value={query}
                    onChange={(event) => handleInput(event.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={t("searchPlaceholder")}
                    autoComplete="off"
                    aria-label={t("searchLabel")}
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={showPanel}
                    aria-controls={showPanel ? listboxId : undefined}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                />
            </div>

            {showHint ? (
                <p className="mt-2 px-1 text-xs leading-relaxed text-[var(--muted)]">
                    {t("searchUnavailable")}
                </p>
            ) : null}

            {showPanel ? (
                <ul
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-[min(24rem,65vh)] overflow-auto rounded-[1.35rem] border border-[var(--card-border)] bg-[var(--card-bg)]/96 p-1.5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:shadow-[0_18px_55px_-35px_rgba(2,6,23,0.88)]"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        clearBlurTimeout();
                    }}
                >
                    {showLoading ? (
                        <li
                            className="flex items-center gap-2 rounded-xl px-3 py-3.5 text-sm text-[var(--muted)]"
                            role="presentation"
                        >
                            <span
                                className="inline-block h-4 w-4 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--primary)_35%,var(--card-bg))]"
                                aria-hidden
                            />
                            <span className="leading-snug">{t("searchIndexing")}</span>
                        </li>
                    ) : showEmpty ? (
                        <li
                            className="rounded-xl px-3 py-4 text-center text-sm leading-relaxed text-[var(--muted)]"
                            role="presentation"
                        >
                            {t("searchNoResults")}
                        </li>
                    ) : (
                        candidates.map((item, index) => (
                            <li key={`${item.href}-${index}`} role="presentation">
                                <Link
                                    to={item.href}
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    className={classNames(
                                        "group flex gap-3 rounded-xl px-2.5 py-2.5 text-left transition-[background-color,box-shadow] duration-150",
                                        index === activeIndex
                                            ? "bg-[var(--primary-bg)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                                            : "hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)]",
                                    )}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => {
                                        clearBlurTimeout();
                                        setOpen(false);
                                        setQuery("");
                                        setCandidates([]);
                                        onPickResult?.();
                                    }}
                                >
                                    <span
                                        className={classNames(
                                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                                            index === activeIndex
                                                ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary-bg)_100%,transparent)] text-[var(--primary-text)]"
                                                : "border-[var(--line-divider)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-[var(--muted)] group-hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] group-hover:text-[var(--primary-text)]",
                                        )}
                                        aria-hidden
                                    >
                                        <Icon
                                            icon="material-symbols:article-outline-rounded"
                                            className="h-[1.125rem] w-[1.125rem]"
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-2">
                                            <span className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
                                                {item.title}
                                            </span>
                                            <Icon
                                                icon="material-symbols:chevron-right-rounded"
                                                className={classNames(
                                                    "mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)] transition-opacity",
                                                    index === activeIndex
                                                        ? "opacity-70"
                                                        : "opacity-0 group-hover:opacity-55",
                                                )}
                                                aria-hidden
                                            />
                                        </span>
                                        {item.excerpt ? (
                                            <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                                                {item.excerpt}
                                            </span>
                                        ) : null}
                                    </span>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            ) : null}
        </div>
    );
}
