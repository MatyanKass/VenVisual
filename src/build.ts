/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { backgroundCss, isSeeThrough } from "./features/background";
import { FEATURES } from "./features/index";
import { resolvePalette, themeVarsCss } from "./features/theme";
import { CssContext, Values } from "./registry";
import { S } from "./selectors";

export const FALLBACK_ACCENT = "#5865f2";
export const FALLBACK_ACCENT2 = "#eb459e";

/** keyframes and helper classes used by the JS side (flash, shake, widgets) */
const STATIC_CSS = `@keyframes vv-shake { 0%,100% { transform: none; } 20% { transform: translate(-4px, 1px); } 40% { transform: translate(4px, -1px); } 60% { transform: translate(-3px, 0); } 80% { transform: translate(3px, 1px); } }
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

    out.push(`:root, .theme-dark, .theme-light {
    --vv-accent: ${palette?.accent ?? FALLBACK_ACCENT};
    --vv-accent2: ${palette?.accent2 ?? FALLBACK_ACCENT2};
    --vv-speed: ${speed}ms;
    --vv-ease: cubic-bezier(.2, .8, .2, 1);
}`);

    if (palette) {
        out.push(`.theme-dark, .theme-light, .theme-darker, .theme-midnight, :root {\n${themeVarsCss(palette, ctx.seeThrough ? v.panelOpacity : 100)}\n}`);
    } else {
        if (ctx.seeThrough) {
            const o = v.panelOpacity;
            const m = (c: string) => `color-mix(in srgb, ${c} ${o}%, transparent)`;
            out.push(`.theme-dark, .theme-light, .theme-darker, .theme-midnight, :root {
    --background-base-lowest: ${m("#121214")} !important;
    --background-base-lower: ${m("#18181b")} !important;
    --background-base-low: ${m("#1e1f22")} !important;
    --chat-background-default: ${m("#1e1f22")} !important;
    --app-frame-background: ${m("#121214")} !important;
    --background-primary: ${m("#1e1f22")} !important;
    --background-secondary: ${m("#18181b")} !important;
    --background-tertiary: ${m("#121214")} !important;
}`);
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

    if (filters.length || v.partyMode) {
        const filter = filters.join(" ") || "saturate(1)";
        out.push(`${S.appMount} { --vv-filter: ${filter}; filter: ${filter}; ${v.partyMode && !v.perfMode ? "animation: vv-party 12s linear infinite;" : ""} }`);
    }

    if (v.perfMode) {
        out.push(`*, *::before, *::after { animation-duration: 0s !important; animation-iteration-count: 1 !important; transition-duration: 0s !important; backdrop-filter: none !important; }
#app-mount::before { filter: brightness(${(100 - v.bgDim) / 100}) !important; }`);
    }

    return out.join("\n\n");
}
