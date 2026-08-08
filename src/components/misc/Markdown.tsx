import {useCallback, useEffect, useRef, useState} from "react";
import ImageLightbox from "@/components/ImageLightbox";

type Props = {
    html: string;
};

export default function Markdown({html}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxAlt, setLightboxAlt] = useState<string | undefined>(undefined);

    const handleImgClick = useCallback((e: Event) => {
        const target = e.target as HTMLElement | null;
        if (!target || target.tagName !== "IMG") return;
        const img = target as HTMLImageElement;
        if (!img.currentSrc && !img.src) return;
        const parent = img.parentElement;
        if (parent && parent.tagName === "A") return;
        e.preventDefault();
        setLightboxSrc(img.currentSrc || img.src);
        setLightboxAlt(img.alt || undefined);
    }, []);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;
        root.addEventListener("click", handleImgClick, {passive: false});
        const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
        for (const img of imgs) {
            img.style.cursor = "zoom-in";
            img.style.transition = "transform .25s ease";
        }
        return () => {
            root.removeEventListener("click", handleImgClick);
        };
    }, [html, handleImgClick]);

    return (
        <>
            <div
                ref={containerRef}
                className="custom-md prose prose-zinc max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{__html: html}}
            />
            <ImageLightbox
                src={lightboxSrc}
                alt={lightboxAlt}
                onClose={() => setLightboxSrc(null)}
            />
        </>
    );
}
