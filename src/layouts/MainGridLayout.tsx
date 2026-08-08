import type {ReactNode} from "react";
import {siteConfig, withSiteBasePath} from "@/config";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import BackToTop from "@/components/BackToTop";
import HomeHeroState from "@/components/HomeHeroState";
import SideBar from "@/components/widget/SideBar";
import TOC from "@/components/widget/TOC";
import TOCMobileFab from "@/components/widget/TOCMobileFab";
import type {CountItem, HeadingItem} from "@/types/post";
import {classNames} from "@/utils/common-utils";

type Props = {
    children: ReactNode;
    categories: CountItem[];
    tags: CountItem[];
    headings?: HeadingItem[];
    heroMode?: "home" | "compact";
};

export default function MainGridLayout({
    children,
    categories,
    tags,
    headings = [],
    heroMode = "compact",
}: Props) {
    const enableHomeHero = siteConfig.banner.enable && heroMode === "home";
    const showTocColumn = siteConfig.toc.enable && headings.length > 0;

    return (
        <div
            className={classNames(
                "main-grid-layout relative isolate flex min-h-screen flex-col",
                enableHomeHero ? "main-grid-layout--home-hero" : "",
            )}
        >
            <HomeHeroState enabled={enableHomeHero}/>
            <Navbar/>
            {siteConfig.banner.enable ? (
                <div className="hero-banner pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden">
                    <div className="relative h-full w-full">
                        <img
                            src={withSiteBasePath(siteConfig.banner.src)}
                            alt="Blog banner"
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{objectPosition: siteConfig.banner.position}}
                            fetchPriority="high"
                        />
                    </div>
                    <div
                        className="hero-banner-tint absolute inset-0"
                        aria-hidden
                    />
                    <div
                        className="hero-banner-fade absolute inset-x-0 bottom-0 z-[1]"
                        aria-hidden
                    />
                    {siteConfig.banner.credit.enable ? (
                        <p className="pointer-events-auto absolute bottom-4 right-4 z-[2] rounded-full bg-black/40 px-3 py-1 text-xs text-white/90 backdrop-blur">
                            {siteConfig.banner.credit.url ? (
                                <a
                                    href={siteConfig.banner.credit.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline-offset-2 hover:underline"
                                >
                                    {siteConfig.banner.credit.text}
                                </a>
                            ) : (
                                siteConfig.banner.credit.text
                            )}
                        </p>
                    ) : null}
                </div>
            ) : null}
            <main
                className={classNames(
                    "hero-main relative z-10 mx-auto w-full max-w-[var(--page-width)] text-[var(--foreground)]",
                    "main-feed-layout",
                    showTocColumn && "main-feed-layout--with-toc",
                )}
            >
                <div className="main-feed-layout__articles">{children}</div>
                <SideBar
                    categories={categories}
                    tags={tags}
                    className="main-feed-layout__sidebar"
                />
                <div className="main-feed-layout__footer">
                    <Footer/>
                </div>
                {siteConfig.toc.enable ? (
                    <TOC headings={headings} maxDepth={siteConfig.toc.depth}/>
                ) : null}
            </main>
            <div className="floating-reader-dock">
                {showTocColumn ? (
                    <div className="md:hidden">
                        <TOCMobileFab
                            headings={headings}
                            maxDepth={siteConfig.toc.depth}
                        />
                    </div>
                ) : null}
                <BackToTop docked/>
            </div>
        </div>
    );
}
