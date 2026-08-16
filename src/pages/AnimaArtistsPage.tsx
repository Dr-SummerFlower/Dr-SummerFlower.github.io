import {useCallback, useEffect, useMemo, useState} from "react";
import {useContentStore} from "@/store/content";
import MainGridLayout from "@/layouts/MainGridLayout";
import {useDocumentTitle} from "@/utils/seo";
import {t} from "@/i18n";
import {withSiteBasePath} from "@/config";
import {Icon} from "@iconify/react";
import ImageLightbox from "@/components/ImageLightbox";
import AnimaInfoModal from "@/components/AnimaInfoModal";
import {classNames} from "@/utils/common-utils";

type ArtistEntry = {
    name: string;
    uniqueness_score: number;
    files: string[];
};

type ArtistIndex = Record<string, ArtistEntry>;

const ARTIST_INDEX_PATH = "/anima-artists/index.json";

export default function AnimaArtistsPage() {
    const categories = useContentStore((s) => s.categories);
    const tags = useContentStore((s) => s.tags);

    const [index, setIndex] = useState<ArtistIndex | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);

    useDocumentTitle(t("animaArtists.title"), t("animaArtists.description"), "/anima-artists");

    useEffect(() => {
        let cancelled = false;
        fetch(withSiteBasePath(ARTIST_INDEX_PATH), {cache: "no-cache"})
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json() as Promise<ArtistIndex>;
            })
            .then((data) => {
                if (!cancelled) setIndex(data);
            })
            .catch(() => {
                if (!cancelled) setLoadError(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const artists = useMemo(() => {
        if (!index) return [];
        return Object.entries(index)
            .map(([id, entry]) => ({id, ...entry}))
            .sort((a, b) => b.uniqueness_score - a.uniqueness_score);
    }, [index]);

    const handleCopy = useCallback(async (id: string, name: string) => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(name);
            } else {
                const ta = document.createElement("textarea");
                ta.value = name;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopiedId(id);
            setTimeout(() => {
                setCopiedId((cur) => (cur === id ? null : cur));
            }, 1400);
        } catch {
            setCopiedId(null);
        }
    }, []);

    return (
        <MainGridLayout categories={categories} tags={tags}>
            <section className="card px-5 py-6 md:px-9 md:py-8">
                <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                            {t("animaArtists.title")}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {t("animaArtists.subtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setInfoOpen(true)}
                        className="btn-regular inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
                    >
                        <Icon
                            icon="material-symbols:info-outline-rounded"
                            className="h-4.5 w-4.5"
                        />
                        生成说明 & 工作流
                    </button>
                </header>

                {loadError ? (
                    <div className="rounded-2xl border border-dashed border-[var(--line-divider)] px-6 py-10 text-center text-sm text-[var(--muted)]">
                        {t("animaArtists.loadFailed")}
                    </div>
                ) : null}

                {!index && !loadError ? (
                    <div
                        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                        aria-busy="true"
                        aria-label={t("search.indexing")}
                    >
                        {Array.from({length: 6}).map((_, i) => (
                            <div
                                key={i}
                                className="overflow-hidden rounded-[1.35rem] border border-[var(--card-border)] bg-[var(--card-bg)]/60"
                            >
                                <div className="grid grid-cols-2 gap-0.5 bg-[var(--line-divider)]/60">
                                    {Array.from({length: 4}).map((_, j) => (
                                        <div
                                            key={j}
                                            className="aspect-square animate-pulse bg-[var(--card-bg)]"
                                        />
                                    ))}
                                </div>
                                <div className="space-y-3 p-4">
                                    <div className="h-5 w-2/3 animate-pulse rounded-md bg-[var(--btn-regular-bg)]"/>
                                    <div className="h-4 w-1/3 animate-pulse rounded-md bg-[var(--btn-regular-bg)]"/>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {artists.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {artists.map((artist) => {
                            const copied = copiedId === artist.id;
                            return (
                                <article
                                    key={artist.id}
                                    className="card overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                                >
                                    <div
                                        className="grid grid-cols-2 gap-0.5 bg-[var(--line-divider)]/50"
                                        role="group"
                                        aria-label={`${artist.name} preview`}
                                    >
                                        {artist.files.slice(0, 4).map((file, i) => {
                                            const src = withSiteBasePath(`/anima-artists/${file}`);
                                            return (
                                                <button
                                                    key={file}
                                                    type="button"
                                                    onClick={() => setLightboxSrc(src)}
                                                    className={classNames(
                                                        "group relative block aspect-square overflow-hidden bg-[var(--card-bg)] outline-none transition",
                                                        "focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60",
                                                    )}
                                                    aria-label={`${artist.name} preview ${i + 1}`}
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`${artist.name} ${i + 1}`}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                                                    />
                                                    <div
                                                        className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/8"
                                                        aria-hidden
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-start justify-between gap-3 p-4">
                                        <div className="min-w-0 flex-1">
                                            <h2
                                                className="truncate text-lg font-semibold leading-6 text-[var(--foreground)]"
                                                title={artist.name}
                                            >
                                                {artist.name}
                                            </h2>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                                                <Icon
                                                    icon="material-symbols:tag-outline-rounded"
                                                    className="h-4 w-4"
                                                />
                                                <span>
                                                    {t("animaArtists.uniqueness")}
                                                    <span className="ml-1 font-semibold text-[var(--primary-text)]">
                                                        {artist.uniqueness_score.toFixed(2)}
                                                    </span>
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(artist.id, artist.name)}
                                            title={
                                                copied
                                                    ? t("animaArtists.copied")
                                                    : t("animaArtists.copyName")
                                            }
                                            aria-label={
                                                copied
                                                    ? t("animaArtists.copied")
                                                    : t("animaArtists.copyName")
                                            }
                                            className={classNames(
                                                "btn-regular shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-all",
                                                copied &&
                                                    "bg-emerald-500/90 text-white hover:bg-emerald-500/90 dark:bg-emerald-400/90 dark:text-slate-950 dark:hover:bg-emerald-400/90",
                                            )}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                <Icon
                                                    icon={
                                                        copied
                                                            ? "material-symbols:check-rounded"
                                                            : "material-symbols:content-copy-outline-rounded"
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <span>
                                                    {copied
                                                        ? t("animaArtists.copied")
                                                        : t("animaArtists.copy")}
                                                </span>
                                            </span>
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : null}
            </section>

            <ImageLightbox
                src={lightboxSrc}
                alt={t("animaArtists.preview")}
                onClose={() => setLightboxSrc(null)}
            />
            <AnimaInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
        </MainGridLayout>
    );
}
