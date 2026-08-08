import {useEffect} from "react";
import {useUIStore} from "@/store/ui";

const COMPACT_SCROLL_THRESHOLD = 12;

type Props = {
    enabled: boolean;
};

export default function HomeHeroState({enabled}: Props) {
    const syncScroll = useUIStore((s) => s.syncScroll);

    useEffect(() => {
        const root = document.documentElement;

        if (!enabled) {
            root.removeAttribute("data-home-hero");
            return () => {
                root.removeAttribute("data-home-hero");
            };
        }

        let rafId = 0;

        const syncState = () => {
            rafId = 0;
            const y = window.scrollY;
            root.setAttribute(
                "data-home-hero",
                y > COMPACT_SCROLL_THRESHOLD ? "compact" : "full",
            );
            syncScroll(y);
        };

        const onScroll = () => {
            if (rafId !== 0) {
                return;
            }
            rafId = window.requestAnimationFrame(syncState);
        };

        syncState();
        window.addEventListener("scroll", onScroll, {passive: true});
        window.addEventListener("resize", onScroll);

        return () => {
            if (rafId !== 0) {
                window.cancelAnimationFrame(rafId);
            }
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            root.removeAttribute("data-home-hero");
        };
    }, [enabled, syncScroll]);

    return null;
}
