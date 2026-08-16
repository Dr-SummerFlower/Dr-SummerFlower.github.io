import {Link, useSearchParams, useNavigate, useLocation} from "react-router-dom";
import { useEffect, useMemo } from "react";
import PostCard from "./PostCard";
import { t } from "@/i18n";
import type { BlogPostMeta } from "@/types/post";
import { normalizeCategory } from "@/utils/common-utils";

type Props = {
    posts: BlogPostMeta[];
};

export default function HomePostList({ posts }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const rawCategory = searchParams.get("category") ?? "";
    const rawTag = searchParams.get("tag") ?? "";

    const categoryCandidates = useMemo(
        () =>
            Array.from(
                new Set(
                    posts
                        .map((post) => normalizeCategory(post.category))
                        .filter(Boolean),
                ),
            ),
        [posts],
    );
    const tagCandidates = useMemo(
        () =>
            Array.from(new Set(posts.flatMap((post) => post.tags).filter(Boolean))),
        [posts],
    );

    const activeCategory = useMemo(() => {
        const normalized = rawCategory.trim().toLowerCase();
        if (!normalized) {
            return "";
        }
        return (
            categoryCandidates.find(
                (candidate) =>
                    candidate.trim().toLowerCase() === normalized,
            ) ?? ""
        );
    }, [rawCategory, categoryCandidates]);

    const activeTag = useMemo(() => {
        const normalized = rawTag.trim().toLowerCase();
        if (!normalized) {
            return "";
        }
        return (
            tagCandidates.find(
                (candidate) => candidate.trim().toLowerCase() === normalized,
            ) ?? ""
        );
    }, [rawTag, tagCandidates]);

    const filteredPosts = useMemo(
        () =>
            posts.filter((post) => {
                const matchesCategory = activeCategory
                    ? normalizeCategory(post.category) === activeCategory
                    : true;
                const matchesTag = activeTag ? post.tags.includes(activeTag) : true;
                return matchesCategory && matchesTag;
            }),
        [posts, activeCategory, activeTag],
    );

    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (searchParams.has("category")) {
            if (activeCategory) {
                if (nextParams.get("category") !== activeCategory) {
                    nextParams.set("category", activeCategory);
                    changed = true;
                }
            } else {
                nextParams.delete("category");
                changed = true;
            }
        }

        if (searchParams.has("tag")) {
            if (activeTag) {
                if (nextParams.get("tag") !== activeTag) {
                    nextParams.set("tag", activeTag);
                    changed = true;
                }
            } else {
                nextParams.delete("tag");
                changed = true;
            }
        }

        if (!changed) {
            return;
        }

        const query = nextParams.toString();
        navigate(query ? `${location.pathname}?${query}` : location.pathname, {
            replace: true,
        });
        void setSearchParams;
    }, [
        activeCategory,
        activeTag,
        location.pathname,
        navigate,
        searchParams,
        setSearchParams,
    ]);

    return (
        <div className="space-y-4">
            {activeCategory || activeTag ? (
                <section className="card px-6 py-4 text-sm text-[var(--muted)]">
                    {t("home.currentFilter")}
                    {activeCategory ? (
                        <span className="ml-2 rounded-full bg-[var(--primary-bg)] px-3 py-1 text-xs text-[var(--primary-text)]">
                            {t("home.filterCategory", { category: activeCategory })}
                        </span>
                    ) : null}
                    {activeTag ? (
                        <span className="ml-2 rounded-full bg-[var(--primary-bg)] px-3 py-1 text-xs text-[var(--primary-text)]">
                            {t("home.filterTag", { tag: activeTag })}
                        </span>
                    ) : null}
                    <Link
                        to="/"
                        className="ml-3 text-xs underline decoration-dotted underline-offset-4 hover:text-[var(--primary)]"
                    >
                        {t("home.clearFilter")}
                    </Link>
                </section>
            ) : null}
            {filteredPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
            ))}
            {filteredPosts.length === 0 ? (
                <section className="card px-6 py-8 text-center text-sm text-[var(--muted)]">
                    {t("home.noFilteredPosts")}
                </section>
            ) : null}
        </div>
    );
}
