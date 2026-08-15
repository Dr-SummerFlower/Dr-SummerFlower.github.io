import type {Plugin, Transformer} from "unified";
import type {Node} from "unist";
import {visit} from "unist-util-visit";
import type {Root} from "mdast";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode from "rehype-expressive-code";
import type {RehypeExpressiveCodeOptions} from "rehype-expressive-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import {pluginCollapsibleSections} from "@expressive-code/plugin-collapsible-sections";
import {pluginLineNumbers} from "@expressive-code/plugin-line-numbers";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import {unified} from "unified";
import remarkStringify from "remark-stringify";
import React, {type ReactNode} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createRequire} from "node:module";
import {iconToSVG, iconToHTML, getIconData} from "@iconify/utils";
import type {IconifyJSON, IconifyIcon} from "@iconify/types";
import {normalizeAssetReference} from "../utils/image-manifest.js";

const ADMONITION_ICON_NOTE = "fa6-solid:circle-info";
const ADMONITION_ICON_TIP = "fa6-solid:lightbulb";
const ADMONITION_ICON_IMPORTANT = "fa6-solid:circle-exclamation";
const ADMONITION_ICON_CAUTION = "fa6-solid:triangle-exclamation";
const ADMONITION_ICON_WARNING = "fa6-solid:circle-exclamation";
const ADMONITION_ICON_DETAILS = "fa6-solid:chevron-right";
const GC_ICON_GITHUB = "fa6-brands:github";
const GC_ICON_STAR = "fa6-solid:star";
const GC_ICON_FORK = "fa6-solid:code-fork";
const GC_ICON_LICENSE = "fa6-solid:scale-balanced";

const ADMONITION_TYPE_LIST: string[] = [
    "note",
    "tip",
    "important",
    "caution",
    "warning",
];

const require = createRequire(import.meta.url);
const ICON_PACKAGES: Record<string, string> = {
    "fa6-solid": "@iconify-json/fa6-solid",
    "fa6-brands": "@iconify-json/fa6-brands",
    "material-symbols": "@iconify-json/material-symbols",
};
const loadedCollections = new Map<string, IconifyJSON>();

function getCollection(prefix: string): IconifyJSON | null {
    const cached = loadedCollections.get(prefix);
    if (cached) return cached;
    const pkg = ICON_PACKAGES[prefix];
    if (!pkg) return null;
    try {
        const mod = require(require.resolve(`${pkg}/icons.json`));
        const col = (mod.default ?? mod) as IconifyJSON;
        loadedCollections.set(prefix, col);
        return col;
    } catch {
        return null;
    }
}

function buildSvgIcon(iconId: string, size = "1em", extraClass = ""): string {
    const idx = iconId.indexOf(":");
    if (idx <= 0) return "";
    const prefix = iconId.slice(0, idx);
    const name = iconId.slice(idx + 1);
    const col = getCollection(prefix);
    if (!col) return "";
    const iconData = getIconData(col, name);
    if (!iconData) return "";
    const svgBuild = iconToSVG(iconData as unknown as IconifyIcon, {
        height: size,
        width: size,
    });
    if (!svgBuild || !svgBuild.body) return "";
    const attributes: Record<string, string> = {...svgBuild.attributes};
    if (!attributes.viewBox && col.width && col.height) {
        attributes.viewBox = `0 0 ${col.width} ${col.height}`;
    }
    attributes["aria-hidden"] = "true";
    attributes.focusable = "false";
    attributes.fill = "currentColor";
    if (extraClass) {
        attributes.class = extraClass;
    }
    return iconToHTML(svgBuild.body, attributes);
}

type AdmonitionType =
    | "note"
    | "tip"
    | "important"
    | "caution"
    | "warning"
    | "details";

type MdAdmonitionProps = {
    type: AdmonitionType;
    title: string;
    iconSvg: ReactNode;
    children?: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
};

