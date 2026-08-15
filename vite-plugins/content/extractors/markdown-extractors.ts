import remarkParse from "remark-parse";
import {toString} from "mdast-util-to-string";
import getReadingTime from "reading-time";
import {unified} from "unified";
import GithubSlugger from "github-slugger";

import type {HeadingItem} from "../../../src/types/post.ts";
import type {CountItem, YearlyArchive, BlogPostMeta} from "../../../src/types/post.ts";
import type {ArchiveGroupItem} from "../../../src/types/post.ts";
import {normalizeCategory} from "../../../src/utils/common-utils.ts";
import {decodeHtml} from "../../../src/utils/common-utils.ts";

export function getReadingStats(content: string) {
    const tree = unified().use(remarkParse).parse(content);
    const plainText = toString(tree);
    const readingTime = getReadingTime(plainText);
    return {
        words: readingTime.words,
        readingMinutes: Math.max(1, Math.round(readingTime.minutes)),
    };
}

export function extractExcerpt(content: string, frontmatterDescription: string): string {
    if (frontmatterDescription.trim()) {
        return frontmatterDescription.trim();
    }
    const cleaned = content
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.slice(0, 140);
}

export function extractHeadings(markdown: string): HeadingItem[] {
    const slugger = new GithubSlugger();
    const headings: HeadingItem[] = [];
    const lines = markdown.split(/\r?\n/);
    for (const line of lines) {
        const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (!match) {
            continue;
        }
        const text = decodeHtml(
            match[2]
                .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
                .replace(/`([^`]*)`/g, "$1")
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/\*(.*?)\*/g, "$1")
                .trim(),
        );
        headings.push({
            depth: match[1].length,
            slug: slugger.slug(text),
            text,
        });
    }
    return headings;
}

export function computeAggregates(postsMeta: BlogPostMeta[]): {
    categories: CountItem[];
    tags: CountItem[];
    archiveGroups: ArchiveGroupItem[];
    yearlyArchive: YearlyArchive[];
} {
    const categoryCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const monthGroups = new Map<string, BlogPostMeta[]>();
    const yearGroups = new Map<number, BlogPostMeta[]>();

    for (const post of postsMeta) {
        const cat = normalizeCategory(post.category);
        categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
        for (const tag of post.tags) {
            const t = tag.trim();
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        }
        const d = new Date(post.published);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const mKey = `${y}-${String(m).padStart(2, "0")}`;
        const cur = monthGroups.get(mKey) ?? [];
        cur.push(post);
        monthGroups.set(mKey, cur);
        const yCur = yearGroups.get(y) ?? [];
        yCur.push(post);
        yearGroups.set(y, yCur);
    }

    const categories = Array.from(categoryCounts.entries())
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    const tags = Array.from(tagCounts.entries())
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    const archiveGroups = Array.from(monthGroups.entries())
        .map(([key, items]) => ({
            key,
            year: Number(key.slice(0, 4)),
            month: Number(key.slice(5, 7)),
            items,
        }))
        .sort((a, b) => b.key.localeCompare(a.key));
    const yearlyArchive = Array.from(yearGroups.entries())
        .map(([year, items]) => ({year, items}))
        .sort((a, b) => b.year - a.year);

    return {categories, tags, archiveGroups, yearlyArchive};
}
