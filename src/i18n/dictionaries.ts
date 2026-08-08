import {resolveLocale, type SupportedLocale} from "@/i18n/locales";
import {enUS} from "@/i18n/locales/en-US";
import {zhCN} from "@/i18n/locales/zh-CN";
import type {Dictionary} from "@/i18n/types";

const dictionaryMap: Record<SupportedLocale, Dictionary> = {
    "zh-CN": zhCN,
    "en-US": enUS,
};

export function getDictionary(lang: string): Dictionary {
    const locale = resolveLocale(lang);
    return dictionaryMap[locale];
}
