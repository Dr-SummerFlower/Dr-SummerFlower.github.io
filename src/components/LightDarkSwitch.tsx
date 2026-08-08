import {useEffect, useMemo, useRef, useState} from "react";
import {Icon} from "@iconify/react";
import {t} from "@/i18n";
import {classNames} from "@/utils/common-utils";
import {useThemeStore, type ThemeMode} from "@/store/theme";

export default function LightDarkSwitch() {
    const theme = useThemeStore((s) => s.mode);
    const setMode = useThemeStore((s) => s.setMode);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const themeItems = useMemo(
        () => [
            {
                value: "light" as const satisfies ThemeMode,
                label: t("themeModeLight"),
                icon: "material-symbols:wb-sunny-outline-rounded",
            },
            {
                value: "dark" as const satisfies ThemeMode,
                label: t("themeModeDark"),
                icon: "material-symbols:dark-mode-outline-rounded",
            },
            {
                value: "auto" as const satisfies ThemeMode,
                label: t("themeModeAuto"),
                icon: "material-symbols:radio-button-partial-outline",
            },
        ],
        [],
    );

    const currentThemeItem =
        themeItems.find((item) => item.value === theme) ?? themeItems[themeItems.length - 1];

    useEffect(() => {
        if (!open) return;
        const onDocumentMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!wrapperRef.current || !target) return;
            if (!wrapperRef.current.contains(target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDocumentMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onDocumentMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                aria-label={t("themeModeLabel")}
                aria-haspopup="menu"
                aria-expanded={open}
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--primary)] dark:hover:bg-white/10"
            >
                <Icon icon={currentThemeItem.icon} className="h-5 w-5"/>
            </button>

            <div
                role="menu"
                className={classNames(
                    "card absolute right-0 top-full mt-2 z-50 min-w-36 p-2 transition",
                    open
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-1 opacity-0",
                )}
            >
                {themeItems.map((item) => (
                    <button
                        key={item.value}
                        role="menuitemradio"
                        aria-checked={theme === item.value}
                        type="button"
                        onClick={() => {
                            setMode(item.value);
                            setOpen(false);
                        }}
                        className={classNames(
                            "mb-1 flex h-9 w-full items-center justify-start rounded-lg px-3 text-sm font-medium transition last:mb-0",
                            theme === item.value
                                ? "bg-black/6 text-[var(--primary)] dark:bg-white/10"
                                : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
                        )}
                    >
                        <Icon icon={item.icon} className="mr-3 h-5 w-5"/>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
