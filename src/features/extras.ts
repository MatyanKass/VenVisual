/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, cssSafe, Feature, mixAccent, normalizeHex, Values } from "../registry";
import { S } from "../selectors";

/* ---------- guards: a slider / color that is missing or broken must never reach the css ---------- */

/** numeric setting, or the fallback when it is missing / NaN */
const nz = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
/** color override, or the theme color when the user left it empty */
const col = (value: unknown, fallback = ACCENT) => normalizeHex(typeof value === "string" ? value : undefined) ?? fallback;
/** a percent slider as a plain multiplier, clamped to something sane */
const mul = (value: unknown, fallback = 100) => Math.min(10, Math.max(0, nz(value, fallback) / 100));
/** short css number: 0.06 -> ".06", 4 -> "4"; never NaN */
const num = (n: number) => (Number.isFinite(n) ? String(Number(n.toFixed(3))).replace(/^(-?)0\./, "$1.") : "0");
/** ":hover" (or any suffix / prefix) applied to every selector of a comma list */
const each = (selector: string, fn: (s: string) => string) => selector.split(",").map(s => fn(s.trim())).join(", ");

const WIDGETS_ON = {
    activeWhen: (v: Values) => !!(v.clock || v.sessionTimer || v.fpsCounter),
    activeHint: "Работает, когда включён хотя бы один виджет"
};

const blurUntilHover = (id: string, label: string, selector: string, amount = 6): Feature => ({
    id, cat: "extras", group: "Приватность (для стримов и скриншотов)", kind: "toggle", label, default: false,
    css: (on, v) => {
        if (!on) return "";
        const blur = Math.max(0, Math.round(amount * mul(v.privacyBlur)));
        const rule = `filter: blur(${blur}px); transition: filter var(--vv-speed) ease !important;`;
        // Discord marks the focused window with .app-focused on <html>, so "reveal while focused"
        // needs no hover rule at all: the blur simply stops applying once the window is in front
        if (v.privacyReveal === "focus") return `${each(selector, s => `html:not(.app-focused) ${s}`)} { ${rule} }`;
        return `${selector} { ${rule} } ${each(selector, s => `${s}:hover`)} { filter: none; }`;
    }
});

