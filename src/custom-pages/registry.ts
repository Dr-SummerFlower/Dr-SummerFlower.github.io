import type {ComponentType} from "react";
import type {ComponentCustomPage} from "@/types/config";

const customPageModules = import.meta.glob<{ default: ComponentType }>(
    "/src/custom-pages/*/index.tsx",
);

export function getCustomPageLoader(
    componentId: string,
): (() => Promise<{ default: ComponentType }>) | null {
    const key = `/src/custom-pages/${componentId}/index.tsx`;
    const loader = customPageModules[key];
    return loader ?? null;
}

export function resolveCustomPageComponentId(page: ComponentCustomPage): string {
    return page.componentId ?? page.slug;
}
