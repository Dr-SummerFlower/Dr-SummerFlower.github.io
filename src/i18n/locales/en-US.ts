import type {Dictionary, LocaleDefinition} from "@/i18n/types";

const dictionary = {
    common: {
        words: "words",
        minutes: "min read",
        updatedAt: "Updated at",
        uncategorized: "Uncategorized",
        backHome: "Back home",
        viewArchive: "View archive",
        reset: "Reset",
        copy: "Copy",
        copied: "Copied",
        untitled: "Untitled",
    },
    nav: {
        home: "Home",
        archive: "Archive",
        about: "About",
        customPages: "Pages",
        animaArtists: "Artists",
    },
    home: {
        title: "Home",
        currentFilter: "Active filters:",
        filterCategory: "Category · {category}",
        filterTag: "Tag · {tag}",
        clearFilter: "Clear filters",
        noFilteredPosts: "No posts match the selected filters.",
    },
    archive: {
        title: "Archive",
        description: "Browse all posts by month.",
        metadataDescription: "Browse all archived posts by date.",
        yearTitle: "{year}",
        postCount: "{count} posts",
    },
    about: {
        title: "About",
        description: "About the author and this blog.",
    },
    toc: {
        title: "Table of contents",
        ariaLabel: "Table of contents",
    },
    sidebar: {
        categoryTitle: "Categories",
        tagTitle: "Tags",
        mobileFiltersSummary: "Categories & tags",
    },
    pagination: {
        prevPage: "Previous",
        nextPage: "Next",
        prevPost: "Previous post",
        nextPost: "Next post",
    },
    error: {
        postNotFound: "Post not found",
        customPageNotFound: "Page not found",
        pageNotFound: "Page not found",
        pageNotFoundDescription:
            "This path does not exist in the blog, or the post URL has changed.",
    },
    footer: {
        poweredBy: "powered by",
        licenseSuffix: "license",
        builtWith: "Built with",
        themeInspiredBy: "theme inspired by",
        adoptedLicense: "Licensed under",
    },
    theme: {
        color: "Theme color",
        reset: "Reset",
        modeLabel: "Theme mode",
        modeLight: "Light",
        modeDark: "Dark",
        modeAuto: "System",
    },
    ui: {
        openMenu: "Open menu",
        closeMenu: "Close menu",
    },
    search: {
        label: "Search posts",
        placeholder: "Search posts…",
        noResults: "No matching posts.",
        indexing: "Loading search index…",
        unavailable:
            "Could not load the search index. Check your connection or deployment configuration.",
        untitled: "Untitled",
    },
    animaArtists: {
        title: "ComfyUI Artist Style Preview",
        description:
            "Preview ComfyUI artist styles with one-click copy artist name.",
        subtitle:
            "Sorted by uniqueness score (descending). Click an image to zoom in, or use the button to copy the artist name.",
        uniqueness: "Uniqueness: ",
        copy: "Copy",
        copyName: "Copy artist name",
        copied: "Copied",
        loadFailed: "Failed to load artist data. Please refresh and try again.",
        preview: "Preview",
    },
} satisfies Dictionary;

export default {
    code: "en-US",
    displayName: "English",
    aliases: ["en", "en-us", "en_us", "en-gb", "en_gb", "en-au", "en_au"],
    dictionary,
} satisfies LocaleDefinition;
