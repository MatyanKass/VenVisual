/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ThemePalette, THEMES } from "./themes";

export interface VVSettings {
    theme: string;
    customAccent: string;
    customAccent2: string;
    customBackground: string;
    customText: string;

    hoverEnabled: boolean;
    hoverChannels: boolean;
    hoverDMs: boolean;
    hoverMembers: boolean;
    hoverServers: boolean;
    hoverMessages: boolean;
    hoverShift: number;
    hoverGlow: number;
    highlightSelected: boolean;

    bgImage: string;
    bgBlur: number;
    bgDim: number;
    panelOpacity: number;
    glassPanels: boolean;

    radius: number;
    fontFamily: string;
    fontScale: number;
    messageSpacing: number;

    animations: boolean;
    animationSpeed: number;

    nameStyle: string;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(value: string | undefined): string | null {
    const v = value?.trim();
    if (!v || !HEX_RE.test(v)) return null;
    return v.startsWith("#") ? v : "#" + v;
}

/** transparent version of a color, pct = 0..100 */
const alpha = (color: string, pct: number) =>
    pct >= 100 ? color : `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** lighten / darken a color by mixing with white / black */
const shade = (color: string, pct: number) =>
    pct >= 0
        ? `color-mix(in srgb, ${color}, white ${pct}%)`
        : `color-mix(in srgb, ${color}, black ${-pct}%)`;

function resolvePalette(s: VVSettings): ThemePalette | null {
    const base = THEMES[s.theme];
    const accent = normalizeHex(s.customAccent);
    const accent2 = normalizeHex(s.customAccent2);
    const bg = normalizeHex(s.customBackground);
    const text = normalizeHex(s.customText);

    if (!base && !accent && !accent2 && !bg && !text) return null;

    // "Discord default" + custom colors: build a dark palette around the overrides
    const p: ThemePalette = base
        ? { ...base }
        : {
            label: "Custom",
            bgLowest: "#121214", bgLow: "#18181b", bgBase: "#1e1f22", bgHigh: "#2b2d31",
            text: "#dbdee1", textMuted: "#949ba4", accent: "#5865f2", accent2: "#eb459e"
        };

    if (accent) p.accent = accent;
    if (accent2) p.accent2 = accent2;
    if (bg) {
        p.bgBase = bg;
        p.bgLow = shade(bg, -12);
        p.bgLowest = shade(bg, -25);
        p.bgHigh = shade(bg, 8);
    }
    if (text) {
        p.text = text;
        p.textMuted = `color-mix(in srgb, ${text} 60%, transparent)`;
    }
    return p;
}

/* ---------- selectors (Discord uses hashed class names, so match by prefix) ---------- */

const SEL = {
    channel: '[class*="containerDefault_"] [class*="link_"]',
    channelSelected: '[class*="containerDefault_"] [class*="modeSelected_"] [class*="link_"]',
    dm: '[class*="privateChannels_"] [class*="interactive_"]',
    dmSelected: '[class*="privateChannels_"] [class*="interactiveSelected_"]',
    member: '[class*="members_"] [class*="member_"] > div',
    server: '[class*="guilds_"] [class*="listItem_"] [class*="wrapper_"]',
    message: 'li[id^="chat-messages-"] > [class*="message_"]',
    username: '[class*="header_"] [class*="username_"]'
};

function themeVars(p: ThemePalette, s: VVSettings, transparent: boolean) {
    const o = transparent ? s.panelOpacity : 100;
    const lowest = alpha(p.bgLowest, o);
    const low = alpha(p.bgLow, o);
    const base = alpha(p.bgBase, o);
    const high = alpha(p.bgHigh, Math.min(100, o + 15));

    const vars: Record<string, string> = {
        // visual refresh variables
        "--background-base-lowest": lowest,
        "--background-base-lower": low,
        "--background-base-low": low,
        "--background-surface-high": high,
        "--background-surface-higher": high,
        "--background-surface-highest": alpha(shade(p.bgHigh, 6), Math.min(100, o + 20)),
        "--bg-base-primary": base,
        "--bg-base-secondary": low,
        "--bg-base-tertiary": lowest,
        "--bg-surface-overlay": alpha(p.bgHigh, 95),
        "--bg-surface-raised": high,
        "--chat-background-default": base,
        "--app-frame-background": lowest,
        "--panel-bg": low,
        "--modal-background": p.bgBase,
        "--modal-footer-background": p.bgLow,
        "--input-background-default": alpha(p.bgHigh, Math.min(100, o + 20)),
        "--channeltextarea-background": alpha(p.bgHigh, Math.min(100, o + 20)),
        "--background-modifier-hover": alpha(p.accent, 8),
        "--background-modifier-selected": alpha(p.accent, 16),
        "--background-modifier-active": alpha(p.accent, 12),
        "--background-mod-subtle": alpha(p.accent, 8),
        "--background-mod-normal": alpha(p.accent, 12),
        "--background-mod-strong": alpha(p.accent, 18),
        "--text-default": p.text,
        "--text-strong": p.text,
        "--text-subtle": p.textMuted,
        "--text-muted": p.textMuted,
        "--interactive-text-default": p.textMuted,
        "--interactive-text-hover": p.text,
        "--interactive-text-active": p.text,
        "--channels-default": p.textMuted,
        "--channel-icon": p.textMuted,
        "--text-link": p.accent,
        "--brand-500": p.accent,
        "--brand-560": shade(p.accent, -10),
        "--brand-600": shade(p.accent, -18),
        "--control-brand-foreground": p.accent,
        "--control-brand-foreground-new": p.accent,
        "--mention-foreground": p.accent,
        "--mention-background": alpha(p.accent, 20),
        "--background-mentioned": alpha(p.accent, 10),
        "--background-mentioned-hover": alpha(p.accent, 15),
        "--info-warning-foreground": p.accent,
        "--scrollbar-thin-thumb": alpha(p.accent, 40),
        "--scrollbar-auto-thumb": alpha(p.accent, 40),
        "--border-subtle": alpha(p.text, 6),
        "--border-normal": alpha(p.text, 10),
        "--border-strong": alpha(p.text, 16),
        // legacy variables (older clients / other plugins)
        "--background-primary": base,
        "--background-secondary": low,
        "--background-secondary-alt": low,
        "--background-tertiary": lowest,
        "--background-floating": p.bgHigh,
        "--background-accent": p.accent,
        "--text-normal": p.text,
        "--header-primary": p.text,
        "--header-secondary": p.textMuted,
        "--interactive-normal": p.textMuted,
        "--interactive-hover": p.text,
        "--interactive-active": p.text
    };

    return Object.entries(vars).map(([k, v]) => `    ${k}: ${v} !important;`).join("\n");
}

export function buildCss(s: VVSettings): string {
    const out: string[] = [];
    const palette = resolvePalette(s);
    const bgUrl = s.bgImage?.trim();
    const hasBg = !!bgUrl;
    const speed = s.animations ? Math.max(40, s.animationSpeed) : 0;

    // accent available to every section, even without a theme
    const accent = palette?.accent ?? "var(--brand-500, #5865f2)";
    const accent2 = palette?.accent2 ?? "#eb459e";

    out.push(`:root, .theme-dark, .theme-light {
    --vv-accent: ${accent};
    --vv-accent2: ${accent2};
    --vv-speed: ${speed}ms;
    --vv-ease: cubic-bezier(.2, .8, .2, 1);
}`);

    /* ---------- theme ---------- */
    if (palette) {
        out.push(`.theme-dark, .theme-light, .theme-darker, .theme-midnight, :root {\n${themeVars(palette, s, hasBg)}\n}`);
        out.push(`::selection { background: ${alpha(palette.accent, 35)}; }`);
    }

    /* ---------- background image ---------- */
    if (hasBg) {
        const safeUrl = bgUrl.replace(/["\\\n]/g, "");
        out.push(`#app-mount {
    background: transparent !important;
}
#app-mount::before {
    content: "";
    position: fixed;
    inset: ${s.bgBlur > 0 ? `-${s.bgBlur * 2}px` : "0"};
    z-index: -1;
    pointer-events: none;
    background: url("${safeUrl}") center / cover no-repeat;
    filter: blur(${s.bgBlur}px) brightness(${(100 - s.bgDim) / 100});
}
html, body, [class*="appMount_"], [class*="app_"], [class*="bg_"], [class*="layers_"], [class*="layer_"], [class*="container_"][class*="base_"], [class*="page_"] {
    background: transparent !important;
}`);
        if (!palette) {
            // no theme: at least make Discord's own panels see-through
            out.push(`.theme-dark, .theme-light, :root {
    --background-base-lowest: color-mix(in srgb, #121214 ${s.panelOpacity}%, transparent) !important;
    --background-base-lower: color-mix(in srgb, #18181b ${s.panelOpacity}%, transparent) !important;
    --background-base-low: color-mix(in srgb, #1e1f22 ${s.panelOpacity}%, transparent) !important;
    --chat-background-default: color-mix(in srgb, #1e1f22 ${s.panelOpacity}%, transparent) !important;
    --background-primary: color-mix(in srgb, #1e1f22 ${s.panelOpacity}%, transparent) !important;
    --background-secondary: color-mix(in srgb, #18181b ${s.panelOpacity}%, transparent) !important;
    --background-tertiary: color-mix(in srgb, #121214 ${s.panelOpacity}%, transparent) !important;
}`);
        }
        if (s.glassPanels) {
            out.push(`[class*="sidebar_"], [class*="guilds_"], [class*="members_"], [class*="chatContent_"], [class*="panels_"], [class*="title_"][class*="container_"] {
    backdrop-filter: blur(14px) saturate(140%);
}`);
        }
    }

    /* ---------- hover highlight ---------- */
    if (s.hoverEnabled) {
        const targets: string[] = [];
        if (s.hoverChannels) targets.push(SEL.channel);
        if (s.hoverDMs) targets.push(SEL.dm);
        if (s.hoverMembers) targets.push(SEL.member);

        if (targets.length) {
            const all = targets.join(",\n");
            const hovered = targets.map(t => `${t}:hover`).join(",\n");
            out.push(`${all} {
    position: relative;
    transition: transform var(--vv-speed) var(--vv-ease), background-color var(--vv-speed) ease, box-shadow var(--vv-speed) ease !important;
    will-change: transform;
}
${hovered} {
    transform: translateX(${s.hoverShift}px);
    background-color: color-mix(in srgb, var(--vv-accent) 16%, transparent) !important;
    box-shadow: inset 3px 0 0 var(--vv-accent), 0 0 ${s.hoverGlow}px color-mix(in srgb, var(--vv-accent) 45%, transparent) !important;
}`);

            if (s.highlightSelected) {
                const selected: string[] = [];
                if (s.hoverChannels) selected.push(SEL.channelSelected);
                if (s.hoverDMs) selected.push(SEL.dmSelected);
                if (selected.length) out.push(`${selected.join(",\n")} {
    transform: translateX(${Math.round(s.hoverShift / 2)}px);
    background: linear-gradient(90deg, color-mix(in srgb, var(--vv-accent) 28%, transparent), color-mix(in srgb, var(--vv-accent2) 8%, transparent)) !important;
    box-shadow: inset 3px 0 0 var(--vv-accent) !important;
}`);
            }
        }

        if (s.hoverServers) {
            out.push(`${SEL.server} {
    transition: transform var(--vv-speed) var(--vv-ease), filter var(--vv-speed) ease !important;
}
[class*="guilds_"] [class*="listItem_"]:hover [class*="wrapper_"] {
    transform: translateX(${Math.max(2, Math.round(s.hoverShift / 2))}px) scale(1.06);
    filter: drop-shadow(0 0 ${Math.round(s.hoverGlow / 2)}px color-mix(in srgb, var(--vv-accent) 70%, transparent));
}`);
        }

        if (s.hoverMessages) {
            out.push(`${SEL.message} {
    transition: background-color var(--vv-speed) ease, box-shadow var(--vv-speed) ease !important;
}
${SEL.message}:hover {
    background-color: color-mix(in srgb, var(--vv-accent) 7%, transparent) !important;
    box-shadow: inset 2px 0 0 var(--vv-accent);
}`);
        }
    }

    /* ---------- shape & typography ---------- */
    if (s.radius >= 0) {
        const r = s.radius;
        out.push(`${SEL.channel}, ${SEL.dm}, ${SEL.member} { border-radius: ${Math.min(r, 12)}px !important; }
[class*="channelTextArea_"] [class*="scrollableContainer_"], [class*="channelTextArea_"] > [class*="inner_"], [class*="form_"] [class*="scrollableContainer_"] { border-radius: ${r}px !important; }
article[class*="embed"], [class*="imageWrapper_"], [class*="messageAttachment_"], [class*="wrapper_"][class*="attachment"], [class*="menu_"], [class*="popout_"], [class*="userPopoutOuter_"], [class*="root_"][class*="modal"], [class*="focusLock_"] > [class*="root_"] { border-radius: ${r}px !important; }
${SEL.message} { border-radius: ${Math.min(r, 10)}px; }`);
    }

    const font = s.fontFamily?.trim().replace(/[;{}<>]/g, "");
    if (font) {
        out.push(`:root, .theme-dark, .theme-light {
    --font-primary: ${font}, "gg sans", sans-serif !important;
    --font-display: ${font}, "gg sans", sans-serif !important;
    --font-headline: ${font}, "gg sans", sans-serif !important;
}
body, input, textarea, button { font-family: ${font}, "gg sans", sans-serif; }`);
    }

    if (s.fontScale !== 100) {
        out.push(`[class*="messageContent_"], [class*="markup_"][class*="messageContent_"] { font-size: calc(1rem * ${s.fontScale / 100}) !important; line-height: 1.4; }`);
    }

    if (s.messageSpacing >= 0) {
        out.push(`li[id^="chat-messages-"] [class*="groupStart_"] { margin-top: ${s.messageSpacing}px !important; }`);
    }

    /* ---------- animations ---------- */
    if (s.animations) {
        out.push(`@keyframes vv-msg-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
}
@keyframes vv-pop-in {
    from { opacity: 0; transform: scale(.96); }
    to { opacity: 1; transform: none; }
}
li[id^="chat-messages-"] { animation: vv-msg-in calc(var(--vv-speed) * 1.4) var(--vv-ease) both; }
[class*="menu_"], [class*="userPopoutOuter_"], [class*="popout_"] { animation: vv-pop-in var(--vv-speed) var(--vv-ease) both; }
button, [role="button"], a { transition: background-color var(--vv-speed) ease, color var(--vv-speed) ease, filter var(--vv-speed) ease; }`);
    }

    /* ---------- usernames ---------- */
    const gradient = ({
        accent: "linear-gradient(90deg, var(--vv-accent), var(--vv-accent2))",
        rainbow: "linear-gradient(90deg, #ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d)",
        roleShine: "linear-gradient(90deg, currentColor 30%, #ffffff 50%, currentColor 70%)"
    } as Record<string, string>)[s.nameStyle];

    if (gradient) {
        const animated = s.nameStyle !== "accent" && s.animations;
        out.push(`@keyframes vv-name-flow { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
${SEL.username} {
    background-image: ${gradient} !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    ${animated ? `animation: vv-name-flow ${s.nameStyle === "rainbow" ? 4 : 3}s linear infinite;` : ""}
}`);
    } else if (s.nameStyle === "glow") {
        out.push(`${SEL.username} { text-shadow: 0 0 8px currentColor; }`);
    }

    return out.join("\n\n");
}