export const extraFeatures: Feature[] = [
    /* ---------- widgets (fx/widgets.ts) ---------- */
    { id: "clock", cat: "extras", group: "Виджеты", kind: "toggle", label: "Часы поверх окна", default: false },
    {
        id: "clockFormat", cat: "extras", group: "Виджеты", kind: "select", label: "Формат часов", default: "24", dependsOn: "clock",
        options: [{ value: "24", label: "24 часа (13:05)" }, { value: "12", label: "12 часов (1:05 PM)" }]
    },
    { id: "clockSeconds", cat: "extras", group: "Виджеты", kind: "toggle", label: "Показывать секунды", default: false, dependsOn: "clock" },
    { id: "clockDate", cat: "extras", group: "Виджеты", kind: "toggle", label: "Показывать дату", default: false, dependsOn: "clock" },
    { id: "sessionTimer", cat: "extras", group: "Виджеты", kind: "toggle", label: "Сколько ты сегодня сидишь в Discord", desc: "Таймер с момента запуска", default: false },
    { id: "sessionTimerLabel", cat: "extras", group: "Виджеты", kind: "toggle", label: "Значок ⏱ у таймера", default: true, dependsOn: "sessionTimer" },
    { id: "fpsCounter", cat: "extras", group: "Виджеты", kind: "toggle", label: "Счётчик FPS", default: false },
    {
        id: "widgetPosition", cat: "extras", group: "Виджеты", kind: "select", label: "Где показывать виджеты", default: "bottom-right",
        options: [
            { value: "top-right", label: "Сверху справа" },
            { value: "top-left", label: "Сверху слева" },
            { value: "bottom-right", label: "Снизу справа" },
            { value: "bottom-left", label: "Снизу слева" },
            { value: "top-center", label: "Сверху по центру" }
        ]
    },
    {
        id: "widgetStyle", cat: "extras", group: "Виджеты", kind: "select", label: "Стиль виджетов", default: "glass",
        options: [{ value: "glass", label: "Стекло" }, { value: "neon", label: "Неон" }, { value: "minimal", label: "Минимализм" }, { value: "terminal", label: "Терминал" }]
    },
    { id: "widgetFontSize", cat: "extras", group: "Виджеты", kind: "slider", label: "Размер шрифта виджетов", default: 13, min: 9, max: 32, unit: " px", ...WIDGETS_ON },
    { id: "widgetOpacity", cat: "extras", group: "Виджеты", kind: "slider", label: "Непрозрачность виджетов", default: 100, min: 10, max: 100, unit: "%", ...WIDGETS_ON },
    { id: "widgetOffset", cat: "extras", group: "Виджеты", kind: "slider", label: "Отступ виджетов от края окна", default: 16, min: 0, max: 120, unit: " px", ...WIDGETS_ON },
    { id: "widgetColor", cat: "extras", group: "Виджеты", kind: "color", label: "Цвет виджетов", desc: "Пусто — цвета выбранного стиля", default: "", ...WIDGETS_ON },

    /* ---------- privacy ---------- */
    blurUntilHover("blurMessages", "Размывать текст сообщений до наведения", S.messageContent, 5),
    blurUntilHover("blurNames", "Размывать ники до наведения", `${S.username}, ${S.membersWrap} [class*="nameAndDecorators_"]`, 5),
    blurUntilHover("blurAvatars", "Размывать аватарки до наведения", `${S.chatAvatar}, ${S.memberAvatar}`, 8),
    blurUntilHover("blurImages", "Размывать картинки до наведения", `${S.image}, ${S.embed} img, ${S.embed} video`, 18),
    blurUntilHover("blurDMList", "Размывать список ЛС до наведения", `${S.dm} [class*="content_"], ${S.dm} [class*="avatar_"]`, 6),
    {
        id: "privacyBlur", cat: "extras", group: "Приватность (для стримов и скриншотов)", kind: "slider",
        label: "Сила размытия", desc: "100% — как задумано: у текста слабее, у картинок сильнее", default: 100, min: 20, max: 400, step: 10, unit: "%",
        activeWhen: v => !!(v.blurMessages || v.blurNames || v.blurAvatars || v.blurImages || v.blurDMList),
        activeHint: "Работает, когда включено хотя бы одно размытие"
    },
    {
        id: "privacyReveal", cat: "extras", group: "Приватность (для стримов и скриншотов)", kind: "select", label: "Когда показывать содержимое", default: "hover",
        options: [
            { value: "hover", label: "При наведении мышкой" },
            { value: "focus", label: "Пока окно Discord активно" }
        ],
        activeWhen: v => !!(v.blurMessages || v.blurNames || v.blurAvatars || v.blurImages || v.blurDMList),
        activeHint: "Работает, когда включено хотя бы одно размытие"
    },

    /* ---------- fun ---------- */
    {
        id: "windowFrame", cat: "extras", group: "Приколы", kind: "select", label: "Светящаяся рамка окна", default: "none", heavy: true,
        desc: "Анимированные рамки перерисовывают всё окно",
        options: [{ value: "none", label: "Нет" }, { value: "accent", label: "Цвет акцента" }, { value: "rainbow", label: "Бегущая радуга" }, { value: "breathing", label: "Дышащая" }],
        css: (mode, v) => {
            if (mode === "none") return "";
            const thick = mul(v.frameThickness);
            const glow = mul(v.frameGlow);
            // a percent instead of a px value: every mode has its own natural thickness (1px / 2px)
            const w = (px: number) => Math.max(1, Math.round(px * thick));
            const g = (px: number) => Math.max(0, Math.round(px * glow));
            const speed = mul(v.frameSpeed);
            const seconds = (sec: number) => num(speed > 0 ? sec / speed : sec);
            const base = "body::after";
            const frame = "content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 2147482000; border-radius: 0;";
            const c = col(v.frameColor);
            if (mode === "accent") return `${base} { ${frame} box-shadow: inset 0 0 0 ${w(1)}px ${mixAccent(80, c)}, inset 0 0 ${g(22)}px ${mixAccent(35, c)}; }`;
            // both animate a compositor-friendly property (opacity / hue-rotate) over a frame that is
            // painted once, instead of re-painting a full-window box-shadow or conic gradient every frame
            if (mode === "breathing") return `@keyframes vv-breathe { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
${base} { ${frame} box-shadow: inset 0 0 0 ${w(2)}px ${ACCENT2}, inset 0 0 ${g(32)}px ${mixAccent(45, ACCENT2)}; animation: vv-breathe ${seconds(4)}s ease-in-out infinite; will-change: opacity; }`;
            return `@keyframes vv-frame-hue { to { filter: hue-rotate(360deg); } }
${base} { ${frame} padding: ${w(2)}px; background: conic-gradient(#ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: vv-frame-hue ${seconds(6)}s linear infinite; will-change: filter; }`;
        }
    },
    { id: "frameThickness", cat: "extras", group: "Приколы", kind: "slider", label: "Толщина рамки окна", default: 100, min: 50, max: 600, step: 10, unit: "%", dependsOn: "windowFrame" },
    {
        id: "frameGlow", cat: "extras", group: "Приколы", kind: "slider", label: "Свечение рамки окна", default: 100, min: 0, max: 300, step: 10, unit: "%", dependsOn: "windowFrame",
        activeWhen: v => v.windowFrame === "accent" || v.windowFrame === "breathing", activeHint: "Работает с рамками «Цвет акцента» и «Дышащая»"
    },
    {
        id: "frameColor", cat: "extras", group: "Приколы", kind: "color", label: "Цвет рамки окна", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "windowFrame",
        activeWhen: v => v.windowFrame === "accent", activeHint: "Работает с рамкой «Цвет акцента»"
    },
    {
        id: "frameSpeed", cat: "extras", group: "Приколы", kind: "slider", label: "Скорость анимации рамки", default: 100, min: 20, max: 400, step: 10, unit: "%", dependsOn: "windowFrame",
        activeWhen: v => v.windowFrame === "rainbow" || v.windowFrame === "breathing", activeHint: "Работает с рамками «Бегущая радуга» и «Дышащая»"
    },
    {
        id: "chatWatermark", cat: "extras", group: "Приколы", kind: "text", label: "Надпись-водяной знак в чате", placeholder: "МАТЯН", default: "", heavy: true,
        desc: "Огромный текст под чатом перерисовывается при прокрутке",
        css: (text, v) => {
            const t = cssSafe(text?.trim() ?? "").replace(/'/g, "\\'");
            if (!t) return "";
            const k = mul(v.watermarkSize);
            const o = Math.min(100, Math.max(0, nz(v.watermarkOpacity, 6)));
            const align = v.watermarkPosition === "top" ? "flex-start" : v.watermarkPosition === "bottom" ? "flex-end" : "center";
            const c1 = col(v.watermarkColor1);
            const c2 = col(v.watermarkColor2, ACCENT2);
            return `${S.messagesWrapper} { position: relative; }
${S.messagesWrapper}::before { content: '${t}'; position: absolute; inset: 0; display: flex; align-items: ${align}; justify-content: center; font-size: clamp(${num(48 * k)}px, ${num(12 * k)}vw, ${num(180 * k)}px); font-weight: 900; letter-spacing: .08em; pointer-events: none; z-index: 0; background: linear-gradient(135deg, ${c1}, ${c2}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; opacity: ${num(o / 100)}; white-space: nowrap; overflow: hidden; }`;
        }
    },
    { id: "watermarkSize", cat: "extras", group: "Приколы", kind: "slider", label: "Размер водяного знака", default: 100, min: 20, max: 300, step: 5, unit: "%", dependsOn: "chatWatermark" },
    { id: "watermarkOpacity", cat: "extras", group: "Приколы", kind: "slider", label: "Заметность водяного знака", default: 6, min: 1, max: 60, unit: "%", dependsOn: "chatWatermark" },
    { id: "watermarkColor1", cat: "extras", group: "Приколы", kind: "color", label: "Первый цвет водяного знака", desc: "Пусто — цвета акцентов темы", default: "", dependsOn: "chatWatermark" },
    { id: "watermarkColor2", cat: "extras", group: "Приколы", kind: "color", label: "Второй цвет водяного знака", default: "", dependsOn: "chatWatermark" },
    {
        id: "watermarkPosition", cat: "extras", group: "Приколы", kind: "select", label: "Где рисовать водяной знак", default: "center", dependsOn: "chatWatermark",
        options: [{ value: "center", label: "По центру" }, { value: "top", label: "Сверху" }, { value: "bottom", label: "Снизу" }]
    },
    { id: "partyMode", cat: "extras", group: "Приколы", kind: "toggle", label: "Режим вечеринки", desc: "Все цвета окна медленно переливаются", default: false, heavy: true },
    {
        id: "partySpeed", cat: "extras", group: "Приколы", kind: "slider", label: "Полный круг цветов за", default: 12, min: 2, max: 90, unit: " с", dependsOn: "partyMode",
        // build.ts hard-codes `animation: vv-party 12s` on #app-mount and nothing else animates that element,
        // so an !important duration is enough to retime it without touching the shared rule
        css: (s, v) => v.partyMode && !v.perfMode && nz(s, 12) !== 12 && `${S.appMount} { animation-duration: ${nz(s, 12)}s !important; }`
    },
    { id: "grayscale", cat: "extras", group: "Приколы", kind: "slider", label: "Чёрно-белый режим", default: 0, min: 0, max: 100, unit: "%", heavy: true, filter: g => g > 0 && `grayscale(${nz(g, 0) / 100})` },
    { id: "invertMode", cat: "extras", group: "Приколы", kind: "toggle", label: "Инверсия цветов", desc: "Быстрая «светлая тема» из тёмной (картинки тоже инвертируются)", default: false, heavy: true, filter: on => on && "invert(0.92) hue-rotate(180deg)" },
    { id: "upsideDown", cat: "extras", group: "Приколы", kind: "toggle", label: "Перевернуть чат вверх ногами", desc: "Для розыгрыша", default: false, css: on => on && `${S.chatContent} { transform: rotate(180deg); }` },
    { id: "comicSans", cat: "extras", group: "Приколы", kind: "toggle", label: "Comic Sans везде", default: false, css: on => on && "* { font-family: 'Comic Sans MS', 'Comic Neue', cursive !important; }" },

    /* ---------- control ---------- */
    {
        id: "lang", cat: "extras", group: "Управление", kind: "select", label: "Язык настроек", desc: "Language of this settings panel",
        default: "ru", options: [{ value: "ru", label: "Русский" }, { value: "en", label: "English" }]
    },
    { id: "panicHotkey", cat: "extras", group: "Управление", kind: "toggle", label: "Ctrl+Alt+V: быстро выключить и включить все эффекты", default: true },
    {
        id: "pauseAnimUnfocused", cat: "extras", group: "Управление", kind: "toggle", default: true,
        label: "Останавливать анимации, когда окно не в фокусе",
        desc: "Пока Discord позади другого окна, ничего не перерисовывается"
    },
    { id: "perfMode", cat: "extras", group: "Управление", kind: "toggle", label: "Режим экономии", desc: "Выключает частицы, анимации, размытия и счётчик FPS, оставляет цвета и часы", default: false }
];
