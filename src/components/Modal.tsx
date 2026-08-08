import {useCallback, useEffect, useState, type ReactNode} from "react";
import {createPortal} from "react-dom";
import Icon from "./Icon";
import {t} from "@/i18n";
import {classNames} from "@/utils/common-utils";

type Props = {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    children: ReactNode;
    maxWidthClass?: string;
    bodyClassName?: string;
};

export default function Modal({
    open,
    onClose,
    title,
    children,
    maxWidthClass = "max-w-3xl",
    bodyClassName = "",
}: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(typeof document !== "undefined");
    }, []);

    useEffect(() => {
        if (!open) return;
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
    }, [open, onClose]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target !== e.currentTarget) return;
            onClose();
        },
        [onClose],
    );

    const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    }, []);

    const handleCloseClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onClose();
        },
        [onClose],
    );

    if (!mounted || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[2147483000] overflow-y-auto p-3 sm:p-8 animate-[fadeIn_.15s_ease-out]"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            style={{
                backgroundColor: "rgba(0,0,0,0.66)",
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
            <div
                className={classNames(
                    "mx-auto my-auto min-h-full w-full items-center justify-center",
                )}
                style={{display: "flex"}}
            >
                <div
                    className={classNames(
                        "card relative w-full overflow-hidden",
                        maxWidthClass,
                        "animate-[popIn_.18s_cubic-bezier(.2,.8,.2,1)]",
                    )}
                    onClick={handleCardClick}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--line-divider)] px-5 py-4 md:px-7 md:py-5">
                        <div className="min-w-0 flex-1">
                            {typeof title === "string" ? (
                                <h2 className="truncate text-xl font-bold leading-7 text-[var(--foreground)] md:text-2xl">
                                    {title}
                                </h2>
                            ) : (
                                title
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleCloseClick}
                            aria-label={t("closeMenu")}
                            className="btn-regular shrink-0 rounded-full p-2"
                        >
                            <Icon
                                name="material-symbols:close-rounded"
                                className="h-5 w-5 text-[var(--btn-content)]"
                            />
                        </button>
                    </div>
                    <div
                        className={classNames(
                            "max-h-[72vh] overflow-y-auto px-5 py-5 md:px-7 md:py-6 custom-md prose prose-zinc max-w-none dark:prose-invert",
                            bodyClassName,
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
