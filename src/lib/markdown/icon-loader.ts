import {createRequire} from "node:module";
import {iconToSVG, iconToHTML, getIconData} from "@iconify/utils";
import type {IconifyJSON, IconifyIcon} from "@iconify/types";

export const ADMONITION_ICON_NOTE = "fa6-solid:circle-info";
export const ADMONITION_ICON_TIP = "fa6-solid:lightbulb";
export const ADMONITION_ICON_IMPORTANT = "fa6-solid:circle-exclamation";
export const ADMONITION_ICON_CAUTION = "fa6-solid:triangle-exclamation";
export const ADMONITION_ICON_WARNING = "fa6-solid:circle-exclamation";
export const ADMONITION_ICON_DETAILS = "fa6-solid:chevron-right";
export const GC_ICON_GITHUB = "fa6-brands:github";
export const GC_ICON_STAR = "fa6-solid:star";
export const GC_ICON_FORK = "fa6-solid:code-fork";
export const GC_ICON_LICENSE = "fa6-solid:scale-balanced";

export const ADMONITION_TYPE_LIST: string[] = [
    "note",
    "tip",
    "important",
    "caution",
    "warning",
];

const require = createRequire(import.meta.url);
const ICON_PACKAGES: Record<string, string> = {
    "fa6-solid": "@iconify-json/fa6-solid",
    "fa6-brands": "@iconify-json/fa6-brands",
    "material-symbols": "@iconify-json/material-symbols",
};
const loadedCollections = new Map<string, IconifyJSON>();

export function getCollection(prefix: string): IconifyJSON | null {
    const cached = loadedCollections.get(prefix);
    if (cached) return cached;
    const pkg = ICON_PACKAGES[prefix];
    if (!pkg) return null;
    try {
        const mod = require(require.resolve(`${pkg}/icons.json`));
        const col = (mod.default ?? mod) as IconifyJSON;
        loadedCollections.set(prefix, col);
        return col;
    } catch {
        return null;
    }
}

export function buildSvgIcon(iconId: string, size = "1em", extraClass = ""): string {
    const idx = iconId.indexOf(":");
    if (idx <= 0) return "";
    const prefix = iconId.slice(0, idx);
    const name = iconId.slice(idx + 1);
    const col = getCollection(prefix);
    if (!col) return "";
    const iconData = getIconData(col, name);
    if (!iconData) return "";
    const svgBuild = iconToSVG(iconData as unknown as IconifyIcon, {
        height: size,
        width: size,
    });
    if (!svgBuild || !svgBuild.body) return "";
    const attributes: Record<string, string> = {...svgBuild.attributes};
    if (!attributes.viewBox && col.width && col.height) {
        attributes.viewBox = `0 0 ${col.width} ${col.height}`;
    }
    attributes["aria-hidden"] = "true";
    attributes.focusable = "false";
    attributes.fill = "currentColor";
    if (extraClass) {
        attributes.class = extraClass;
    }
    return iconToHTML(svgBuild.body, attributes);
}
