import {siteConfig} from "@/lib/config/derived.config.ts";
import {resolveLocale, type SupportedLocale} from "@/i18n/locales";
import {LOCALE_REGISTRY, DEFAULT_LOCALE_DEF} from "@/i18n/locales/_registry";
import type {Dictionary, I18nKey, LocaleDefinition, TranslationParams} from "@/i18n/types";

const dictionaryMap: Record<string, Dictionary> = LOCALE_REGISTRY.reduce(
    (acc, loc: LocaleDefinition) => {
        acc[loc.code] = loc.dictionary;
        return acc;
    },
    {} as Record<string, Dictionary>,
);

export function getDictionary(lang: string): Dictionary {
    const locale = resolveLocale(lang);
    return dictionaryMap[locale] ?? DEFAULT_LOCALE_DEF.dictionary;
}

function getByPath(obj: unknown, path: string): string {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== "object") {
            return `{${path}}`;
        }
        current = (current as Record<string, unknown>)[key];
    }
    if (typeof current !== "string") {
        return `{${path}}`;
    }
    return current;
}

function formatMessage(template: string, params?: TranslationParams): string {
    if (!params) {
        return template;
    }
    return template.replace(/\{(\w+)\}/g, (_, paramKey: string) => {
        const value = params[paramKey];
        return value === undefined ? `{${paramKey}}` : String(value);
    });
}

export function createTranslator(lang: string) {
    const dictionary = getDictionary(lang);
    return (key: I18nKey, params?: TranslationParams): string =>
        formatMessage(getByPath(dictionary, key), params);
}

export function t(
    key: I18nKey,
    params?: TranslationParams,
    lang: SupportedLocale | string = siteConfig.lang,
): string {
    return createTranslator(lang)(key, params);
}
