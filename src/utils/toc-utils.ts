import type {HeadingItem} from "../types/post";

export type NumberedHeadingItem = HeadingItem & {
    level: number;
    marker: string;
};

export function filterTocHeadings(
    headings: HeadingItem[],
    maxDepth: number,
): HeadingItem[] {
    if (headings.length === 0) {
        return [];
    }

    const minDepth = Math.min(...headings.map((heading) => heading.depth));
    return headings.filter((heading) => heading.depth < minDepth + maxDepth);
}

function toAlpha(value: number) {
    let current = value;
    let result = "";
    while (current > 0) {
        current -= 1;
        result = String.fromCharCode(97 + (current % 26)) + result;
        current = Math.floor(current / 26);
    }
    return result;
}

export function buildNumberedTocHeadings(
    headings: HeadingItem[],
    maxDepth: number,
): NumberedHeadingItem[] {
    const normalizedDepth = Math.min(Math.max(maxDepth, 1), 3);
    const filtered = filterTocHeadings(headings, normalizedDepth);
    if (filtered.length === 0) {
        return [];
    }

    const minDepth = Math.min(...filtered.map((heading) => heading.depth));
    const counters = [0, 0, 0];

    return filtered.map((heading) => {
        const level = Math.min(Math.max(heading.depth - minDepth, 0), 2);
        counters[level] += 1;
        for (let index = level + 1; index < counters.length; index += 1) {
            counters[index] = 0;
        }

        let marker: string;
        if (level === 0) {
            marker = String(counters[0]);
        } else if (level === 1) {
            marker = `${counters[1]})`;
        } else {
            marker = toAlpha(counters[2]);
        }

        return {
            ...heading,
            level,
            marker,
        };
    });
}
