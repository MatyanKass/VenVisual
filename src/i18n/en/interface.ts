/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/interface.ts, keyed by feature id. Missing entries fall back to Russian. */
export const EN_INTERFACE: Record<string, FeatureText> = {
    /* ---------- shape & fonts ---------- */
    radius: {
        label: "Corner rounding",
        group: "Shape & fonts"
    },
    radiusSeparate: {
        label: "Separate rounding for messages, panels and images",
        desc: "While this is off, everything follows the slider above",
        group: "Shape & fonts"
    },
    radiusMessages: {
        label: "Message rounding",
        group: "Shape & fonts"
    },
    radiusPanels: {
        label: "Rounding of panels, menus and the chat input",
        group: "Shape & fonts"
    },
    radiusMedia: {
        label: "Rounding of images, attachments and code",
        group: "Shape & fonts"
    },
    fontFamily: {
        label: "Interface font",
        desc: "Name of a font installed on your PC, for example Inter, Nunito, Comic Sans MS",
        group: "Shape & fonts"
    },
    codeFont: {
        label: "Font for code",
        group: "Shape & fonts"
    },
    animSpeed: {
        label: "Length of every animation",
        group: "Shape & fonts"
    },
    smoothScroll: {
        label: "Smooth scrolling",
        desc: "Except in the chat itself, where it gets in the way of loading older messages",
        group: "Shape & fonts"
    },

    /* ---------- scrollbars ---------- */
    scrollbarStyle: {
        label: "Scrollbars",
        group: "Scrollbars",
        options: {
            default: "Discord default",
            accent: "Accent color",
            gradient: "Gradient",
            hidden: "Hidden"
        }
    },
    scrollbarWidth: {
        label: "Scrollbar thickness",
        group: "Scrollbars",
        activeHint: "Works with the accent color and gradient scrollbars"
    },
    scrollbarColor: {
        label: "Scrollbar color",
        desc: "Empty means the theme's accent color",
        group: "Scrollbars",
        activeHint: "Works with the accent color and gradient scrollbars"
    },
    scrollbarColor2: {
        label: "Second gradient color",
        group: "Scrollbars",
        activeHint: "Works with the gradient scrollbars"
    },
    scrollbarHoverColor: {
        label: "Scrollbar color on hover",
        group: "Scrollbars",
        activeHint: "Works with the accent color and gradient scrollbars"
    },

    /* ---------- chat input ---------- */
    inputGlow: {
        label: "Chat input glows while you type",
        group: "Chat input"
    },
    inputGlowColor: {
        label: "Chat input glow color",
        desc: "Empty means the theme's accent color",
        group: "Chat input"
    },
    inputGlowRadius: {
        label: "Chat input glow radius",
        group: "Chat input"
    },
    inputGradientBorder: {
        label: "Spinning gradient border on the chat input",
        group: "Chat input"
    },
    inputBorderColor1: {
        label: "First border color",
        desc: "Empty means the theme's accent colors",
        group: "Chat input"
    },
    inputBorderColor2: {
        label: "Second border color",
        group: "Chat input"
    },
    inputBorderSpeed: {
        label: "One full spin takes",
        group: "Chat input"
    },
    inputPlaceholder: {
        placeholder: "say something clever… or don’t",
        label: "Your own chat input placeholder",
        group: "Chat input"
    },

    /* ---------- hide stuff ---------- */
    hideGiftButton: {
        label: "Gift button in the chat input",
        group: "Hide clutter"
    },
    hideGifButton: {
        label: "GIF button",
        group: "Hide clutter"
    },
    hideStickerButton: {
        label: "Sticker button",
        group: "Hide clutter"
    },
    hideAppsButton: {
        label: "Apps button",
        group: "Hide clutter"
    },
    hideStoreLinks: {
        label: "Nitro, Shop and Quests in the DM list",
        group: "Hide clutter"
    },
    hideActivityPanel: {
        label: "Now-playing panel above your profile",
        group: "Hide clutter"
    },
    hideMemberList: {
        label: "Member list",
        group: "Hide clutter"
    },
    hideServerSeparators: {
        label: "Separators in the server list",
        group: "Hide clutter"
    },

    /* ---------- sizes ---------- */
    memberListWidth: {
        label: "Member list width",
        group: "Sizes"
    },
    sidebarWidth: {
        label: "Channel list width",
        group: "Sizes"
    },
    compactServers: {
        label: "Server icon size",
        group: "Sizes"
    },

    /* ---------- chrome ---------- */
    systemBarGradient: {
        label: "Gradient on the title bar",
        group: "Window look"
    },
    systemBarColor1: {
        label: "Left color of the title bar",
        desc: "Empty means the theme's accent colors",
        group: "Window look"
    },
    systemBarColor2: {
        label: "Right color of the title bar",
        group: "Window look"
    },
    systemBarOpacity: {
        label: "Strength of the title bar gradient",
        group: "Window look"
    },
    macButtons: {
        label: "macOS-style window buttons",
        desc: "Colored dots instead of minimize / maximize / close",
        group: "Window look"
    },
    userPanelGradient: {
        label: "Gradient on the profile panel at the bottom",
        group: "Window look"
    },
    userPanelColor1: {
        label: "First color of the profile panel",
        desc: "Empty means the theme's accent colors",
        group: "Window look"
    },
    userPanelColor2: {
        label: "Second color of the profile panel",
        group: "Window look"
    },
    userPanelOpacity: {
        label: "Strength of the profile panel gradient",
        group: "Window look"
    },
    badgeGradient: {
        label: "Gradient on mention badges",
        group: "Window look"
    },
    badgeColor1: {
        label: "First badge color",
        desc: "Empty means the theme's accent colors",
        group: "Window look"
    },
    badgeColor2: {
        label: "Second badge color",
        group: "Window look"
    },
    buttonsGlow: {
        label: "Buttons glow on hover",
        group: "Window look"
    },
    buttonsGlowColor: {
        label: "Button glow color",
        desc: "Empty means the theme's accent color",
        group: "Window look"
    },
    buttonsGlowRadius: {
        label: "Button glow radius",
        group: "Window look"
    },

    /* ---------- popups ---------- */
    menuGlass: {
        label: "Frosted glass context menus",
        group: "Menus & popups"
    },
    menuBlur: {
        label: "Blur behind menus",
        group: "Menus & popups"
    },
    menuOpacity: {
        label: "Menu background opacity",
        group: "Menus & popups"
    },
    popupAnim: {
        label: "How menus and modals appear",
        group: "Menus & popups",
        options: {
            off: "Discord default",
            pop: "Pop out",
            slide: "Slide up",
            flip: "Flip",
            blur: "Out of a blur"
        }
    },
    popoutGlow: {
        label: "Glowing border on modals and profiles",
        group: "Menus & popups"
    },
    popoutGlowColor: {
        label: "Glow color of modals",
        desc: "Empty means the theme's accent color",
        group: "Menus & popups"
    },
    popoutGlowStrength: {
        label: "Glow strength of modals",
        group: "Menus & popups"
    },
    tooltipAccent: {
        label: "Tooltips in theme colors",
        group: "Menus & popups"
    },
    tooltipStrength: {
        label: "Accent strength in tooltips",
        group: "Menus & popups"
    },
    backdropBlur: {
        label: "Blur behind modals",
        group: "Menus & popups"
    },

    /* ---------- focus ---------- */
    focusMode: {
        label: "Focus mode",
        desc: "Side panels stay faded until you hover them",
        group: "Focus"
    },
    focusOpacity: {
        label: "Channel list opacity in focus mode",
        group: "Focus"
    },
    focusMembersOpacity: {
        label: "Member list opacity in focus mode",
        group: "Focus"
    },
    focusFade: {
        label: "How long panels take to fade in",
        desc: "This many times longer than the usual interface animation",
        group: "Focus"
    }
};
