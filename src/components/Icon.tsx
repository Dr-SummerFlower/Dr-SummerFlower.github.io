import type {IconifyIcon} from "@iconify/types";
import {Icon as IconifyIconComponent} from "@iconify/react";

// ==== Material Symbols (import per-icon from @iconify/icons-material-symbols) ====
import _ms_article_outline_rounded from "@iconify/icons-material-symbols/article-outline-rounded";
import _ms_calendar_month_outline_rounded from "@iconify/icons-material-symbols/calendar-month-outline-rounded";
import _ms_chevron_right_rounded from "@iconify/icons-material-symbols/chevron-right-rounded";
import _ms_close_rounded from "@iconify/icons-material-symbols/close-rounded";
import _ms_dark_mode_outline_rounded from "@iconify/icons-material-symbols/dark-mode-outline-rounded";
import _ms_expand_more_rounded from "@iconify/icons-material-symbols/expand-more-rounded";
import _ms_folder_outline_rounded from "@iconify/icons-material-symbols/folder-outline-rounded";
import _ms_format_list_numbered_rounded from "@iconify/icons-material-symbols/format-list-numbered-rounded";
import _ms_home_outline_rounded from "@iconify/icons-material-symbols/home-outline-rounded";
import _ms_keyboard_arrow_up_rounded from "@iconify/icons-material-symbols/keyboard-arrow-up-rounded";
import _ms_mail from "@iconify/icons-material-symbols/mail";
import _ms_palette_outline from "@iconify/icons-material-symbols/palette-outline";
import _ms_radio_button_partial_outline from "@iconify/icons-material-symbols/radio-button-partial-outline";
import _ms_schedule_rounded from "@iconify/icons-material-symbols/schedule-rounded";
import _ms_search_rounded from "@iconify/icons-material-symbols/search-rounded";
import _ms_tag_rounded from "@iconify/icons-material-symbols/tag-rounded";
import _ms_text_fields_rounded from "@iconify/icons-material-symbols/text-fields-rounded";
import _ms_update_rounded from "@iconify/icons-material-symbols/update-rounded";
import _ms_wb_sunny_outline_rounded from "@iconify/icons-material-symbols/wb-sunny-outline-rounded";
import _ms_menu_rounded from "@iconify/icons-material-symbols/menu-rounded";
import _ms_check_small_rounded from "@iconify/icons-material-symbols/check-small-rounded";
import _ms_content_copy_outline_rounded from "@iconify/icons-material-symbols/content-copy-outline-rounded";
import _ms_download_2_outline_rounded from "@iconify/icons-material-symbols/download-2-outline-rounded";
import _ms_download_rounded from "@iconify/icons-material-symbols/download-rounded";
import _ms_info_outline_rounded from "@iconify/icons-material-symbols/info-outline-rounded";
import _ms_magic_button_outline from "@iconify/icons-material-symbols/magic-button-outline";

// ==== Font Awesome 6 Solid ====
import _fa6_solid_arrow_rotate_left from "@iconify/icons-fa6-solid/arrow-rotate-left";

// ==== Font Awesome 6 Brands ====
import _fa6_brands_bilibili from "@iconify/icons-fa6-brands/bilibili";
import _fa6_brands_github from "@iconify/icons-fa6-brands/github";
import _fa6_brands_npm from "@iconify/icons-fa6-brands/npm";

const _ICON_MAP: Record<string, IconifyIcon> = {
    // Material Symbols — used in original code
    "material-symbols:article-outline-rounded": _ms_article_outline_rounded as IconifyIcon,
    "material-symbols:calendar-month-outline-rounded": _ms_calendar_month_outline_rounded as IconifyIcon,
    "material-symbols:chevron-right-rounded": _ms_chevron_right_rounded as IconifyIcon,
    "material-symbols:close-rounded": _ms_close_rounded as IconifyIcon,
    "material-symbols:dark-mode-outline-rounded": _ms_dark_mode_outline_rounded as IconifyIcon,
    "material-symbols:expand-more-rounded": _ms_expand_more_rounded as IconifyIcon,
    "material-symbols:folder-outline-rounded": _ms_folder_outline_rounded as IconifyIcon,
    "material-symbols:format-list-numbered-rounded": _ms_format_list_numbered_rounded as IconifyIcon,
    "material-symbols:home-outline-rounded": _ms_home_outline_rounded as IconifyIcon,
    "material-symbols:keyboard-arrow-up-rounded": _ms_keyboard_arrow_up_rounded as IconifyIcon,
    "material-symbols:mail": _ms_mail as IconifyIcon,
    "material-symbols:palette-outline": _ms_palette_outline as IconifyIcon,
    "material-symbols:radio-button-partial-outline": _ms_radio_button_partial_outline as IconifyIcon,
    "material-symbols:schedule-rounded": _ms_schedule_rounded as IconifyIcon,
    "material-symbols:search-rounded": _ms_search_rounded as IconifyIcon,
    "material-symbols:tag-outline-rounded": _ms_tag_rounded as IconifyIcon,
    "material-symbols:text-fields-rounded": _ms_text_fields_rounded as IconifyIcon,
    "material-symbols:update-rounded": _ms_update_rounded as IconifyIcon,
    "material-symbols:wb-sunny-outline-rounded": _ms_wb_sunny_outline_rounded as IconifyIcon,
    "material-symbols:menu-rounded": _ms_menu_rounded as IconifyIcon,
    // New icons for Anima Artists page & PromptBlock copy / info modal
    "material-symbols:check-rounded": _ms_check_small_rounded as IconifyIcon,
    "material-symbols:content-copy-outline-rounded": _ms_content_copy_outline_rounded as IconifyIcon,
    // Alias: download-outline-rounded → download-2-outline-rounded (npm package uses download-2 prefix)
    "material-symbols:download-outline-rounded": _ms_download_2_outline_rounded as IconifyIcon,
    "material-symbols:download-2-outline-rounded": _ms_download_2_outline_rounded as IconifyIcon,
    "material-symbols:download-rounded": _ms_download_rounded as IconifyIcon,
    "material-symbols:info-outline-rounded": _ms_info_outline_rounded as IconifyIcon,
    "material-symbols:magic-button-outline": _ms_magic_button_outline as IconifyIcon,
    // Font Awesome 6 Solid
    "fa6-solid:arrow-rotate-left": _fa6_solid_arrow_rotate_left as IconifyIcon,
    // Font Awesome 6 Brands
    "fa6-brands:bilibili": _fa6_brands_bilibili as IconifyIcon,
    "fa6-brands:github": _fa6_brands_github as IconifyIcon,
    "fa6-brands:npm": _fa6_brands_npm as IconifyIcon,
};

type Props = {
    name?: string;
    className?: string;
};

export default function Icon({name, className}: Props) {
    if (!name) {
        return null;
    }
    const resolved = _ICON_MAP[name];
    if (!resolved) {
        return null;
    }
    return <IconifyIconComponent icon={resolved} className={className}/>;
}
