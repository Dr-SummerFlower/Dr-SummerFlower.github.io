import {create} from "zustand";
import type {HeadingItem} from "@/types/post";

type UIState = {
    mobileMenuOpen: boolean;
    searchOverlayOpen: boolean;
    homeHeroCompact: boolean;
    backToTopVisible: boolean;
    scrollY: number;
    scrollDirection: "up" | "down";
    heroMode: "home" | "compact";
    headings: HeadingItem[];
    openMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleMobileMenu: () => void;
    openSearchOverlay: () => void;
    closeSearchOverlay: () => void;
    toggleSearchOverlay: () => void;
    syncScroll: (y: number) => void;
    setLayoutHeroMode: (mode: "home" | "compact") => void;
    setLayoutHeadings: (headings: HeadingItem[]) => void;
};

let lastScrollY = 0;

export const useUIStore = create<UIState>()((set, get) => ({
    mobileMenuOpen: false,
    searchOverlayOpen: false,
    homeHeroCompact: false,
    backToTopVisible: false,
    scrollY: 0,
    scrollDirection: "down",
    heroMode: "compact",
    headings: [],
    openMobileMenu: () => set({mobileMenuOpen: true}),
    closeMobileMenu: () => set({mobileMenuOpen: false}),
    toggleMobileMenu: () => set({mobileMenuOpen: !get().mobileMenuOpen}),
    openSearchOverlay: () => set({searchOverlayOpen: true}),
    closeSearchOverlay: () => set({searchOverlayOpen: false}),
    toggleSearchOverlay: () => set({searchOverlayOpen: !get().searchOverlayOpen}),
    syncScroll: (y) => {
        const prevY = lastScrollY;
        lastScrollY = y;
        set({
            scrollY: y,
            scrollDirection: y >= prevY ? "down" : "up",
            backToTopVisible: y > 360,
            homeHeroCompact: y > 12,
        });
    },
    setLayoutHeroMode: (mode) => set({heroMode: mode}),
    setLayoutHeadings: (headings) => set({headings}),
}));
