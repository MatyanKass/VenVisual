/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, Feature, mixAccent, Values } from "../registry";
import { S } from "../selectors";

const TRANSITION = "transition: transform var(--vv-speed) var(--vv-ease), background var(--vv-speed) ease, background-color var(--vv-speed) ease, box-shadow var(--vv-speed) ease, color var(--vv-speed) ease, opacity var(--vv-speed) ease !important;";

function rowHover(target: string, v: Values): string {
    if (!v.hoverEnabled) return "";
    const shift = v.hoverShift;
    const glow = v.hoverGlow;
    const hov = target.split(",").map(t => `${t.trim()}:hover`).join(", ");

    const styles: Record<string, string> = {
        slide: `transform: translateX(${shift}px); background-color: ${mixAccent(16)} !important; box-shadow: inset 3px 0 0 ${ACCENT}, 0 0 ${glow}px ${mixAccent(45)} !important;`,
        soft: `transform: translateX(${shift}px); background-color: ${mixAccent(10)} !important;`,
        gradient: `transform: translateX(${shift}px); background: linear-gradient(90deg, ${mixAccent(30)}, ${mixAccent(4, ACCENT2)}) !important; box-shadow: 0 0 ${glow}px ${mixAccent(35)} !important;`,
        neon: `transform: translateX(${shift}px); background-color: ${mixAccent(8)} !important; box-shadow: inset 0 0 0 1px ${ACCENT}, 0 0 ${glow}px ${mixAccent(60)}, inset 0 0 ${Math.round(glow / 2)}px ${mixAccent(35)} !important;`,
        scale: `transform: scale(1.03) translateX(${Math.round(shift / 2)}px); background-color: ${mixAccent(14)} !important; box-shadow: 0 4px ${glow}px ${mixAccent(35)} !important;`,
        underline: `transform: translateX(${shift}px); background-color: transparent !important; box-shadow: inset 0 -2px 0 ${ACCENT} !important;`
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

export const hoverFeatures: Feature[] = [
    { id: "hoverEnabled", cat: "hover", group: "Наведение", kind: "toggle", label: "Подсветка при наведении", desc: "Элемент светится и отъезжает в сторону, как при выборе", default: true },
    { id: "hoverStyle", cat: "hover", group: "Наведение", kind: "select", label: "Стиль подсветки", default: "slide", options: HOVER_STYLES, dependsOn: "hoverEnabled" },
    { id: "hoverShift", cat: "hover", group: "Наведение", kind: "slider", label: "Насколько отъезжает", default: 6, min: 0, max: 24, unit: " px", dependsOn: "hoverEnabled" },
    { id: "hoverGlow", cat: "hover", group: "Наведение", kind: "slider", label: "Сила свечения", default: 12, min: 0, max: 40, unit: " px", dependsOn: "hoverEnabled" },

    { id: "hoverChannels", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Каналы сервера", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && rowHover(S.channel, v) },
    { id: "hoverDMs", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Личные сообщения", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && rowHover(S.dm, v) },
    { id: "hoverMembers", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Список участников", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && rowHover(S.member, v) },
    { id: "hoverMenus", cat: "hover", group: "Где подсвечивать", kind: "toggle", label: "Пункты контекстных меню", default: true, dependsOn: "hoverEnabled", css: (on, v) => on && v.hoverEnabled && `${S.menuItem} { ${TRANSITION} } ${S.menuFocused} { transform: translateX(${Math.round(v.hoverShift / 2)}px); background: linear-gradient(90deg, ${mixAccent(55)}, ${mixAccent(20, ACCENT2)}) !important; box-shadow: 0 0 ${v.hoverGlow}px ${mixAccent(35)}; }` },
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
            const glow = `filter: drop-shadow(0 0 ${Math.round(v.hoverGlow / 2)}px ${mixAccent(75)});`;
            const base = `${S.guildIcon} { transition: transform var(--vv-speed) var(--vv-ease), filter var(--vv-speed) ease !important; }`;
            switch (mode) {
                case "lift": return `${base} ${hov} { transform: translateX(${Math.max(2, Math.round(v.hoverShift / 2))}px) scale(1.06); ${glow} }`;
                case "scale": return `${base} ${hov} { transform: scale(1.15); ${glow} }`;
                case "spin": return `${base} ${hov} { transform: rotate(360deg) scale(1.05); transition-duration: calc(var(--vv-speed) * 3) !important; ${glow} }`;
                case "wiggle": return `@keyframes vv-wiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-9deg); } 75% { transform: rotate(9deg); } } ${base} ${hov} { animation: vv-wiggle .4s ease-in-out 2; ${glow} }`;
                case "bounce": return `@keyframes vv-bounce { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } 70% { transform: translateY(1px); } } ${base} ${hov} { animation: vv-bounce .5s var(--vv-ease); ${glow} }`;
            }
        }
    },

    {
        id: "highlightSelected", cat: "hover", group: "Открытый чат", kind: "toggle", label: "Выделять открытый канал / ЛС", desc: "Градиент и полоска у текущего чата", default: true,
        css: (on, v) => on && `${S.channelSelected}, ${S.dmSelected} {
    transform: translateX(${Math.round(v.hoverShift / 2)}px);
    background: linear-gradient(90deg, ${mixAccent(30)}, ${mixAccent(8, ACCENT2)}) !important;
    box-shadow: inset 3px 0 0 ${ACCENT}, 0 0 var(--vv-sel-glow, 0px) ${mixAccent(45)} !important;
}`
    },
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
        css: on => on && `${S.channelUnread} [class*="name_"] { color: ${ACCENT} !important; text-shadow: 0 0 8px ${mixAccent(55)}; }`
    },
    {
        id: "mutedOpacity", cat: "hover", group: "Состояния каналов", kind: "slider", label: "Прозрачность заглушённых каналов", default: 50, min: 10, max: 100, unit: "%",
        css: val => val !== 50 && `${S.channelMuted} [class*="name_"], ${S.channelMuted} [class*="icon_"] { opacity: ${val / 100} !important; }`
    },
    {
        id: "voiceConnectedPulse", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Пульс голосового канала, где ты сидишь", default: true,
        css: on => on && `@keyframes vv-voice-pulse { 0%,100% { box-shadow: inset 3px 0 0 #3ba55d, 0 0 0 transparent; } 50% { box-shadow: inset 3px 0 0 #3ba55d, 0 0 12px color-mix(in srgb, #3ba55d 55%, transparent); } }
${S.channelConnected} { animation: vv-voice-pulse 2s ease-in-out infinite; }`
    },
    {
        id: "channelIconAccent", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Иконки каналов цветом акцента при наведении", default: true,
        css: on => on && `${S.channel}:hover [class*="icon_"] { color: ${ACCENT} !important; transition: color var(--vv-speed) ease; }`
    },
    {
        id: "categoryAccent", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Названия категорий цветом акцента", default: false,
        css: on => on && `${S.categoryName} { color: ${ACCENT} !important; letter-spacing: .06em; }`
    },
    {
        id: "hoverBold", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Название жирнее при наведении", default: false,
        css: on => on && `${S.channel}:hover [class*="name_"], ${S.dm}:hover [class*="name_"] { font-weight: 700 !important; }`
    },
    {
        id: "folderTint", cat: "hover", group: "Состояния каналов", kind: "toggle", label: "Открытые папки серверов с оттенком акцента", default: true,
        css: on => on && `${S.guildFolder} { background: linear-gradient(180deg, ${mixAccent(22)}, ${mixAccent(8, ACCENT2)}) !important; }`
    }
];
