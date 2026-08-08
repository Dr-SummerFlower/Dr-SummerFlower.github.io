import {siteConfig} from "@/config";
import {getDictionary} from "@/i18n/dictionaries";
import type {I18nKey, TranslationParams} from "@/i18n/types";

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

    return (key: I18nKey, params?: TranslationParams) =>
        formatMessage(dictionary[key], params);
}

export function t(key: I18nKey, params?: TranslationParams, lang = siteConfig.lang) {
    return createTranslator(lang)(key, params);
}