function MdAdmonition({
    type,
    title,
    iconSvg,
    children,
    collapsible,
    defaultOpen,
}: MdAdmonitionProps) {
    const className = `admonition admonition-${type}`;
    const titleInner = React.createElement(
        React.Fragment,
        null,
        React.createElement("span", {
            className: "admonition-icon-wrap",
            dangerouslySetInnerHTML: {__html: iconSvg as string},
        }),
        React.createElement("span", null, title),
    );

    if (collapsible || type === "details") {
        return React.createElement(
            "details",
            {
                className,
                ...(defaultOpen ? {open: true} : {}),
            },
            React.createElement(
                "summary",
                {className: "admonition-title"},
                titleInner,
            ),
            React.createElement("div", {className: "admonition-body"}, children),
        );
    }
    return React.createElement(
        "div",
        {className},
        React.createElement("div", {className: "admonition-title"}, titleInner),
        React.createElement("div", {className: "admonition-body"}, children),
    );
}

type MdGithubCardSkeletonProps = {
    repo: string;
    isValid: boolean;
    owner: string;
    repoName: string;
    githubLogoSvg: ReactNode;
    starIconSvg: ReactNode;
    forkIconSvg: ReactNode;
    licenseIconSvg: ReactNode;
};

function MdGithubCardSkeleton({
    repo,
    isValid,
    owner,
    repoName,
    githubLogoSvg,
    starIconSvg,
    forkIconSvg,
    licenseIconSvg,
}: MdGithubCardSkeletonProps) {
    const statusClass = isValid ? "fetch-waiting" : "fetch-error";
    const descriptionText = isValid
        ? "Waiting for api.github.com..."
        : 'Invalid repository format, expected "owner/repo".';
    const attrs: Record<string, unknown> = {
        className: `card-github no-styling ${statusClass}`,
        href: isValid ? `https://github.com/${repo}` : "#",
        target: "_blank",
        rel: "noreferrer",
    };
    if (isValid) {
        attrs["data-github-card"] = repo;
    }

    const slot = (name: string) => ({["data-gc-slot"]: name});

    return React.createElement(
        "a",
        attrs,
        React.createElement(
            "div",
            {className: "gc-titlebar"},
            React.createElement(
                "div",
                {className: "gc-titlebar-left"},
                React.createElement(
                    "div",
                    {className: "gc-owner"},
                    React.createElement("div", {
                        className: "gc-avatar",
                        ...slot("avatar"),
                    }),
                    React.createElement("div", {className: "gc-user"}, owner),
                ),
                React.createElement("div", {className: "gc-divider"}, "/"),
                React.createElement("div", {className: "gc-repo"}, repoName),
            ),
            React.createElement("div", {
                className: "github-logo",
                dangerouslySetInnerHTML: {__html: githubLogoSvg as string},
            }),
        ),
        React.createElement(
            "div",
            {
                className: "gc-description",
                ...slot("description"),
            },
            descriptionText,
        ),
        React.createElement(
            "div",
            {className: "gc-infobar"},
            React.createElement(
                "div",
                {className: "gc-stars"},
                React.createElement("span", {
                    className: "gc-icon gc-icon-star",
                    dangerouslySetInnerHTML: {__html: starIconSvg as string},
                }),
                React.createElement("span", {className: "gc-value", ...slot("stars")}, "00K"),
            ),
            React.createElement(
                "div",
                {className: "gc-forks"},
                React.createElement("span", {
                    className: "gc-icon gc-icon-fork",
                    dangerouslySetInnerHTML: {__html: forkIconSvg as string},
                }),
                React.createElement("span", {className: "gc-value", ...slot("forks")}, "0K"),
            ),
            React.createElement(
                "div",
                {className: "gc-license"},
                React.createElement("span", {
                    className: "gc-icon gc-icon-license",
                    dangerouslySetInnerHTML: {__html: licenseIconSvg as string},
                }),
                React.createElement("span", {className: "gc-value", ...slot("license")}, "no-license"),
            ),
            React.createElement(
                "span",
                {className: "gc-language", ...slot("language")},
                "Waiting...",
            ),
        ),
    );
}

