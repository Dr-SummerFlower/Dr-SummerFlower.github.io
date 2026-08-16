import type {Dictionary, LocaleDefinition} from "@/i18n/types";

const dictionary = {
    common: {
        words: "字",
        minutes: "分钟阅读",
        updatedAt: "更新于",
        uncategorized: "未分类",
        backHome: "返回首页",
        viewArchive: "查看归档",
        reset: "重置",
        copy: "复制",
        copied: "已复制",
        untitled: "无标题",
    },
    nav: {
        home: "首页",
        archive: "归档",
        about: "关于",
        customPages: "页面",
        animaArtists: "画师精选",
    },
    home: {
        title: "首页",
        currentFilter: "当前筛选：",
        filterCategory: "分类 · {category}",
        filterTag: "标签 · {tag}",
        clearFilter: "清除筛选",
        noFilteredPosts: "暂无符合该筛选条件的文章。",
    },
    archive: {
        title: "归档",
        description: "按月份整理当前博客文章。",
        metadataDescription: "按时间查看全部文章归档。",
        yearTitle: "{year} 年",
        postCount: "{count} 篇",
    },
    about: {
        title: "关于",
        description: "关于作者和这个博客。",
    },
    toc: {
        title: "目录",
        ariaLabel: "文章目录",
    },
    sidebar: {
        categoryTitle: "分类",
        tagTitle: "标签",
        mobileFiltersSummary: "分类与标签",
    },
    pagination: {
        prevPage: "上一页",
        nextPage: "下一页",
        prevPost: "上一篇",
        nextPost: "下一篇",
    },
    error: {
        postNotFound: "文章未找到",
        customPageNotFound: "页面未找到",
        pageNotFound: "页面未找到",
        pageNotFoundDescription:
            "这个地址在博客里还不存在，或者文章链接已经变化。",
    },
    footer: {
        poweredBy: "重构驱动",
        licenseSuffix: "许可",
        builtWith: "由",
        themeInspiredBy: "主题灵感来自",
        adoptedLicense: "采用",
    },
    theme: {
        color: "主题色",
        reset: "重置",
        modeLabel: "主题模式",
        modeLight: "浅色",
        modeDark: "深色",
        modeAuto: "自动",
    },
    ui: {
        openMenu: "打开菜单",
        closeMenu: "关闭菜单",
    },
    search: {
        label: "搜索文章",
        placeholder: "搜索文章…",
        noResults: "没有匹配的文章。",
        indexing: "正在加载搜索索引…",
        unavailable: "无法加载搜索索引，请稍后重试或检查部署配置。",
        untitled: "无标题",
    },
    animaArtists: {
        title: "ComfyUI 画师风格预览",
        description: "ComfyUI 画师画风预览，支持一键复制画师名称。",
        subtitle:
            "按独特值降序排列，点击图片放大预览，点击按钮可一键复制画师名称到剪贴板。",
        uniqueness: "独特值：",
        copy: "复制",
        copyName: "复制画师名称",
        copied: "已复制",
        loadFailed: "画师数据加载失败，请稍后刷新重试。",
        preview: "预览图",
    },
} satisfies Dictionary;

export default {
    code: "zh-CN",
    displayName: "简体中文",
    aliases: ["zh", "zh-cn", "zh_cn"],
    isDefault: true,
    dictionary,
} satisfies LocaleDefinition;
