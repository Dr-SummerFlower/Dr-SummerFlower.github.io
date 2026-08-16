import {useCallback, useEffect, useRef, useState} from "react";
import {giscusConfig} from "@/lib/config/derived.config.ts";

type LoadState = "idle" | "loading" | "ready" | "error";

let giscusScriptLoaded = false;

export default function Giscus() {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetHostRef = useRef<HTMLDivElement>(null);
    const ioRef = useRef<IntersectionObserver | null>(null);
    const [state, setState] = useState<LoadState>(
        giscusConfig.enable ? "idle" : "ready",
    );

    const inject = useCallback(() => {
        const widgetHost = widgetHostRef.current;
        if (!widgetHost || giscusScriptLoaded || !giscusConfig.enable) return;
        giscusScriptLoaded = true;
        setState("loading");

        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.async = true;
        script.crossOrigin = "anonymous";
        script.setAttribute("data-repo", giscusConfig.repo);
        script.setAttribute("data-repo-id", giscusConfig.repoId);
        script.setAttribute("data-category", giscusConfig.category);
        script.setAttribute("data-category-id", giscusConfig.categoryId);
        script.setAttribute("data-mapping", giscusConfig.mapping);
        script.setAttribute("data-strict", String(giscusConfig.strict));
        script.setAttribute(
            "data-reactions-enabled",
            giscusConfig.reactionsEnabled,
        );
        script.setAttribute("data-emit-metadata", giscusConfig.emitMetadata);
        script.setAttribute("data-input-position", giscusConfig.inputPosition);
        script.setAttribute("data-theme", giscusConfig.theme);
        script.setAttribute("data-lang", giscusConfig.lang);
        script.setAttribute("data-loading", "lazy");

        const cleanup = () => {
            try {
                if (widgetHost.contains(script)) widgetHost.removeChild(script);
            } catch {
                /* noop */
            }
        };
        script.addEventListener("load", () => {
            cleanup();
            setState("ready");
        });
        script.addEventListener("error", () => {
            cleanup();
            giscusScriptLoaded = false;
            setState("error");
        });
        widgetHost.appendChild(script);
    }, []);

    useEffect(() => {
        if (!giscusConfig.enable) return;
        const container = containerRef.current;
        if (!container) return;
        if (state === "ready" || state === "loading") return;

        if (typeof IntersectionObserver === "undefined") {
            inject();
            return;
        }
        if (ioRef.current) return;
        ioRef.current = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        ioRef.current?.disconnect();
                        ioRef.current = null;
                        inject();
                        break;
                    }
                }
            },
            {rootMargin: "400px 0px", threshold: 0},
        );
        ioRef.current.observe(container);
        return () => {
            ioRef.current?.disconnect();
            ioRef.current = null;
        };
    }, [inject, state]);

    const onRetry = () => {
        giscusScriptLoaded = false;
        inject();
    };

    if (!giscusConfig.enable) {
        return null;
    }

    return (
        <section
            ref={containerRef}
            className="card mt-4 px-6 py-6 md:px-8"
            aria-busy={state === "loading"}
            aria-live="polite"
        >
            <div ref={widgetHostRef}/>
            {state === "ready"
                ? null
                : state === "error"
                  ? (
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span>评论无法加载（连接 giscus.app 失败）</span>
                          <button
                              type="button"
                              onClick={onRetry}
                              className="inline-flex items-center gap-1 rounded-full border border-current/20 px-3 py-1 hover:bg-current/10"
                          >
                              点击重试
                          </button>
                      </div>
                  )
                  : (
                      <div className="flex flex-wrap items-center gap-3 min-h-[72px] text-sm text-fg-muted">
                          <span aria-hidden>💬</span>
                          <span>评论加载中…（由 Giscus 驱动 · 需连接 GitHub）</span>
                          <span
                              className="inline-block flex-1 h-1 rounded-full bg-primary/60"
                              style={{animation: "pulsate 1.6s ease-in-out infinite"}}
                          />
                      </div>
                  )}
        </section>
    );
}
