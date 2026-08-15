export const META_FILES = [
    {key: "posts", url: "/generated/posts.json"},
    {key: "categories", url: "/generated/categories.json"},
    {key: "tags", url: "/generated/tags.json"},
    {key: "archiveGroups", url: "/generated/archive-groups.json"},
    {key: "yearlyArchive", url: "/generated/yearly-archive.json"},
    {key: "customPages", url: "/generated/custom-pages.json"},
] as const;

export async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} while loading ${url}`);
    return (await res.json()) as T;
}

export const META_CACHE_TTL_MS = 5 * 60 * 1000;

export const CONTENT_STORE_VERSION = 2;
