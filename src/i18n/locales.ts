export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: SupportedLocale = "zh-CN";

const localeAliasMap: Record<string, SupportedLocale> = {
    zh: "zh-CN",
    "zh-cn": "zh-CN",
    zh_cn: "zh-CN",
    en: "en-US",
    "en-us": "en-US",
    en_us: "en-US",
    "en-gb": "en-US",
    en_gb: "en-US",
    "en-au": "en-US",
    en_au: "en-US",
};

export function normalizeLocale(locale: string): string {
    return locale.trim().toLowerCase().replaceAll("_", "-");
}

export function resolveLocale(locale: string | undefined | null): SupportedLocale {
    if (!locale) {
        return DEFAULT_LOCALE;
    }

    const normalized = normalizeLocale(locale);
    return localeAliasMap[normalized] ?? DEFAULT_LOCALE;
}

export {DEFAULT_LOCALE};
