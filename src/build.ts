/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { backgroundCss, isSeeThrough } from "./features/background";
import { FEATURES } from "./features/index";
import { messageShadowCss } from "./features/messages";
import { resolvePalette, themeVarsCss } from "./features/theme";
import { CssContext, Values } from "./registry";
import { S } from "./selectors";

export const FALLBACK_ACCENT = "#5865f2";
export const FALLBACK_ACCENT2 = "#eb459e";

/** Discord's own surfaces, used when a background is shown without a VenVisual theme: [lowest, lower, low] */
const SEE_THROUGH_SURFACES: [string, [string, string, string]][] = [
    [".theme-dark, :root", ["#121214", "#18181b", "#1e1f22"]],
    [".theme-darker", ["#0c0c0e", "#111113", "#161618"]],
    [".theme-midnight", ["#000000", "#060608", "#0b0b0e"]],
    [".theme-light", ["#e3e5e8", "#ebedef", "#f2f3f5"]]
];

/** keyframes and helper classes used by the JS side (flash, shake, widgets) */
const STATIC_CSS = `@keyframes vv-shake { 0%,100% { translate: none; } 20% { translate: -4px 1px; } 40% { translate: 4px -1px; } 60% { translate: -3px 0; } 80% { translate: 3px 1px; } }
.vv-shake { animation: vv-shake .45s ease-in-out !important; }
@keyframes vv-flash { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
.vv-flash { position: fixed; inset: 0; pointer-events: none; z-index: 2147483200; box-shadow: inset 0 0 0 3px var(--vv-accent2), inset 0 0 90px color-mix(in srgb, var(--vv-accent2) 55%, transparent); animation: vv-flash 1.1s ease-out forwards; }
@keyframes vv-party { from { filter: var(--vv-filter) hue-rotate(0deg); } to { filter: var(--vv-filter) hue-rotate(360deg); } }`;

export function buildCss(v: Values, paused: boolean): string {
    if (paused) return "";

    const palette = resolvePalette(v);
    const ctx: CssContext = { palette, seeThrough: isSeeThrough(v) };
    const speed = v.perfMode ? 0 : v.animSpeed;
    const out: string[] = [STATIC_CSS];

    // --vv-live-accent* are set inline on <html> by the rainbow accent (fx/runtime.ts), no stylesheet rewrite needed
    out.push(`:root, .theme-dark, .theme-light {
    --vv-accent: var(--vv-live-accent, ${palette?.accent ?? FALLBACK_ACCENT});
    --vv-accent2: var(--vv-live-accent2, ${palette?.accent2 ?? FALLBACK_ACCENT2});
    --vv-speed: ${speed}ms;
    --vv-ease: cubic-bezier(.2, .8, .2, 1);
}`);

    if (palette) {
        out.push(`.theme-dark, .theme-light, .theme-darker, .theme-midnight, :root {\n${themeVarsCss(palette, ctx.seeThrough ? v.panelOpacity : 100)}\n}`);
    } else {
        if (ctx.seeThrough) {
            const o = v.panelOpacity;
            const m = (c: string) => `color-mix(in srgb, ${c} ${o}%, transparent)`;
            // separate blocks (later wins): the light theme keeps light panels so Discord's dark text stays readable
            for (const [selector, [lowest, lower, low]] of SEE_THROUGH_SURFACES) {
                out.push(`${selector} {
    --background-base-lowest: ${m(lowest)} !important;
    --background-base-lower: ${m(lower)} !important;
    --background-base-low: ${m(low)} !important;
    --chat-background-default: ${m(low)} !important;
    --app-frame-background: ${m(lowest)} !important;
    --background-primary: ${m(low)} !important;
    --background-secondary: ${m(lower)} !important;
    --background-tertiary: ${m(lowest)} !important;
}`);
            }
        }
        if (v.rainbowAccent) {
            // no theme: route Discord's brand color through the live accent
            out.push(":root, .theme-dark, .theme-light { --brand-500: var(--vv-accent) !important; --text-link: var(--vv-accent) !important; --control-brand-foreground: var(--vv-accent) !important; }");
        }
    }

    out.push(backgroundCss(v));

    const filters: string[] = [];
    for (const f of FEATURES) {
        try {
            const val = v[f.id];
            const css = f.css?.(val, v, ctx);
            if (css) out.push(css);
            const filter = f.filter?.(val, v);
            if (filter) filters.push(filter);
        } catch (e) {
            console.error("[VenVisual] feature css failed:", f.id, e);
        }
    }

    out.push(messageShadowCss(v));

    const party = v.partyMode && !v.perfMode;
    if (filters.length || party) {
        const filter = filters.join(" ") || "saturate(1)";
        out.push(`${S.appMount} { --vv-filter: ${filter}; filter: ${filter}; ${party ? "animation: vv-party 12s linear infinite;" : ""} }`);
    }

    if (v.pauseAnimUnfocused && !v.perfMode) {
        // Discord marks the focused window with .app-focused on <html>. Looping animations keep
        // repainting while Discord sits behind another window, which costs GPU time for nothing.
        out.push("html:not(.app-focused) *, html:not(.app-focused) *::before, html:not(.app-focused) *::after { animation-play-state: paused !important; }");
    }

    if (v.perfMode) {
        // .01ms instead of 0s so transitionend / animationend still fire for code that waits for them
        out.push(`*, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; transition-delay: 0s !important; backdrop-filter: none !important; will-change: auto !important; }
#app-mount::before { filter: brightness(${(100 - v.bgDim) / 100}) saturate(${v.bgSaturation / 100}) !important; }`);
    }

    return out.join("\n\n");
}
