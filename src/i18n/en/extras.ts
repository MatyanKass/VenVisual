/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/extras.ts, keyed by feature id. Missing entries fall back to Russian. */
export const EN_EXTRAS: Record<string, FeatureText> = {
    /* ---------- widgets ---------- */
    clock: {
        label: "Clock on top of the window",
        group: "Widgets"
    },
    clockFormat: {
        label: "Clock format",
        group: "Widgets",
        options: {
            "24": "24-hour (13:05)",
            "12": "12-hour (1:05 PM)"
        }
    },
    clockSeconds: {
        label: "Show seconds",
        group: "Widgets"
    },
    clockDate: {
        label: "Show the date",
        group: "Widgets"
    },
    sessionTimer: {
        label: "How long you have been in Discord today",
        desc: "Counts from the moment Discord started",
        group: "Widgets"
    },
    sessionTimerLabel: {
        label: "⏱ icon next to the timer",
        group: "Widgets"
    },
    fpsCounter: {
        label: "FPS counter",
        group: "Widgets"
    },
    widgetPosition: {
        label: "Where to show the widgets",
        group: "Widgets",
        options: {
            "top-right": "Top right",
            "top-left": "Top left",
            "bottom-right": "Bottom right",
            "bottom-left": "Bottom left",
            "top-center": "Top center"
        }
    },
    widgetStyle: {
        label: "Widget style",
        group: "Widgets",
        options: {
            glass: "Glass",
            neon: "Neon",
            minimal: "Minimal",
            terminal: "Terminal"
        }
    },
    widgetFontSize: {
        label: "Widget font size",
        group: "Widgets",
        activeHint: "Works once at least one widget is on"
    },
    widgetOpacity: {
        label: "Widget opacity",
        group: "Widgets",
        activeHint: "Works once at least one widget is on"
    },
    widgetOffset: {
        label: "Widget distance from the window edge",
        group: "Widgets",
        activeHint: "Works once at least one widget is on"
    },
    widgetColor: {
        label: "Widget color",
        desc: "Empty means the colors of the chosen style",
        group: "Widgets",
        activeHint: "Works once at least one widget is on"
    },

    /* ---------- privacy ---------- */
    blurMessages: {
        label: "Blur message text until you hover it",
        group: "Privacy (for streams and screenshots)"
    },
    blurNames: {
        label: "Blur names until you hover them",
        group: "Privacy (for streams and screenshots)"
    },
    blurAvatars: {
        label: "Blur avatars until you hover them",
        group: "Privacy (for streams and screenshots)"
    },
    blurImages: {
        label: "Blur images until you hover them",
        group: "Privacy (for streams and screenshots)"
    },
    blurDMList: {
        label: "Blur the DM list until you hover it",
        group: "Privacy (for streams and screenshots)"
    },
    privacyBlur: {
        label: "Blur strength",
        desc: "100% is the tuned default: lighter on text, heavier on images",
        group: "Privacy (for streams and screenshots)",
        activeHint: "Works once at least one blur is on"
    },
    privacyReveal: {
        label: "When to reveal the content",
        group: "Privacy (for streams and screenshots)",
        activeHint: "Works once at least one blur is on",
        options: {
            hover: "On mouse hover",
            focus: "While the Discord window is focused"
        }
    },

    /* ---------- fun ---------- */
    windowFrame: {
        label: "Glowing window frame",
        desc: "Animated frames repaint the whole window",
        group: "Fun stuff",
        options: {
            none: "Off",
            accent: "Accent color",
            rainbow: "Running rainbow",
            breathing: "Breathing"
        }
    },
    frameThickness: {
        label: "Window frame thickness",
        group: "Fun stuff"
    },
    frameGlow: {
        label: "Window frame glow",
        group: "Fun stuff",
        activeHint: "Works with the accent color and breathing frames"
    },
    frameColor: {
        label: "Window frame color",
        desc: "Empty means the theme's accent color",
        group: "Fun stuff",
        activeHint: "Works with the accent color frame"
    },
    frameSpeed: {
        label: "Frame animation speed",
        group: "Fun stuff",
        activeHint: "Works with the running rainbow and breathing frames"
    },
    chatWatermark: {
        placeholder: "MINE",
        label: "Watermark text in the chat",
        desc: "Huge text behind the chat, repainted on every scroll",
        group: "Fun stuff"
    },
    watermarkSize: {
        label: "Watermark size",
        group: "Fun stuff"
    },
    watermarkOpacity: {
        label: "How visible the watermark is",
        group: "Fun stuff"
    },
    watermarkColor1: {
        label: "First watermark color",
        desc: "Empty means the theme's accent colors",
        group: "Fun stuff"
    },
    watermarkColor2: {
        label: "Second watermark color",
        group: "Fun stuff"
    },
    watermarkPosition: {
        label: "Where to put the watermark",
        group: "Fun stuff",
        options: {
            center: "Center",
            top: "Top",
            bottom: "Bottom"
        }
    },
    partyMode: {
        label: "Party mode",
        desc: "Every color in the window slowly cycles",
        group: "Fun stuff"
    },
    partySpeed: {
        label: "A full color cycle takes",
        group: "Fun stuff"
    },
    grayscale: {
        label: "Black and white",
        group: "Fun stuff"
    },
    invertMode: {
        label: "Invert colors",
        desc: "A quick light theme out of a dark one (images get inverted too)",
        group: "Fun stuff"
    },
    upsideDown: {
        label: "Turn the chat upside down",
        desc: "For pranks",
        group: "Fun stuff"
    },
    comicSans: {
        label: "Comic Sans everywhere",
        group: "Fun stuff"
    },

    /* ---------- control ---------- */
    lang: {
        label: "Language of the settings",
        desc: "Language of this settings panel",
        group: "Control",
        options: {
            ru: "Русский",
            en: "English"
        }
    },
    panicHotkey: {
        label: "Ctrl+Alt+V: turn every effect off and back on",
        group: "Control"
    },
    pauseAnimUnfocused: {
        label: "Pause animations when the window is not focused",
        desc: "Nothing repaints while Discord sits behind another window",
        group: "Control"
    },
    perfMode: {
        label: "Battery saver",
        desc: "Turns off particles, animations, blurs and the FPS counter; keeps colors and the clock",
        group: "Control"
    }
};
