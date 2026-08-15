import fsPromises from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";

import type {IconifyAlias, IconifyJSON, IconifyIcon} from "@iconify/types";

import type {ScannedIcon, BuildResult} from "./types.js";
import {
    ICON_JSX_ATTR_RE,
    ICON_OBJECT_PROP_RE,
    STRING_LITERAL_CANDIDATE_RE,
    PREFIX_TO_COLLECTION_PACKAGE,
    parseIconId,
} from "./types.js";
import {normalizeIconViaBBox} from "./bbox-normalizer.js";

const requireFn = createRequire(import.meta.url);

export type ResolvedPackage = {
    collection: IconifyJSON;
    resolve: (name: string) => {resolved: string; data: IconifyIcon} | null;
};

export function loadCollectionPackage(prefix: string): ResolvedPackage | null {
    const pkg = PREFIX_TO_COLLECTION_PACKAGE[prefix];
    if (!pkg) return null;
    const mod = requireFn(requireFn.resolve(`${pkg}/icons.json`));
    const collection = ((mod.default ?? mod) as IconifyJSON);
    if (!collection || !collection.icons || typeof collection.icons !== "object") return null;
    const collectionW = collection.width ?? 24;
    const collectionH = collection.height ?? 24;

    const resolve = (name: string): {resolved: string; data: IconifyIcon} | null => {
        const direct = collection.icons[name] as IconifyIcon | IconifyAlias | undefined;
        if (direct) {
            if ("body" in direct && typeof (direct as unknown as IconifyIcon).body === "string") {
                const icon = direct as IconifyIcon;
                return {
                    resolved: name,
                    data: normalizeIconViaBBox(prefix, icon, collectionW, collectionH),
                };
            }
            if ("parent" in direct && typeof (direct as unknown as IconifyAlias).parent === "string") {
                const parentName = (direct as unknown as IconifyAlias).parent;
                const parent = collection.icons[parentName] as IconifyIcon | undefined;
                if (parent && "body" in parent && typeof parent.body === "string") {
                    return {
                        resolved: parentName,
                        data: normalizeIconViaBBox(prefix, parent, collectionW, collectionH),
                    };
                }
            }
            return null;
        }
        if (collection.aliases) {
            const alias = collection.aliases[name] as IconifyAlias | undefined;
            if (alias && typeof alias.parent === "string") {
                const parent = collection.icons[alias.parent] as IconifyIcon | undefined;
                if (parent && "body" in parent && typeof parent.body === "string") {
                    return {
                        resolved: alias.parent,
                        data: normalizeIconViaBBox(prefix, parent, collectionW, collectionH),
                    };
                }
            }
        }
        return null;
    };

    return {collection, resolve};
}

export async function collectSourceFiles(root: string): Promise<string[]> {
    const srcRoot = path.join(root, "src");
    try {
        await fsPromises.access(srcRoot);
    } catch {
        return [];
    }
    const result: string[] = [];
    const walk = async (dir: string) => {
        const entries = await fsPromises.readdir(dir, {withFileTypes: true});
        for (const entry of entries) {
            if (entry.name.startsWith(".")) continue;
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(entryPath);
            } else if (
                entry.name.endsWith(".ts") ||
                entry.name.endsWith(".tsx") ||
                entry.name.endsWith(".js") ||
                entry.name.endsWith(".jsx")
            ) {
                result.push(entryPath);
            }
        }
    };
    await walk(srcRoot);
    return result;
}

export function extractIconsFromContent(content: string): ScannedIcon[] {
    const collected = new Map<string, ScannedIcon>();
    const push = (id: string) => {
        if (collected.has(id)) return;
        const parsed = parseIconId(id);
        if (!parsed) return;
        if (!(parsed.prefix in PREFIX_TO_COLLECTION_PACKAGE)) return;
        collected.set(id, {id, prefix: parsed.prefix, name: parsed.name});
    };
    for (const m of content.matchAll(ICON_JSX_ATTR_RE)) push(m[1]);
    for (const m of content.matchAll(ICON_OBJECT_PROP_RE)) push(m[1]);
    for (const m of content.matchAll(STRING_LITERAL_CANDIDATE_RE)) push(m[1]);
    return Array.from(collected.values());
}

export async function buildIconCollections(
    icons: ScannedIcon[],
): Promise<{collections: IconifyJSON[]; missing: string[]; widths: Array<{prefix: string; iconCount: number; vbSpec: string; normalizedCount: number}>}> {
    const byPrefix = new Map<string, ScannedIcon[]>();
    for (const icon of icons) {
        const list = byPrefix.get(icon.prefix) ?? [];
        list.push(icon);
        byPrefix.set(icon.prefix, list);
    }
    const collections: IconifyJSON[] = [];
    const missing: string[] = [];
    const widths: Array<{prefix: string; iconCount: number; vbSpec: string; normalizedCount: number}> = [];
    for (const [prefix, list] of byPrefix.entries()) {
        const pkg = loadCollectionPackage(prefix);
        if (!pkg) {
            for (const item of list) missing.push(item.id);
            continue;
        }
        const newIcons: Record<string, IconifyIcon> = Object.create(null);
        let normalizedCount = 0;
        const vbSpecs = new Set<string>();
        for (const item of list) {
            const res = pkg.resolve(item.name);
            if (res) {
                newIcons[item.name] = res.data;
                if (res.data.body.startsWith("<g ")) normalizedCount++;
                const vbW = ((res.data.width as number | undefined) ?? pkg.collection.width ?? 24);
                const vbH = ((res.data.height as number | undefined) ?? pkg.collection.height ?? 24);
                vbSpecs.add(`${vbW}×${vbH}`);
            } else {
                missing.push(item.id);
            }
        }
        const iconList = Object.keys(newIcons);
        if (iconList.length > 0) {
            const baseCol = pkg.collection;
            const built: IconifyJSON = {
                prefix,
                width: baseCol.width ?? 24,
                height: baseCol.height ?? 24,
                left: baseCol.left ?? 0,
                top: baseCol.top ?? 0,
                icons: newIcons,
            };
            collections.push(built);
            widths.push({
                prefix,
                iconCount: iconList.length,
                vbSpec: Array.from(vbSpecs).sort().join(";"),
                normalizedCount,
            });
        }
    }
    return {collections, missing, widths};
}

export function renderRegistryModule(collections: IconifyJSON[]): string {
    const chunks: string[] = [];
    chunks.push(`import { addCollection } from "@iconify/react";`);
    chunks.push("");
    for (const col of collections) {
        chunks.push(`addCollection(${JSON.stringify(col)});`);
    }
    chunks.push("");
    return chunks.join("\n");
}

export function formatMissingList(missing: string[]): string {
    return missing.map((id) => `• ${id}`).join("\n  ");
}

export type {ScannedIcon, BuildResult};
