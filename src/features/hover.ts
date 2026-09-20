/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, Feature, mixAccent, normalizeHex, Values } from "../registry";
import { S } from "../selectors";

const TRANSITION = "transition: transform var(--vv-speed) var(--vv-ease), background var(--vv-speed) ease, background-color var(--vv-speed) ease, box-shadow var(--vv-speed) ease, color var(--vv-speed) ease, opacity var(--vv-speed) ease !important;";

/** css number: at most 4 decimals, no trailing zeros, ".4" like the hand-written values */
const num = (x: number) => {
    if (!Number.isFinite(x)) return "0";
    const s = String(Number(x.toFixed(4)));
    if (s.startsWith("0.")) return s.slice(1);
    if (s.startsWith("-0.")) return "-" + s.slice(2);
    return s;
};

/** slider value with a fallback, so a missing or broken value never reaches the css */
const numberOr = (val: unknown, fallback: number) => (typeof val === "number" && Number.isFinite(val) ? val : fallback);

/** color-mix percentage, rounded and clamped to 0..100 */
const mixPct = (base: number, scale: number) => Math.max(0, Math.min(100, Math.round(base * scale)));

/** own hover color, or the theme accent while it is empty */
const hoverColor = (v: Values) => normalizeHex(v.hoverColor) ?? ACCENT;

/** tint of the hover background / glow at `base` %, scaled by the strength slider (100 % = stock look) */
const hoverTint = (v: Values, base: number, color?: string) =>
    mixAccent(mixPct(base, numberOr(v.hoverTint, 100) / 100), color ?? hoverColor(v));

function rowHover(target: string, v: Values): string {
    if (!v.hoverEnabled) return "";
    const shift = Math.round(numberOr(v.hoverShift, 6));
    const glow = Math.round(numberOr(v.hoverGlow, 12));
    const c = hoverColor(v);
    const stripe = Math.max(1, Math.round(numberOr(v.hoverStripe, 3)));
    const t = (base: number) => hoverTint(v, base, c);
    const hov = target.split(",").map(part => `${part.trim()}:hover`).join(", ");

    const styles: Record<string, string> = {
        slide: `transform: translateX(${shift}px); background-color: ${t(16)} !important; box-shadow: inset ${stripe}px 0 0 ${c}, 0 0 ${glow}px ${t(45)} !important;`,
        soft: `transform: translateX(${shift}px); background-color: ${t(10)} !important;`,
        gradient: `transform: translateX(${shift}px); background: linear-gradient(90deg, ${t(30)}, ${hoverTint(v, 4, ACCENT2)}) !important; box-shadow: 0 0 ${glow}px ${t(35)} !important;`,
        neon: `transform: translateX(${shift}px); background-color: ${t(8)} !important; box-shadow: inset 0 0 0 1px ${c}, 0 0 ${glow}px ${t(60)}, inset 0 0 ${Math.round(glow / 2)}px ${t(35)} !important;`,
        scale: `transform: scale(1.03) translateX(${Math.round(shift / 2)}px); background-color: ${t(14)} !important; box-shadow: 0 4px ${glow}px ${t(35)} !important;`,
        underline: `transform: translateX(${shift}px); background-color: transparent !important; box-shadow: inset 0 -${Math.max(1, stripe - 1)}px 0 ${c} !important;`
    };

    return `${target} { position: relative; ${TRANSITION} }
${hov} { ${styles[v.hoverStyle] ?? styles.slide} }`;
}

const HOVER_STYLES = [
    { value: "slide", label: "Отъезд + свечение + полоска" },
    { value: "soft", label: "Мягкий отъезд" },
    { value: "gradient", label: "Градиентная заливка" },
    { value: "neon", label: "Неоновая рамка" },
    { value: "scale", label: "Увеличение с тенью" },
    { value: "underline", label: "Подчёркивание" }
];

/** hover styles that actually draw the stripe the thickness slider controls */
const STRIPE_STYLES = new Set(["slide", "underline"]);
/** server icon effects driven by a keyframe animation / long transition */
const SERVER_TIMED = new Set(["spin", "wiggle", "bounce"]);

