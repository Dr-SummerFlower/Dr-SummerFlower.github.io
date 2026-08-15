import type {Plugin} from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeExpressiveCode from "rehype-expressive-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import {unified} from "unified";

import {expressiveCodeOptions} from "./expressive-code.config.ts";
import {assetLinksTransformer} from "./plugins/remark-asset-links.ts";
import {remarkCustomDirectives} from "./plugins/remark-directives.ts";
import {rehypeLazyImage} from "./plugins/rehype-lazy-image.ts";

export {buildSvgIcon, getCollection} from "./icon-loader.ts";
export {MdAdmonition} from "./components/MdAdmonition.tsx";
export type {AdmonitionType, MdAdmonitionProps} from "./components/MdAdmonition.tsx";
export {MdGithubCardSkeleton} from "./components/MdGithubCard.tsx";
export type {MdGithubCardSkeletonProps} from "./components/MdGithubCard.tsx";
export {remarkCustomDirectives} from "./plugins/remark-directives.ts";
export type {DirectiveNode} from "./plugins/remark-directives.ts";
export {rehypeLazyImage} from "./plugins/rehype-lazy-image.ts";
export {expressiveCodeOptions} from "./expressive-code.config.ts";

export async function renderMarkdown(
    markdown: string,
    sourcePath: string,
    publicRoot: string,
): Promise<string> {
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDirective)
        .use(() => (_tree: unknown, file_: any) => {
            if (file_) {
                const data = (file_.data ??= {});
                data.sourcePath = sourcePath;
                data.publicRoot = publicRoot;
            }
        })
        .use(() => assetLinksTransformer(sourcePath, publicRoot))
        .use(remarkCustomDirectives as Plugin)
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(rehypeLazyImage as Plugin)
        .use(rehypeExpressiveCode, expressiveCodeOptions)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, {
            behavior: "append",
            properties: {
                className: ["anchor"],
            },
            content: {
                type: "element",
                tagName: "span",
                properties: {
                    className: ["anchor-icon"],
                },
                children: [{type: "text", value: "#"}],
            },
        })
        .use(rehypeStringify)
        .process(markdown);

    return String(file);
}
