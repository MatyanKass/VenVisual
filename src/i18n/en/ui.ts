/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { CategoryId } from "../../registry";
import type { PresetText, UiStrings } from "..";

const settings = (n: number) => `${n} ${n === 1 ? "setting" : "settings"}`;

export const EN_UI: UiStrings = {
    subtitle: (total, changed) => `${settings(total)} · ${changed} changed`,
    language: "Language",

    speedUp: "⚡ Speed up",
    speedUpTitle: "Turn down the heaviest effects without touching colors and themes",
    speedUpDone: n => `Sped up: ${settings(n)} changed`,
    speedUpNothing: "Already set up for speed",

    random: "🎲 Random style",
    randomTitle: "Build a random style out of themes, backgrounds and effects",

    exportBtn: "📤 Export",
    exportTitle: "Copy the changed settings to the clipboard",
    exportOk: "Settings copied",
    exportFail: "Could not copy to the clipboard",

    importBtn: "📥 Import",
    importTitle: "Paste settings from JSON",
    importNote: "Pasted settings replace what you have now, everything else goes back to defaults",
    importCancel: "Cancel",
    importApply: "Apply",
    importNotJson: "That does not look like JSON",
    importNotObject: "Needs a JSON object with settings",
    importNoSettings: "No VenVisual settings in this JSON",
    importOk: n => `Imported: ${settings(n)}`,

    resetBtn: "↺ Reset all",
    resetArmed: "Really reset?",
    resetTitle: "Return every setting to its default",
    resetOk: "All settings reset",

    searchPlaceholder: "Search settings…",
    searchClear: "Clear search",
    searchFound: n => `Found: ${settings(n)}`,
    searchNone: "Nothing found",

    colorTitle: "Color comes from the theme. Click to pick your own",
    colorFromTheme: "from theme",
    colorHexPlaceholder: "#rrggbb",
    colorClear: "Remove your color and take the theme's",

    heavyTitle: "Can be heavy on a weak PC",
    resetOneTitle: "Back to default",
    groupOther: "Other"
};

export const EN_CATEGORIES: Record<CategoryId, string> = {
    theme: "Themes",
    hover: "Highlight",
    messages: "Messages",
    names: "Names & avatars",
    background: "Background",
    effects: "Effects",
    interface: "Interface",
    extras: "Extras"
};

/** English names and descriptions for the presets in src/presets.ts, keyed by preset id. */
export const EN_PRESETS: Record<string, PresetText> = {
    crimsonSakura: {
        label: "🌸 Crimson sakura",
        desc: "Crimson and blossom pink, fading into a softer night theme, with falling petals, a starry cursor trail and a red glow around the edges"
    },
    cyberpunk: {
        label: "⚡ Neon cyberpunk",
        desc: "Neon theme, rainbow names, neon highlight, a retro grid in the background, floating dust and a glowing window frame"
    },
    glass: {
        label: "🧊 Frosted glass",
        desc: "Translucent glass panels over an aurora, soft corners and messages as cards"
    },
    sakura: {
        label: "🌸 Cozy sakura",
        desc: "Pink theme, falling petals, heart-shaped avatars and warm soft colors"
    },
    hacker: {
        label: "💻 Hacker",
        desc: "Matrix theme, digital rain, terminal widgets, a monospace font and strict square corners"
    },
    winter: {
        label: "❄️ Winter",
        desc: "Cold arctic theme, falling snow, icy names and a starry sky"
    },
    minimal: {
        label: "◻️ Minimal",
        desc: "Black AMOLED theme, no glows or extra buttons, fast and calm animations"
    },
    sunset: {
        label: "🌇 Sunset",
        desc: "Warm orange tones, fiery names, campfire embers and a slowly shifting gradient"
    },
    synthwave: {
        label: "🌆 Synthwave",
        desc: "Retro 80s: a neon grid, pink and cyan names, a rainbow cursor trail and CRT scanlines"
    },
    quietNight: {
        label: "🌙 Quiet night",
        desc: "Deep blue theme, a starry sky, a few fireflies and a warm filter to rest your eyes"
    },
    streamer: {
        label: "🎥 Streamer-safe",
        desc: "Clean look for streams: DMs and images blurred until you hover them, no extra buttons, clock and session timer"
    }
};
