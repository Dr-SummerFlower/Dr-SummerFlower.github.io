import path from "node:path";
import type {Plugin, ResolvedConfig, ViteDevServer} from "vite";

import {
    VIRTUAL_ID,
    RESOLVED_ID,
    PLUGIN_LOG_PREFIX,
    parseIconId,
} from "./types.js";
import type {
    BuildResult,
    ScannedIcon,
} from "./types.js";
import {
    collectSourceFiles,
    extractIconsFromContent,
    buildIconCollections,
    renderRegistryModule,
    formatMissingList,
} from "./scanner.js";

type ScanCache = {
    result: BuildResult | null;
};

export default function iconifyPlugin(): Plugin {
    let resolved: ResolvedConfig;
    let projectRoot: string;
    let printedSummary = false;
    const cache: ScanCache = {result: null};

    async function buildRegistryInternal(): Promise<BuildResult> {
        if (cache.result) return cache.result;
        const sourceFiles = await collectSourceFiles(projectRoot);
        const all = await Promise.all(
            sourceFiles.map(async (file) => {
                const content = await fsPromises.readFile(file, "utf8");
                return extractIconsFromContent(content);
            }),
        );
        const mergedMap = new Map<string, ScannedIcon>();
        for (const list of all) {
            for (const item of list) {
                if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
            }
        }
        const icons = Array.from(mergedMap.values());
        const {collections, missing, widths} = await buildIconCollections(icons);
        (cache as ScanCache & {widths?: unknown}).widths = widths;
        const result: BuildResult = {
            icons,
            collections,
            missing,
            registry: renderRegistryModule(collections),
        };
        cache.result = result;
        return result;
    }

    function invalidate() {
        cache.result = null;
        delete (cache as ScanCache & {widths?: unknown}).widths;
        printedSummary = false;
    }

    function printSummary(
        ctx: {warn: (msg: string) => void},
        result: BuildResult,
        mode: "build" | "dev",
    ) {
        if (printedSummary) return;
        printedSummary = true;

        const widths = (cache as ScanCache & {widths?: Array<{prefix: string; iconCount: number; vbSpec: string; normalizedCount: number}>}).widths ?? [];
        const collectionSummary = widths
            .map((s) => `${s.prefix}×${s.iconCount}[${s.vbSpec},norm×${s.normalizedCount}]`)
            .join(" / ");
        const tag = mode === "build" ? "build" : "dev";
        const parts = [
            `扫描 ${result.icons.length} 个图标`,
            `${result.collections.length} 个集合 (${collectionSummary || "-"})`,
        ];
        console.info(`${PLUGIN_LOG_PREFIX} [${tag}] ${parts.join(" · ")}`);

        if (result.missing.length > 0) {
            const body = formatMissingList(result.missing);
            ctx.warn(
                `${PLUGIN_LOG_PREFIX} 有 ${result.missing.length} 个图标在本地 @iconify-json/* 集合内找不到：\n  ${body}\n  请检查图标名拼写或补齐对应的 @iconify-json/* 开发依赖。`,
            );
        }
    }

    return {
        name: "vite-plugin-iconify",
        configResolved(cfg) {
            resolved = cfg;
            projectRoot = cfg.root;
        },
        resolveId(id) {
            if (id === VIRTUAL_ID) return RESOLVED_ID;
            return null;
        },
        async load(id) {
            if (id !== RESOLVED_ID) return null;
            const result = await buildRegistryInternal();
            printSummary(this, result, resolved.command === "build" ? "build" : "dev");
            return result.registry;
        },
        async buildStart() {
            const result = await buildRegistryInternal();
            printSummary(this, result, resolved.command === "build" ? "build" : "dev");
        },
        configureServer(server: ViteDevServer) {
            const srcRoot = path.join(projectRoot, "src");
            const onChange = (file: string) => {
                if (!file.startsWith(srcRoot)) return;
                if (
                    !file.endsWith(".ts") &&
                    !file.endsWith(".tsx") &&
                    !file.endsWith(".js") &&
                    !file.endsWith(".jsx")
                ) {
                    return;
                }
                invalidate();
                const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
                if (mod) server.moduleGraph.invalidateModule(mod);
                server.ws.send({type: "full-reload"});
            };
            server.watcher.on("add", onChange);
            server.watcher.on("change", onChange);
            server.watcher.on("unlink", onChange);
        },
    };
}

import fsPromises from "node:fs/promises";

export {parseIconId};
