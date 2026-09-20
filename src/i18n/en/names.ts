/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/names.ts, keyed by feature id. Missing entries fall back to Russian. */
export const EN_NAMES: Record<string, FeatureText> = {
    nameStyle: {
        label: "Name style",
        desc: "The shifting styles animate every name on screen",
        group: "Names",
        options: {
            none: "Plain",
            accent: "Accent gradient",
            custom: "Custom gradient (colors below)",
            rainbow: "Shifting rainbow",
            roleShine: "Shine in the role color",
            glow: "Role color glow",
            fire: "Fire",
            ice: "Ice",
            gold: "Gold",
            toxic: "Toxic",
            neon: "Flickering neon"
        }
    },
    nameColor1: {
        label: "Custom gradient: color 1",
        group: "Names",
        activeHint: "Works with the “Custom gradient” style"
    },
    nameColor2: {
        label: "Custom gradient: color 2",
        group: "Names",
        activeHint: "Works with the “Custom gradient” style"
    },
    nameSpeed: {
        label: "Name shimmer duration",
        desc: "Higher is slower",
        group: "Names",
        activeHint: "Works with the shifting styles"
    },
    nameAngle: {
        label: "Name gradient angle",
        group: "Names",
        activeHint: "Works with the gradient styles"
    },
    nameGlowColor: {
        label: "Name glow: color",
        desc: "Empty — the role color",
        group: "Names",
        activeHint: "Works with the “Role color glow” style"
    },
    nameGlowBlur: {
        label: "Name glow: blur",
        group: "Names",
        activeHint: "Works with the “Role color glow” style"
    },
    nameInMembers: {
        label: "Use the style in the member list too",
        group: "Names"
    },
    nameWeight: {
        label: "Name weight",
        group: "Names"
    },
    nameUppercase: {
        label: "Names in capitals",
        group: "Names"
    },
    nameHoverUnderline: {
        label: "Animated underline under names",
        group: "Names"
    },
    underlineColor1: {
        label: "Underline: color on the left",
        group: "Names"
    },
    underlineColor2: {
        label: "Underline: color on the right",
        group: "Names"
    },
    underlineWidth: {
        label: "Underline: thickness",
        group: "Names"
    },
    resetNameStyles: {
        label: "Turn off Discord's own name fonts and effects",
        desc: "The Nitro display name styles",
        group: "Names"
    },
    roleDotGlow: {
        label: "Colored role dots glow",
        group: "Names"
    },
    roleDotRadius: {
        label: "Role dot glow strength",
        group: "Names"
    },
    avatarShape: {
        label: "Avatar shape in chat",
        group: "Avatars",
        options: {
            circle: "Circle",
            squircle: "Squircle",
            rounded: "Soft square",
            square: "Square",
            hexagon: "Hexagon",
            diamond: "Diamond",
            heart: "Heart"
        }
    },
    avatarHover: {
        label: "Avatar on hover",
        group: "Avatars",
        options: {
            off: "Nothing",
            scale: "Zoom in",
            spin: "Spin",
            tilt: "Tilt",
            jelly: "Jelly"
        }
    },
    avatarHoverScale: {
        label: "Avatar: how much it grows",
        group: "Avatars",
        activeHint: "Works with the “Zoom in” effect"
    },
    avatarTilt: {
        label: "Avatar: tilt angle",
        group: "Avatars",
        activeHint: "Works with the “Tilt” effect"
    },
    avatarSpinTime: {
        label: "Avatar: spin duration",
        desc: "How many times longer than the overall animation speed",
        group: "Avatars",
        activeHint: "Works with the “Spin” effect"
    },
    avatarRing: {
        label: "Accent-colored ring around avatars",
        group: "Avatars",
        activeHint: "Not visible on shaped avatars (hexagon, diamond, heart)"
    },
    avatarRingColor: {
        label: "Ring color",
        desc: "Empty — the theme's accent",
        group: "Avatars"
    },
    avatarRingWidth: {
        label: "Ring thickness",
        group: "Avatars"
    },
    avatarRingGlow: {
        label: "Ring glow",
        group: "Avatars"
    },
    avatarRingPulse: {
        label: "Ring pulses",
        group: "Avatars"
    },
    statusGlow: {
        label: "Status dots (online / do not disturb) glow",
        group: "Avatars"
    },
    speakingGlow: {
        label: "People speaking in voice glow brighter",
        group: "Avatars"
    },
    speakingColor: {
        label: "Speaking glow color",
        desc: "Empty — the Discord green",
        group: "Avatars"
    },
    speakingRadius: {
        label: "Speaking glow size",
        group: "Avatars"
    },
    hideDecorations: {
        label: "Hide avatar decorations",
        group: "Avatars"
    },
    hideNameplates: {
        label: "Hide animated nameplates in the member list",
        group: "Avatars"
    },
    hideClanTags: {
        label: "Hide guild tags next to names",
        group: "Avatars"
    }
};
