import {Link} from "react-router-dom";
import {t} from "@/i18n";

export default function NotFoundPage() {
    return (
        <div className="mx-auto w-full max-w-xl px-4 py-16">
            <div className="card px-8 py-12 text-center">
                <div className="text-8xl font-black tracking-tight text-[var(--primary)] md:text-9xl">
                    404
                </div>
                <h1 className="mt-4 text-3xl font-bold text-[var(--foreground)]">
                    {t("error.pageNotFound")}
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    {t("error.pageNotFoundDescription")}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                        to="/"
                        className="rounded-full bg-[var(--primary-text)] px-5 py-2 text-sm font-medium text-white dark:bg-[var(--primary)]"
                    >
                        {t("common.backHome")}
                    </Link>
                    <Link
                        to="/archive"
                        className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-[var(--foreground)] dark:border-white/15"
                    >
                        {t("common.viewArchive")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
