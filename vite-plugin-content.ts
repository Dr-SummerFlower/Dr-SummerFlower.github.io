import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import {load as parseYaml} from "js-yaml";
import GithubSlugger from "github-slugger";
import {toString} from "mdast-util-to-string";
import getReadingTime from "reading-time";
import remarkParse from "remark-parse";
import {unified} from "unified";
import {z} from "zod";
import type {Plugin, ResolvedConfig, ViteDevServer} from "vite";

import type {NavLink} from "./src/types/config.ts";
import {
    blogConfig,
    contentConfig,
    getAbsoluteUrl,
    getCustomPages,
    getNavLinks,
    seoConfig,
    siteConfig,
} from "./src/config.ts";
import type {
    BlogPostHtmlPayload,
    BlogPostMeta,
    CountItem,
    CustomPageContent,
    HeadingItem,
    YearlyArchive,
} from "./src/types/post.ts";
import type {ArchiveGroupItem} from "./src/types/post.ts";
import type {SearchIndexItem, SearchIndexPayload} from "./src/types/search-index.ts";
import {decodeHtml, normalizeCategory} from "./src/utils/common-utils.ts";
import {normalizeAssetReference} from "./src/utils/image-manifest.ts";
import {markdownToPlainTextForSearch} from "./src/utils/markdown-plaintext.ts";
import {renderMarkdown} from "./src/lib/markdown.ts";

const EC_VIRTUAL_ID = "virtual:expressive-code.css";
const EC_RESOLVED_ID = "\0" + EC_VIRTUAL_ID;

type RawMarkdownFile = {
    slug: string;
    sourcePath: string;
    frontmatter: z.infer<typeof frontmatterSchema>;
    content: string;
};

type CompiledPostFile = RawMarkdownFile & {
    html: string;
    headings: HeadingItem[];
    excerpt: string;
    readingMinutes: number;
    words: number;
    normalizedImage: string;
};

type CompiledCustomPage = {
    slug: string;
    title: string;
    description: string;
    sourcePath: string;
    content: string;
    html: string;
    headings: HeadingItem[];
    showInSitemap: boolean;
};

const frontmatterSchema = z.object({
    title: z.string(),
    published: z.union([z.string(), z.date()]),
    updated: z.union([z.string(), z.date()]).optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional().default(""),
    image: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().nullable().optional().default(""),
    lang: z.string().optional().default(""),
    showInNavbar: z.boolean().optional().default(false),
    showInSitemap: z.boolean().optional().default(true),
});

