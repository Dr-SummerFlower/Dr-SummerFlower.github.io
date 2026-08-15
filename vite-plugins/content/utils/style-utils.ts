export function extractStripInlineStyles(html: string): {cleanedHtml: string; styleChunks: string[]} {
    const styleChunks: string[] = [];
    const cleanedHtml = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_0, body) => {
        styleChunks.push(String(body).trim());
        return "";
    });
    return {cleanedHtml, styleChunks};
}

export function dedupeStyles(chunks: string[]): string {
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
