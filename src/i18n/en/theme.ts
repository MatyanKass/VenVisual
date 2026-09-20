/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/theme.ts, keyed by feature id. Missing entries fall back to Russian. */

const GROUP_THEME = "Theme";
const GROUP_COLORS = "Your own colors";
const GROUP_AUTO = "Switch by time of day";
const GROUP_LIVE = "Living color";
const GROUP_SMALL = "Small touches";
const GROUP_GRADE = "Color grading for the whole window";

/** Palette names are proper names, so they stay as they are; only the "no theme" row is translated. */
const THEMES: Record<string, string> = {
    none: "Discord (unchanged)",
    midnight: "Midnight",
    amoled: "AMOLED",
    neon: "Neon / Cyber",
    synthwave: "Synthwave '84",
    vaporwave: "Vaporwave",
    sakura: "Sakura",
    lavender: "Lavender",
    ocean: "Ocean",
    arctic: "Arctic",
    forest: "Forest",
    mint: "Mint",
    matrix: "Matrix",
    dracula: "Dracula",
    catppuccin: "Catppuccin Mocha",
    rosepine: "Rosé Pine",
    tokyo: "Tokyo Night",
    nord: "Nord",
    gruvbox: "Gruvbox",
    monokai: "Monokai",
    solarized: "Solarized Dark",
    coffee: "Coffee",
    sunset: "Sunset",
    blood: "Blood Moon",
    gold: "Royal Gold"
};

export const EN_THEME: Record<string, FeatureText> = {
    theme: {
        label: "Theme",
        desc: "A ready-made palette for the whole client",
        group: GROUP_THEME,
        options: THEMES
    },

    accent: {
        label: "Accent color",
        desc: "Buttons, links, highlights. Empty = take it from the theme",
        group: GROUP_COLORS
    },
    accent2: {
        label: "Second accent",
        desc: "Used for gradients",
        group: GROUP_COLORS
    },
    bgColor: {
        label: "Background color",
        desc: "Every other background shade is derived from it",
        group: GROUP_COLORS
    },
    textColor: {
        label: "Text color",
        group: GROUP_COLORS
    },
    mutedText: {
        label: "Brightness of secondary text",
        desc: "Only works together with a theme or your own text color",
        group: GROUP_COLORS
    },

    autoTheme: {
        label: "Day and night theme",
        desc: "The theme switches itself depending on the time of day",
        group: GROUP_AUTO
    },
    dayTheme: {
        label: "Day theme",
        group: GROUP_AUTO,
        options: THEMES
    },
    nightTheme: {
        label: "Night theme",
        group: GROUP_AUTO,
        options: THEMES
    },
    dayStart: {
        label: "Day starts at",
        group: GROUP_AUTO
    },
    nightStart: {
        label: "Night starts at",
        group: GROUP_AUTO
    },

    rainbowAccent: {
        label: "Rainbow accent",
        desc: "The accent color drifts smoothly around the color wheel",
        group: GROUP_LIVE
    },
    rainbowSpeed: {
        label: "Rainbow speed",
        group: GROUP_LIVE
    },
    rainbowSat: {
        label: "Rainbow saturation",
        group: GROUP_LIVE
    },

    selectionAccent: {
        label: "Selected text in the accent color",
        group: GROUP_SMALL
    },
    caretAccent: {
        label: "Typing caret in the accent color",
        group: GROUP_SMALL
    },
    focusRingAccent: {
        label: "Focus ring in the accent color",
        group: GROUP_SMALL
    },

    saturation: {
        label: "Saturation",
        group: GROUP_GRADE
    },
    contrast: {
        label: "Contrast",
        group: GROUP_GRADE
    },
    brightness: {
        label: "Brightness",
        group: GROUP_GRADE
    },
    warmth: {
        label: "Warm night filter",
        desc: "Less blue light in the evening",
        group: GROUP_GRADE
    },
    hueShift: {
        label: "Hue shift",
        desc: "Rotates every color, images included",
        group: GROUP_GRADE
    }
};
