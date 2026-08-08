import {Icon} from "@iconify/react";
import {classNames} from "@/utils/common-utils";
import {useUIStore} from "@/store/ui";

type Props = {
    docked?: boolean;
};

export default function BackToTop({docked = false}: Props) {
    const visible = useUIStore((s) => s.backToTopVisible);

    return (
        <button
            type="button"
            aria-label="Back to top"
            onClick={() => window.scrollTo({top: 0, behavior: "smooth"})}
            className={classNames(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[var(--card-bg)] text-[var(--primary-text)] shadow-[0_12px_30px_-20px_rgba(15,23,42,0.7)] backdrop-blur transition",
                docked
                    ? "relative z-40 back-to-top--docked"
                    : "fixed z-40 back-to-top-anchor back-to-top--outer",
                visible
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
            )}
        >
            <Icon icon="material-symbols:keyboard-arrow-up-rounded" className="h-6 w-6"/>
        </button>
    );
}