async function pathExists(targetPath: string): Promise<boolean> {
    try {
        await fsPromises.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function getMarkdownFiles(dirPath: string): Promise<string[]> {
    if (!(await pathExists(dirPath))) {
        return [];
    }
    const entries = await fsPromises.readdir(dirPath, {withFileTypes: true});
    const files = await Promise.all(
        entries.map(async (entry) => {
            if (entry.name.startsWith(".")) {
                return [] as string[];
            }
            const entryPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                return getMarkdownFiles(entryPath);
            }
            return entry.name.endsWith(".md") ? [entryPath] : [];
        }),
    );
    return files.flat();
}

function toSlug(filePath: string, dirRoot: string): string {
    return path.relative(dirRoot, filePath).replace(/\\/g, "/").replace(/\.md$/, "");
}

function splitFrontmatter(fileContent: string) {
    if (!fileContent.startsWith("---")) {
        return {
            frontmatter: frontmatterSchema.parse({
                title: "Untitled",
                published: new Date().toISOString(),
            }),
            content: fileContent,
        };
    }
    const lines = fileContent.split(/\r?\n/);
    if (lines[0] !== "---") {
        throw new Error("Invalid frontmatter opening delimiter.");
    }
    let closingIndex = -1;
    for (let index = 1; index < lines.length; index += 1) {
        if (lines[index] === "---") {
            closingIndex = index;
            break;
        }
    }
    if (closingIndex === -1) {
        throw new Error("Frontmatter closing delimiter not found.");
    }
    const yamlText = lines.slice(1, closingIndex).join("\n");
    const content = lines.slice(closingIndex + 1).join("\n").trim();
    const parsedYaml = (parseYaml(yamlText) ?? {}) as Record<string, unknown>;
    return {
        frontmatter: frontmatterSchema.parse(parsedYaml),
        content,
    };
}

function getReadingStats(content: string) {
    const tree = unified().use(remarkParse).parse(content);
    const plainText = toString(tree);
    const readingTime = getReadingTime(plainText);
    return {
        words: readingTime.words,
        readingMinutes: Math.max(1, Math.round(readingTime.minutes)),
    };
}

function extractExcerpt(content: string, frontmatterDescription: string): string {
    if (frontmatterDescription.trim()) {
        return frontmatterDescription.trim();
    }
    const cleaned = content
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.slice(0, 140);
}

function extractHeadings(markdown: string): HeadingItem[] {
    const slugger = new GithubSlugger();
    const headings: HeadingItem[] = [];
    const lines = markdown.split(/\r?\n/);
    for (const line of lines) {
        const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (!match) {
            continue;
        }
        const text = decodeHtml(
            match[2]
                .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
                .replace(/`([^`]*)`/g, "$1")
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/\*(.*?)\*/g, "$1")
                .trim(),
        );
        headings.push({
            depth: match[1].length,
            slug: slugger.slug(text),
            text,
        });
    }
    return headings;
}

function extractStripInlineStyles(html: string): {cleanedHtml: string; styleChunks: string[]} {
    const styleChunks: string[] = [];
    const cleanedHtml = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_0, body) => {
        styleChunks.push(String(body).trim());
        return "";
    });
    return {cleanedHtml, styleChunks};
}

function dedupeStyles(chunks: string[]): string {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of chunks) {
        if (!c) continue;
        const key = c.trim();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(key);
    }
    return out.join("\n\n");
}

function xmlEscape(raw: string): string {
    return raw
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function clamp(num: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, num));
}

function oklchToHex(l: number, c: number, h: number): string {
    const hr = (h / 180) * Math.PI;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;
    const R = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const G = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const B = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
    const r = Math.round(clamp(255 * (R <= 0.0031308 ? 12.92 * R : 1.055 * Math.pow(R, 1 / 2.4) - 0.055), 0, 255));
    const g = Math.round(clamp(255 * (G <= 0.0031308 ? 12.92 * G : 1.055 * Math.pow(G, 1 / 2.4) - 0.055), 0, 255));
    const b2 = Math.round(clamp(255 * (B <= 0.0031308 ? 12.92 * B : 1.055 * Math.pow(B, 1 / 2.4) - 0.055), 0, 255));
    return "#" + [r, g, b2].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hueToHex(hue: number): string {
    return oklchToHex(0.75, 0.12, Number.isFinite(hue) ? hue : 250);
}

function buildRssXml(posts: BlogPostMeta[]): string {
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

function buildSitemapXml(posts: BlogPostMeta[], customPages: CompiledCustomPage[]): string {
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

function buildRobotsTxt(): string {
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

function buildCnameContent(): string | null {
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

function buildLlmsText(
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

function computeAggregates(postsMeta: BlogPostMeta[]): {
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
} {
    const categoryCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const monthGroups = new Map<string, BlogPostMeta[]>();
    const yearGroups = new Map<number, BlogPostMeta[]>();

    for (const post of postsMeta) {
        const cat = normalizeCategory(post.category);
        categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
        for (const tag of post.tags) {
            const t = tag.trim();
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        }
        const d = new Date(post.published);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const mKey = `${y}-${String(m).padStart(2, "0")}`;
        const cur = monthGroups.get(mKey) ?? [];
        cur.push(post);
        monthGroups.set(mKey, cur);
        const yCur = yearGroups.get(y) ?? [];
        yCur.push(post);
        yearGroups.set(y, yCur);
    }

    const categories = Array.from(categoryCounts.entries())
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    const tags = Array.from(tagCounts.entries())
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    const archiveGroups = Array.from(monthGroups.entries())
        .map(([key, items]) => ({
            key,
            year: Number(key.slice(0, 4)),
            month: Number(key.slice(5, 7)),
            items,
        }))
        .sort((a, b) => b.key.localeCompare(a.key));
    const yearlyArchive = Array.from(yearGroups.entries())
        .map(([year, items]) => ({year, items}))
        .sort((a, b) => b.year - a.year);

    return {categories, tags, archiveGroups, yearlyArchive};
}

type CompiledArtifacts = {
    postsMeta: BlogPostMeta[];
    postsHtmlBySlug: Map<string, BlogPostHtmlPayload>;
    customPagesMeta: Array<{slug: string; title: string; description: string; headings: HeadingItem[]}>;
    customPagesHtmlBySlug: Map<string, CustomPageContent>;
    sitemapCustomPages: CompiledCustomPage[];
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
    searchIndex: SearchIndexPayload;
    rssXml: string;
    sitemapXml: string;
    robotsTxt: string;
    llmsTxt: string;
    llmsFullTxt: string;
    expressiveCodeCss: string;
    cnameContent: string | null;
};

async function scanAndCompile(projectRoot: string): Promise<CompiledArtifacts> {
    const contentRoot = path.join(projectRoot, contentConfig.rootDir);
    const postsRoot = path.join(contentRoot, contentConfig.postsDir);
    const pagesRoot = path.join(contentRoot, contentConfig.pagesDir);
    const publicRoot = path.join(projectRoot, "public");

    const styleSet: string[] = [];

    const postFiles = await getMarkdownFiles(postsRoot);
    const rawPosts: RawMarkdownFile[] = await Promise.all(
        postFiles.map(async (filePath) => {
            const fileContent = await fsPromises.readFile(filePath, "utf8");
            const {frontmatter, content} = splitFrontmatter(fileContent);
            return {
                slug: toSlug(filePath, postsRoot),
                sourcePath: filePath,
                frontmatter,
                content,
            };
        }),
    );

    const sortedRaw = rawPosts
        .filter((p) => contentConfig.includeDrafts || !p.frontmatter.draft)
        .sort((a, b) => {
            const ad = new Date(a.frontmatter.published).getTime();
            const bd = new Date(b.frontmatter.published).getTime();
            return bd - ad;
        });

    const compiledPosts: CompiledPostFile[] = await Promise.all(
        sortedRaw.map(async (raw): Promise<CompiledPostFile> => {
            const {words, readingMinutes} = getReadingStats(raw.content);
            const excerpt = extractExcerpt(raw.content, raw.frontmatter.description);
            const rawHtml = await renderMarkdown(raw.content, raw.sourcePath, publicRoot);
            const {cleanedHtml, styleChunks} = extractStripInlineStyles(rawHtml);
            styleSet.push(...styleChunks);
            const normalizedImage = normalizeAssetReference(
                raw.frontmatter.image,
                raw.sourcePath,
                publicRoot,
            );
            return {
                ...raw,
                html: cleanedHtml,
                headings: extractHeadings(raw.content),
                excerpt,
                readingMinutes,
                words,
                normalizedImage,
            };
        }),
    );

    const postsMeta: BlogPostMeta[] = compiledPosts.map((post, index) => ({
        slug: post.slug,
        title: post.frontmatter.title,
        published: new Date(post.frontmatter.published).toISOString(),
        updated: post.frontmatter.updated
            ? new Date(post.frontmatter.updated).toISOString()
            : undefined,
        draft: post.frontmatter.draft,
        description: post.frontmatter.description,
        image: post.normalizedImage,
        tags: post.frontmatter.tags,
        category: post.frontmatter.category?.trim() || null,
        lang: post.frontmatter.lang || "zh-CN",
        excerpt: post.excerpt,
        readingMinutes: post.readingMinutes,
        words: post.words,
        prevPost:
            index < compiledPosts.length - 1
                ? {
                      slug: compiledPosts[index + 1].slug,
                      title: compiledPosts[index + 1].frontmatter.title,
                  }
                : undefined,
        nextPost:
            index > 0
                ? {
                      slug: compiledPosts[index - 1].slug,
                      title: compiledPosts[index - 1].frontmatter.title,
                  }
                : undefined,
    }));

    const postsHtmlBySlug = new Map<string, BlogPostHtmlPayload>();
    for (const post of compiledPosts) {
        postsHtmlBySlug.set(post.slug, {
            slug: post.slug,
            html: post.html,
            headings: post.headings,
        });
    }

    const customPageSources: CompiledCustomPage[] = [];
    for (const page of getCustomPages()) {
        const sourcePath = path.join(contentRoot, page.filePath || `${page.slug}.md`);
        if (!(await pathExists(sourcePath))) continue;
        const fileContent = await fsPromises.readFile(sourcePath, "utf8");
        const {frontmatter, content} = splitFrontmatter(fileContent);
        const rawHtml = await renderMarkdown(content, sourcePath, publicRoot);
        const {cleanedHtml, styleChunks} = extractStripInlineStyles(rawHtml);
        styleSet.push(...styleChunks);
        customPageSources.push({
            slug: page.slug,
            title: page.title || frontmatter.title,
            description: page.description || frontmatter.description || "",
            sourcePath,
            content,
            html: cleanedHtml,
            headings: extractHeadings(content),
            showInSitemap: page.showInSitemap !== false,
        });
    }

    const extraPageFiles = await getMarkdownFiles(pagesRoot);
    for (const pageFile of extraPageFiles) {
        const slug = toSlug(pageFile, pagesRoot);
        if (customPageSources.some((c) => c.slug === slug)) continue;
        const fileContent = await fsPromises.readFile(pageFile, "utf8");
        const {frontmatter, content} = splitFrontmatter(fileContent);
        const fallbackTitle = slug.split("/").at(-1) || slug;
        const title = frontmatter.title === "Untitled" ? fallbackTitle : frontmatter.title;
        const rawHtml = await renderMarkdown(content, pageFile, publicRoot);
        const {cleanedHtml, styleChunks} = extractStripInlineStyles(rawHtml);
        styleSet.push(...styleChunks);
        customPageSources.push({
            slug,
            title,
            description: frontmatter.description || "",
            sourcePath: pageFile,
            content,
            html: cleanedHtml,
            headings: extractHeadings(content),
            showInSitemap: frontmatter.showInSitemap !== false,
        });
    }

    const customPagesMeta = customPageSources.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        headings: p.headings,
    }));
    const customPagesHtmlBySlug = new Map<string, CustomPageContent>();
    for (const p of customPageSources) {
        customPagesHtmlBySlug.set(p.slug, {
            slug: p.slug,
            title: p.title,
            description: p.description,
            sourcePath: p.sourcePath,
            content: p.content,
            html: p.html,
            headings: p.headings,
        });
    }

    const {categories, tags, archiveGroups, yearlyArchive} = computeAggregates(postsMeta);

    const searchIndexItems: SearchIndexItem[] = compiledPosts.map((p) => ({
        slug: p.slug,
        title: p.frontmatter.title,
        excerpt: p.excerpt,
        text: markdownToPlainTextForSearch(p.content),
        tags: p.frontmatter.tags.join(" "),
    }));
    const searchIndex: SearchIndexPayload = {version: 1, items: searchIndexItems};

    const sitemapCustomPages = customPageSources.filter((p) => p.showInSitemap);

    const expressiveCodeCss = dedupeStyles(styleSet);
    return {
        postsMeta,
        postsHtmlBySlug,
        customPagesMeta,
        customPagesHtmlBySlug,
        sitemapCustomPages,
        categories,
        tags,
        archiveGroups,
        yearlyArchive,
        searchIndex,
        rssXml: buildRssXml(postsMeta),
        sitemapXml: buildSitemapXml(postsMeta, sitemapCustomPages),
        robotsTxt: buildRobotsTxt(),
        llmsTxt: buildLlmsText(postsMeta, sitemapCustomPages, false),
        llmsFullTxt: buildLlmsText(postsMeta, sitemapCustomPages, true),
        expressiveCodeCss,
        cnameContent: buildCnameContent(),
    };
}

export default function contentPlugin(): Plugin {
    let resolved: ResolvedConfig;
    let projectRoot: string;
    let artifacts: CompiledArtifacts | null = null;

    async function ensureArtifacts(): Promise<CompiledArtifacts> {
        if (!artifacts) {
            artifacts = await scanAndCompile(projectRoot);
        }
        return artifacts;
    }

    function invalidate() {
        artifacts = null;
    }

    async function sendJson(res: any, payload: unknown) {
        const body = JSON.stringify(payload, null, 0);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(body);
    }

    async function sendText(res: any, body: string, contentType: string) {
        res.setHeader("Content-Type", `${contentType}; charset=utf-8`);
        res.setHeader("Cache-Control", "no-cache");
        res.end(body);
    }

    function stripBase(url: string, base: string): string {
        if (!base || base === "/") return url;
        const norm = base.endsWith("/") ? base.slice(0, -1) : base;
        if (url.startsWith(norm)) return url.slice(norm.length) || "/";
        return url;
    }

    return {
        name: "vite-plugin-blog-content",
        configResolved(cfg) {
            resolved = cfg;
            projectRoot = cfg.root;
        },
        async buildStart() {
            await ensureArtifacts();
        },
        resolveId(id) {
            if (id === EC_VIRTUAL_ID || id === "/@generated/expressive-code.css") {
                return EC_RESOLVED_ID;
            }
        },
        async load(id) {
            if (id === EC_RESOLVED_ID) {
                const a = await ensureArtifacts();
                return a.expressiveCodeCss;
            }
        },
        async configureServer(server: ViteDevServer) {
            const contentRoot = path.join(projectRoot, contentConfig.rootDir);
            const onChange = (file: string) => {
                if (!file.startsWith(contentRoot)) return;
                if (!file.endsWith(".md")) return;
                invalidate();
                server.ws.send({type: "full-reload"});
            };
            server.watcher.on("add", onChange);
            server.watcher.on("change", onChange);
            server.watcher.on("unlink", onChange);

            server.middlewares.use(async (req, res, next) => {
                try {
                    const rawUrl = req.url || "/";
                    const urlPath = stripBase(rawUrl.split("?")[0], resolved.base || "/");
                    const a = await ensureArtifacts();

                    if (urlPath === "/generated/posts.json") {
                        return sendJson(res, a.postsMeta);
                    }
                    if (urlPath === "/generated/categories.json") {
                        return sendJson(res, a.categories);
                    }
                    if (urlPath === "/generated/tags.json") {
                        return sendJson(res, a.tags);
                    }
                    if (urlPath === "/generated/archive-groups.json") {
                        return sendJson(res, a.archiveGroups);
                    }
                    if (urlPath === "/generated/yearly-archive.json") {
                        return sendJson(res, a.yearlyArchive);
                    }
                    if (urlPath === "/generated/custom-pages.json") {
                        return sendJson(res, a.customPagesMeta);
                    }
                    if (urlPath === "/generated/search-index.json") {
                        return sendJson(res, a.searchIndex);
                    }
                    if (urlPath === "/generated/expressive-code.css") {
                        return sendText(res, a.expressiveCodeCss, "text/css");
                    }

                    const postsHtmlPrefix = "/generated/posts-html/";
                    if (urlPath.startsWith(postsHtmlPrefix) && urlPath.endsWith(".json")) {
                        const slug = decodeURIComponent(
                            urlPath.slice(postsHtmlPrefix.length, -".json".length),
                        );
                        const p = a.postsHtmlBySlug.get(slug);
                        if (!p) {
                            res.statusCode = 404;
                            res.end("Not found");
                            return;
                        }
                        return sendJson(res, p);
                    }

                    const pagesHtmlPrefix = "/generated/custom-pages-html/";
                    if (urlPath.startsWith(pagesHtmlPrefix) && urlPath.endsWith(".json")) {
                        const slug = decodeURIComponent(
                            urlPath.slice(pagesHtmlPrefix.length, -".json".length),
                        );
                        const p = a.customPagesHtmlBySlug.get(slug);
                        if (!p) {
                            res.statusCode = 404;
                            res.end("Not found");
                            return;
                        }
                        return sendJson(res, p);
                    }

                    if (urlPath === "/sitemap.xml") {
                        return sendText(res, a.sitemapXml, "application/xml");
                    }
                    if (urlPath === "/rss.xml") {
                        return sendText(res, a.rssXml, "application/rss+xml");
                    }
                    if (urlPath === "/robots.txt") {
                        return sendText(res, a.robotsTxt, "text/plain");
                    }
                    if (urlPath === "/llms.txt") {
                        return sendText(res, a.llmsTxt, "text/plain");
                    }
                    if (urlPath === "/llms-full.txt") {
                        return sendText(res, a.llmsFullTxt, "text/plain");
                    }
                    if (urlPath === "/CNAME" && a.cnameContent) {
                        return sendText(res, a.cnameContent, "text/plain");
                    }

                    next();
                } catch (err) {
                    next(err);
                }
            });
        },
        async generateBundle() {
            const a = await ensureArtifacts();
            const emit = (fileName: string, source: string) => {
                this.emitFile({type: "asset", fileName, source});
            };
            emit("generated/posts.json", JSON.stringify(a.postsMeta));
            emit("generated/categories.json", JSON.stringify(a.categories));
            emit("generated/tags.json", JSON.stringify(a.tags));
            emit("generated/archive-groups.json", JSON.stringify(a.archiveGroups));
            emit("generated/yearly-archive.json", JSON.stringify(a.yearlyArchive));
            emit("generated/custom-pages.json", JSON.stringify(a.customPagesMeta));
            emit("generated/search-index.json", JSON.stringify(a.searchIndex));
            emit("generated/expressive-code.css", a.expressiveCodeCss);
            for (const [slug, payload] of a.postsHtmlBySlug.entries()) {
                emit(`generated/posts-html/${slug}.json`, JSON.stringify(payload));
            }
            for (const [slug, payload] of a.customPagesHtmlBySlug.entries()) {
                emit(`generated/custom-pages-html/${slug}.json`, JSON.stringify(payload));
            }
            emit("sitemap.xml", a.sitemapXml);
            emit("rss.xml", a.rssXml);
            emit("robots.txt", a.robotsTxt);
            emit("llms.txt", a.llmsTxt);
            emit("llms-full.txt", a.llmsFullTxt);
            if (a.cnameContent) {
                emit("CNAME", a.cnameContent);
            }
        },
        async writeBundle() {
            const outDir = resolved.build.outDir || "dist";
            const distPath = path.isAbsolute(outDir) ? outDir : path.join(projectRoot, outDir);
            const indexPath = path.join(distPath, "index.html");
            const notFoundPath = path.join(distPath, "404.html");
            let baseHtmlSnapshot = "";
            try {
                if (fs.existsSync(indexPath)) {
                    const a = await ensureArtifacts();
                    let html = await fsPromises.readFile(indexPath, "utf8");
                    const defaultTitle = seoConfig.defaultTitle;
                    const defaultDescription = seoConfig.defaultDescription;
                    const themeColorHex = hueToHex(blogConfig.theme.color.hue);
                    const baseHtml = html
                        .replace(/<title>[\s\S]*?<\/title>/, `<title>${defaultTitle}</title>`)
                        .replace(
                            /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
                            `<meta name="description" content="${defaultDescription}" />`,
                        )
                        .replace(
                            /<meta\s+name="theme-color"\s+content="[^"]*"\s*\/?>/,
                            `<meta name="theme-color" content="${themeColorHex}" />`,
                        );
                    baseHtmlSnapshot = baseHtml;

                    const metaBundle = {
                        posts: a.postsMeta,
                        categories: a.categories,
                        tags: a.tags,
                        archiveGroups: a.archiveGroups,
                        yearlyArchive: a.yearlyArchive,
                        customPages: a.customPagesMeta.map(({headings: _headings, ...rest}) => rest),
                    };
                    const inlineRoot = (() => {
                        const raw = JSON.stringify({kind: "meta", value: metaBundle});
                        const safe = raw
                            .replace(/</g, "\\u003c")
                            .replace(/>/g, "\\u003e");
                        return `<script type="application/json" data-inline-id="root">${safe}</script>`;
                    })();
                    const inlineScript = (id: string, data: unknown) => {
                        const raw = JSON.stringify(data);
                        const safe = raw
                            .replace(/</g, "\\u003c")
                            .replace(/>/g, "\\u003e");
                        return `<script type="application/json" data-inline-id="${id}">${safe}</script>`;
                    };

                    const injectBeforeBodyEnd = (src: string, chunks: string[]): string => {
                        if (chunks.length === 0) return src;
                        const idx = src.lastIndexOf("</body>");
                        const start = src.lastIndexOf("<!--INL");
                        const payload = "<!--INLINE_START-->" + chunks.join("") + "<!--INLINE_END-->" + "</body>";
                        return idx >= 0
                            ? src.slice(0, idx) + payload
                            : (start >= 0 ? src.slice(0, start) + payload : src);
                    };

                    const titleRe = /<title>[\s\S]*?<\/title>/;
                    const descRe = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i;
                    const themeColorRe = /<meta\s+name="theme-color"\s+content="[^"]*"\s*\/?>/i;
                    const ogTitleRe = /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i;
                    const ogDescRe = /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i;

                    const applyPageMeta = (doc: string, title: string, description: string, hueHex: string): string => {
                        let out = doc
                            .replace(titleRe, `<title>${escapeHtml(title)}</title>`)
                            .replace(descRe, `<meta name="description" content="${escapeHtml(description)}" />`)
                            .replace(themeColorRe, `<meta name="theme-color" content="${escapeHtml(hueHex)}" />`);
                        const ogTitleTag = `<meta property="og:title" content="${escapeHtml(title)}" />`;
                        const ogDescTag = `<meta property="og:description" content="${escapeHtml(description)}" />`;
                        if (ogTitleRe.test(out)) {
                            out = out.replace(ogTitleRe, ogTitleTag);
                        } else {
                            const headClose = out.lastIndexOf("</head>");
                            if (headClose >= 0) out = out.slice(0, headClose) + ogTitleTag + "</head>" + out.slice(headClose + 7);
                        }
                        if (ogDescRe.test(out)) {
                            out = out.replace(ogDescRe, ogDescTag);
                        } else {
                            const headClose = out.lastIndexOf("</head>");
                            if (headClose >= 0) out = out.slice(0, headClose) + ogDescTag + "</head>" + out.slice(headClose + 7);
                        }
                        return out;
                    };

                    const indexWithMeta = applyPageMeta(baseHtml, defaultTitle, defaultDescription, themeColorHex);
                    await fsPromises.writeFile(indexPath, injectBeforeBodyEnd(indexWithMeta, [inlineRoot]), "utf8");
                    await fsPromises.writeFile(notFoundPath, indexWithMeta, "utf8");

                    for (const meta of a.postsMeta) {
                        const payload = a.postsHtmlBySlug.get(meta.slug);
                        if (!payload) continue;
                        const routeDir = path.join(distPath, "posts", meta.slug);
                        await fsPromises.mkdir(routeDir, {recursive: true});
                        const title = `${meta.title} - ${seoConfig.defaultTitle}`;
                        const description = meta.description || defaultDescription;
                        let doc = applyPageMeta(baseHtml, title, description, themeColorHex);
                        const chunks = [
                            inlineRoot,
                            inlineScript(`post:${meta.slug}`, {
                                kind: "post",
                                value: {meta, payload},
                            }),
                        ];
                        await fsPromises.writeFile(
                            path.join(routeDir, "index.html"),
                            injectBeforeBodyEnd(doc, chunks),
                            "utf8",
                        );
                    }

                    {
                        const routeDir = path.join(distPath, "archive");
                        await fsPromises.mkdir(routeDir, {recursive: true});
                        const title = `归档 - ${seoConfig.defaultTitle}`;
                        const description = "按时间查看全部文章归档。";
                        let doc = applyPageMeta(baseHtml, title, description, themeColorHex);
                        await fsPromises.writeFile(
                            path.join(routeDir, "index.html"),
                            injectBeforeBodyEnd(doc, [
                                inlineRoot,
                                inlineScript("yearly-archive", {kind:"yearly-archive", value: a.yearlyArchive}),
                                inlineScript("archive-groups", {kind:"archive-groups", value: a.archiveGroups}),
                            ]),
                            "utf8",
                        );
                    }

                    for (const c of a.customPagesMeta) {
                        const payload = a.customPagesHtmlBySlug.get(c.slug);
                        if (!payload) continue;
                        const routeDir = path.join(distPath, c.slug);
                        await fsPromises.mkdir(routeDir, {recursive: true});
                        const title = `${c.title} - ${seoConfig.defaultTitle}`;
                        const description = c.description || defaultDescription;
                        let doc = applyPageMeta(baseHtml, title, description, themeColorHex);
                        await fsPromises.writeFile(
                            path.join(routeDir, "index.html"),
                            injectBeforeBodyEnd(doc, [
                                inlineRoot,
                                inlineScript(`custom-page:${c.slug}`, {
                                    kind: "custom-page",
                                    value: {meta: c, payload},
                                }),
                            ]),
                            "utf8",
                        );
                    }
                }
            } catch (e) {
                console.error("[vite-plugin-content] writeBundle inline-data error:", e);
            }
            _ = baseHtmlSnapshot.length;
        },
    };
}

function escapeHtml(s: string): string {
    return String(s).replace(/[&<>"']/g, (ch) => {
        switch (ch) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            case "'": return "&#39;";
            default: return ch;
        }
    });
}

// Re-export config helpers so they are not tree-shaken / marked unused in strict tsconfig.node.
// eslint-disable-next-line
let _: any;
