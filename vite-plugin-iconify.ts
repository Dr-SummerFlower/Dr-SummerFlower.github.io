import fsPromises from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";

import type {IconifyAlias, IconifyJSON, IconifyIcon} from "@iconify/types";
import type {Plugin, ResolvedConfig, ViteDevServer} from "vite";

const requireFn = createRequire(import.meta.url);

const VIRTUAL_ID = "virtual:iconify-registry";
const RESOLVED_ID = "\0" + VIRTUAL_ID;
const PLUGIN_LOG_PREFIX = "[iconify]";

const ICON_JSX_ATTR_RE = /icon\s*=\s*["']([a-zA-Z0-9-]+:[a-zA-Z0-9-_:]+?)["']/g;
const ICON_OBJECT_PROP_RE = /icon\s*:\s*["']([a-zA-Z0-9-]+:[a-zA-Z0-9-_:]+?)["']/g;
const STRING_LITERAL_CANDIDATE_RE = /["']([a-z][a-z0-9-]*:[a-zA-Z0-9-_:]{3,})["']/g;

const PREFIX_TO_COLLECTION_PACKAGE: Record<string, string> = {
    "material-symbols": "@iconify-json/material-symbols",
    "fa6-solid": "@iconify-json/fa6-solid",
    "fa6-brands": "@iconify-json/fa6-brands",
};

const NORMALIZE_BBOX_PREFIXES = new Set<string>(["fa6-solid", "fa6-brands"]);
const DEFAULT_BBOX_AREA_RATIO = 0.85;

type ScannedIcon = {
    id: string;
    prefix: string;
    name: string;
};

type BuildResult = {
    registry: string;
    icons: ScannedIcon[];
    collections: IconifyJSON[];
    missing: string[];
};

type ResolvedPackage = {
    collection: IconifyJSON;
    resolve: (name: string) => {resolved: string; data: IconifyIcon} | null;
};

function parseIconId(id: string): {prefix: string; name: string} | null {
    const idx = id.indexOf(":");
    if (idx <= 0) return null;
    return {prefix: id.slice(0, idx), name: id.slice(idx + 1)};
}

// ============== Path BBox tokenizer (linear/curve point hull approximation) =======
type Token = { type: "cmd" | "num"; value: string | number };
function tokenizePathD(d: string): Token[] {
    const tokens: Token[] = [];
    const re = /([A-Za-z])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(d)) !== null) {
        if (m[1] !== undefined) tokens.push({type: "cmd", value: m[1]});
        else if (m[2] !== undefined) tokens.push({type: "num", value: parseFloat(m[2])});
    }
    return tokens;
}
type BBox = { minX: number; minY: number; maxX: number; maxY: number };
function pathBBox(d: string): BBox | null {
    const tokens = tokenizePathD(d);
    if (tokens.length === 0) return null;
    let x = 0, y = 0;
    let sx = 0, sy = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const push = (ax: number, ay: number) => {
        if (!Number.isFinite(ax) || !Number.isFinite(ay)) return;
        if (ax < minX) minX = ax;
        if (ay < minY) minY = ay;
        if (ax > maxX) maxX = ax;
        if (ay > maxY) maxY = ay;
    };
    let i = 0;
    const num = (): number => i < tokens.length && tokens[i].type === "num" ? (tokens[i++].value as number) : NaN;
    while (i < tokens.length) {
        const t = tokens[i++];
        if (t.type !== "cmd") continue;
        let cmd = t.value as string;
        do {
            const upper = cmd.toUpperCase();
            const rel = (cmd !== upper);
            switch (upper) {
                case "M": {
                    const px = num(), py = num();
                    if (!Number.isFinite(px)) break;
                    if (rel) { x += px; y += py; } else { x = px; y = py; }
                    sx = x; sy = y; push(x, y);
                    cmd = rel ? "l" : "L";
                    continue;
                }
                case "L": {
                    const px = num(), py = num();
                    if (!Number.isFinite(px)) break;
                    if (rel) { x += px; y += py; } else { x = px; y = py; }
                    push(x, y); break;
                }
                case "H": {
                    const v = num();
                    if (!Number.isFinite(v)) break;
                    if (rel) x += v; else x = v;
                    push(x, y); break;
                }
                case "V": {
                    const v = num();
                    if (!Number.isFinite(v)) break;
                    if (rel) y += v; else y = v;
                    push(x, y); break;
                }
                case "C": {
                    const c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex = num(), ey = num();
                    if (!Number.isFinite(c1x)) break;
                    if (rel) { push(x + c1x, y + c1y); push(x + c2x, y + c2y); x += ex; y += ey; }
                    else { push(c1x, c1y); push(c2x, c2y); x = ex; y = ey; }
                    push(x, y); break;
                }
                case "S": {
                    const c2x = num(), c2y = num(), ex = num(), ey = num();
                    if (!Number.isFinite(c2x)) break;
                    if (rel) { push(x + c2x, y + c2y); x += ex; y += ey; }
                    else { push(c2x, c2y); x = ex; y = ey; }
                    push(x, y); break;
                }
                case "Q": {
                    const cx = num(), cy = num(), ex = num(), ey = num();
                    if (!Number.isFinite(cx)) break;
                    if (rel) { push(x + cx, y + cy); x += ex; y += ey; }
                    else { push(cx, cy); x = ex; y = ey; }
                    push(x, y); break;
                }
                case "T": {
                    const ex = num(), ey = num();
                    if (!Number.isFinite(ex)) break;
                    if (rel) { x += ex; y += ey; } else { x = ex; y = ey; }
                    push(x, y); break;
                }
                case "A": {
                    const rx = num(), ry = num(), _rot = num(), _la = num(), _sw = num(), ex = num(), ey = num();
                    if (!Number.isFinite(rx)) break;
                    let exa = ex, eya = ey;
                    if (rel) { exa = x + ex; eya = y + ey; }
                    push(x - rx, y - ry); push(x + rx, y + ry);
                    push(exa - rx, eya - ry); push(exa + rx, eya + ry);
                    push(x, y); x = exa; y = eya; push(x, y); break;
                }
                case "Z": case "z": {
                    x = sx; y = sy; push(x, y); break;
                }
            }
        } while (i < tokens.length && tokens[i].type === "num" && cmd.toUpperCase() !== "Z");
    }
    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX === maxX || minY === maxY) return null;
    return {minX, minY, maxX, maxY};
}

