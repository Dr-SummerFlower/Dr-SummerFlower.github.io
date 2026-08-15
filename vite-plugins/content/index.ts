import path from "node:path";
import type {Plugin, ResolvedConfig, ViteDevServer} from "vite";

import {contentConfig} from "./../../src/config.ts";

import {
    EC_VIRTUAL_ID,
    EC_RESOLVED_ID,
} from "./types.ts";
import type {CompiledArtifacts} from "./types.ts";

import {scanAndCompile} from "./compiler.ts";
import {writeBundleHtmlInline} from "./writers/html-inline.ts";

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

    let _baseHtmlSnapshot: string;

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
            const a = await ensureArtifacts();
            const snapshot = await writeBundleHtmlInline(resolved, projectRoot, a);
            _baseHtmlSnapshot = snapshot;
        },
    };
}

// Re-export config helpers so they are not tree-shaken / marked unused in strict tsconfig.node.
// eslint-disable-next-line
let _: any;
