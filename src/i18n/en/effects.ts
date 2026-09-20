/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/effects.ts, keyed by feature id. Missing entries fall back to Russian. */
export const EN_EFFECTS: Record<string, FeatureText> = {
    particles: {
        label: "Particles",
        group: "Particles on screen",
        options: {
            none: "Off",
            snow: "❄️ Snow",
            sakura: "🌸 Sakura petals",
            leaves: "🍂 Autumn leaves",
            rain: "🌧️ Rain",
            stars: "✨ Twinkling stars",
            fireflies: "🪲 Fireflies",
            bubbles: "🫧 Bubbles",
            hearts: "💖 Hearts",
            embers: "🔥 Embers",
            dust: "🌫️ Accent-colored dust",
            matrix: "🟩 Digital rain (Matrix)",
            confetti: "🎊 Confetti"
        }
    },
    particleCount: {
        label: "Count",
        group: "Particles on screen"
    },
    particleSpeed: {
        label: "Speed",
        group: "Particles on screen"
    },
    particleSize: {
        label: "Size",
        group: "Particles on screen"
    },
    particleOpacity: {
        label: "Opacity",
        group: "Particles on screen"
    },
    particleWind: {
        label: "Wind",
        group: "Particles on screen"
    },
    particleMouse: {
        label: "Particles scatter away from the cursor",
        group: "Particles on screen"
    },
    particle3d: {
        label: "3D depth",
        desc: "Particles fly at different depths: the far ones are smaller, slower, paler and slightly blurred, the near ones bigger and sharper. Petals and leaves tumble as they fall",
        group: "Particles on screen"
    },
    particleDepth: {
        label: "Depth strength",
        group: "Particles on screen",
        activeHint: "Works only with “3D depth”"
    },
    particleSpin: {
        label: "Spin speed",
        group: "Particles on screen"
    },
    fxLayer: {
        label: "Particle layer",
        group: "Particles on screen",
        options: {
            front: "Over the interface",
            back: "Behind the interface (seen through translucent panels)"
        }
    },
    cursorTrail: {
        label: "Cursor trail",
        group: "Cursor",
        options: {
            none: "Off",
            dots: "Dots",
            sparkles: "Sparkles",
            rainbow: "Rainbow line",
            comet: "Comet",
            bubbles: "Bubbles",
            stars: "Stars"
        }
    },
    trailLength: {
        label: "Trail length",
        group: "Cursor"
    },
    trailColor: {
        label: "Trail color",
        group: "Cursor",
        options: {
            accent: "Same as the other effects",
            custom: "Custom color",
            rainbow: "Rainbow"
        }
    },
    trailColor1: {
        label: "Custom trail color",
        group: "Cursor",
        activeHint: "Needs the trail color set to “Custom color”"
    },
    trailWidth: {
        label: "Trail thickness",
        group: "Cursor"
    },
    trailFade: {
        label: "How fast the trail fades",
        group: "Cursor"
    },
    cursorRing: {
        label: "Ring that chases the cursor",
        group: "Cursor"
    },
    ringSize: {
        label: "Ring size",
        group: "Cursor"
    },
    ringWidth: {
        label: "Ring thickness",
        group: "Cursor"
    },
    ringColor: {
        label: "Ring color",
        desc: "Empty — taken from the theme",
        group: "Cursor"
    },
    ringLag: {
        label: "How far the ring lags behind",
        group: "Cursor"
    },
    clickEffect: {
        label: "Click effect",
        group: "Clicks and events",
        options: {
            none: "Off",
            ripple: "Ripples on water",
            burst: "Particle burst",
            stars: "Stars",
            hearts: "Hearts",
            confetti: "Confetti"
        }
    },
    clickIntensity: {
        label: "Click effect strength",
        group: "Clicks and events"
    },
    clickCount: {
        label: "Particles per click",
        group: "Clicks and events"
    },
    clickColor: {
        label: "Click effect color",
        desc: "Empty — taken from the theme",
        group: "Clicks and events"
    },
    sendEffect: {
        label: "When you send a message",
        group: "Clicks and events",
        options: {
            none: "Nothing",
            confetti: "🎊 Confetti",
            fireworks: "🎆 Fireworks",
            hearts: "💖 Hearts",
            stars: "⭐ Stars"
        }
    },
    sendEffectSize: {
        label: "Send effect size",
        group: "Clicks and events"
    },
    typingSparks: {
        label: "Sparks while you type",
        desc: "Sparkles fly out of the input box on every letter",
        group: "Clicks and events"
    },
    mentionFlash: {
        label: "Screen edges flash when you are mentioned",
        group: "Clicks and events"
    },
    mentionShake: {
        label: "Light chat shake on a mention",
        group: "Clicks and events"
    },
    fxColors: {
        label: "Effect colors",
        group: "General",
        options: {
            accent: "Theme accents",
            rainbow: "Rainbow",
            white: "White",
            natural: "Natural (snow is white, sakura is pink…)",
            custom: "Custom colors"
        }
    },
    fxColor1: {
        label: "Custom effect color 1",
        group: "General",
        activeHint: "Needs the effect colors set to “Custom colors”"
    },
    fxColor2: {
        label: "Custom effect color 2",
        group: "General",
        activeHint: "Needs the effect colors set to “Custom colors”"
    },
    fxPauseUnfocused: {
        label: "Pause while Discord is not focused",
        desc: "Saves resources",
        group: "General"
    },
    fxFps: {
        label: "Effect FPS limit",
        desc: "“Auto” lowers the rate by itself when frames start running late",
        group: "General",
        options: {
            auto: "Auto (recommended)",
            "30": "30 FPS",
            "60": "60 FPS",
            "0": "Unlimited (hard on the GPU)"
        }
    },
    fxQuality: {
        label: "Effect rendering quality",
        desc: "Resolution of the particle canvas. The lower it is, the less work for the GPU",
        group: "General",
        options: {
            auto: "Auto (recommended)",
            high: "High (matches the screen)",
            medium: "Medium",
            low: "Low (maximum performance)"
        }
    }
};
