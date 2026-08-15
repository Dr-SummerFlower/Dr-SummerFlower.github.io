export function xmlEscape(raw: string): string {
    return raw
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

export function escapeHtml(s: string): string {
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

export function hueToHex(hue: number): string {
    return oklchToHex(0.75, 0.12, Number.isFinite(hue) ? hue : 250);
}