function bodyBBox(body: string): BBox | null {
    const dList: string[] = [];
    const re = /\bd\s*=\s*"([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) dList.push(m[1]);
    if (dList.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const d of dList) {
        const b = pathBBox(d);
        if (!b) continue;
        if (b.minX < minX) minX = b.minX;
        if (b.minY < minY) minY = b.minY;
        if (b.maxX > maxX) maxX = b.maxX;
        if (b.maxY > maxY) maxY = b.maxY;
    }
    if (!Number.isFinite(minX) || minX === maxX || minY === maxY) return null;
    return {minX, minY, maxX, maxY};
}

function normalizeIconViaBBox(
    prefix: string,
    icon: IconifyIcon,
    collectionW: number,
    collectionH: number,
    opts: { areaRatio?: number } = {},
): IconifyIcon {
    if (!NORMALIZE_BBOX_PREFIXES.has(prefix)) return icon;
    const areaRatio = opts.areaRatio ?? DEFAULT_BBOX_AREA_RATIO;
    const vbW = (icon.width as number | undefined) ?? collectionW;
    const vbH = (icon.height as number | undefined) ?? collectionH;
    if (!Number.isFinite(vbW) || !Number.isFinite(vbH) || vbW <= 0 || vbH <= 0) return icon;
    const bbox = bodyBBox(icon.body);
    if (!bbox) return icon;
    const bw = bbox.maxX - bbox.minX;
    const bh = bbox.maxY - bbox.minY;
    if (bw <= 0 || bh <= 0) return icon;
    // 目标：将图形缩放到占 viewBox 的 areaRatio 面积，居中
    // 缩放因子 s 取 min( (vbW*areaRatio)/bw , (vbH*areaRatio)/bh )，保证图形既不超宽也不超高
    const s = Math.min(
        (vbW * areaRatio) / bw,
        (vbH * areaRatio) / bh,
    );
    if (!Number.isFinite(s) || s <= 0) return icon;
    const cx = bbox.minX + bw / 2;
    const cy = bbox.minY + bh / 2;
    const newCx = vbW / 2;
    const newCy = vbH / 2;
    // 变换：先平移使图形中心到原点 (0,0) → scale s → 再平移回到 viewBox 中心
    // 整体 M' = translate(newCx - s*cx, newCy - s*cy) ∘ scale(s)
    const dx = newCx - s * cx;
    const dy = newCy - s * cy;
    // 包裹原 body 所有 SVG 子标签
    const wrapped = `<g transform="translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${s.toFixed(6)})">${icon.body}</g>`;
    const out: IconifyIcon = {...icon, body: wrapped};
    return out;
}

function loadCollectionPackage(prefix: string): ResolvedPackage | null {
    const pkg = PREFIX_TO_COLLECTION_PACKAGE[prefix];
    if (!pkg) return null;
    const mod = requireFn(requireFn.resolve(`${pkg}/icons.json`));
    const collection = ((mod.default ?? mod) as IconifyJSON);
    if (!collection || !collection.icons || typeof collection.icons !== "object") return null;
    const collectionW = collection.width ?? 24;
    const collectionH = collection.height ?? 24;

    const resolve = (name: string): {resolved: string; data: IconifyIcon} | null => {
        const direct = collection.icons[name] as IconifyIcon | IconifyAlias | undefined;
        if (direct) {
            if ("body" in direct && typeof (direct as unknown as IconifyIcon).body === "string") {
                const icon = direct as IconifyIcon;
                return {
                    resolved: name,
                    data: normalizeIconViaBBox(prefix, icon, collectionW, collectionH),
                };
            }
            if ("parent" in direct && typeof (direct as unknown as IconifyAlias).parent === "string") {
                const parentName = (direct as unknown as IconifyAlias).parent;
                const parent = collection.icons[parentName] as IconifyIcon | undefined;
                if (parent && "body" in parent && typeof parent.body === "string") {
                    return {
                        resolved: parentName,
                        data: normalizeIconViaBBox(prefix, parent, collectionW, collectionH),
                    };
                }
            }
            return null;
        }
        if (collection.aliases) {
            const alias = collection.aliases[name] as IconifyAlias | undefined;
            if (alias && typeof alias.parent === "string") {
                const parent = collection.icons[alias.parent] as IconifyIcon | undefined;
                if (parent && "body" in parent && typeof parent.body === "string") {
                    return {
                        resolved: alias.parent,
                        data: normalizeIconViaBBox(prefix, parent, collectionW, collectionH),
                    };
                }
            }
        }
        return null;
    };

    return {collection, resolve};
}

