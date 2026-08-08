import {create} from "zustand";

type UIState = {
    mobileMenuOpen: boolean;
    searchOverlayOpen: boolean;
    homeHeroCompact: boolean;
    backToTopVisible: boolean;
    scrollY: number;
    scrollDirection: "up" | "down";
    openMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleMobileMenu: () => void;
    openSearchOverlay: () => void;
    closeSearchOverlay: () => void;
    toggleSearchOverlay: () => void;
    syncScroll: (y: number) => void;
};

let lastScrollY = 0;

export const useUIStore = create<UIState>()((set, get) => ({
    mobileMenuOpen: false,
    searchOverlayOpen: false,
    homeHeroCompact: false,
    backToTopVisible: false,
    scrollY: 0,
    scrollDirection: "down",
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
}));
