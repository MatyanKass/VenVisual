/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, cssSafe, Feature, mixAccent } from "../registry";
import { S } from "../selectors";

const blurUntilHover = (id: string, label: string, selector: string, amount = 6): Feature => ({
    id, cat: "extras", group: "Приватность (для стримов и скриншотов)", kind: "toggle", label, default: false,
    css: on => on && `${selector} { filter: blur(${amount}px); transition: filter var(--vv-speed) ease !important; } ${selector.split(",").map(s => `${s.trim()}:hover`).join(", ")} { filter: none; }`
});

export const extraFeatures: Feature[] = [
    /* ---------- widgets (fx/widgets.ts) ---------- */
    { id: "clock", cat: "extras", group: "Виджеты", kind: "toggle", label: "Часы поверх окна", default: false },
    { id: "clockSeconds", cat: "extras", group: "Виджеты", kind: "toggle", label: "Показывать секунды", default: false, dependsOn: "clock" },
    { id: "clockDate", cat: "extras", group: "Виджеты", kind: "toggle", label: "Показывать дату", default: false, dependsOn: "clock" },
    { id: "sessionTimer", cat: "extras", group: "Виджеты", kind: "toggle", label: "Сколько ты сегодня сидишь в Discord", desc: "Таймер с момента запуска", default: false },
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

    /* ---------- privacy ---------- */
    blurUntilHover("blurMessages", "Размывать текст сообщений до наведения", S.messageContent, 5),
    blurUntilHover("blurNames", "Размывать ники до наведения", `${S.username}, ${S.membersWrap} [class*="nameAndDecorators_"]`, 5),
    blurUntilHover("blurAvatars", "Размывать аватарки до наведения", `${S.chatAvatar}, ${S.memberAvatar}`, 8),
    blurUntilHover("blurImages", "Размывать картинки до наведения", `${S.image}, ${S.embed} img, ${S.embed} video`, 18),
    blurUntilHover("blurDMList", "Размывать список ЛС до наведения", `${S.dm} [class*="content_"], ${S.dm} [class*="avatar_"]`, 6),

    /* ---------- fun ---------- */
    {
        id: "windowFrame", cat: "extras", group: "Приколы", kind: "select", label: "Светящаяся рамка окна", default: "none", heavy: true,
        desc: "Анимированные рамки перерисовывают всё окно",
        options: [{ value: "none", label: "Нет" }, { value: "accent", label: "Цвет акцента" }, { value: "rainbow", label: "Бегущая радуга" }, { value: "breathing", label: "Дышащая" }],
        css: mode => {
            if (mode === "none") return "";
            const base = "body::after";
            const frame = "content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 2147482000; border-radius: 0;";
            if (mode === "accent") return `${base} { ${frame} box-shadow: inset 0 0 0 1px ${mixAccent(80)}, inset 0 0 22px ${mixAccent(35)}; }`;
            // both animate a compositor-friendly property (opacity / hue-rotate) over a frame that is
            // painted once, instead of re-painting a full-window box-shadow or conic gradient every frame
            if (mode === "breathing") return `@keyframes vv-breathe { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
${base} { ${frame} box-shadow: inset 0 0 0 2px ${ACCENT2}, inset 0 0 32px ${mixAccent(45, ACCENT2)}; animation: vv-breathe 4s ease-in-out infinite; will-change: opacity; }`;
            return `@keyframes vv-frame-hue { to { filter: hue-rotate(360deg); } }
${base} { ${frame} padding: 2px; background: conic-gradient(#ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: vv-frame-hue 6s linear infinite; will-change: filter; }`;
        }
    },
    {
        id: "chatWatermark", cat: "extras", group: "Приколы", kind: "text", label: "Надпись-водяной знак в чате", placeholder: "МАТЯН", default: "", heavy: true,
        desc: "Огромный текст под чатом перерисовывается при прокрутке",
        css: text => {
            const t = cssSafe(text?.trim() ?? "").replace(/'/g, "\\'");
            return t && `${S.messagesWrapper} { position: relative; }
${S.messagesWrapper}::before { content: '${t}'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(48px, 12vw, 180px); font-weight: 900; letter-spacing: .08em; pointer-events: none; z-index: 0; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT2}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; opacity: .06; white-space: nowrap; overflow: hidden; }`;
        }
    },
    { id: "partyMode", cat: "extras", group: "Приколы", kind: "toggle", label: "Режим вечеринки", desc: "Все цвета окна медленно переливаются", default: false, heavy: true },
    { id: "grayscale", cat: "extras", group: "Приколы", kind: "slider", label: "Чёрно-белый режим", default: 0, min: 0, max: 100, unit: "%", heavy: true, filter: g => g > 0 && `grayscale(${g / 100})` },
    { id: "invertMode", cat: "extras", group: "Приколы", kind: "toggle", label: "Инверсия цветов", desc: "Быстрая «светлая тема» из тёмной (картинки тоже инвертируются)", default: false, heavy: true, filter: on => on && "invert(0.92) hue-rotate(180deg)" },
    { id: "upsideDown", cat: "extras", group: "Приколы", kind: "toggle", label: "Перевернуть чат вверх ногами", desc: "Для розыгрыша", default: false, css: on => on && `${S.chatContent} { transform: rotate(180deg); }` },
    { id: "comicSans", cat: "extras", group: "Приколы", kind: "toggle", label: "Comic Sans везде", default: false, css: on => on && "* { font-family: 'Comic Sans MS', 'Comic Neue', cursive !important; }" },

    /* ---------- control ---------- */
    { id: "panicHotkey", cat: "extras", group: "Управление", kind: "toggle", label: "Ctrl+Alt+V: быстро выключить и включить все эффекты", default: true },
    {
        id: "pauseAnimUnfocused", cat: "extras", group: "Управление", kind: "toggle", default: true,
        label: "Останавливать анимации, когда окно не в фокусе",
        desc: "Пока Discord позади другого окна, ничего не перерисовывается"
    },
    { id: "perfMode", cat: "extras", group: "Управление", kind: "toggle", label: "Режим экономии", desc: "Выключает частицы, анимации, размытия и счётчик FPS, оставляет цвета и часы", default: false }
];
