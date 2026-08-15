import type {Plugin} from "unified";
import type {Node} from "unist";
import {visit} from "unist-util-visit";

export const rehypeLazyImage: Plugin<[], Node> = () => {
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
