import {useEffect} from "react";
import {useContentStore} from "@/store/content";
import {useUIStore} from "@/store/ui";
import HomePostList from "@/components/HomePostList";
import {useDocumentTitle} from "@/utils/seo";
import {t} from "@/i18n";

export default function HomePage() {
    const ensureMeta = useContentStore((s) => s.ensureMeta);
    const tryApplyInline = useContentStore((s) => s.tryApplyInline);
    const posts = useContentStore((s) => s.posts);
    const setLayoutHeroMode = useUIStore((s) => s.setLayoutHeroMode);

    useEffect(() => {
        setLayoutHeroMode("home");
        return () => setLayoutHeroMode("compact");
    }, [setLayoutHeroMode]);

    useEffect(() => {
        tryApplyInline();
        ensureMeta().catch(() => undefined);
    }, [ensureMeta, tryApplyInline]);

    useDocumentTitle(t("home.title"), undefined, "/");

    return <HomePostList posts={posts}/>;
}
