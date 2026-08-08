import {useEffect} from "react";
import {getAbsoluteUrl, seoConfig, siteConfig} from "@/config";
import {withSiteBasePath} from "@/config";

function upsertMeta(selector: string, attrs: Record<string, string>) {
    const existing = document.head.querySelector<HTMLMetaElement>(selector);
    const el = existing || document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (!existing) {
        document.head.appendChild(el);
    }
}

function upsertLink(selector: string, attrs: Record<string, string>) {
    const existing = document.head.querySelector<HTMLLinkElement>(selector);
    const el = existing || document.createElement("link");
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (!existing) {
        document.head.appendChild(el);
    }
}

type ApplyDocumentMetaInput = {
    title?: string;
    description?: string;
    pathname?: string;
    ogImage?: string;
    canonical?: string;
};

export function applyDocumentMeta({
                                      title,
                                      description,
                                      pathname = "/",
                                      ogImage,
                                      canonical,
                                  }: ApplyDocumentMetaInput = {}) {
    const effectiveTitle = title ?? seoConfig.defaultTitle;
    const effectiveDescription = description ?? seoConfig.defaultDescription;
    const effectiveImage = ogImage ?? seoConfig.defaultOgImage;
    const fullImageUrl = effectiveImage ? getAbsoluteUrl(effectiveImage) : undefined;
    const canonicalUrl = canonical ?? getAbsoluteUrl(pathname);

    document.title = effectiveTitle;

    upsertMeta('meta[name="description"]', {
        name: "description",
        content: effectiveDescription,
    });

    upsertMeta('meta[property="og:title"]', {
        property: "og:title",
        content: effectiveTitle,
    });
    upsertMeta('meta[property="og:description"]', {
        property: "og:description",
        content: effectiveDescription,
    });
    upsertMeta('meta[property="og:type"]', {
        property: "og:type",
        content: "website",
    });
    upsertMeta('meta[property="og:url"]', {
        property: "og:url",
        content: getAbsoluteUrl(pathname),
    });
    upsertMeta('meta[property="og:site_name"]', {
        property: "og:site_name",
        content: siteConfig.title,
    });
    upsertMeta('meta[property="og:locale"]', {
        property: "og:locale",
        content: siteConfig.lang.replace("-", "_"),
    });
    if (fullImageUrl) {
        upsertMeta('meta[property="og:image"]', {
            property: "og:image",
            content: fullImageUrl,
        });
    }

    upsertMeta('meta[name="twitter:card"]', {
        name: "twitter:card",
        content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
        name: "twitter:title",
        content: effectiveTitle,
    });
    upsertMeta('meta[name="twitter:description"]', {
        name: "twitter:description",
        content: effectiveDescription,
    });
    if (fullImageUrl) {
        upsertMeta('meta[name="twitter:image"]', {
            name: "twitter:image",
            content: fullImageUrl,
        });
    }

    upsertLink('link[rel="canonical"]', {
        rel: "canonical",
        href: canonicalUrl,
    });

    upsertLink('link[rel="alternate"][type="application/rss+xml"]', {
        rel: "alternate",
        type: "application/rss+xml",
        title: "RSS Feed",
        href: withSiteBasePath("/rss.xml"),
    });
}

export function useDocumentTitle(
    title: string | undefined,
    description?: string,
    pathname: string = "/",
    ogImage?: string,
) {
    useEffect(() => {
        applyDocumentMeta({title, description, pathname, ogImage});
    }, [title, description, pathname, ogImage]);
}
