import type {InlineDataShape} from "./types.js";

export function readInlinePayload<T extends InlineDataShape>(slug: string | null): T | null {
    if (typeof document === "undefined") return null;
    const selector = slug ? `script[type="application/json"][data-inline-id="${slug}"]`
        : 'script[type="application/json"][data-inline-id="root"]';
    const el = document.head.querySelector<HTMLScriptElement>(selector)
        || document.body.querySelector<HTMLScriptElement>(selector);
    if (!el?.textContent) return null;
    try {
        return JSON.parse(el.textContent) as T;
    } catch {
        return null;
    }
}
