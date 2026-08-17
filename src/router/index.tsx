import {createBrowserRouter, type RouteObject} from "react-router-dom";
import {withSiteBasePath} from "@/lib/config/helpers/url.ts";
import {RootLayout} from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import PostPage from "@/pages/PostPage";
import ArchivePage from "@/pages/ArchivePage";
import AboutPage from "@/pages/AboutPage";
import CustomPage from "@/pages/CustomPage";
import NotFoundPage from "@/pages/NotFoundPage";
import {getCustomPages} from "@/lib/config/helpers/navigation.ts";
import {ComponentCustomPageLoader} from "@/custom-pages";
import type {ComponentCustomPage, CustomPageItem} from "@/types/config";

function resolveRoutePath(page: CustomPageItem): string | null {
    if (page.type === "component") {
        let path = page.path ?? `pages/${page.slug}`;
        if (path.startsWith("/")) {
            path = path.slice(1);
        }
        return path;
    }
    if (page.slug === "about") {
        return "about";
    }
    return null;
}

function buildCustomPageRoutes(): RouteObject[] {
    const result: RouteObject[] = [];
    for (const page of getCustomPages()) {
        const path = resolveRoutePath(page);
        if (!path) continue;
        if (page.type === "component") {
            result.push({
                path,
                element: <ComponentCustomPageLoader pageMeta={page as ComponentCustomPage}/>,
            });
        } else if (page.slug === "about") {
            result.push({
                path,
                element: <AboutPage/>,
            });
        }
    }
    return result;
}

const routes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout/>,
        errorElement: <NotFoundPage/>,
        children: [
            {index: true, element: <HomePage/>},
            {path: "archive", element: <ArchivePage/>},
            ...buildCustomPageRoutes(),
            {path: "pages/:slug", element: <CustomPage/>},
            {path: "posts/:slug", element: <PostPage/>},
            {path: "*", element: <NotFoundPage/>},
        ],
    },
];

export const router = createBrowserRouter(routes, {
    basename: withSiteBasePath("/"),
});
