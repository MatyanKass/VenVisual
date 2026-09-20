/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/background.ts, keyed by feature id. Missing entries fall back to Russian. */
export const EN_BACKGROUND: Record<string, FeatureText> = {
    bgMode: {
        label: "Window background",
        group: "Background",
        options: {
            none: "No background",
            image: "Image from a link",
            gradient: "Shifting gradient",
            aurora: "Aurora",
            mesh: "Soft color blobs",
            stars: "Starfield",
            grid: "Retro neon grid"
        }
    },
    bgImage: {
        label: "Image link",
        desc: "A direct link to a jpg/png/gif/webp, or a data: link",
        group: "Background",
        activeHint: "Works with the “Image from a link” background"
    },
    bgPosition: {
        label: "Image position",
        group: "Background",
        activeHint: "Works with the “Image from a link” background",
        options: {
            center: "Centered",
            top: "Top",
            bottom: "Bottom",
            left: "Left",
            right: "Right"
        }
    },
    bgColor1: {
        label: "First background color",
        desc: "Empty — the theme's accent colors",
        group: "Background",
        activeHint: "Works with the drawn backgrounds, not with an image"
    },
    bgColor2: {
        label: "Second background color",
        group: "Background",
        activeHint: "Works with the drawn backgrounds, not with an image"
    },
    bgDarkness: {
        label: "Mix black into the background colors",
        desc: "Minus is brighter, plus is darker",
        group: "Background",
        activeHint: "Works with the drawn backgrounds, not with an image"
    },
    bgBlur: {
        label: "Background blur",
        group: "Background"
    },
    bgDim: {
        label: "Background dimming",
        group: "Background"
    },
    bgSaturation: {
        label: "Background saturation",
        group: "Background"
    },
    gradientSpeed: {
        label: "Animated background speed",
        group: "Background",
        activeHint: "Works with the animated backgrounds"
    },
    kenBurns: {
        label: "Slow camera push",
        desc: "The background drifts in and back out",
        group: "Background"
    },
    parallax: {
        label: "Parallax on mouse move",
        desc: "The background shifts a little as the cursor moves",
        group: "Background",
        activeHint: "Works once a background is picked (an image needs a link)"
    },
    parallaxStrength: {
        label: "Parallax strength",
        group: "Background"
    },
    panelOpacity: {
        label: "Panel opacity",
        group: "Panels over the background",
        activeHint: "Works once a background is picked (an image needs a link)"
    },
    glassPanels: {
        label: "Glass effect",
        desc: "Blur under the panels",
        group: "Panels over the background",
        activeHint: "Works once a background is picked (an image needs a link)"
    },
    glassStrength: {
        label: "Glass strength",
        group: "Panels over the background"
    },
    glassSaturation: {
        label: "Saturation under the glass",
        group: "Panels over the background"
    },
    vignette: {
        label: "Vignette around the edges",
        group: "Whole-window overlays"
    },
    vignetteColor: {
        label: "Vignette color",
        desc: "Empty — black",
        group: "Whole-window overlays"
    },
    vignetteSoftness: {
        label: "Where the vignette starts",
        desc: "Lower pulls the darkening closer to the center",
        group: "Whole-window overlays"
    },
    grain: {
        label: "Film grain",
        group: "Whole-window overlays"
    },
    grainSize: {
        label: "Grain size",
        group: "Whole-window overlays"
    },
    grainAnimated: {
        label: "Living grain",
        desc: "The grain jitters like real film (redraws the layer all the time)",
        group: "Whole-window overlays"
    },
    scanlines: {
        label: "CRT scanlines",
        group: "Whole-window overlays"
    },
    scanlineThickness: {
        label: "Scanline thickness",
        group: "Whole-window overlays"
    },
    scanlineGap: {
        label: "Gap between scanlines",
        group: "Whole-window overlays"
    }
};
