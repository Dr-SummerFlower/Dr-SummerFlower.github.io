import type {ComponentType, ErrorInfo, ReactNode} from "react";
import {Component, Suspense, useMemo, lazy} from "react";
import {Link} from "react-router-dom";
import type {ComponentCustomPage} from "@/types/config";
import {useDocumentTitle} from "@/utils/seo";
import {getCustomPageLoader, resolveCustomPageComponentId} from "./registry";

type PageErrorBoundaryProps = { children: ReactNode };
type PageErrorBoundaryState = { hasError: boolean; error: Error | null };

class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
    constructor(props: PageErrorBoundaryProps) {
        super(props);
        this.state = {hasError: false, error: null};
    }

    static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
        return {hasError: true, error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Custom page render error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <section className="card px-8 py-12 text-center">
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">
                        页面加载出错
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                        {this.state.error?.message ?? "发生了未知错误，请稍后再试。"}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            to="/"
                            className="rounded-full bg-[var(--primary-text)] px-5 py-2 text-sm font-medium text-white dark:bg-[var(--primary)]"
                        >
                            返回首页
                        </Link>
                    </div>
                </section>
            );
        }
        return this.props.children;
    }
}

type ComponentCustomPageLoaderProps = {
    pageMeta: ComponentCustomPage;
};

export default function ComponentCustomPageLoader({pageMeta}: ComponentCustomPageLoaderProps) {
    const pagePath = pageMeta.path ?? `/pages/${pageMeta.slug}`;

    useDocumentTitle(pageMeta.title, pageMeta.description, pagePath);

    const componentId = resolveCustomPageComponentId(pageMeta);
    const loader = getCustomPageLoader(componentId);

    const LazyPage = useMemo(() => {
        if (!loader) return null;
        return lazy<ComponentType>(loader);
    }, [loader]);

    return (
        <PageErrorBoundary>
            {!loader ? (
                <section className="card px-8 py-12 text-center">
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">
                        未找到页面组件
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                        组件 ID &quot;{componentId}&quot; 未在注册表中找到。
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            to="/"
                            className="rounded-full bg-[var(--primary-text)] px-5 py-2 text-sm font-medium text-white dark:bg-[var(--primary)]"
                        >
                            返回首页
                        </Link>
                    </div>
                </section>
            ) : (
                <Suspense
                    fallback={
                        <div
                            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                            aria-busy="true"
                        >
                            {Array.from({length: 6}).map((_, i) => (
                                <div
                                    key={i}
                                    className="overflow-hidden rounded-[1.35rem] border border-[var(--card-border)] bg-[var(--card-bg)]/60"
                                >
                                    <div className="grid grid-cols-2 gap-0.5 bg-[var(--line-divider)]/60">
                                        {Array.from({length: 4}).map((_, j) => (
                                            <div
                                                key={j}
                                                className="aspect-square animate-pulse bg-[var(--card-bg)]"
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-3 p-4">
                                        <div className="h-5 w-2/3 animate-pulse rounded-md bg-[var(--btn-regular-bg)]" />
                                        <div className="h-4 w-1/3 animate-pulse rounded-md bg-[var(--btn-regular-bg)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                >
                    {LazyPage ? <LazyPage /> : null}
                </Suspense>
            )}
        </PageErrorBoundary>
    );
}
