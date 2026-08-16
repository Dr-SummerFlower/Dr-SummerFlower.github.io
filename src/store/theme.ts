import {create} from "zustand";
import {persist} from "zustand/middleware";
import {siteConfig} from "@/lib/config/derived.config.ts";

export type ThemeMode = "light" | "dark" | "auto";

function normalizeHue(hue: number): number {
    return Math.max(0, Math.min(360, Math.round(hue)));
}

function _clamp(num: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, num));
}

function _oklchToHex(l: number, c: number, h: number): string {
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
    const r = Math.round(_clamp(255 * (R <= 0.0031308 ? 12.92 * R : 1.055 * Math.pow(R, 1 / 2.4) - 0.055), 0, 255));
    const g = Math.round(_clamp(255 * (G <= 0.0031308 ? 12.92 * G : 1.055 * Math.pow(G, 1 / 2.4) - 0.055), 0, 255));
    const b2 = Math.round(_clamp(255 * (B <= 0.0031308 ? 12.92 * B : 1.055 * Math.pow(B, 1 / 2.4) - 0.055), 0, 255));
    return "#" + [r, g, b2].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function hueToHex(hue: number): string {
    return _oklchToHex(0.75, 0.12, Number.isFinite(hue) ? hue : 250);
}

type ThemeState = {
    mode: ThemeMode;
    hue: number;
    bannerDismissed: boolean;
    setMode: (mode: ThemeMode) => void;
    cycleMode: () => void;
    setHue: (hue: number) => void;
    resetHue: () => void;
    setBannerDismissed: (value: boolean) => void;
    applyToDom: () => void;
    initOnHydrate: () => void;
};

function isDarkFor(mode: ThemeMode): boolean {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: siteConfig.defaultThemeMode,
            hue: siteConfig.themeColor.hue,
            bannerDismissed: false,
            setMode: (mode) => {
                set({mode});
                get().applyToDom();
            },
            cycleMode: () => {
                const order: ThemeMode[] = ["light", "dark", "auto"];
                const idx = order.indexOf(get().mode);
                const next = order[(idx + 1) % order.length];
                set({mode: next});
                get().applyToDom();
            },
            setHue: (hue) => {
                const next = siteConfig.themeColor.fixed
                    ? siteConfig.themeColor.hue
                    : normalizeHue(hue);
                set({hue: next});
                get().applyToDom();
            },
            resetHue: () => {
                const defaultHue = siteConfig.themeColor.hue;
                set({hue: defaultHue});
                get().applyToDom();
            },
            setBannerDismissed: (value) => set({bannerDismissed: value}),
            applyToDom: () => {
                if (typeof document === "undefined") return;
                const root = document.documentElement;
                const {mode, hue} = get();
                root.classList.toggle("dark", isDarkFor(mode));
                const finalHue = siteConfig.themeColor.fixed ? siteConfig.themeColor.hue : hue;
                root.style.setProperty("--hue", String(finalHue));
                const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
                if (themeColorMeta) {
                    themeColorMeta.setAttribute("content", hueToHex(finalHue));
                }
            },
            initOnHydrate: () => {
                get().applyToDom();
                if (typeof window === "undefined") return;
                const mql = window.matchMedia("(prefers-color-scheme: dark)");
                const listener = () => {
                    if (get().mode === "auto") get().applyToDom();
                };
                mql.addEventListener?.("change", listener);
            },
        }),
        {
            name: "summer-blog-theme-v1",
            partialize: (state) => ({
                mode: state.mode,
                hue: state.hue,
                bannerDismissed: state.bannerDismissed,
            }),
        },
    ),
);
