import type {NavLink} from "../../../src/types/config.ts";
import {
    blogConfig,
    getAbsoluteUrl,
    getNavLinks,
    seoConfig,
    siteConfig,
} from "../../../src/config.ts";
import type {BlogPostMeta} from "../../../src/types/post.ts";
import type {CompiledCustomPage} from "../types.ts";
import {xmlEscape} from "./../utils/color-utils.ts";

export function buildRssXml(posts: BlogPostMeta[]): string {
    const rssItems = posts
        .map((post) => {
            const link = getAbsoluteUrl(`/posts/${post.slug}`);
            const pubDate = new Date(post.updated ?? post.published).toUTCString();
            return [
                "<item>",
                `<title>${xmlEscape(post.title)}</title>`,
                `<link>${xmlEscape(link)}</link>`,
                `<guid>${xmlEscape(link)}</guid>`,
                `<pubDate>${pubDate}</pubDate>`,
                `<description>${xmlEscape(post.description || post.excerpt)}</description>`,
                "</item>",
            ].join("\n");
        })
        .join("\n");
    return [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<rss version="2.0">',
        "<channel>",
        `<title>${xmlEscape(siteConfig.title)}</title>`,
        `<link>${xmlEscape(getAbsoluteUrl("/"))}</link>`,
        `<description>${xmlEscape(siteConfig.description)}</description>`,
        rssItems,
        "</channel>",
        "</rss>",
        "",
    ].join("\n");
}

export function buildSitemapXml(posts: BlogPostMeta[], customPages: CompiledCustomPage[]): string {
    const navItems = getNavLinks();
    const staticUrls = navItems.map((n: NavLink) => ({
        loc: getAbsoluteUrl(n.href),
        lastmod: new Date().toISOString().slice(0, 10),
    }));
    const postUrls = posts.map((p) => ({
        loc: getAbsoluteUrl(`/posts/${p.slug}`),
        lastmod: new Date(p.updated ?? p.published).toISOString().slice(0, 10),
    }));
    const pageUrls = customPages
        .filter((p) => p.showInSitemap)
        .map((p) => {
            const href = p.slug === "about" ? `/about` : `/pages/${p.slug}`;
            return {
                loc: getAbsoluteUrl(href),
                lastmod: new Date().toISOString().slice(0, 10),
            };
        });
    const all = [...staticUrls, ...postUrls, ...pageUrls];
    const body = all
        .map(
            (u) =>
                `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`,
        )
        .join("\n");
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        body,
        "</urlset>",
        "",
    ].join("\n");
}

export function buildRobotsTxt(): string {
    const allow = seoConfig.robots.allow;
    const disallowList = seoConfig.robots.disallow;
    const lines: string[] = ["User-agent: *"];
    lines.push(`Allow: ${allow}`);
    for (const d of disallowList) {
        lines.push(`Disallow: ${d}`);
    }
    lines.push(`Sitemap: ${getAbsoluteUrl("/sitemap.xml")}`);
    return lines.join("\n") + "\n";
}

export function buildCnameContent(): string | null {
    const rawUrl = blogConfig.site.url?.trim();
    if (!rawUrl) return null;
    try {
        const host = new URL(rawUrl).hostname;
        if (!host) return null;
        return host + "\n";
    } catch {
        const stripped = rawUrl
            .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "")
            .replace(/\/.*$/, "")
            .replace(/:\d+$/, "")
            .trim();
        if (!stripped) return null;
        return stripped + "\n";
    }
}

export function buildLlmsText(
    posts: BlogPostMeta[],
    customPages: CompiledCustomPage[],
    full: boolean,
): string {
    const baseLines = [
        `# ${siteConfig.title}`,
        `> ${siteConfig.subtitle}`,
        "",
        "## 站点",
        `- [首页](${getAbsoluteUrl("/")})`,
        `- [归档](${getAbsoluteUrl("/archive")})`,
        ...customPages
            .filter((p) => p.showInSitemap)
            .map((item) => {
                const href = item.slug === "about" ? "/about" : `/pages/${item.slug}`;
                return `- [${item.title}](${getAbsoluteUrl(href)})`;
            }),
        `- [RSS](${getAbsoluteUrl("/rss.xml")})`,
        `- [全文索引 (llms-full.txt)](${getAbsoluteUrl("/llms-full.txt")})`,
        "",
        "## 文章",
    ];
    const postLines = posts.map((post) => {
        const link = getAbsoluteUrl(`/posts/${post.slug}`);
        const dateText = new Date(post.published).toISOString().slice(0, 10);
        const tagsText = post.tags.length ? ` 标签: ${post.tags.join(", ")}.` : "";
        const desc = post.description || post.excerpt;
        if (full) {
            return `- [${post.title}](${link}): ${desc} (${dateText})${tagsText}`;
        }
        return `- [${post.title}](${link}) (${dateText})${tagsText}`;
    });
    return `${baseLines.concat(postLines).join("\n")}\n`;
}
