import type {LocaleDefinition, LocaleRegistry} from "@/i18n/types";

type LocaleModule = {
    default: LocaleDefinition;
};

const rawModules = import.meta.glob<LocaleModule>("./*.ts", {
    eager: true,
    query: "?locale-module",
});

const registry: LocaleDefinition[] = [];
const seen = new Set<string>();

for (const [path, mod] of Object.entries(rawModules)) {
    if (path.includes("_registry")) continue;
    const def = mod.default;
    if (!def || !def.code) continue;
    const code = def.code.toLowerCase();
    if (seen.has(code)) continue;
    seen.add(code);
    registry.push(def);
}

const defaultEntry = registry.find((l) => l.isDefault) ?? registry[0];
if (!defaultEntry) {
    throw new Error(
        "[i18n] No locale files found under src/i18n/locales/*.ts (export default LocaleDefinition).",
    );
}

export const LOCALE_REGISTRY: LocaleRegistry = Object.freeze(registry);

export const LOCALE_CODE_LIST: readonly string[] = Object.freeze(
    LOCALE_REGISTRY.map((l) => l.code),
);

export const DEFAULT_LOCALE_DEF: LocaleDefinition = defaultEntry;

export const DEFAULT_LOCALE_CODE: string = defaultEntry.code;

export function getLocaleDefinition(code: string): LocaleDefinition | undefined {
    const target = code.toLowerCase();
    return LOCALE_REGISTRY.find((l) => l.code.toLowerCase() === target);
}
