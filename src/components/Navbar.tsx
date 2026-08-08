import {useEffect, useRef, useState} from "react";
import {Link} from "react-router-dom";
import {getNavLinks, siteConfig} from "@/config";
import Icon from "./Icon";
import LightDarkSwitch from "./LightDarkSwitch";
import ThemeColorSwitch from "./ThemeColorSwitch";
import NavbarSearch from "./NavbarSearch";
import {t} from "@/i18n";
import {classNames} from "@/utils/common-utils";
import {useUIStore} from "@/store/ui";

export default function Navbar() {
    const allLinks = getNavLinks().map((link) => {
        if (link.href === "/") {
            return {...link, name: t("navHome")};
        }
        if (link.href === "/archive") {
            return {...link, name: t("navArchive")};
        }
        if (link.href === "/about") {
            return {...link, name: t("navAbout")};
        }
        return link;
    });
    const aboutLink = allLinks.find((l) => l.href === "/about" || l.href === "/pages/about");
    const otherLinks = allLinks.filter(
        (l) => l.href !== "/about" && l.href !== "/pages/about",
    );
    const navLinks = [
        ...otherLinks,
        {name: t("navAnimaArtists"), href: "/anima-artists"},
        ...(aboutLink ? [aboutLink] : []),
    ];
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [hiddenOnScroll, setHiddenOnScroll] = useState(false);
    const lastScrollYRef = useRef(0);
    const prevHomeHeroStateRef = useRef<"full" | "compact" | null>(null);
    const onScrollRef = useRef<(() => void) | null>(null);
    const homeHeroCompact = useUIStore((s) => s.homeHeroCompact);

    useEffect(() => {
        const onScroll = () => {
            const nextScrollY = window.scrollY;
            const homeHeroState =
                document.documentElement.getAttribute("data-home-hero");
            const normalizedHomeHeroState =
                homeHeroState === "full" || homeHeroState === "compact"
                    ? homeHeroState
                    : null;
            const hasHomeHeroStateChanged =
                prevHomeHeroStateRef.current !== normalizedHomeHeroState;

            prevHomeHeroStateRef.current = normalizedHomeHeroState;

            if (hasHomeHeroStateChanged) {
                setHiddenOnScroll(false);
                lastScrollYRef.current = nextScrollY;
                return;
            }

            if (normalizedHomeHeroState === "full") {
                setHiddenOnScroll(false);
                lastScrollYRef.current = nextScrollY;
                return;
            }

            const isScrollingDown = nextScrollY > lastScrollYRef.current;
            const delta = Math.abs(nextScrollY - lastScrollYRef.current);

            if (nextScrollY <= 24) {
                setHiddenOnScroll(false);
            } else if (delta > 6) {
                setHiddenOnScroll(isScrollingDown);
            }

            lastScrollYRef.current = nextScrollY;
        };

        onScrollRef.current = onScroll;
        onScroll();
        window.addEventListener("scroll", onScroll, {passive: true});
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        onScrollRef.current?.();
    }, [homeHeroCompact]);

    useEffect(() => {
        const closeMobileChromeOnDesktop = () => {
            if (window.matchMedia("(min-width: 768px)").matches) {
                setMobileMenuOpen(false);
                setMobileSearchOpen(false);
            }
        };

        closeMobileChromeOnDesktop();
        window.addEventListener("resize", closeMobileChromeOnDesktop);
        return () =>
            window.removeEventListener("resize", closeMobileChromeOnDesktop);
    }, []);

    return (
        <header
            className={classNames(
                "sticky top-0 z-50 mx-auto w-full max-w-[var(--page-width)] px-0 transition-transform duration-200 md:px-4",
                hiddenOnScroll ? "-translate-y-[130%]" : "translate-y-0",
            )}
        >
            <div className="mt-4 hidden rounded-[1.35rem] border border-white/40 bg-[var(--card-bg)]/95 px-5 py-3 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.65)] backdrop-blur md:block">
                <div className="flex items-center justify-between gap-5">
                    <Link
                        to="/"
                        className="rounded-lg px-2.5 py-2 text-base font-bold text-[var(--primary-text)] transition hover:bg-black/5 hover:text-[var(--primary)] dark:hover:bg-white/10"
                    >
                        <span className="inline-flex items-center">
                            <Icon
                                name="material-symbols:home-outline-rounded"
                                className="mr-2 h-5 w-5 text-[var(--primary-text)]"
                            />
                            {siteConfig.title}
                        </span>
                    </Link>
                    <nav className="flex shrink-0 items-center gap-1.5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--primary)] dark:hover:bg-white/10"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                    <NavbarSearch
                        className="hidden min-w-0 max-w-[14rem] flex-1 md:block lg:max-w-xs"
                        onPickResult={() => setMobileMenuOpen(false)}
                    />
                    <div className="flex shrink-0 items-center gap-1.5">
                        <ThemeColorSwitch/>
                        <LightDarkSwitch/>
                    </div>
                </div>
            </div>

            <div className="mt-4 overflow-visible rounded-[1.1rem] border border-white/35 bg-[var(--card-bg)]/95 px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.7)] backdrop-blur md:hidden">
                <div className="flex items-center justify-between gap-2">
                    <Link
                        to="/"
                        className="min-w-0 rounded-md px-2 py-1.5 text-[0.9rem] font-bold text-[var(--primary-text)] transition hover:bg-black/5 hover:text-[var(--primary)] dark:hover:bg-white/10"
                    >
                        <span className="inline-flex min-w-0 items-center">
                            <Icon
                                name="material-symbols:home-outline-rounded"
                                className="mr-1 h-4.5 w-4.5 shrink-0 text-[var(--primary-text)]"
                            />
                            <span className="truncate">{siteConfig.title}</span>
                        </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileSearchOpen((current) => {
                                    const next = !current;
                                    if (next) {
                                        setMobileMenuOpen(false);
                                    }
                                    return next;
                                });
                            }}
                            className={classNames(
                                "btn-plain flex h-10 w-10 rounded-full border border-black/10 dark:border-white/10",
                                mobileSearchOpen &&
                                    "bg-black/[0.06] dark:bg-white/[0.08]",
                            )}
                            aria-expanded={mobileSearchOpen}
                            aria-controls="mobile-navbar-search"
                            aria-label={t("searchLabel")}
                        >
                            <Icon
                                name={
                                    mobileSearchOpen
                                        ? "material-symbols:close-rounded"
                                        : "material-symbols:search-rounded"
                                }
                                className="h-5 w-5"
                            />
                        </button>
                        <ThemeColorSwitch/>
                        <LightDarkSwitch/>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen((current) => {
                                    const next = !current;
                                    if (next) {
                                        setMobileSearchOpen(false);
                                    }
                                    return next;
                                });
                            }}
                            className="btn-plain flex h-10 w-10 rounded-full border border-black/10 dark:border-white/10"
                            aria-label={
                                mobileMenuOpen ? t("closeMenu") : t("openMenu")
                            }
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navbar-menu"
                        >
                            <Icon
                                name={
                                    mobileMenuOpen
                                        ? "material-symbols:close-rounded"
                                        : "material-symbols:menu-rounded"
                                }
                                className="h-5 w-5"
                            />
                        </button>
                    </div>
                </div>
                {mobileSearchOpen ? (
                    <div
                        id="mobile-navbar-search"
                        className="mt-2 border-t border-black/10 pt-2.5 dark:border-white/10"
                    >
                        <NavbarSearch
                            autoFocus
                            className="w-full"
                            onPickResult={() => {
                                setMobileSearchOpen(false);
                                setMobileMenuOpen(false);
                            }}
                        />
                    </div>
                ) : null}
                {mobileMenuOpen ? (
                    <nav
                        id="mobile-navbar-menu"
                        className="mt-2 grid gap-1.5 border-t border-black/10 pt-2.5 dark:border-white/10"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={`mobile-${link.href}`}
                                to={link.href}
                                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--primary)] dark:hover:bg-white/10"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                ) : null}
            </div>
        </header>
    );
}
