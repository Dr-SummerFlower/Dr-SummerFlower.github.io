import type {
    CustomPageItem,
    GiscusConfig,
    NavLink,
    SocialLink,
} from "./types/config.ts";

const BASE_PATH = "";

export const blogConfig = {
    site: {
        title: "Summer Flower的个人博客",
        subtitle: "基于 Vite + React 的个人博客",
        description: "记录折腾、开发和日常问题解决方案的个人博客。",
        lang: "zh-CN",
        url: "https://blog.summerflower.top",
        basePath: BASE_PATH,
        favicon: "/favicon/summerflower.jpg",
        defaultThemeMode: "auto" as const,
        font: {
            sans: "system-ui",
            mono: "ui-monospace",
            fallbackSans: [
                "-apple-system",
                "BlinkMacSystemFont",
                "Segoe UI",
                "Roboto",
                "Helvetica Neue",
                "Arial",
                "sans-serif",
            ],
            fallbackMono: [
                "SFMono-Regular",
                "SF Mono",
                "Menlo",
                "Consolas",
                "Liberation Mono",
                "monospace",
            ],
        },
    },
    content: {
        rootDir: "content",
        postsDir: "posts",
        pagesDir: "pages",
        specDir: "spec",
        pageSize: 8,
        includeDrafts: false,
    },
    theme: {
        toc: {
            enable: true,
            depth: 3,
        },
        banner: {
            enable: true,
            src: "/banner.png",
            position: "center" as const,
            credit: {
                enable: false,
                text: "",
                url: "",
            },
        },
        color: {
            hue: 250,
            fixed: false,
            presets: [
                {name: "Blue", hue: 220},
                {name: "Cyan", hue: 250},
                {name: "Emerald", hue: 160},
                {name: "Rose", hue: 345},
                {name: "Amber", hue: 45},
            ],
        },
    },
    assets: {
        image: {
            formats: [],
            widths: [],
        },
    },
    navigation: {
        links: [
            {name: "首页", href: "/"},
            {name: "归档", href: "/archive"},
        ] satisfies NavLink[],
        customPages: [
            {
                slug: "about",
                title: "关于",
                filePath: "spec/about.md",
                description: "关于作者和博客的介绍页。",
                showInNavbar: true,
                showInSitemap: true,
            },
            { type: "component", slug: "anima-artists", path: "/anima-artists", componentId: "anima-artists", title: "画师精选", description: "ComfyUI 画师画风预览，支持一键复制画师名称。", showInNavbar: true, showInSitemap: true },
        ] satisfies CustomPageItem[],
    },
    profile: {
        name: "Summer Flower",
        bio: "啥都会一点，但是啥都不精通的菜鸡",
        avatar: "/favicon/summerflower.jpg",
        profileUrl: "https://github.com/Dr-SummerFlower",
        links: [
            {
                name: "Bilibili",
                icon: "fa6-brands:bilibili",
                url: "https://space.bilibili.com/358868241",
            },
            {
                name: "GitHub",
                icon: "fa6-brands:github",
                url: "https://github.com/Dr-SummerFlower",
            },
            {
                name: "Npm",
                icon: "fa6-brands:npm",
                url: "https://www.npmjs.com/~summerflower",
            },
            {
                name: "Email",
                icon: "material-symbols:mail-rounded",
                url: "mailto:1721807170@qq.com",
            },
        ] satisfies SocialLink[],
    },
    license: {
        enable: true,
        name: "CC BY-NC-SA 4.0",
        url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    },
    comment: {
        giscus: {
            enable: true,
            repo: "Dr-SummerFlower/blog_giscus",
            repoId: "R_kgDOQiXXYw",
            category: "Announcements",
            categoryId: "DIC_kwDOQiXXY84CzYVh",
            mapping: "pathname",
            strict: "0",
            reactionsEnabled: "1",
            emitMetadata: "0",
            inputPosition: "top",
            theme: "preferred_color_scheme",
            lang: "zh-CN",
        } satisfies GiscusConfig,
    },
    seo: {
        defaultOgImage: "",
        keywords: ["blog", "vite", "react", "markdown", "fuwari"],
        robots: {
            allow: "/",
            disallow: [],
        },
    },
} as const;
