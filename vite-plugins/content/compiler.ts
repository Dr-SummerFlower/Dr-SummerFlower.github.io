import fsPromises from "node:fs/promises";
import path from "node:path";

import {contentConfig, getCustomPages} from "../../src/config.ts";
import {markdownToPlainTextForSearch} from "../../src/utils/markdown-plaintext.ts";
import {normalizeAssetReference} from "../../src/utils/image-manifest.ts";
import {renderMarkdown} from "../../src/lib/markdown/index.ts";

import type {
    BlogPostMeta,
    BlogPostHtmlPayload,
    CustomPageContent,
} from "../../src/types/post.ts";
import type {SearchIndexPayload, SearchIndexItem} from "../../src/types/search-index.ts";
import type {CompiledArtifacts, CompiledPostFile, CompiledCustomPage, RawMarkdownFile} from "./types.ts";

import {
    getMarkdownFiles,
    pathExists,
    splitFrontmatter,
    toSlug,
} from "./utils/fs-helpers.ts";
import {dedupeStyles, extractStripInlineStyles} from "./utils/style-utils.ts";
import {computeAggregates, extractExcerpt, extractHeadings, getReadingStats} from "./extractors/markdown-extractors.ts";
import {
    buildCnameContent,
    buildLlmsText,
    buildRobotsTxt,
    buildRssXml,
    buildSitemapXml,
} from "./writers/feed-writers.ts";
import {writeBundleHtmlInline, inlineRootData, applyPageMeta, escapeHtml} from "./writers/html-inline.ts";

export async function scanAndCompile(projectRoot: string): Promise<CompiledArtifacts> {
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
            } as RawMarkdownFile;
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
            } as CompiledPostFile;
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

export {writeBundleHtmlInline, inlineRootData, applyPageMeta, escapeHtml};
