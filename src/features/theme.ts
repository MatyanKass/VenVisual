/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, alpha, Feature, mixAccent, normalizeHex, shade, Values } from "../registry";
import { THEME_OPTIONS, ThemePalette, THEMES } from "../themes";

const HOURS = { min: 0, max: 23, step: 1, unit: " ч" };

export const themeFeatures: Feature[] = [
    { id: "theme", cat: "theme", group: "Тема", kind: "select", label: "Тема", desc: "Готовая палитра всего клиента", default: "none", options: THEME_OPTIONS },
    { id: "accent", cat: "theme", group: "Свои цвета", kind: "color", label: "Акцентный цвет", desc: "Кнопки, ссылки, подсветка. Пусто = из темы", default: "" },
    { id: "accent2", cat: "theme", group: "Свои цвета", kind: "color", label: "Второй акцент", desc: "Для градиентов", default: "" },
    { id: "bgColor", cat: "theme", group: "Свои цвета", kind: "color", label: "Цвет фона", desc: "Остальные оттенки фона считаются от него", default: "" },
    { id: "textColor", cat: "theme", group: "Свои цвета", kind: "color", label: "Цвет текста", default: "" },
    { id: "mutedText", cat: "theme", group: "Свои цвета", kind: "slider", label: "Яркость второстепенного текста", default: 60, min: 30, max: 90, unit: "%", desc: "Только вместе с темой или своим цветом текста" },

    { id: "autoTheme", cat: "theme", group: "Автосмена по времени", kind: "toggle", label: "Дневная и ночная тема", desc: "Тема сама меняется в зависимости от времени суток", default: false },
    { id: "dayTheme", cat: "theme", group: "Автосмена по времени", kind: "select", label: "Дневная тема", default: "nord", options: THEME_OPTIONS, dependsOn: "autoTheme" },
    { id: "nightTheme", cat: "theme", group: "Автосмена по времени", kind: "select", label: "Ночная тема", default: "midnight", options: THEME_OPTIONS, dependsOn: "autoTheme" },
    { id: "dayStart", cat: "theme", group: "Автосмена по времени", kind: "slider", label: "День начинается в", default: 8, ...HOURS, dependsOn: "autoTheme" },
    { id: "nightStart", cat: "theme", group: "Автосмена по времени", kind: "slider", label: "Ночь начинается в", default: 21, ...HOURS, dependsOn: "autoTheme" },

    { id: "rainbowAccent", cat: "theme", group: "Живой цвет", kind: "toggle", label: "Радужный акцент", desc: "Акцентный цвет плавно переливается по кругу", default: false },
    { id: "rainbowSpeed", cat: "theme", group: "Живой цвет", kind: "slider", label: "Скорость радуги", default: 20, min: 2, max: 120, unit: " с/круг", dependsOn: "rainbowAccent" },
    { id: "rainbowSat", cat: "theme", group: "Живой цвет", kind: "slider", label: "Насыщенность радуги", default: 85, min: 20, max: 100, unit: "%", dependsOn: "rainbowAccent" },

    {
        id: "selectionAccent", cat: "theme", group: "Мелочи", kind: "toggle", label: "Выделение текста цветом акцента", default: true,
        css: on => on && `::selection { background: ${mixAccent(38)} !important; }`
    },
    {
        id: "caretAccent", cat: "theme", group: "Мелочи", kind: "toggle", label: "Курсор ввода цветом акцента", default: true,
        css: on => on && "input, textarea, [contenteditable] { caret-color: var(--vv-accent) !important; }"
    },
    {
        id: "focusRingAccent", cat: "theme", group: "Мелочи", kind: "toggle", label: "Рамка фокуса цветом акцента", default: false,
        css: on => on && `:root, .theme-dark, .theme-light { --focus-primary: ${ACCENT} !important; --border-focus: ${ACCENT} !important; }`
    },

    { id: "saturation", cat: "theme", group: "Цветокоррекция всего окна", kind: "slider", label: "Насыщенность", default: 100, min: 0, max: 200, unit: "%", heavy: true, filter: v => v !== 100 && `saturate(${v / 100})` },
    { id: "contrast", cat: "theme", group: "Цветокоррекция всего окна", kind: "slider", label: "Контраст", default: 100, min: 70, max: 150, unit: "%", heavy: true, filter: v => v !== 100 && `contrast(${v / 100})` },
    { id: "brightness", cat: "theme", group: "Цветокоррекция всего окна", kind: "slider", label: "Яркость", default: 100, min: 50, max: 150, unit: "%", heavy: true, filter: v => v !== 100 && `brightness(${v / 100})` },
    { id: "warmth", cat: "theme", group: "Цветокоррекция всего окна", kind: "slider", label: "Ночной тёплый фильтр", desc: "Меньше синего вечером", default: 0, min: 0, max: 60, unit: "%", heavy: true, filter: v => v > 0 && `sepia(${v / 100})` },
    { id: "hueShift", cat: "theme", group: "Цветокоррекция всего окна", kind: "slider", label: "Сдвиг оттенка", desc: "Поворачивает все цвета, включая картинки", default: 0, min: 0, max: 360, unit: "°", heavy: true, filter: v => v > 0 && `hue-rotate(${v}deg)` }
];

