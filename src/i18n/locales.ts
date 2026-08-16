import {
    DEFAULT_LOCALE_CODE,
    LOCALE_CODE_LIST,
    LOCALE_REGISTRY,
} from "@/i18n/locales/_registry";
import type {LocaleDefinition} from "@/i18n/types";

const SUPPORTED_LOCALES = LOCALE_CODE_LIST as readonly string[];

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: SupportedLocale = DEFAULT_LOCALE_CODE as SupportedLocale;

function buildAliasMap(): Record<string, SupportedLocale> {
    const map: Record<string, SupportedLocale> = {};
    for (const loc of LOCALE_REGISTRY) {
        const code = loc.code as SupportedLocale;
        const normalizedCode = normalizeLocale(loc.code);
        map[normalizedCode] = code;
        map[loc.code] = code;
        if (loc.aliases?.length) {
            for (const alias of loc.aliases) {
                map[normalizeLocale(alias)] = code;
                map[alias] = code;
            }
        }
    }
    return map;
}

const localeAliasMap: Record<string, SupportedLocale> = buildAliasMap();

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

export function getSupportedLocaleDefinition(
    code: SupportedLocale,
): LocaleDefinition | undefined {
    return LOCALE_REGISTRY.find((l) => l.code === code);
}

export {SUPPORTED_LOCALES, DEFAULT_LOCALE, localeAliasMap};
export type {SupportedLocale};