export const hoverFeatures: Feature[] = [
    { id: "hoverEnabled", cat: "hover", group: "Наведение", kind: "toggle", label: "Подсветка при наведении", desc: "Элемент светится и отъезжает в сторону, как при выборе", default: true },
    { id: "hoverStyle", cat: "hover", group: "Наведение", kind: "select", label: "Стиль подсветки", default: "slide", options: HOVER_STYLES, dependsOn: "hoverEnabled" },
    { id: "hoverColor", cat: "hover", group: "Наведение", kind: "color", label: "Свой цвет подсветки", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "hoverEnabled" },
    { id: "hoverShift", cat: "hover", group: "Наведение", kind: "slider", label: "Насколько отъезжает", default: 6, min: 0, max: 24, unit: " px", dependsOn: "hoverEnabled" },
    { id: "hoverGlow", cat: "hover", group: "Наведение", kind: "slider", label: "Сила свечения", default: 12, min: 0, max: 40, unit: " px", dependsOn: "hoverEnabled" },
    { id: "hoverTint", cat: "hover", group: "Наведение", kind: "slider", label: "Плотность заливки фона", desc: "100 % — как было", default: 100, min: 0, max: 200, step: 5, unit: "%", dependsOn: "hoverEnabled" },
    {
        id: "hoverStripe", cat: "hover", group: "Наведение", kind: "slider", label: "Толщина полоски", default: 3, min: 1, max: 8, unit: " px", dependsOn: "hoverEnabled",
        activeWhen: v => STRIPE_STYLES.has(v.hoverStyle), activeHint: "Есть у стилей «Отъезд + свечение + полоска» и «Подчёркивание»"
    },

    { id: "hoverChannels", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Каналы сервера", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && rowHover(S.channel, v) },
    { id: "hoverDMs", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Личные сообщения", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && rowHover(S.dm, v) },
    { id: "hoverMembers", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Список участников", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && rowHover(S.member, v) },
    { id: "hoverMenus", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Пункты контекстных меню", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && v.hoverEnabled && `${S.menuItem} { ${TRANSITION} } ${S.menuFocused} { transform: translateX(${Math.round(numberOr(v.hoverShift, 6) / 2)}px); background: linear-gradient(90deg, ${hoverTint(v, 55)}, ${hoverTint(v, 20, ACCENT2)}) !important; box-shadow: 0 0 ${Math.round(numberOr(v.hoverGlow, 12))}px ${hoverTint(v, 35)}; }` },
    {
        id: "hoverServers", cat: "hover", group: "Где подсвечивать", kind: "select", label: "Иконки серверов", dependsOn: "hoverEnabled", default: "lift",
        options: [
            { value: "off", label: "Без эффекта" },
            { value: "lift", label: "Сдвиг + свечение" },
            { value: "scale", label: "Увеличение" },
            { value: "spin", label: "Поворот" },
            { value: "wiggle", label: "Покачивание" },
            { value: "bounce", label: "Подпрыгивание" }
        ],
        css: (mode, v) => {
            if (!v.hoverEnabled || mode === "off") return "";
            const hov = `${S.guildItem}:hover ${S.guildIconTail}`;
            const glow = `filter: drop-shadow(0 0 ${Math.round(numberOr(v.hoverGlow, 12) / 2)}px ${hoverTint(v, 75)});`;
            const base = `${S.guildIcon} { transition: transform var(--vv-speed) var(--vv-ease), filter var(--vv-speed) ease !important; }`;
            // power scales how far the icon moves / grows, speed scales the timed effects (100 % = stock)
            const power = Math.max(0, numberOr(v.serverHoverPower, 100) / 100);
            const speed = Math.max(0.1, numberOr(v.serverHoverSpeed, 100) / 100);
            const sc = (over: number) => num(1 + over * power);
            const dur = (sec: number) => num(sec * speed);
            switch (mode) {
                case "lift": return `${base} ${hov} { transform: translateX(${Math.max(2, Math.round(numberOr(v.hoverShift, 6) / 2 * power))}px) scale(${sc(0.06)}); ${glow} }`;
                case "scale": return `${base} ${hov} { transform: scale(${sc(0.15)}); ${glow} }`;
                case "spin": return `${base} ${hov} { transform: rotate(360deg) scale(${sc(0.05)}); transition-duration: calc(var(--vv-speed) * ${dur(3)}) !important; ${glow} }`;
                case "wiggle": return `@keyframes vv-wiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(${num(-9 * power)}deg); } 75% { transform: rotate(${num(9 * power)}deg); } } ${base} ${hov} { animation: vv-wiggle ${dur(0.4)}s ease-in-out 2; ${glow} }`;
                case "bounce": return `@keyframes vv-bounce { 0%,100% { transform: translateY(0); } 40% { transform: translateY(${num(-6 * power)}px); } 70% { transform: translateY(${num(power)}px); } } ${base} ${hov} { animation: vv-bounce ${dur(0.5)}s var(--vv-ease); ${glow} }`;
            }
        }
    },
    { id: "serverHoverPower", cat: "hover", group: "Где подсвечивать", kind: "slider", label: "Сила эффекта у иконок серверов", desc: "Насколько сильно иконка растёт, качается и прыгает", default: 100, min: 20, max: 200, step: 5, unit: "%", dependsOn: "hoverServers" },
    {
        id: "serverHoverSpeed", cat: "hover", group: "Где подсвечивать", kind: "slider", label: "Длительность анимации иконок", default: 100, min: 25, max: 300, step: 5, unit: "%", dependsOn: "hoverServers",
        activeWhen: v => SERVER_TIMED.has(v.hoverServers), activeHint: "Для поворота, покачивания и подпрыгивания"
    },

    {
        id: "highlightSelected", cat: "hover", group: "Открытый чат", kind: "toggle", label: "Выделять открытый канал / ЛС", desc: "Градиент и полоска у текущего чата", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c1 = normalizeHex(v.selColor1) ?? ACCENT;
            const c2 = normalizeHex(v.selColor2) ?? ACCENT2;
            const scale = numberOr(v.selStrength, 100) / 100;
            const t = (base: number, color: string) => mixAccent(mixPct(base, scale), color);
            return `${S.channelSelected}, ${S.dmSelected} {
    transform: translateX(${Math.round(numberOr(v.hoverShift, 6) / 2)}px);
    background: linear-gradient(90deg, ${t(30, c1)}, ${t(8, c2)}) !important;
    box-shadow: inset 3px 0 0 ${c1}, 0 0 var(--vv-sel-glow, 0px) ${t(45, c1)} !important;
}`;
        }
    },
    { id: "selColor1", cat: "hover", group: "Открытый чат", kind: "color", label: "Открытый чат: цвет слева", desc: "Им же красится полоска", default: "", dependsOn: "highlightSelected" },
    { id: "selColor2", cat: "hover", group: "Открытый чат", kind: "color", label: "Открытый чат: цвет справа", default: "", dependsOn: "highlightSelected" },
    { id: "selStrength", cat: "hover", group: "Открытый чат", kind: "slider", label: "Плотность выделения", default: 100, min: 0, max: 200, step: 5, unit: "%", dependsOn: "highlightSelected" },
    {
        id: "selectedPulse", cat: "hover", group: "Открытый чат", kind: "toggle", label: "Пульсация открытого чата", default: false, dependsOn: "highlightSelected",
        // the base box-shadow is !important (beats animations), so the animation drives a registered property it reads
        css: (on, v) => on && v.highlightSelected && `@property --vv-sel-glow { syntax: "<length>"; inherits: false; initial-value: 0px; }
@keyframes vv-sel-pulse { 0%,100% { --vv-sel-glow: 0px; } 50% { --vv-sel-glow: 14px; } }
${S.channelSelected}, ${S.dmSelected} { animation: vv-sel-pulse 2.4s ease-in-out infinite; }`
    },
    {
        id: "selectedServerGlow", cat: "hover", group: "Открытый чат", kind: "toggle", label: "Свечение выбранного сервера", default: true,
        // Discord puts `selected_` on the icon wrapper itself. Asking for it with :has() instead
        // (the guild item that contains a selected pill) made every style recalc in the whole
        // client ~40ms more expensive, which is what made hovering and scrolling stutter.
        css: on => on && `${S.guilds} [class*="listItemWrapper_"][class*="selected_"] { filter: drop-shadow(0 0 6px ${mixAccent(70)}); }`
    },
    {
        id: "serverPillAccent", cat: "hover", group: "Открытый чат", kind: "toggle", label: "Полоска у сервера цветом акцента", default: true,
        css: on => on && `${S.guildPill} { background: linear-gradient(180deg, ${ACCENT}, ${ACCENT2}) !important; box-shadow: 0 0 8px ${mixAccent(60)}; }`
    },

    {
        id: "unreadGlow", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Свечение непрочитанных каналов", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c = normalizeHex(v.unreadColor) ?? ACCENT;
            return `${S.channelUnread} [class*="name_"] { color: ${c} !important; text-shadow: 0 0 8px ${mixAccent(55, c)}; }`;
        }
    },
    { id: "unreadColor", cat: "hover", group: "Состояния каналов", kind: "color", label: "Цвет непрочитанных каналов", default: "", dependsOn: "unreadGlow" },
    {
        id: "mutedOpacity", cat: "hover", group: "Состояния каналов", kind: "slider", label: "Прозрачность заглушённых каналов", default: 50, min: 10, max: 100, unit: "%",
        css: val => {
            const n = numberOr(val, 50);
            return n !== 50 && `${S.channelMuted} [class*="name_"], ${S.channelMuted} [class*="icon_"] { opacity: ${n / 100} !important; }`;
        }
    },
    {
        id: "voiceConnectedPulse", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Пульс голосового канала, где ты сидишь", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c = normalizeHex(v.voiceColor) ?? "#3ba55d";
            return `@keyframes vv-voice-pulse { 0%,100% { box-shadow: inset 3px 0 0 ${c}, 0 0 0 transparent; } 50% { box-shadow: inset 3px 0 0 ${c}, 0 0 12px ${mixAccent(55, c)}; } }
${S.channelConnected} { animation: vv-voice-pulse 2s ease-in-out infinite; }`;
        }
    },
    { id: "voiceColor", cat: "hover", group: "Состояния каналов", kind: "color", label: "Цвет пульса голосового канала", desc: "Пусто — зелёный Discord", default: "", dependsOn: "voiceConnectedPulse" },
    {
        id: "channelIconAccent", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Иконки каналов цветом акцента при наведении", default: true,
        css: (on, v) => on && `${S.channel}:hover [class*="icon_"] { color: ${normalizeHex(v.channelIconColor) ?? ACCENT} !important; transition: color var(--vv-speed) ease; }`
    },
    { id: "channelIconColor", cat: "hover", group: "Состояния каналов", kind: "color", label: "Цвет иконок каналов", default: "", dependsOn: "channelIconAccent" },
    {
        id: "categoryAccent", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Названия категорий цветом акцента", default: false,
        css: (on, v) => on && `${S.categoryName} { color: ${normalizeHex(v.categoryColor) ?? ACCENT} !important; letter-spacing: .06em; }`
    },
    { id: "categoryColor", cat: "hover", group: "Состояния каналов", kind: "color", label: "Цвет названий категорий", default: "", dependsOn: "categoryAccent" },
    {
        id: "hoverBold", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Название жирнее при наведении", default: false,
        css: on => on && `${S.channel}:hover [class*="name_"], ${S.dm}:hover [class*="name_"] { font-weight: 700 !important; }`
    },
    {
        id: "folderTint", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Открытые папки серверов с оттенком акцента", default: true,
        css: on => on && `${S.guildFolder} { background: linear-gradient(180deg, ${mixAccent(22)}, ${mixAccent(8, ACCENT2)}) !important; }`
    }
];
