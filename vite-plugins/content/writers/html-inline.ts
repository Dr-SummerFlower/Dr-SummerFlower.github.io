import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import type {ResolvedConfig} from "vite";
import {blogConfig} from "../../../src/config.ts";
import {seoConfig} from "../../../src/lib/config/derived.config.ts";
import {hueToHex, escapeHtml} from "./../utils/color-utils.ts";
import type {CompiledArtifacts} from "../types.ts";
import type {HeadingItem} from "../../../src/types/post.ts";

export function inlineRootData(a: CompiledArtifacts, id: string, data: unknown): string {
    const raw = JSON.stringify(data);
    const safe = raw
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e");
    return `<script type="application/json" data-inline-id="${id}">${safe}</script>`;
}

export function injectBeforeBodyEnd(src: string, chunks: string[]): string {
    if (chunks.length === 0) return src;
    const idx = src.lastIndexOf("</body>");
    const start = src.lastIndexOf("<!--INL");
    const payload = "<!--INLINE_START-->" + chunks.join("") + "<!--INLINE_END-->" + "</body>";
    return idx >= 0
        ? src.slice(0, idx) + payload
        : (start >= 0 ? src.slice(0, start) + payload : src);
}

const titleRe = /<title>[\s\S]*?<\/title>/;
const descRe = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i;
const themeColorRe = /<meta\s+name="theme-color"\s+content="[^"]*"\s*\/?>/i;
const ogTitleRe = /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i;
const ogDescRe = /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i;

export function applyPageMeta(doc: string, title: string, description: string, hueHex: string): string {
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
}

export {escapeHtml} from "./../utils/color-utils.ts";

export async function writeBundleHtmlInline(
    resolved: ResolvedConfig,
    projectRoot: string,
    artifacts: CompiledArtifacts,
): Promise<string> {
    const a = artifacts;
    const outDir = resolved.build.outDir || "dist";
    const distPath = path.isAbsolute(outDir) ? outDir : path.join(projectRoot, outDir);
    const indexPath = path.join(distPath, "index.html");
    const notFoundPath = path.join(distPath, "404.html");
    let baseHtmlSnapshot = "";
    try {
        if (fs.existsSync(indexPath)) {
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
                customPages: a.customPagesMeta.map((cp: {slug: string; title: string; description: string; headings: HeadingItem[]}) => {
                    const {slug, title, description} = cp;
                    return {slug, title, description};
                }),
            };
            const inlineRootChunk = (() => inlineRootData(a, "root", {kind: "meta", value: metaBundle}))();
            const inlineScript = (id: string, data: unknown) => inlineRootData(a, id, data);

            const indexWithMeta = applyPageMeta(baseHtml, defaultTitle, defaultDescription, themeColorHex);
            await fsPromises.writeFile(indexPath, injectBeforeBodyEnd(indexWithMeta, [inlineRootChunk]), "utf8");
            await fsPromises.writeFile(notFoundPath, indexWithMeta, "utf8");

            for (const meta of a.postsMeta) {
                const payload = a.postsHtmlBySlug.get(meta.slug);
                if (!payload) continue;
                const routeDir = path.join(distPath, "posts", meta.slug);
                await fsPromises.mkdir(routeDir, {recursive: true});
                const title = `${meta.title} - ${seoConfig.defaultTitle}`;
                const description = meta.description || defaultDescription;
                const doc = applyPageMeta(baseHtml, title, description, themeColorHex);
                const chunks = [
                    inlineRootChunk,
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
                const doc = applyPageMeta(baseHtml, title, description, themeColorHex);
                await fsPromises.writeFile(
                    path.join(routeDir, "index.html"),
                    injectBeforeBodyEnd(doc, [
                        inlineRootChunk,
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
                const doc = applyPageMeta(baseHtml, title, description, themeColorHex);
                await fsPromises.writeFile(
                    path.join(routeDir, "index.html"),
                    injectBeforeBodyEnd(doc, [
                        inlineRootChunk,
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
    return baseHtmlSnapshot;
}
