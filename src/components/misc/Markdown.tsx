import {useCallback, useEffect, useRef, useState} from "react";
import ImageLightbox from "@/components/ImageLightbox";

type Props = {
    html: string;
};

type GithubCached = {
    avatarUrl: string;
    description: string;
    language: string;
    stars: string;
    forks: string;
    license: string;
    ttl: number;
};

const GITHUB_CACHE_TTL = 10 * 60 * 1000;
const githubRepoCache = new Map<string, GithubCached>();

function formatCompact(num: number): string {
    try {
        const f = new Intl.NumberFormat("en-us", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(num);
        return f.replaceAll("\u202f", "");
    } catch {
        return String(num);
    }
}

function fillSlot(
    container: HTMLElement,
    slot: string,
    text?: string,
    style?: Partial<CSSStyleDeclaration>,
): void {
    const el = container.querySelector<HTMLElement>(`[data-gc-slot="${slot}"]`);
    if (!el) return;
    if (text !== undefined) {
        el.innerText = text;
    }
    if (style) {
        Object.assign(el.style, style);
    }
}

function setError(container: HTMLElement, reason: string): void {
    container.classList.remove("fetch-waiting");
    container.classList.add("fetch-error");
    fillSlot(container, "description", reason);
}

function applyCached(container: HTMLElement, cached: GithubCached): void {
    fillSlot(container, "avatar", undefined, {
        backgroundImage: `url(${cached.avatarUrl})`,
    });
    fillSlot(container, "description", cached.description);
    fillSlot(container, "language", cached.language);
    fillSlot(container, "stars", cached.stars);
    fillSlot(container, "forks", cached.forks);
    fillSlot(container, "license", cached.license);
    container.classList.remove("fetch-waiting");
}

async function fetchGithubRepo(
    repo: string,
    signal?: AbortSignal,
): Promise<{cached: GithubCached; rateLimited?: boolean}> {
    const candidates = [
        `https://api.github.com/repos/${repo}`,
        `https://ghproxy.summerflower.top/https://api.github.com/repos/${repo}`,
    ];
    let lastErr: unknown = null;
    for (const url of candidates) {
        if (signal?.aborted) {
            return Promise.reject(new DOMException("Aborted", "AbortError"));
        }
        try {
            const res = await fetch(url, {
                signal,
                referrerPolicy: "no-referrer",
                headers: {
                    Accept: "application/vnd.github+json",
                },
            });
            if (res.status === 403) {
                const remaining = res.headers.get("X-RateLimit-Remaining");
                if (remaining === "0" || remaining == null) {
                    lastErr = new Error("rate-limited");
                    continue;
                }
            }
            if (!res.ok) {
                lastErr = new Error(`status-${res.status}`);
                continue;
            }
            const data = (await res.json()) as {
                description?: string | null;
                language?: string | null;
                stargazers_count?: number;
                forks_count?: number;
                license?: {spdx_id?: string | null} | null;
                owner?: {avatar_url?: string | null} | null;
            };
            const cached: GithubCached = {
                avatarUrl: data.owner?.avatar_url ?? "",
                description:
                    (data.description ?? "").trim() || "This repository has no description.",
                language: (data.language ?? "").trim() || "Unknown",
                stars: formatCompact(data.stargazers_count ?? 0),
                forks: formatCompact(data.forks_count ?? 0),
                license: data.license?.spdx_id?.trim()
                    ? data.license.spdx_id.trim()
                    : "no-license",
                ttl: Date.now() + GITHUB_CACHE_TTL,
            };
            githubRepoCache.set(repo, cached);
            return {cached};
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                return Promise.reject(err);
            }
            lastErr = err;
        }
    }
    return Promise.reject(lastErr ?? new Error("unknown"));
}

function isAbortError(err: unknown): err is DOMException {
    return err instanceof DOMException && err.name === "AbortError";
}

async function hydrateGithubCard(
    container: HTMLAnchorElement,
    signal?: AbortSignal,
): Promise<void> {
    const repo = container.dataset.githubCard;
    if (!repo) return;

    const cached = githubRepoCache.get(repo);
    if (cached && cached.ttl > Date.now()) {
        if (!container.isConnected || signal?.aborted) return;
        applyCached(container, cached);
        return;
    }

    try {
        const {cached: fresh} = await fetchGithubRepo(repo, signal);
        if (!container.isConnected || signal?.aborted) return;
        applyCached(container, fresh);
    } catch (err) {
        if (isAbortError(err)) return;
        if (!container.isConnected || signal?.aborted) return;
        const msg = err instanceof Error ? err.message : "unknown";
        if (msg === "rate-limited") {
            setError(container, "GitHub API 限流，约 1 小时后自动恢复");
        } else {
            setError(container, "加载失败，请稍后重试");
        }
    }
}

export default function Markdown({html}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxAlt, setLightboxAlt] = useState<string | undefined>(undefined);

    const handleImgClick = useCallback((e: Event) => {
        const target = e.target as HTMLElement | null;
        if (!target || target.tagName !== "IMG") return;
        const img = target as HTMLImageElement;
        if (!img.currentSrc && !img.src) return;
        const parent = img.parentElement;
        if (parent && parent.tagName === "A") return;
        e.preventDefault();
        setLightboxSrc(img.currentSrc || img.src);
        setLightboxAlt(img.alt || undefined);
    }, []);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;
        root.addEventListener("click", handleImgClick, {passive: false});
        const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
        for (const img of imgs) {
            img.style.cursor = "zoom-in";
            img.style.transition = "transform .25s ease";
        }
        return () => {
            root.removeEventListener("click", handleImgClick);
        };
    }, [html, handleImgClick]);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;
        const cards = Array.from(
            root.querySelectorAll<HTMLAnchorElement>("a[data-github-card]"),
        );
        if (cards.length === 0) return;

        const controller = new AbortController();
        let detached = false;
        const signal = controller.signal;

        const tasks = cards.map((card) => hydrateGithubCard(card, signal));

        void Promise.allSettled(tasks).then((results) => {
            if (detached || process.env.NODE_ENV !== "development") return;
            const rejected = results.filter(
                (r) => r.status === "rejected" && !isAbortError(r.reason),
            ).length;
            if (rejected > 0) {
                console.warn(`[Markdown] ${rejected} GitHub cards failed to hydrate`);
            }
        });

        return () => {
            detached = true;
            controller.abort();
        };
    }, [html]);

    return (
        <>
            <div
                ref={containerRef}
                className="custom-md prose prose-zinc max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{__html: html}}
            />
            <ImageLightbox
                src={lightboxSrc}
                alt={lightboxAlt}
                onClose={() => setLightboxSrc(null)}
            />
        </>
    );
}
