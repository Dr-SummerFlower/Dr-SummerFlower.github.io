import fsPromises from "node:fs/promises";
import path from "node:path";

import {frontmatterSchema} from "../types.ts";
import type {RawMarkdownFile} from "../types.ts";

import {parseYaml} from "./imports.ts";

export async function pathExists(targetPath: string): Promise<boolean> {
    try {
        await fsPromises.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

export async function getMarkdownFiles(dirPath: string): Promise<string[]> {
    if (!(await pathExists(dirPath))) {
        return [];
    }
    const entries = await fsPromises.readdir(dirPath, {withFileTypes: true});
    const files = await Promise.all(
        entries.map(async (entry) => {
            if (entry.name.startsWith(".")) {
                return [] as string[];
            }
            const entryPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                return getMarkdownFiles(entryPath);
            }
            return entry.name.endsWith(".md") ? [entryPath] : [];
        }),
    );
    return files.flat();
}

export function toSlug(filePath: string, dirRoot: string): string {
    return path.relative(dirRoot, filePath).replace(/\\/g, "/").replace(/\.md$/, "");
}

export function splitFrontmatter(fileContent: string) {
    if (!fileContent.startsWith("---")) {
        return {
            frontmatter: frontmatterSchema.parse({
                title: "Untitled",
                published: new Date().toISOString(),
            }),
            content: fileContent,
        };
    }
    const lines = fileContent.split(/\r?\n/);
    if (lines[0] !== "---") {
        throw new Error("Invalid frontmatter opening delimiter.");
    }
    let closingIndex = -1;
    for (let index = 1; index < lines.length; index += 1) {
        if (lines[index] === "---") {
            closingIndex = index;
            break;
        }
    }
    if (closingIndex === -1) {
        throw new Error("Frontmatter closing delimiter not found.");
    }
    const yamlText = lines.slice(1, closingIndex).join("\n");
    const content = lines.slice(closingIndex + 1).join("\n").trim();
    const parsedYaml = (parseYaml(yamlText) ?? {}) as Record<string, unknown>;
    return {
        frontmatter: frontmatterSchema.parse(parsedYaml),
        content,
    };
}

export function parseRawPostFile(
    filePath: string,
    postsRoot: string,
    fileContent: string,
): RawMarkdownFile {
    const {frontmatter, content} = splitFrontmatter(fileContent);
    return {
        slug: toSlug(filePath, postsRoot),
        sourcePath: filePath,
        frontmatter,
        content,
    };
}
