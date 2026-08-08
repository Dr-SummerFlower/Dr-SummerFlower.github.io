import type {Plugin, Transformer} from "unified";
import type {Node} from "unist";
import {visit} from "unist-util-visit";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode from "rehype-expressive-code";
import type {RehypeExpressiveCodeOptions} from "rehype-expressive-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import {pluginCollapsibleSections} from "@expressive-code/plugin-collapsible-sections";
import {pluginLineNumbers} from "@expressive-code/plugin-line-numbers";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import {unified} from "unified";
import {normalizeAssetReference} from "../utils/image-manifest.ts";

const expressiveCodeOptions: RehypeExpressiveCodeOptions = {
    themes: ["github-dark", "github-dark"],
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
        borderRadius: "0px",
        borderColor: "none",
        codeFontSize: "0.875rem",
        codeFontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        codeLineHeight: "1.5rem",
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
        },
        textMarkers: {
            delHue: "0",
            insHue: "180",
            markHue: "250",
        },
    },
    frames: {
        showCopyToClipboardButton: false,
    },
};

function createAssetUrl(value: string, sourcePath: string, publicRoot: string) {
    return normalizeAssetReference(value, sourcePath, publicRoot);
}

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

const remarkCustomDirectives: Plugin<[], Node> = () => {
    return (tree) => {
        visit(tree, (node) => {
            const directiveNode = node as Node & {
                type?: string;
                name?: string;
                attributes?: Record<string, string>;
                children?: unknown[];
                data?: Record<string, unknown>;
            };

            if (
                !directiveNode.type ||
                !["containerDirective", "leafDirective", "textDirective"].includes(
                    directiveNode.type,
                )
            ) {
                return;
            }

            const directiveName = directiveNode.name ?? "";
            const data = (directiveNode.data ??= {});

            if (
                ["note", "tip", "important", "caution", "warning"].includes(
                    directiveName,
                )
            ) {
                data.hName = "div";
                data.hProperties = {
                    className: ["admonition", `admonition-${directiveName}`],
                };
                data.hChildren = [
                    {
                        type: "element",
                        tagName: "p",
                        properties: {className: ["admonition-title"]},
                        children: [{type: "text", value: directiveName.toUpperCase()}],
                    },
                    ...(directiveNode.children ?? []),
                ];
                return;
            }

            if (directiveName === "github") {
                const repo = (directiveNode.attributes?.repo ?? "").trim();
                const isValidRepo = repo.includes("/") && repo.split("/").every(Boolean);
                const cardUuid = `GC${Math.random().toString(36).slice(2, 8)}`;
                const owner = isValidRepo ? repo.split("/")[0] : "owner";
                const repoName = isValidRepo ? repo.split("/")[1] : "repo";

                data.hName = "a";
                data.hProperties = {
                    className: ["card-github", "fetch-waiting", "no-styling"],
                    id: `${cardUuid}-card`,
                    href: isValidRepo ? `https://github.com/${repo}` : "#",
                    target: "_blank",
                    rel: "noreferrer",
                    repo,
                };
                data.hChildren = [
                    {
                        type: "element",
                        tagName: "div",
                        properties: {className: ["gc-titlebar"]},
                        children: [
                            {
                                type: "element",
                                tagName: "div",
                                properties: {className: ["gc-titlebar-left"]},
                                children: [
                                    {
                                        type: "element",
                                        tagName: "div",
                                        properties: {className: ["gc-owner"]},
                                        children: [
                                            {
                                                type: "element",
                                                tagName: "div",
                                                properties: {
                                                    id: `${cardUuid}-avatar`,
                                                    className: ["gc-avatar"],
                                                },
                                                children: [],
                                            },
                                            {
                                                type: "element",
                                                tagName: "div",
                                                properties: {className: ["gc-user"]},
                                                children: [{type: "text", value: owner}],
                                            },
                                        ],
                                    },
                                    {
                                        type: "element",
                                        tagName: "div",
                                        properties: {className: ["gc-divider"]},
                                        children: [{type: "text", value: "/"}],
                                    },
                                    {
                                        type: "element",
                                        tagName: "div",
                                        properties: {className: ["gc-repo"]},
                                        children: [{type: "text", value: repoName}],
                                    },
                                ],
                            },
                            {
                                type: "element",
                                tagName: "div",
                                properties: {className: ["github-logo"]},
                                children: [],
                            },
                        ],
                    },
                    {
                        type: "element",
                        tagName: "div",
                        properties: {
                            id: `${cardUuid}-description`,
                            className: ["gc-description"],
                        },
                        children: [{type: "text", value: "Waiting for api.github.com..."}],
                    },
                    {
                        type: "element",
                        tagName: "div",
                        properties: {className: ["gc-infobar"]},
                        children: [
                            {
                                type: "element",
                                tagName: "div",
                                properties: {id: `${cardUuid}-stars`, className: ["gc-stars"]},
                                children: [{type: "text", value: "00K"}],
                            },
                            {
                                type: "element",
                                tagName: "div",
                                properties: {id: `${cardUuid}-forks`, className: ["gc-forks"]},
                                children: [{type: "text", value: "0K"}],
                            },
                            {
                                type: "element",
                                tagName: "div",
                                properties: {id: `${cardUuid}-license`, className: ["gc-license"]},
                                children: [{type: "text", value: "no-license"}],
                            },
                            {
                                type: "element",
                                tagName: "span",
                                properties: {
                                    id: `${cardUuid}-language`,
                                    className: ["gc-language"],
                                },
                                children: [{type: "text", value: "Waiting..."}],
                            },
                        ],
                    },
                    {
                        type: "element",
                        tagName: "script",
                        properties: {
                            id: `${cardUuid}-script`,
                            type: "text/javascript",
                            defer: true,
                        },
                        children: [
                            {
                                type: "text",
                                value: isValidRepo
                                    ? `\n      fetch('https://api.github.com/repos/${repo}', { referrerPolicy: "no-referrer" })\n        .then(function (response) { return response.json(); })\n        .then(function (data) {\n          var descriptionEl = document.getElementById('${cardUuid}-description');\n          var languageEl = document.getElementById('${cardUuid}-language');\n          var forksEl = document.getElementById('${cardUuid}-forks');\n          var starsEl = document.getElementById('${cardUuid}-stars');\n          var avatarEl = document.getElementById('${cardUuid}-avatar');\n          var licenseEl = document.getElementById('${cardUuid}-license');\n          var cardEl = document.getElementById('${cardUuid}-card');\n          if (!descriptionEl || !languageEl || !forksEl || !starsEl || !avatarEl || !licenseEl || !cardEl) {\n            return;\n          }\n          descriptionEl.innerText = (data.description || 'Description not set').replace(/:[a-zA-Z0-9_]+:/g, '');\n          languageEl.innerText = data.language || 'Unknown';\n          forksEl.innerText = Intl.NumberFormat('en-us', { notation: 'compact', maximumFractionDigits: 1 }).format(data.forks || 0).replaceAll("\\u202f", '');\n          starsEl.innerText = Intl.NumberFormat('en-us', { notation: 'compact', maximumFractionDigits: 1 }).format(data.stargazers_count || 0).replaceAll("\\u202f", '');\n          avatarEl.style.backgroundImage = 'url(' + (data.owner && data.owner.avatar_url ? data.owner.avatar_url : '') + ')';\n          avatarEl.style.backgroundColor = 'transparent';\n          licenseEl.innerText = data.license && data.license.spdx_id ? data.license.spdx_id : 'no-license';\n          cardEl.classList.remove('fetch-waiting');\n        })\n        .catch(function () {\n          var cardEl = document.getElementById('${cardUuid}-card');\n          if (cardEl) {\n            cardEl.classList.add('fetch-error');\n          }\n        });\n      `
                                    : `\n      var cardEl = document.getElementById('${cardUuid}-card');\n      var descriptionEl = document.getElementById('${cardUuid}-description');\n      if (cardEl) {\n        cardEl.classList.remove('fetch-waiting');\n        cardEl.classList.add('fetch-error');\n      }\n      if (descriptionEl) {\n        descriptionEl.innerText = 'Invalid repository format, expected "owner/repo".';\n      }\n      `,
                            },
                        ],
                    },
                ];
            }
        });
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
        .use(() => assetLinksTransformer(sourcePath, publicRoot))
        .use(remarkCustomDirectives)
        .use(remarkRehype, {allowDangerousHtml: false})
        .use(rehypeLazyImage)
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
