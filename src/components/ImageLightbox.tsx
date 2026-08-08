import {useCallback, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import Icon from "./Icon";
import {t} from "@/i18n";

type Props = {
    src: string | null;
    alt?: string;
    onClose: () => void;
};

export default function ImageLightbox({src, alt, onClose}: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(typeof document !== "undefined");
    }, []);

    useEffect(() => {
        if (!src) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        const prevOverflow = document.body.style.overflow;
        const prevTouchAction = document.body.style.touchAction;
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
        window.addEventListener("keydown", onKey, {passive: true});
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            document.body.style.touchAction = prevTouchAction;
        };
    }, [src, onClose]);

    const handleImgClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        e.stopPropagation();
    }, []);

    const handleCloseClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onClose();
        },
        [onClose],
    );

    if (!mounted || !src) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4 sm:p-8 animate-[fadeIn_.15s_ease-out]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={alt || t("animaArtistsPreview")}
            style={{
                backgroundColor: "rgba(0,0,0,0.78)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
            }}
        >
            <button
                type="button"
                onClick={handleCloseClick}
                aria-label={t("closeMenu")}
                className="btn-regular fixed z-10 h-11 w-11 shrink-0 rounded-full p-0 shadow-lg active:scale-95"
                style={{
                    top: "20px",
                    right: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon
                    name="material-symbols:close-rounded"
                    className="h-6 w-6 text-[var(--btn-content)]"
                />
            </button>
            <img
                src={src}
                alt={alt || t("animaArtistsPreview")}
                onClick={handleImgClick}
                className="relative z-[1] select-none shadow-2xl"
                draggable={false}
                style={{
                    maxWidth: "96vw",
                    maxHeight: "92vh",
                    objectFit: "contain",
                    borderRadius: "1rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            />
        </div>,
        document.body,
    );
}
