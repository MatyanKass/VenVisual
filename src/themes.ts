/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ThemePalette {
    label: string;
    /** deepest background (server list, app frame) */
    bgLowest: string;
    /** sidebar / channel list */
    bgLow: string;
    /** chat area */
    bgBase: string;
    /** cards, inputs, hovered rows */
    bgHigh: string;
    text: string;
    textMuted: string;
    accent: string;
    /** second color for gradients */
    accent2: string;
}

export const THEMES: Record<string, ThemePalette> = {
    midnight: {
        label: "Midnight",
        bgLowest: "#0b0d14", bgLow: "#10131c", bgBase: "#151926", bgHigh: "#1d2233",
        text: "#dfe3f0", textMuted: "#8a91a8", accent: "#6c8cff", accent2: "#b36cff"
    },
    amoled: {
        label: "AMOLED",
        bgLowest: "#000000", bgLow: "#000000", bgBase: "#050505", bgHigh: "#121212",
        text: "#e8e8e8", textMuted: "#8c8c8c", accent: "#ffffff", accent2: "#9a9a9a"
    },
    neon: {
        label: "Neon / Cyber",
        bgLowest: "#07030f", bgLow: "#0d0719", bgBase: "#120a22", bgHigh: "#1e1236",
        text: "#f0e9ff", textMuted: "#9d8cc0", accent: "#ff2bd6", accent2: "#00e5ff"
    },
    sakura: {
        label: "Sakura",
        bgLowest: "#1d1418", bgLow: "#251a1f", bgBase: "#2d2026", bgHigh: "#3a2931",
        text: "#fbe9ef", textMuted: "#c29cab", accent: "#ff8fb8", accent2: "#ffc38f"
    },
    ocean: {
        label: "Ocean",
        bgLowest: "#041419", bgLow: "#071c23", bgBase: "#0a242d", bgHigh: "#10323d",
        text: "#dff5f7", textMuted: "#7fa6ad", accent: "#2ad4c4", accent2: "#3a8dff"
    },
    forest: {
        label: "Forest",
        bgLowest: "#0c120d", bgLow: "#111a12", bgBase: "#162118", bgHigh: "#1f2e22",
        text: "#e3efe2", textMuted: "#8fa48d", accent: "#7ed957", accent2: "#e0c95a"
    },
    dracula: {
        label: "Dracula",
        bgLowest: "#191a21", bgLow: "#21222c", bgBase: "#282a36", bgHigh: "#343746",
        text: "#f8f8f2", textMuted: "#9ea3c0", accent: "#bd93f9", accent2: "#ff79c6"
    },
    nord: {
        label: "Nord",
        bgLowest: "#242933", bgLow: "#2b303b", bgBase: "#2e3440", bgHigh: "#3b4252",
        text: "#eceff4", textMuted: "#9aa3b5", accent: "#88c0d0", accent2: "#b48ead"
    },
    sunset: {
        label: "Sunset",
        bgLowest: "#170d0f", bgLow: "#1f1215", bgBase: "#27171a", bgHigh: "#352024",
        text: "#fff0e6", textMuted: "#b8938a", accent: "#ff7a45", accent2: "#ffcf4a"
    }
};
