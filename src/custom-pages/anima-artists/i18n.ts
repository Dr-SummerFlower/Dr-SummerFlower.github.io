import {t} from "@/i18n";
import {siteConfig} from "@/lib/config/derived.config.ts";
import {resolveLocale, type SupportedLocale} from "@/i18n/locales";

export const localDict = {
    "zh-CN": {
        title: "画师精选",
        description: "ComfyUI 画师画风预览，支持一键复制画师名称。",
        subtitle:
            "按独特值降序排列，点击图片放大预览，点击按钮可一键复制画师名称到剪贴板。",
        uniqueness: "独特值：",
        copy: "复制",
        copyName: "复制画师名称",
        copied: "已复制",
        loadFailed: "画师数据加载失败，请稍后刷新重试。",
        preview: "预览图",
    },
    "en-US": {
        title: "Artist Gallery",
        description:
            "Preview ComfyUI artist styles with one-click copy artist name.",
        subtitle:
            "Sorted by uniqueness score (descending). Click an image to zoom in, or use the button to copy the artist name.",
        uniqueness: "Uniqueness: ",
        copy: "Copy",
        copyName: "Copy artist name",
        copied: "Copied",
        loadFailed: "Failed to load artist data. Please refresh and try again.",
        preview: "Preview",
    },
};

type LocalKey = keyof typeof localDict["zh-CN"];

function formatLocal(template: string, params?: Record<string, string | number>): string {
    if (!params) {
        return template;
    }
    return template.replace(/\{(\w+)\}/g, (_, paramKey: string) => {
        const value = params[paramKey];
        return value === undefined ? `{${paramKey}}` : String(value);
    });
}

export function useLocalAnimaT(): (
    key: LocalKey,
    params?: Record<string, string | number>,
) => string {
    const lang = resolveLocale(siteConfig.lang) as SupportedLocale;
    return (key: LocalKey, params?: Record<string, string | number>): string => {
        const globalKey = `animaArtists.${key}` as const;
        const globalResult = t(globalKey as any, params, lang);
        const isPlaceholder =
            globalResult.startsWith("{") && globalResult.endsWith("}");
        if (isPlaceholder) {
            const dictKey = lang in localDict ? (lang as keyof typeof localDict) : "zh-CN";
            const fallback = localDict[dictKey][key] ?? localDict["zh-CN"][key];
            return formatLocal(fallback, params);
        }
        return globalResult;
    };
}
