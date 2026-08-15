import React, {type ReactNode} from "react";

export type MdGithubCardSkeletonProps = {
    repo: string;
    isValid: boolean;
    owner: string;
    repoName: string;
    githubLogoSvg: ReactNode;
    starIconSvg: ReactNode;
    forkIconSvg: ReactNode;
    licenseIconSvg: ReactNode;
};

export function MdGithubCardSkeleton({
    repo,
    isValid,
    owner,
    repoName,
    githubLogoSvg,
    starIconSvg,
    forkIconSvg,
    licenseIconSvg,
}: MdGithubCardSkeletonProps) {
    const statusClass = isValid ? "fetch-waiting" : "fetch-error";
    const descriptionText = isValid
        ? "Waiting for api.github.com..."
        : 'Invalid repository format, expected "owner/repo".';
    const attrs: Record<string, unknown> = {
        className: `card-github no-styling ${statusClass}`,
        href: isValid ? `https://github.com/${repo}` : "#",
        target: "_blank",
        rel: "noreferrer",
    };
    if (isValid) {
        attrs["data-github-card"] = repo;
    }

    const slot = (name: string) => ({["data-gc-slot"]: name});

    return React.createElement(
        "a",
        attrs,
        React.createElement(
            "div",
            {className: "gc-titlebar"},
            React.createElement(
                "div",
                {className: "gc-titlebar-left"},
                React.createElement(
                    "div",
                    {className: "gc-owner"},
                    React.createElement("div", {
                        className: "gc-avatar",
                        ...slot("avatar"),
                    }),
                    React.createElement("div", {className: "gc-user"}, owner),
                ),
                React.createElement("div", {className: "gc-divider"}, "/"),
                React.createElement("div", {className: "gc-repo"}, repoName),
            ),
            React.createElement("div", {
                className: "github-logo",
                dangerouslySetInnerHTML: {__html: githubLogoSvg as string},
            }),
        ),
        React.createElement(
            "div",
            {
                className: "gc-description",
                ...slot("description"),
            },
            descriptionText,
        ),
        React.createElement(
            "div",
            {className: "gc-infobar"},
            React.createElement(
                "div",
                {className: "gc-stars"},
                React.createElement("span", {
                    className: "gc-icon gc-icon-star",
                    dangerouslySetInnerHTML: {__html: starIconSvg as string},
                }),
                React.createElement("span", {className: "gc-value", ...slot("stars")}, "00K"),
            ),
            React.createElement(
                "div",
                {className: "gc-forks"},
                React.createElement("span", {
                    className: "gc-icon gc-icon-fork",
                    dangerouslySetInnerHTML: {__html: forkIconSvg as string},
                }),
                React.createElement("span", {className: "gc-value", ...slot("forks")}, "0K"),
            ),
            React.createElement(
                "div",
                {className: "gc-license"},
                React.createElement("span", {
                    className: "gc-icon gc-icon-license",
                    dangerouslySetInnerHTML: {__html: licenseIconSvg as string},
                }),
                React.createElement("span", {className: "gc-value", ...slot("license")}, "no-license"),
            ),
            React.createElement(
                "span",
                {className: "gc-language", ...slot("language")},
                "Waiting...",
            ),
        ),
    );
}
