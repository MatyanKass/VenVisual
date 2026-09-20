/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ThemePalette } from "./themes";

export type Values = Record<string, any>;

export interface CssContext {
    /** resolved palette, null when Discord colors are kept */
    palette: ThemePalette | null;
    /** a background image or animated background is active, panels may be translucent */
    seeThrough: boolean;
}

export type CategoryId = "theme" | "hover" | "messages" | "names" | "background" | "effects" | "interface" | "extras";

export const CATEGORIES: { id: CategoryId; label: string; icon: string; }[] = [
    { id: "theme", label: "Темы", icon: "🎨" },
    { id: "hover", label: "Подсветка", icon: "✨" },
    { id: "messages", label: "Сообщения", icon: "💬" },
    { id: "names", label: "Ники и аватары", icon: "🌈" },
    { id: "background", label: "Фон", icon: "🖼️" },
    { id: "effects", label: "Эффекты", icon: "🎆" },
    { id: "interface", label: "Интерфейс", icon: "🧩" },
    { id: "extras", label: "Всячина", icon: "🧪" }
];

interface FeatureBase {
    id: string;
    cat: CategoryId;
    label: string;
    desc?: string;
    /** sub-heading inside the tab */
    group?: string;
    /** id of a toggle / select this option depends on; shown dimmed while it is off */
    dependsOn?: string;
    /** extra condition for the option to have an effect (e.g. only for one select value); dimmed while false */
    activeWhen?(v: Values): boolean;
    /** hint shown while activeWhen is false */
    activeHint?: string;
    /** noticeably heavier on weak PCs */
    heavy?: boolean;
    css?(value: any, v: Values, ctx: CssContext): string | false | undefined | null;
    /** piece of the combined `filter` applied to the whole app, e.g. "saturate(1.2)" */
    filter?(value: any, v: Values): string | false | undefined | null;
}

export interface ToggleFeature extends FeatureBase { kind: "toggle"; default: boolean; }
export interface SliderFeature extends FeatureBase { kind: "slider"; default: number; min: number; max: number; step?: number; unit?: string; }
export interface ColorFeature extends FeatureBase { kind: "color"; default: string; }
export interface SelectFeature extends FeatureBase { kind: "select"; default: string; options: { value: string; label: string; }[]; }
export interface TextFeature extends FeatureBase { kind: "text"; default: string; placeholder?: string; multiline?: boolean; }

export type Feature = ToggleFeature | SliderFeature | ColorFeature | SelectFeature | TextFeature;

/* ---------- small css helpers shared by feature files ---------- */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(value: string | undefined): string | null {
    const v = value?.trim();
    if (!v || !HEX_RE.test(v)) return null;
    let hex = v.startsWith("#") ? v.slice(1) : v;
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    return "#" + hex.toLowerCase();
}

/** transparent version of a color, pct = 0..100 */
export const alpha = (color: string, pct: number) =>
    pct >= 100 ? color : `color-mix(in srgb, ${color} ${Math.max(0, pct)}%, transparent)`;

/** lighten (pct > 0) or darken (pct < 0) by mixing with white / black */
export const shade = (color: string, pct: number) =>
    pct >= 0
        ? `color-mix(in srgb, ${color}, white ${pct}%)`
        : `color-mix(in srgb, ${color}, black ${-pct}%)`;

/** strip characters that could break out of a css value */
export const cssSafe = (s: string) => s.replace(/[;{}<>\\\n\r"]/g, "");

export const ACCENT = "var(--vv-accent)";
export const ACCENT2 = "var(--vv-accent2)";
export const mixAccent = (pct: number, color = ACCENT) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
