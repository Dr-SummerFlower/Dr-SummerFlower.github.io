import {createBrowserRouter, type RouteObject} from "react-router-dom";
import {withSiteBasePath} from "@/lib/config/helpers/url.ts";
import {RootLayout} from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import PostPage from "@/pages/PostPage";
import ArchivePage from "@/pages/ArchivePage";
import AboutPage from "@/pages/AboutPage";
import CustomPage from "@/pages/CustomPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AnimaArtistsPage from "@/pages/AnimaArtistsPage";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout/>,
        errorElement: <NotFoundPage/>,
        children: [
            {index: true, element: <HomePage/>},
            {path: "archive", element: <ArchivePage/>},
            {path: "about", element: <AboutPage/>},
            {path: "anima-artists", element: <AnimaArtistsPage/>},
            {path: "pages/:slug", element: <CustomPage/>},
            {path: "posts/:slug", element: <PostPage/>},
            {path: "*", element: <NotFoundPage/>},
        ],
    },
];

export const router = createBrowserRouter(routes, {
    basename: withSiteBasePath("/"),
});
