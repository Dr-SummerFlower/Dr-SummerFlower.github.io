import {useRef, useState} from "react";
import {Icon} from "@iconify/react";
import {t} from "@/i18n";
import {classNames} from "@/utils/common-utils";
import {useThemeStore} from "@/store/theme";
import {siteConfig} from "@/lib/config/derived.config.ts";

export default function ThemeColorSwitch() {
    const hue = useThemeStore((s) => s.hue);
    const setHue = useThemeStore((s) => s.setHue);
    const resetHue = useThemeStore((s) => s.resetHue);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const defaultHue = siteConfig.themeColor.hue;

    if (siteConfig.themeColor.fixed) {
        return null;
    }

    return (
        <div
            ref={wrapperRef}
            className="relative z-50"
            onMouseLeave={() => setOpen(false)}
        >
            <button
                aria-label={t("theme.color")}
                type="button"
                onClick={() => setOpen((value) => !value)}
                onBlur={(e) => {
                    const target = e.relatedTarget as Node | null;
                    if (!wrapperRef.current?.contains(target)) {
                        setOpen(false);
                    }
                }}
                className="btn-plain scale-animation h-9 w-9 rounded-lg active:scale-90"
            >
                <Icon icon="material-symbols:palette-outline-rounded" className="text-[1.1rem]"/>
            </button>

            <div
                className={classNames(
                    "absolute right-0 top-9 pt-4 transition-all",
                    open ? "" : "float-panel-closed pointer-events-none opacity-0",
                )}
            >
                <div className="float-panel w-80 px-4 py-4">
                    <div className="mb-3 flex flex-row items-center justify-between gap-2">
                        <div
                            className="relative ml-3 flex gap-2 text-lg font-bold text-[var(--foreground)] transition before:absolute before:-left-3 before:top-[0.33rem] before:h-4 before:w-1 before:rounded-md before:bg-[var(--primary)]"
                        >
                            {t("theme.color")}
                            <button
                                aria-label={t("theme.reset")}
                                type="button"
                                onClick={() => resetHue()}
                                className={classNames(
                                    "btn-regular h-7 w-7 rounded-md active:scale-90 will-change-transform",
                                    hue === defaultHue && "pointer-events-none opacity-0",
                                )}
                            >
                                <div className="text-[var(--btn-content)]">
                                    <Icon
                                        icon="fa6-solid:arrow-rotate-left"
                                        className="text-[0.875rem]"
                                    />
                                </div>
                            </button>
                        </div>
                        <div className="flex gap-1">
                            <div className="theme-hue-value flex h-7 w-10 items-center justify-center rounded-md text-sm font-bold">
                                {hue}
                            </div>
                        </div>
                    </div>

                    <div className="theme-hue-slider-shell h-6 w-full select-none rounded px-1">
                        <input
                            aria-label={t("theme.color")}
                            type="range"
                            min={0}
                            max={360}
                            step={5}
                            value={hue}
                            onChange={(event) => {
                                setHue(Number(event.currentTarget.value));
                            }}
                            className="theme-hue-slider h-6 w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
