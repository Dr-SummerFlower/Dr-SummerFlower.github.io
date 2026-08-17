import type {CustomPageItem, NavLink} from "../../../types/config.ts";
import {blogConfig} from "../../../config.ts";
import {contentConfig} from "../derived.config.ts";

const customPages: CustomPageItem[] = (blogConfig.navigation.customPages as CustomPageItem[]).map((item) => {
    if (item.type === "component") {
        return item;
    }
    return {
        ...item,
        filePath: item.filePath || `${contentConfig.pagesDir}/${item.slug}.md`,
    };
});

const navLinks: NavLink[] = [...blogConfig.navigation.links];

export function getCustomPages() {
    return customPages;
}

export function getNavLinks() {
    function resolveRouteHref(page: CustomPageItem): string {
        if (page.type === "component") {
            return page.path ?? `/pages/${page.slug}`;
        }
        if (page.slug === "about") {
            return "/about";
        }
        return `/pages/:${page.slug}`;
    }

    const dynamicLinks = customPages
        .filter((item) => item.showInNavbar)
        .map((item) => ({
            name: item.title,
            href: resolveRouteHref(item),
        }));

    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
        const allHrefs = [...navLinks.map((l) => l.href), ...dynamicLinks.map((l) => l.href)];
        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const href of allHrefs) {
            if (seen.has(href)) {
                if (!duplicates.includes(href)) {
                    duplicates.push(href);
                }
            } else {
                seen.add(href);
            }
        }
        if (duplicates.length > 0) {
            console.warn(`[navigation] Duplicate href(s) found in navigation: ${duplicates.join(", ")}`);
        }
    }

    return [...navLinks, ...dynamicLinks];
}
