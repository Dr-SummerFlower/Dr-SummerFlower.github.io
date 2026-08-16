import type {GiscusConfig, SeoConfig} from "../../types/config.ts";
import {blogConfig} from "../../config.ts";

export const siteConfig = {
    title: blogConfig.site.title,
    subtitle: blogConfig.site.subtitle,
    description: blogConfig.site.description,
    site: blogConfig.site.url,
    lang: blogConfig.site.lang,
    contentDir: blogConfig.content.rootDir,
    themeColor: blogConfig.theme.color,
    banner: blogConfig.theme.banner,
    toc: blogConfig.theme.toc,
    favicon: blogConfig.site.favicon,
    defaultThemeMode: blogConfig.site.defaultThemeMode,
    font: blogConfig.site.font,
};

export const profileConfig = blogConfig.profile;

export const licenseConfig = blogConfig.license;

export const giscusConfig: GiscusConfig = {
    ...blogConfig.comment.giscus,
    lang: blogConfig.comment.giscus.lang,
};

export const seoConfig: SeoConfig = {
    defaultTitle: `${siteConfig.title} - ${siteConfig.subtitle}`,
    defaultDescription: siteConfig.description,
    defaultOgImage: blogConfig.seo.defaultOgImage || undefined,
    robots: {
        allow: blogConfig.seo.robots.allow,
        disallow: [...blogConfig.seo.robots.disallow],
    },
};

export const contentConfig = {
    rootDir: blogConfig.content.rootDir,
    postsDir: blogConfig.content.postsDir,
    pagesDir: blogConfig.content.pagesDir,
    specDir: blogConfig.content.specDir,
    includeDrafts: blogConfig.content.includeDrafts,
};
