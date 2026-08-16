import {useEffect} from "react";
import {useContentStore} from "@/store/content";
import MainGridLayout from "@/layouts/MainGridLayout";
import HomePostList from "@/components/HomePostList";
import {useDocumentTitle} from "@/utils/seo";
import {t} from "@/i18n";

export default function HomePage() {
    const ensureMeta = useContentStore((s) => s.ensureMeta);
    const tryApplyInline = useContentStore((s) => s.tryApplyInline);
    const posts = useContentStore((s) => s.posts);
    const categories = useContentStore((s) => s.categories);
    const tags = useContentStore((s) => s.tags);

    useEffect(() => {
        tryApplyInline();
        ensureMeta().catch(() => undefined);
    }, [ensureMeta, tryApplyInline]);

    useDocumentTitle(t("home.title"), undefined, "/");

    return (
        <MainGridLayout categories={categories} tags={tags} heroMode="home">
            <HomePostList posts={posts}/>
        </MainGridLayout>
    );
}
