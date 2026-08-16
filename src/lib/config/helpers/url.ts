import {blogConfig} from "../../../config.ts";
import {siteConfig} from "../derived.config.ts";

export function withSiteBasePath(href: string): string {
    const base: string = blogConfig.site.basePath;
    if (!href || !base) {
        return href;
    }
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("data:")) {
        return href;
    }
    if (!href.startsWith("/")) {
        return href;
    }
    const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${normalized}${href}`;
}

export function getAbsoluteUrl(pathname = "/") {
    if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
        return pathname;
    }
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const pathWithBase = withSiteBasePath(normalizedPath);
    const base = siteConfig.site.replace(/\/$/, "");
    return `${base}${pathWithBase}`;
}
