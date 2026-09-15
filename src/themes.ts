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

const t = (label: string, bgLowest: string, bgLow: string, bgBase: string, bgHigh: string, text: string, textMuted: string, accent: string, accent2: string): ThemePalette =>
    ({ label, bgLowest, bgLow, bgBase, bgHigh, text, textMuted, accent, accent2 });

export const THEMES: Record<string, ThemePalette> = {
    midnight: t("Midnight", "#0b0d14", "#10131c", "#151926", "#1d2233", "#dfe3f0", "#8a91a8", "#6c8cff", "#b36cff"),
    amoled: t("AMOLED", "#000000", "#000000", "#050505", "#121212", "#e8e8e8", "#8c8c8c", "#ffffff", "#9a9a9a"),
    neon: t("Neon / Cyber", "#07030f", "#0d0719", "#120a22", "#1e1236", "#f0e9ff", "#9d8cc0", "#ff2bd6", "#00e5ff"),
    synthwave: t("Synthwave '84", "#140b24", "#1b1030", "#241538", "#34204d", "#fdf2ff", "#b39bc8", "#ff7edb", "#fede5d"),
    vaporwave: t("Vaporwave", "#1a1030", "#221540", "#2a1b4d", "#3a2866", "#fff0fb", "#c1a8d8", "#01cdfe", "#ff71ce"),
    sakura: t("Sakura", "#1d1418", "#251a1f", "#2d2026", "#3a2931", "#fbe9ef", "#c29cab", "#ff8fb8", "#ffc38f"),
    lavender: t("Lavender", "#15121f", "#1c1829", "#231e33", "#302942", "#efe9ff", "#a89cc4", "#b69cff", "#ff9ce3"),
    ocean: t("Ocean", "#041419", "#071c23", "#0a242d", "#10323d", "#dff5f7", "#7fa6ad", "#2ad4c4", "#3a8dff"),
    arctic: t("Arctic", "#0c1620", "#111e2b", "#162636", "#1f3347", "#e9f6ff", "#8fb0c8", "#7fd6ff", "#c1f0ff"),
    forest: t("Forest", "#0c120d", "#111a12", "#162118", "#1f2e22", "#e3efe2", "#8fa48d", "#7ed957", "#e0c95a"),
    mint: t("Mint", "#0b1614", "#0f1e1b", "#142723", "#1c3630", "#e2fff6", "#8cb8aa", "#3ef0b0", "#9dffcf"),
    matrix: t("Matrix", "#000500", "#000a02", "#010f04", "#03200a", "#b6ffc2", "#4e9a5c", "#00ff41", "#00b52e"),
    dracula: t("Dracula", "#191a21", "#21222c", "#282a36", "#343746", "#f8f8f2", "#9ea3c0", "#bd93f9", "#ff79c6"),
    catppuccin: t("Catppuccin Mocha", "#11111b", "#181825", "#1e1e2e", "#313244", "#cdd6f4", "#a6adc8", "#cba6f7", "#f5c2e7"),
    rosepine: t("Rosé Pine", "#141220", "#191724", "#1f1d2e", "#26233a", "#e0def4", "#908caa", "#ebbcba", "#c4a7e7"),
    tokyo: t("Tokyo Night", "#13141c", "#16161e", "#1a1b26", "#24283b", "#c0caf5", "#737aa2", "#7aa2f7", "#bb9af7"),
    nord: t("Nord", "#242933", "#2b303b", "#2e3440", "#3b4252", "#eceff4", "#9aa3b5", "#88c0d0", "#b48ead"),
    gruvbox: t("Gruvbox", "#1b1b1b", "#232323", "#282828", "#3c3836", "#ebdbb2", "#a89984", "#fabd2f", "#fe8019"),
    monokai: t("Monokai", "#1a1a16", "#22221d", "#272822", "#3e3d32", "#f8f8f2", "#a59f85", "#a6e22e", "#f92672"),
    solarized: t("Solarized Dark", "#00212b", "#002833", "#002b36", "#073642", "#eee8d5", "#93a1a1", "#2aa198", "#b58900"),
    coffee: t("Coffee", "#15100c", "#1c1510", "#241b15", "#33271e", "#f3e6d8", "#b09880", "#d4a373", "#e9c46a"),
    sunset: t("Sunset", "#170d0f", "#1f1215", "#27171a", "#352024", "#fff0e6", "#b8938a", "#ff7a45", "#ffcf4a"),
    blood: t("Blood Moon", "#0f0506", "#170809", "#1f0b0d", "#2e1215", "#ffe9ea", "#b48a8d", "#ff3b4e", "#ff8a3b"),
    gold: t("Royal Gold", "#0e0c08", "#15120b", "#1c180f", "#2a2416", "#fff6de", "#b8a57a", "#ffd166", "#f4a261")
};

export const THEME_OPTIONS = [
    { value: "none", label: "Discord (без изменений)" },
    ...Object.entries(THEMES).map(([value, p]) => ({ value, label: p.label }))
];
