export type TranslationParams = Record<string, string | number>;

export type CommonDict = {
    words: string;
    minutes: string;
    updatedAt: string;
    uncategorized: string;
    backHome: string;
    viewArchive: string;
    reset: string;
    copy: string;
    copied: string;
    untitled: string;
};

export type NavDict = {
    home: string;
    archive: string;
    about: string;
    customPages: string;
    animaArtists: string;
};

export type HomeDict = {
    title: string;
    currentFilter: string;
    filterCategory: string;
    filterTag: string;
    clearFilter: string;
    noFilteredPosts: string;
};

export type ArchiveDict = {
    title: string;
    description: string;
    metadataDescription: string;
    yearTitle: string;
    postCount: string;
};

export type AboutDict = {
    title: string;
    description: string;
};

export type TocDict = {
    title: string;
    ariaLabel: string;
};

export type SidebarDict = {
    categoryTitle: string;
    tagTitle: string;
    mobileFiltersSummary: string;
};

export type PaginationDict = {
    prevPage: string;
    nextPage: string;
    prevPost: string;
    nextPost: string;
};

export type ErrorDict = {
    postNotFound: string;
    customPageNotFound: string;
    pageNotFound: string;
    pageNotFoundDescription: string;
};

export type FooterDict = {
    poweredBy: string;
    licenseSuffix: string;
    builtWith: string;
    themeInspiredBy: string;
    adoptedLicense: string;
};

export type ThemeDict = {
    color: string;
    reset: string;
    modeLabel: string;
    modeLight: string;
    modeDark: string;
    modeAuto: string;
};

export type UiDict = {
    openMenu: string;
    closeMenu: string;
};

export type SearchDict = {
    label: string;
    placeholder: string;
    noResults: string;
    indexing: string;
    unavailable: string;
    untitled: string;
};

export type AnimaArtistsDict = {
    title: string;
    description: string;
    subtitle: string;
    uniqueness: string;
    copy: string;
    copyName: string;
    copied: string;
    loadFailed: string;
    preview: string;
};

export type Dictionary = {
    common: CommonDict;
    nav: NavDict;
    home: HomeDict;
    archive: ArchiveDict;
    about: AboutDict;
    toc: TocDict;
    sidebar: SidebarDict;
    pagination: PaginationDict;
    error: ErrorDict;
    footer: FooterDict;
    theme: ThemeDict;
    ui: UiDict;
    search: SearchDict;
    animaArtists: AnimaArtistsDict;
};

type Join<K, P> = K extends string | number
    ? P extends string | number
        ? `${K}${"" extends P ? "" : "."}${P}`
        : never
    : never;

type Leaves<T> = T extends object
    ? {
          [K in keyof T]-?: Join<K, Leaves<T[K]>>;
      }[keyof T]
    : "";

export type I18nKey = Leaves<Dictionary>;

export type LocaleDefinition = {
    readonly code: string;
    readonly displayName: string;
    readonly aliases: readonly string[];
    readonly isDefault?: boolean;
    readonly dictionary: Dictionary;
};

export type LocaleRegistry = ReadonlyArray<LocaleDefinition>;
