import React, {type ReactNode} from "react";

export type AdmonitionType =
    | "note"
    | "tip"
    | "important"
    | "caution"
    | "warning"
    | "details";

export type MdAdmonitionProps = {
    type: AdmonitionType;
    title: string;
    iconSvg: ReactNode;
    children?: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
};

export function MdAdmonition({
    type,
    title,
    iconSvg,
    children,
    collapsible,
    defaultOpen,
}: MdAdmonitionProps) {
    const className = `admonition admonition-${type}`;
    const titleInner = React.createElement(
        React.Fragment,
        null,
        React.createElement("span", {
            className: "admonition-icon-wrap",
            dangerouslySetInnerHTML: {__html: iconSvg as string},
        }),
        React.createElement("span", null, title),
    );

    if (collapsible || type === "details") {
        return React.createElement(
            "details",
            {
                className,
                ...(defaultOpen ? {open: true} : {}),
            },
            React.createElement(
                "summary",
                {className: "admonition-title"},
                titleInner,
            ),
            React.createElement("div", {className: "admonition-body"}, children),
        );
    }
    return React.createElement(
        "div",
        {className},
        React.createElement("div", {className: "admonition-title"}, titleInner),
        React.createElement("div", {className: "admonition-body"}, children),
    );
}
