import type {Plugin} from "unified";
import type {Node} from "unist";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeExpressiveCode from "rehype-expressive-code";
import rehypeStringify from "rehype-stringify";
import {unified} from "unified";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {expressiveCodeOptions} from "../expressive-code.config.ts";
import {rehypeLazyImage} from "./rehype-lazy-image.ts";
import {assetLinksTransformer} from "./remark-asset-links.ts";
import {
    ADMONITION_ICON_NOTE,
    ADMONITION_ICON_TIP,
    ADMONITION_ICON_IMPORTANT,
    ADMONITION_ICON_CAUTION,
    ADMONITION_ICON_WARNING,
    ADMONITION_ICON_DETAILS,
    ADMONITION_TYPE_LIST,
    GC_ICON_GITHUB,
    GC_ICON_STAR,
    GC_ICON_FORK,
    GC_ICON_LICENSE,
    buildSvgIcon,
} from "../icon-loader.ts";
import {MdAdmonition, type AdmonitionType} from "../components/MdAdmonition.tsx";
import {MdGithubCardSkeleton} from "../components/MdGithubCard.tsx";

type MdastNode = Node & { children?: unknown[] };

export type DirectiveNode = Node & {
    type?: string;
    name?: string;
    attributes?: Record<string, string>;
    children?: unknown[];
    data?: Record<string, unknown>;
};

function renderChildrenAsMarkdown(node: MdastNode): string {
    const tree: Root = {
        type: "root",
        children: (node.children ?? []) as any,
    };
    const f = unified().use(remarkStringify).stringify(tree as any);
    return String(f);
}

async function renderMarkdownChildren(
    markdown: string,
    sourcePath: string,
    publicRoot: string,
): Promise<string> {
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDirective)
        .use(() => assetLinksTransformer(sourcePath, publicRoot))
        .use(remarkCustomDirectives as Plugin)
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeRaw)
        .use(rehypeExpressiveCode, expressiveCodeOptions)
        .use(rehypeLazyImage as Plugin)
        .use(rehypeStringify)
        .process(markdown);
    return String(file);
}

export const remarkCustomDirectives: Plugin<[], Node> = () => {
    return async (tree, file: any) => {
        const sourcePath = (file?.data?.sourcePath as string) ?? "";
        const publicRoot = (file?.data?.publicRoot as string) ?? "";

        const nodesToReplace: Array<{node: DirectiveNode; html: string}> = [];
        const pending: Promise<void>[] = [];

        visit(tree, (node: unknown) => {
            const directiveNode = node as DirectiveNode;
            if (
                !directiveNode.type ||
                !["containerDirective", "leafDirective", "textDirective"].includes(
                    directiveNode.type,
                )
            ) {
                return;
            }

            const directiveName = (directiveNode.name ?? "").toLowerCase();

            if (ADMONITION_TYPE_LIST.includes(directiveName)) {
                const titleRaw = (directiveNode.attributes?.title ?? "").trim();
                const title = titleRaw || directiveName.toUpperCase();
                const iconId = (() => {
                    switch (directiveName as AdmonitionType) {
                        case "note": return ADMONITION_ICON_NOTE;
                        case "tip": return ADMONITION_ICON_TIP;
                        case "important": return ADMONITION_ICON_IMPORTANT;
                        case "caution": return ADMONITION_ICON_CAUTION;
                        case "warning": return ADMONITION_ICON_WARNING;
                        default: return ADMONITION_ICON_NOTE;
                    }
                })();
                const iconSvg = buildSvgIcon(iconId);
                const childrenMd = renderChildrenAsMarkdown(directiveNode);
                const job = renderMarkdownChildren(
                    childrenMd,
                    sourcePath,
                    publicRoot,
                ).then((childrenHtml) => {
                    const element = React.createElement(
                        MdAdmonition as any,
                        {
                            type: directiveName as AdmonitionType,
                            title,
                            iconSvg,
                            collapsible: false,
                        },
                        React.createElement("div", {
                            dangerouslySetInnerHTML: {__html: childrenHtml},
                        }),
                    );
                    const html = renderToStaticMarkup(element);
                    nodesToReplace.push({node: directiveNode, html});
                });
                pending.push(job);
                return;
            }

            if (directiveName === "details") {
                const titleRaw = (directiveNode.attributes?.title ?? "").trim();
                const defaultOpenRaw = (directiveNode.attributes?.open ?? "").trim();
                const title = titleRaw || "Details";
                const iconSvg = buildSvgIcon(ADMONITION_ICON_DETAILS);
                const defaultOpen =
                    defaultOpenRaw === "true" || defaultOpenRaw === "1";
                const childrenMd = renderChildrenAsMarkdown(directiveNode);
                const job = renderMarkdownChildren(
                    childrenMd,
                    sourcePath,
                    publicRoot,
                ).then((childrenHtml) => {
                    const element = React.createElement(
                        MdAdmonition as any,
                        {
                            type: "details" as AdmonitionType,
                            title,
                            iconSvg,
                            collapsible: true,
                            defaultOpen,
                        },
                        React.createElement("div", {
                            dangerouslySetInnerHTML: {__html: childrenHtml},
                        }),
                    );
                    const html = renderToStaticMarkup(element);
                    nodesToReplace.push({node: directiveNode, html});
                });
                pending.push(job);
                return;
            }

            if (directiveName === "github") {
                const repo = (directiveNode.attributes?.repo ?? "").trim();
                const isValid = repo.includes("/") && repo.split("/").every(Boolean);
                const parts = isValid ? repo.split("/") : ["owner", "repo"];
                const owner = parts[0] || "owner";
                const repoName = parts[1] || "repo";

                const githubLogoSvg = buildSvgIcon(GC_ICON_GITHUB, "100%");
                const starIconSvg = buildSvgIcon(GC_ICON_STAR);
                const forkIconSvg = buildSvgIcon(GC_ICON_FORK);
                const licenseIconSvg = buildSvgIcon(GC_ICON_LICENSE);

                const element = React.createElement(
                    MdGithubCardSkeleton as any,
                    {
                        repo,
                        isValid,
                        owner,
                        repoName,
                        githubLogoSvg,
                        starIconSvg,
                        forkIconSvg,
                        licenseIconSvg,
                    },
                );
                const html = renderToStaticMarkup(element);
                nodesToReplace.push({node: directiveNode, html});
                return;
            }
        });

        if (pending.length > 0) {
            await Promise.all(pending);
        }

        for (const {node, html} of nodesToReplace) {
            const directiveNode = node as DirectiveNode;
            const anyNode = node as any;
            anyNode.type = "html";
            anyNode.value = html;
            delete directiveNode.name;
            delete directiveNode.attributes;
            delete directiveNode.children;
            delete directiveNode.data;
        }
    };
};
