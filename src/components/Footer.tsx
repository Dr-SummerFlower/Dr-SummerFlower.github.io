import {licenseConfig, profileConfig, withSiteBasePath} from "@/config";
import {t} from "@/i18n";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const linkClass =
        "inline-flex items-center rounded-md px-1.5 py-0.5 font-medium !text-[var(--primary)] underline decoration-1 underline-offset-4 transition hover:bg-black/5 hover:!text-[var(--primary)] dark:hover:bg-white/10";

    return (
        <footer
            className="mt-10 rounded-[1.5rem] border border-dashed border-black/10 px-6 py-8 text-center text-sm text-[var(--muted)] dark:border-white/10"
        >
            <p>
                &copy; 2024 - {currentYear}{" "}
                <a
                    href={profileConfig.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                >
                    {profileConfig.name}
                </a>
                , {t("footer.adoptedLicense")}{" "}
                <a
                    href={licenseConfig.url}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                >
                    {licenseConfig.name}
                </a>{" "}
                {t("footer.licenseSuffix")}
            </p>
            <p className="mt-2">
                <a href={withSiteBasePath("/rss.xml")} className={linkClass}>
                    RSS
                </a>
                <span className="px-2 text-[var(--muted)]">|</span>
                <a href={withSiteBasePath("/sitemap.xml")} className={linkClass}>
                    Sitemap
                </a>
            </p>
            <p className="mt-2">
                {t("footer.builtWith")}{" "}
                <a
                    href="https://vite.dev"
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                >
                    Vite
                </a>{" "}
                +{" "}
                <a
                    href="https://react.dev"
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                >
                    React
                </a>
                , {t("footer.themeInspiredBy")}{" "}
                <a
                    href="https://github.com/saicaca/fuwari"
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                >
                    Fuwari
                </a>
            </p>
        </footer>
    );
}
