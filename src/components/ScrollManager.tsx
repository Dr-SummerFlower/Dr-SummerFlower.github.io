import {useEffect} from "react";
import {useLocation} from "react-router-dom";
import {useUIStore} from "@/store/ui";

export default function ScrollManager() {
    const location = useLocation();
    const syncScroll = useUIStore((s) => s.syncScroll);

    useEffect(() => {
        window.scrollTo({top: 0, behavior: "auto"});
    }, [location.pathname, location.search]);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(() => {
                raf = 0;
                syncScroll(window.scrollY);
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, {passive: true});
        window.addEventListener("resize", onScroll);
        return () => {
            if (raf) window.cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [syncScroll]);

    return null;
}