const expressiveCodeOptions: RehypeExpressiveCodeOptions = {
    themes: ["catppuccin-latte"],
    plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
    defaultProps: {
        wrap: true,
        overridesByLang: {
            shellsession: {
                showLineNumbers: false,
            },
        },
    },
    styleOverrides: {
        codeBackground: "var(--codeblock-bg)",
        borderRadius: "1rem",
        borderWidth: "1px",
        borderColor: "var(--line-divider)",
        codeFontSize: "0.875rem",
        codeFontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        codeLineHeight: "1.5rem",
        codePaddingInline: "1rem",
        frames: {
            editorBackground: "var(--codeblock-bg)",
            terminalBackground: "var(--codeblock-bg)",
            terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
            editorTabBarBackground: "var(--codeblock-topbar-bg)",
            editorActiveTabBackground: "none",
            editorActiveTabIndicatorBottomColor: "var(--primary)",
            editorActiveTabIndicatorTopColor: "none",
            editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
            terminalTitlebarBorderBottomColor: "none",
            inlineButtonBackground: "var(--codeblock-topbar-bg)",
            inlineButtonBackgroundIdleOpacity: "0",
            inlineButtonBackgroundHoverOrFocusOpacity: "1",
            inlineButtonBackgroundActiveOpacity: "1",
            inlineButtonBorderOpacity: "0",
            inlineButtonForeground: "var(--codeblock-color)",
            terminalTitlebarDotsOpacity: "0.15",
            editorActiveTabBorderColor: "transparent",
            editorTabsMarginInlineStart: "0",
            editorTabsMarginBlockStart: "0",
            editorTabBorderRadius: "0.5rem",
            editorTabBarBorderColor: "transparent",
            terminalTitlebarDotsForeground: "var(--muted)",
            terminalTitlebarForeground: "var(--foreground)",
            tooltipSuccessBackground: "var(--primary)",
            tooltipSuccessForeground: "#fff",
            terminalIcon: "var(--terminal-icon)",
        },
        textMarkers: {
            delHue: "0",
            insHue: "180",
            markHue: "250",
        },
    },
    frames: {
        showCopyToClipboardButton: true,
        extractFileNameFromCode: true,
    },
    useThemedScrollbars: true,
};

function createAssetUrl(value: string, sourcePath: string, publicRoot: string) {
    return normalizeAssetReference(value, sourcePath, publicRoot);
}

type MdastNode = Node & { children?: unknown[] };

function assetLinksTransformer(sourcePath: string, publicRoot: string): Transformer<Node> {
    return (tree) => {
        visit(tree, (node) => {
            const imageNode = node as Node & { type?: string; url?: string };
            if (imageNode.type !== "image") {
                return;
            }
            if (!imageNode.url) {
                return;
            }
            imageNode.url = createAssetUrl(imageNode.url, sourcePath, publicRoot);
        });
    };
}

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

type DirectiveNode = Node & {
    type?: string;
    name?: string;
    attributes?: Record<string, string>;
    children?: unknown[];
    data?: Record<string, unknown>;
};

const remarkCustomDirectives: Plugin<[], Node> = () => {
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

const rehypeLazyImage: Plugin<[], Node> = () => {
    return (tree) => {
        visit(tree, (node) => {
            const elementNode = node as Node & {
                type?: string;
                tagName?: string;
                properties?: Record<string, unknown>;
            };
            if (elementNode.type !== "element" || elementNode.tagName !== "img") {
                return;
            }

            const properties = (elementNode.properties ??= {});
            properties.loading = "lazy";
            properties.decoding = "async";
            properties.referrerPolicy = "no-referrer";
        });
    };
};

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
