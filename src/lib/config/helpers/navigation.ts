import type {CustomPageItem, NavLink} from "../../../types/config.ts";
import {blogConfig} from "../../../config.ts";
import {contentConfig} from "../derived.config.ts";

const customPages: CustomPageItem[] = blogConfig.navigation.customPages.map((item) => ({
    ...item,
    filePath: item.filePath || `${contentConfig.pagesDir}/${item.slug}.md`,
}));

const navLinks: NavLink[] = [...blogConfig.navigation.links];

export function getCustomPages() {
    return customPages;
}

export function getNavLinks() {
    const dynamicLinks = customPages
        .filter((item) => item.showInNavbar)
        .map((item) => ({
            name: item.title,
            href: item.slug === "about" ? "/about" : `/pages/${item.slug}`,
        }));

    return [...navLinks, ...dynamicLinks];
}
