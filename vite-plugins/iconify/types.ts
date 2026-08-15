export type ScannedIcon = {
    id: string;
    prefix: string;
    name: string;
};

export type BuildResult = {
    registry: string;
    icons: ScannedIcon[];
    collections: IconifyJSON[];
    missing: string[];
};

export type ResolvedPackage = {
    collection: IconifyJSON;
    resolve: (name: string) => {resolved: string; data: IconifyIcon} | null;
};

import type {IconifyJSON, IconifyIcon} from "@iconify/types";

export const VIRTUAL_ID = "virtual:iconify-registry";
export const RESOLVED_ID = "\0" + VIRTUAL_ID;
export const PLUGIN_LOG_PREFIX = "[iconify]";

export const ICON_JSX_ATTR_RE = /icon\s*=\s*["']([a-zA-Z0-9-]+:[a-zA-Z0-9-_:]+?)["']/g;
export const ICON_OBJECT_PROP_RE = /icon\s*:\s*["']([a-zA-Z0-9-]+:[a-zA-Z0-9-_:]+?)["']/g;
export const STRING_LITERAL_CANDIDATE_RE = /["']([a-z][a-z0-9-]*:[a-zA-Z0-9-_:]{3,})["']/g;

export const PREFIX_TO_COLLECTION_PACKAGE: Record<string, string> = {
    "material-symbols": "@iconify-json/material-symbols",
    "fa6-solid": "@iconify-json/fa6-solid",
    "fa6-brands": "@iconify-json/fa6-brands",
};

export const NORMALIZE_BBOX_PREFIXES = new Set<string>(["fa6-solid", "fa6-brands"]);
export const DEFAULT_BBOX_AREA_RATIO = 0.85;

export function parseIconId(id: string): {prefix: string; name: string} | null {
    const idx = id.indexOf(":");
    if (idx <= 0) return null;
    return {prefix: id.slice(0, idx), name: id.slice(idx + 1)};
}
