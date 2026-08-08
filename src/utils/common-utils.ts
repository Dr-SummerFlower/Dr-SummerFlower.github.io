import clsx, {type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function classNames(...values: ClassValue[]) {
    return twMerge(clsx(values));
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function normalizeCategory(value: string | null | undefined) {
    return isNonEmptyString(value) ? value.trim() : "未分类";
}

export function decodeHtml(value: string) {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'");
}
