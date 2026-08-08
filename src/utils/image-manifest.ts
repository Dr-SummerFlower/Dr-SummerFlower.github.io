import path from "node:path";
import {withSiteBasePath} from "../config.ts";

function toPosix(filePath: string) {
    return filePath.replace(/\\/g, "/");
}

export function normalizeAssetReference(
    reference: string,
    sourcePath?: string,
    publicRoot?: string,
): string {
    if (!reference) {
        return "";
    }

    if (reference.startsWith("http://") || reference.startsWith("https://")) {
        return reference;
    }

    if (reference.startsWith("/")) {
        return withSiteBasePath(reference);
    }

    if (!sourcePath || !publicRoot) {
        return reference;
    }

    const absolutePath = path.resolve(path.dirname(sourcePath), reference);
    const rel = toPosix(path.relative(publicRoot, absolutePath));
    if (rel && !rel.startsWith("..")) {
        return withSiteBasePath(`/${rel}`);
    }

    return reference;
}
