import type {RehypeExpressiveCodeOptions} from "rehype-expressive-code";
import {pluginCollapsibleSections} from "@expressive-code/plugin-collapsible-sections";
import {pluginLineNumbers} from "@expressive-code/plugin-line-numbers";

export const expressiveCodeOptions: RehypeExpressiveCodeOptions = {
    themes: ["catppuccin-latte"],
    plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
    defaultProps: {
        wrap: true,
        overridesByLang: {
            shellsession: {
                showLineNumbers: false,
            },
        },
    },
    styleOverrides: {
        codeBackground: "var(--codeblock-bg)",
        borderRadius: "1rem",
        borderWidth: "1px",
        borderColor: "var(--line-divider)",
        codeFontSize: "0.875rem",
        codeFontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        codeLineHeight: "1.5rem",
        codePaddingInline: "1rem",
        frames: {
            editorBackground: "var(--codeblock-bg)",
            terminalBackground: "var(--codeblock-bg)",
            terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
            editorTabBarBackground: "var(--codeblock-topbar-bg)",
            editorActiveTabBackground: "none",
            editorActiveTabIndicatorBottomColor: "var(--primary)",
            editorActiveTabIndicatorTopColor: "none",
            editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
            terminalTitlebarBorderBottomColor: "none",
            inlineButtonBackground: "var(--codeblock-topbar-bg)",
            inlineButtonBackgroundIdleOpacity: "0",
            inlineButtonBackgroundHoverOrFocusOpacity: "1",
            inlineButtonBackgroundActiveOpacity: "1",
            inlineButtonBorderOpacity: "0",
            inlineButtonForeground: "var(--codeblock-color)",
            terminalTitlebarDotsOpacity: "0.15",
            editorActiveTabBorderColor: "transparent",
            editorTabsMarginInlineStart: "0",
            editorTabsMarginBlockStart: "0",
            editorTabBorderRadius: "0.5rem",
            editorTabBarBorderColor: "transparent",
            terminalTitlebarDotsForeground: "var(--muted)",
            terminalTitlebarForeground: "var(--foreground)",
            tooltipSuccessBackground: "var(--primary)",
            tooltipSuccessForeground: "#fff",
            terminalIcon: "var(--terminal-icon)",
        },
        textMarkers: {
            delHue: "0",
            insHue: "180",
            markHue: "250",
        },
    },
    frames: {
        showCopyToClipboardButton: true,
        extractFileNameFromCode: true,
    },
    useThemedScrollbars: true,
};
