import {Link} from "react-router-dom";
import {formatDateToYYYYMMDD} from "@/utils/date-utils";
import {normalizeCategory} from "@/utils/common-utils";
import {Icon} from "@iconify/react";
import {t} from "@/i18n";

type Props = {
    published: string | Date;
    updated?: string | Date;
    category?: string | null;
    tags?: string[];
    words?: number;
    readingMinutes?: number;
};

const iconClass = "h-4 w-4 shrink-0 text-[var(--primary-text)]";

function toDate(d: string | Date | undefined): Date | null {
    if (d === undefined || d === null) return null;
    return d instanceof Date ? d : new Date(d);
}

export default function PostMeta({
    published,
    updated,
    category,
    tags = [],
    words,
    readingMinutes,
}: Props) {
    const categoryLabel = normalizeCategory(category);
    const trimmedTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const pubDate = toDate(published);
    const updDate = toDate(updated);
    const showUpdated =
        pubDate && updDate && updDate.getTime() !== pubDate.getTime();

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                    <Icon
                        icon="material-symbols:calendar-month-outline-rounded"
                        className={iconClass}
                    />
                    <span>{formatDateToYYYYMMDD(published)}</span>
                </span>
                {showUpdated ? (
                    <span className="inline-flex items-center gap-1.5">
                        <Icon icon="material-symbols:update-rounded" className={iconClass}/>
                        <span>
                            {t("common.updatedAt")} {formatDateToYYYYMMDD(updated!)}
                        </span>
                    </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                    <Icon icon="material-symbols:folder-outline-rounded" className={iconClass}/>
                    <Link
                        to={{
                            pathname: "/",
                            search: `?category=${encodeURIComponent(categoryLabel)}`,
                        }}
                        className="text-[var(--primary-text)] transition hover:text-[var(--primary)]"
                    >
                        {categoryLabel}
                    </Link>
                </span>
                {typeof words === "number" ? (
                    <span className="inline-flex items-center gap-1.5">
                        <Icon icon="material-symbols:text-fields-rounded" className={iconClass}/>
                        <span>
                            {words} {t("common.words")}
                        </span>
                    </span>
                ) : null}
                {typeof readingMinutes === "number" ? (
                    <span className="inline-flex items-center gap-1.5">
                        <Icon icon="material-symbols:schedule-rounded" className={iconClass}/>
                        <span>
                            {readingMinutes} {t("common.minutes")}
                        </span>
                    </span>
                ) : null}
            </div>
            {trimmedTags.length > 0 ? (
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                    <span className="inline-flex items-start gap-1.5">
                        <Icon
                            icon="material-symbols:tag-outline-rounded"
                            className={`${iconClass} mt-0.5`}
                        />
                        <span className="flex flex-wrap gap-1.5">
                            {trimmedTags.map((tag) => (
                                <Link
                                    key={tag}
                                    to={{
                                        pathname: "/",
                                        search: `?tag=${encodeURIComponent(tag)}`,
                                    }}
                                    className="rounded-full bg-[var(--primary-bg)] px-2.5 py-0.5 text-xs text-[var(--primary-text)] transition hover:text-[var(--primary)]"
                                >
                                    {tag}
                                </Link>
                            ))}
                        </span>
                    </span>
                </div>
            ) : null}
        </div>
    );
}