/* ---------- palette resolution ---------- */

export function effectiveThemeId(v: Values, now = new Date()): string {
    if (!v.autoTheme) return v.theme;
    const h = now.getHours();
    const { dayStart, nightStart } = v;
    const isDay = dayStart <= nightStart
        ? h >= dayStart && h < nightStart
        : h >= dayStart || h < nightStart;
    return isDay ? v.dayTheme : v.nightTheme;
}

export function resolvePalette(v: Values): ThemePalette | null {
    const base = THEMES[effectiveThemeId(v)];
    const accent = normalizeHex(v.accent);
    const accent2 = normalizeHex(v.accent2);
    const bg = normalizeHex(v.bgColor);
    const text = normalizeHex(v.textColor);

    if (!base && !accent && !accent2 && !bg && !text) return null;

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
    if (text || v.mutedText !== 60) {
        if (text) p.text = text;
        p.textMuted = `color-mix(in srgb, ${p.text} ${v.mutedText}%, ${p.bgBase})`;
    }
    return p;
}

export function themeVarsCss(p: ThemePalette, panelOpacity: number): string {
    const o = panelOpacity;
    const lowest = alpha(p.bgLowest, o);
    const low = alpha(p.bgLow, o);
    const base = alpha(p.bgBase, o);
    const high = alpha(p.bgHigh, Math.min(100, o + 15));
    const higher = alpha(shade(p.bgHigh, 6), Math.min(100, o + 20));
    const input = alpha(p.bgHigh, Math.min(100, o + 20));
    const a = ACCENT;

    const vars: Record<string, string> = {
        "--background-base-lowest": lowest,
        "--background-base-lower": low,
        "--background-base-low": low,
        "--background-surface-high": high,
        "--background-surface-higher": high,
        "--background-surface-highest": higher,
        "--bg-base-primary": base,
        "--bg-base-secondary": low,
        "--bg-base-tertiary": lowest,
        "--bg-surface-overlay": alpha(p.bgHigh, 96),
        "--bg-surface-raised": high,
        "--chat-background-default": base,
        "--app-frame-background": lowest,
        "--panel-bg": low,
        "--modal-background": p.bgBase,
        "--modal-footer-background": p.bgLow,
        "--input-background-default": input,
        "--channeltextarea-background": input,
        "--interactive-background-hover": mixAccent(10),
        "--interactive-background-active": mixAccent(14),
        "--interactive-background-selected": mixAccent(18),
        "--background-modifier-hover": mixAccent(8),
        "--background-modifier-selected": mixAccent(16),
        "--background-modifier-active": mixAccent(12),
        "--background-mod-subtle": mixAccent(8),
        "--background-mod-normal": mixAccent(12),
        "--background-mod-strong": mixAccent(18),
        "--message-background-hover": mixAccent(5),
        "--message-mentioned-background-default": mixAccent(10, "var(--vv-accent2)"),
        "--message-mentioned-background-hover": mixAccent(15, "var(--vv-accent2)"),
        "--icon-feedback-warning": "var(--vv-accent2)",
        "--reaction-background-reacted-default": mixAccent(20),
        "--reaction-border-reacted-default": a,
        "--reaction-text-reacted-default": p.text,
        "--badge-background-default": a,
        "--spine-default": mixAccent(60),
        "--input-placeholder-text-default": p.textMuted,
        "--text-default": p.text,
        "--text-strong": p.text,
        "--text-subtle": p.textMuted,
        "--text-muted": p.textMuted,
        "--text-brand": a,
        "--icon-strong": p.text,
        "--icon-default": p.textMuted,
        "--icon-subtle": p.textMuted,
        "--icon-muted": p.textMuted,
        "--interactive-text-default": p.textMuted,
        "--interactive-text-hover": p.text,
        "--interactive-text-active": p.text,
        "--channels-default": p.textMuted,
        "--channel-icon": p.textMuted,
        "--text-link": a,
        "--brand-500": a,
        "--brand-560": shade(a, -10),
        "--brand-600": shade(a, -18),
        "--control-brand-foreground": a,
        "--control-brand-foreground-new": a,
        "--mention-foreground": a,
        "--mention-background": mixAccent(20),
        "--background-mentioned": mixAccent(10),
        "--background-mentioned-hover": mixAccent(15),
        "--scrollbar-thin-thumb": mixAccent(40),
        "--scrollbar-auto-thumb": mixAccent(40),
        "--border-subtle": alpha(p.text, 6),
        "--border-normal": alpha(p.text, 10),
        "--border-strong": alpha(p.text, 16),
        "--background-primary": base,
        "--background-secondary": low,
        "--background-secondary-alt": low,
        "--background-tertiary": lowest,
        "--background-floating": p.bgHigh,
        "--background-accent": a,
        "--text-normal": p.text,
        "--header-primary": p.text,
        "--header-secondary": p.textMuted,
        "--interactive-normal": p.textMuted,
        "--interactive-hover": p.text,
        "--interactive-active": p.text
    };

    return Object.entries(vars).map(([k, val]) => `    ${k}: ${val} !important;`).join("\n");
}
