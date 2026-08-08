import type {Root} from "mdast";
import {toString} from "mdast-util-to-string";
import remarkParse from "remark-parse";
import {unified} from "unified";

export function markdownToPlainTextForSearch(markdown: string): string {
    const tree = unified().use(remarkParse).parse(markdown) as Root;
    const raw = toString(tree);
    return raw.replace(/\s+/g, " ").trim();
}