async function collectSourceFiles(root: string): Promise<string[]> {
    const srcRoot = path.join(root, "src");
    try {
        await fsPromises.access(srcRoot);
    } catch {
        return [];
    }
    const result: string[] = [];
    const walk = async (dir: string) => {
        const entries = await fsPromises.readdir(dir, {withFileTypes: true});
        for (const entry of entries) {
            if (entry.name.startsWith(".")) continue;
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(entryPath);
            } else if (
                entry.name.endsWith(".ts") ||
                entry.name.endsWith(".tsx") ||
                entry.name.endsWith(".js") ||
                entry.name.endsWith(".jsx")
            ) {
                result.push(entryPath);
            }
        }
    };
    await walk(srcRoot);
    return result;
}

function extractIconsFromContent(content: string): ScannedIcon[] {
    const collected = new Map<string, ScannedIcon>();
    const push = (id: string) => {
        if (collected.has(id)) return;
        const parsed = parseIconId(id);
        if (!parsed) return;
        if (!(parsed.prefix in PREFIX_TO_COLLECTION_PACKAGE)) return;
        collected.set(id, {id, prefix: parsed.prefix, name: parsed.name});
    };
    for (const m of content.matchAll(ICON_JSX_ATTR_RE)) push(m[1]);
    for (const m of content.matchAll(ICON_OBJECT_PROP_RE)) push(m[1]);
    for (const m of content.matchAll(STRING_LITERAL_CANDIDATE_RE)) push(m[1]);
    return Array.from(collected.values());
}

async function buildIconCollections(
    icons: ScannedIcon[],
): Promise<{collections: IconifyJSON[]; missing: string[]; widths: Array<{prefix: string; iconCount: number; vbSpec: string; normalizedCount: number}>}> {
    const byPrefix = new Map<string, ScannedIcon[]>();
    for (const icon of icons) {
        const list = byPrefix.get(icon.prefix) ?? [];
        list.push(icon);
        byPrefix.set(icon.prefix, list);
    }
    const collections: IconifyJSON[] = [];
    const missing: string[] = [];
    const widths: Array<{prefix: string; iconCount: number; vbSpec: string; normalizedCount: number}> = [];
    for (const [prefix, list] of byPrefix.entries()) {
        const pkg = loadCollectionPackage(prefix);
        if (!pkg) {
            for (const item of list) missing.push(item.id);
            continue;
        }
        const newIcons: Record<string, IconifyIcon> = Object.create(null);
        let normalizedCount = 0;
        const vbSpecs = new Set<string>();
        for (const item of list) {
            const res = pkg.resolve(item.name);
            if (res) {
                newIcons[item.name] = res.data;
                // <g transform=... 开头的说明是我们包过的
                if (res.data.body.startsWith("<g ")) normalizedCount++;
                const vbW = ((res.data.width as number | undefined) ?? pkg.collection.width ?? 24);
                const vbH = ((res.data.height as number | undefined) ?? pkg.collection.height ?? 24);
                vbSpecs.add(`${vbW}×${vbH}`);
            } else {
                missing.push(item.id);
            }
        }
        const iconList = Object.keys(newIcons);
        if (iconList.length > 0) {
            const baseCol = pkg.collection;
            const built: IconifyJSON = {
                prefix,
                width: baseCol.width ?? 24,
                height: baseCol.height ?? 24,
                left: baseCol.left ?? 0,
                top: baseCol.top ?? 0,
                icons: newIcons,
            };
            collections.push(built);
            widths.push({
                prefix,
                iconCount: iconList.length,
                vbSpec: Array.from(vbSpecs).sort().join(";"),
                normalizedCount,
            });
        }
    }
    return {collections, missing, widths};
}

function renderRegistryModule(collections: IconifyJSON[]): string {
    const chunks: string[] = [];
    chunks.push(`import { addCollection } from "@iconify/react";`);
    chunks.push("");
    for (const col of collections) {
        chunks.push(`addCollection(${JSON.stringify(col)});`);
    }
    chunks.push("");
    return chunks.join("\n");
}

function formatMissingList(missing: string[]): string {
    return missing.map((id) => `• ${id}`).join("\n  ");
}

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
