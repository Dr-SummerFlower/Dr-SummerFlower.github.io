import type {IconifyIcon} from "@iconify/types";
import {NORMALIZE_BBOX_PREFIXES, DEFAULT_BBOX_AREA_RATIO, parseIconId} from "./types.js";

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

export function normalizeIconViaBBox(
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
    const s = Math.min(
        (vbW * areaRatio) / bw,
        (vbH * areaRatio) / bh,
    );
    if (!Number.isFinite(s) || s <= 0) return icon;
    const cx = bbox.minX + bw / 2;
    const cy = bbox.minY + bh / 2;
    const newCx = vbW / 2;
    const newCy = vbH / 2;
    const dx = newCx - s * cx;
    const dy = newCy - s * cy;
    const wrapped = `<g transform="translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${s.toFixed(6)})">${icon.body}</g>`;
    const out: IconifyIcon = {...icon, body: wrapped};
    return out;
}

export {parseIconId};
