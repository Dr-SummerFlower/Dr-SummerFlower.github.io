import {Link} from "react-router-dom";
import {profileConfig} from "@/lib/config/derived.config.ts";
import {withSiteBasePath} from "@/lib/config/helpers/url.ts";
import {Icon} from "@iconify/react";
import {t} from "@/i18n";
import {classNames} from "@/utils/common-utils";
import type {CountItem} from "@/types/post";
import type {SocialLink} from "@/types/config";

type Props = {
    categories: CountItem[];
    tags: CountItem[];
    className?: string;
};

function searchUrl(baseName: "category" | "tag", value: string) {
    return {
        pathname: "/",
        search: `?${baseName}=${encodeURIComponent(value)}`,
    };
}

export default function SideBar({categories, tags, className}: Props) {
    return (
        <aside
            className={classNames(
                "w-full space-y-3 sm:space-y-4 lg:max-w-[18rem]",
                className,
            )}
        >
            <section className="card p-4 max-lg:py-3.5">
                <div
                    className="flex flex-col items-center max-lg:flex-row max-lg:items-start max-lg:gap-4 max-lg:text-left lg:text-center"
                >
                    <div
                        className="mx-auto mb-4 h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 max-lg:mx-0 max-lg:mb-0 max-lg:h-16 max-lg:w-16 max-lg:rounded-xl"
                    >
                        <img
                            src={withSiteBasePath(profileConfig.avatar)}
                            alt={profileConfig.name}
                            width={112}
                            height={112}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                        <h2 className="text-center text-xl font-bold text-[var(--foreground)] max-lg:text-left max-lg:text-lg">
                            {profileConfig.name}
                        </h2>
                        <div className="mx-auto h-1 w-5 rounded-full bg-[var(--primary)] max-lg:mx-0"/>
                        <p className="mt-3 text-center text-sm text-[var(--muted)] max-lg:mt-0 max-lg:text-left max-lg:leading-relaxed max-lg:line-clamp-3 lg:mt-3">
                            {profileConfig.bio}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 max-lg:mt-3 max-lg:justify-start">
                            {profileConfig.links.map((link: SocialLink) => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={link.name}
                                    title={link.name}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[var(--primary-text)] transition active:scale-[0.97] hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-white/10 max-lg:h-9 max-lg:w-9"
                                >
                                    {link.icon ? (
                                        <Icon
                                            icon={link.icon}
                                            className="h-4 w-4 text-[var(--primary-text)]"
                                        />
                                    ) : null}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="hidden space-y-4 lg:sticky lg:top-[calc(var(--nav-offset)+0.5rem)] lg:block lg:max-h-[calc(100vh-var(--nav-offset)-1rem)] lg:overflow-y-auto">
                <section className="card overflow-hidden p-4">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-[var(--foreground)]">
                        {t("sidebar.categoryTitle")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <Link
                                key={category.name}
                                to={searchUrl("category", category.name)}
                                className="rounded-full bg-[var(--primary-bg)] px-3 py-1.5 text-xs text-[var(--primary-text)] transition hover:text-[var(--primary)] dark:text-[var(--primary-text)]"
                            >
                                {category.name} · {category.count}
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="card overflow-hidden p-4">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-[var(--foreground)]">
                        {t("sidebar.tagTitle")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Link
                                key={tag.name}
                                to={searchUrl("tag", tag.name)}
                                className="rounded-full bg-[var(--primary-bg)] px-3 py-1.5 text-xs text-[var(--primary-text)] transition hover:text-[var(--primary)] dark:text-[var(--primary-text)]"
                            >
                                {tag.name} · {tag.count}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>

            <details className="group card overflow-hidden lg:hidden">
                <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-[var(--foreground)] transition marker:content-none [&::-webkit-details-marker]:hidden active:bg-black/[0.03] dark:active:bg-white/[0.04]"
                >
                    <span>{t("sidebar.mobileFiltersSummary")}</span>
                    <Icon
                        icon="material-symbols:expand-more-rounded"
                        className="h-5 w-5 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180"
                    />
                </summary>
                <div className="space-y-4 border-t border-black/10 px-4 py-4 dark:border-white/10">
                    <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                            {t("sidebar.categoryTitle")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <Link
                                    key={`m-${category.name}`}
                                    to={searchUrl("category", category.name)}
                                    className="rounded-full bg-[var(--primary-bg)] px-3 py-1.5 text-xs text-[var(--primary-text)] transition active:scale-[0.98] hover:text-[var(--primary)] dark:text-[var(--primary-text)]"
                                >
                                    {category.name} · {category.count}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                            {t("sidebar.tagTitle")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Link
                                    key={`m-${tag.name}`}
                                    to={searchUrl("tag", tag.name)}
                                    className="rounded-full bg-[var(--primary-bg)] px-3 py-1.5 text-xs text-[var(--primary-text)] transition active:scale-[0.98] hover:text-[var(--primary)] dark:text-[var(--primary-text)]"
                                >
                                    {tag.name} · {tag.count}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </details>
        </aside>
    );
}
