import type {Transformer} from "unified";
import type {Node} from "unist";
import {visit} from "unist-util-visit";
import {normalizeAssetReference} from "../../../utils/image-manifest.ts";

function createAssetUrl(value: string, sourcePath: string, publicRoot: string) {
    return normalizeAssetReference(value, sourcePath, publicRoot);
}

export function assetLinksTransformer(sourcePath: string, publicRoot: string): Transformer<Node> {
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
