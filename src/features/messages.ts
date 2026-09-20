/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, Feature, mixAccent, normalizeHex, Values } from "../registry";
import { S } from "../selectors";

const toggle = (id: string, group: string, label: string, def: boolean, css: string, desc?: string, heavy?: boolean): Feature =>
    ({ id, cat: "messages", group, kind: "toggle", label, desc, heavy, default: def, css: on => on && css });

/**
 * Several features mark a message with a stripe / glow. Instead of each one overwriting box-shadow,
 * they set their own variable and this single rule layers them (first = on top).
 */
export function messageShadowCss(v: Values): string {
    const used = v.msgHover || v.attachmentHighlight || v.linkMsgHighlight || v.kwEnabled;
    if (!used) return "";
    const none = "0 0 #0000";
    return `${S.message} { box-shadow: var(--vv-ms-hover, ${none}), var(--vv-ms-att, ${none}), var(--vv-ms-kw, ${none}), var(--vv-ms-link, ${none}) !important; }`;
}

export const messageFeatures: Feature[] = [
    /* ---------- look ---------- */
    toggle("msgHover", "Вид сообщений", "Подсветка сообщения при наведении", true,
        `${S.message} { transition: background-color var(--vv-speed) ease !important; }
${S.message}:hover { background-color: ${mixAccent(6)} !important; --vv-ms-hover: inset 2px 0 0 ${ACCENT}; }`),
    toggle("msgBubbles", "Вид сообщений", "Сообщения карточками", false,
        `${S.message} { background: color-mix(in srgb, var(--background-surface-high, #2b2d31) 45%, transparent); margin: 2px 12px 2px 8px !important; border-radius: var(--vv-radius, 10px); }
${S.messageGroupStart} { margin-top: 10px !important; }`,
        "Каждое сообщение на полупрозрачной подложке со скруглением"),
    {
        id: "msgAppear", cat: "messages", group: "Вид сообщений", kind: "select", label: "Появление новых сообщений", desc: "Анимируются только что пришедшие сообщения, прокрутка истории — нет", default: "slide",
        options: [
            { value: "off", label: "Без анимации" },
            { value: "fade", label: "Проявление" },
            { value: "slide", label: "Выезд снизу" },
            { value: "side", label: "Выезд сбоку" },
            { value: "pop", label: "Выпрыгивание" },
            { value: "blur", label: "Из размытия" }
        ],
        css: mode => {
            const frames: Record<string, string> = {
                fade: "from { opacity: 0; }",
                slide: "from { opacity: 0; transform: translateY(8px); }",
                side: "from { opacity: 0; transform: translateX(-16px); }",
                pop: "from { opacity: 0; transform: scale(.94); } 60% { transform: scale(1.01); }",
                blur: "from { opacity: 0; filter: blur(6px); }"
            };
            // fill "backwards": nothing is kept after the entry animation, so opacity / transform from other features still apply
            return frames[mode] && `@keyframes vv-msg-in { ${frames[mode]} }
${S.messageLi}[data-vv-new] { animation: vv-msg-in calc(var(--vv-speed) * 1.5) var(--vv-ease) backwards; }`;
        }
    },
    {
        id: "mentionStyle", cat: "messages", group: "Вид сообщений", kind: "select", label: "Сообщения с упоминанием тебя", default: "accent", heavy: true,
        desc: "Пульс и радуга анимируются на каждом таком сообщении в истории",
        options: [
            { value: "off", label: "Как в Discord" },
            { value: "accent", label: "Градиент цветом акцента" },
            { value: "pulse", label: "Пульсирующее свечение" },
            { value: "rainbow", label: "Радужная полоска" }
        ],
        css: mode => {
            if (mode === "off") return "";
            const base = `${S.mentioned} { background: linear-gradient(90deg, ${mixAccent(22, ACCENT2)}, ${mixAccent(4)}) !important; } ${S.mentioned}::before { background: ${ACCENT2} !important; width: 3px !important; }`;
            // the glow lives on its own layer and only its opacity animates: animating the blurred
            // shadow itself repaints every mentioned message in the loaded history, every frame
            if (mode === "pulse") return `${base} @keyframes vv-mention { 0%,100% { opacity: 0; } 50% { opacity: 1; } }
${S.mentioned} { position: relative; }
${S.mentioned}::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 22px ${mixAccent(30, ACCENT2)}; animation: vv-mention 2.2s ease-in-out infinite; }`;
            if (mode === "rainbow") return `${base} @keyframes vv-rainbow-bg { to { background-position: 0 200%; } } ${S.mentioned}::before { background: linear-gradient(180deg, #ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d) !important; background-size: 100% 200% !important; animation: vv-rainbow-bg 2s linear infinite; }`;
            return base;
        }
    },
    toggle("hideChatAvatars", "Вид сообщений", "Скрыть аватарки в чате", false,
        `${S.chatAvatar} { display: none !important; } ${S.message} [class*="contents_"] { padding-left: 0 !important; }`),
    toggle("attachmentHighlight", "Вид сообщений", "Отмечать сообщения с картинками и файлами", false,
        `${S.messageLi}[data-vv-att] > [class*="message_"] { --vv-ms-att: inset 2px 0 0 ${ACCENT2}; }`),
    toggle("linkMsgHighlight", "Вид сообщений", "Отмечать сообщения со ссылками", false,
        `${S.messageLi}[data-vv-link] > [class*="message_"] { --vv-ms-link: inset 4px 0 0 color-mix(in srgb, ${ACCENT} 60%, ${ACCENT2}); }`),

    /* ---------- text ---------- */
    { id: "msgFontScale", cat: "messages", group: "Текст", kind: "slider", label: "Размер текста сообщений", default: 100, min: 70, max: 150, unit: "%", css: val => val !== 100 && `${S.messageContent} { font-size: calc(1rem * ${val / 100}) !important; }` },
    { id: "msgLineHeight", cat: "messages", group: "Текст", kind: "slider", label: "Межстрочный интервал", default: 138, min: 100, max: 200, unit: "%", css: val => val !== 138 && `${S.messageContent} { line-height: ${val / 100} !important; }` },
    { id: "msgLetterSpacing", cat: "messages", group: "Текст", kind: "slider", label: "Расстояние между буквами", default: 0, min: -1, max: 3, step: 0.1, unit: " px", css: val => val !== 0 && `${S.messageContent} { letter-spacing: ${val}px; }` },
    { id: "msgSpacing", cat: "messages", group: "Текст", kind: "slider", label: "Отступ между группами сообщений", default: 16, min: 0, max: 40, unit: " px", css: val => val !== 16 && `${S.messageGroupStart} { margin-top: ${val}px !important; }` },
    toggle("msgTextGlow", "Текст", "Лёгкое свечение текста", false, `${S.messageContent} { text-shadow: 0 0 4px ${mixAccent(35)}; }`, "Тень у всего текста чата: заметно дороже при прокрутке", true),
    toggle("timestampsAlways", "Текст", "Время у каждого сообщения всегда видно", false, `${S.timestampHover} { opacity: 1 !important; }`),
    toggle("timestampAccent", "Текст", "Время цветом акцента", false, `${S.timestamp}, ${S.timestamp} time { color: ${mixAccent(80)} !important; }`),
    toggle("editedAccent", "Текст", "Метка «изменено» цветом акцента", false, `${S.edited} { color: ${ACCENT2} !important; font-style: italic; }`),

    /* ---------- markdown ---------- */
    toggle("linkUnderline", "Разметка", "Анимированное подчёркивание ссылок", true,
        `${S.anchor} { text-decoration: none !important; background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2}) left bottom / 0% 2px no-repeat; transition: background-size var(--vv-speed) var(--vv-ease); }
${S.anchor}:hover { background-size: 100% 2px; }`),
    toggle("mentionInlineGlow", "Разметка", "Упоминания (@ник) с градиентом", true,
        `${S.mentionInline} { background: linear-gradient(90deg, ${mixAccent(30)}, ${mixAccent(25, ACCENT2)}) !important; color: var(--text-strong, #fff) !important; border-radius: 4px; transition: box-shadow var(--vv-speed) ease; }
${S.mentionInline}:hover { box-shadow: 0 0 10px ${mixAccent(55)}; }`),
    toggle("codeBlockStyle", "Разметка", "Красивые блоки кода", true,
        `${S.codeBlock} { border: 1px solid ${mixAccent(35)} !important; border-radius: 10px !important; box-shadow: 0 0 18px ${mixAccent(12)}, inset 0 0 0 1px ${mixAccent(8)}; }
${S.codeBlock} code { border: none !important; background: color-mix(in srgb, var(--background-base-lowest, #111) 80%, transparent) !important; }`),
    toggle("inlineCodeAccent", "Разметка", "Короткий `код` цветом акцента", true,
        `${S.inlineCode} { color: ${ACCENT} !important; background: ${mixAccent(12)} !important; border: 1px solid ${mixAccent(25)} !important; border-radius: 5px !important; }`),
    toggle("blockquoteGradient", "Разметка", "Цитаты с градиентной полоской", true,
        `${S.blockquote} { background: linear-gradient(180deg, ${ACCENT}, ${ACCENT2}) !important; box-shadow: 0 0 8px ${mixAccent(40)}; }`),
    toggle("replySpineAccent", "Разметка", "Линия ответа цветом акцента", true,
        `${S.reply}::before { border-color: ${mixAccent(70)} !important; }`),
    toggle("spoilerGlass", "Разметка", "Спойлеры как матовое стекло", false,
        `${S.spoiler} { background: repeating-linear-gradient(45deg, ${mixAccent(25)} 0 6px, ${mixAccent(12, ACCENT2)} 6px 12px) !important; border-radius: 6px; }`),
    toggle("botTagGradient", "Разметка", "Метка BOT с градиентом", true,
        `${S.botTag} { background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2}) !important; }`),

    /* ---------- media ---------- */
    toggle("embedAccent", "Вложения и медиа", "Эмбеды с градиентной рамкой", true,
        `${S.embed} { border-left: 4px solid !important; border-image: linear-gradient(180deg, ${ACCENT}, ${ACCENT2}) 1 !important; box-shadow: 0 6px 20px rgba(0,0,0,.25); }`),
    toggle("imageHoverZoom", "Вложения и медиа", "Картинки увеличиваются при наведении", true,
        `${S.image} { transition: transform var(--vv-speed) var(--vv-ease), box-shadow var(--vv-speed) ease !important; }
${S.image}:hover { transform: scale(1.02); box-shadow: 0 8px 28px ${mixAccent(35)}; z-index: 1; }`),
    toggle("emojiHoverScale", "Вложения и медиа", "Эмодзи увеличиваются при наведении", true,
        `${S.emoji} { transition: transform var(--vv-speed) var(--vv-ease) !important; } ${S.emoji}:hover { transform: scale(1.45); }`),
    toggle("jumboWiggle", "Вложения и медиа", "Большие эмодзи покачиваются", false,
        `@keyframes vv-jumbo { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-8deg) scale(1.05); } 75% { transform: rotate(8deg) scale(1.05); } }
${S.jumboEmoji}:hover { animation: vv-jumbo .6s ease-in-out infinite; }`),
    toggle("reactionPop", "Вложения и медиа", "Реакции выпрыгивают при наведении", true,
        `${S.reaction} { transition: transform var(--vv-speed) var(--vv-ease), box-shadow var(--vv-speed) ease !important; }
${S.reaction}:hover { transform: translateY(-2px) scale(1.08); box-shadow: 0 4px 12px ${mixAccent(35)}; }`),
    toggle("reactionMeGlow", "Вложения и медиа", "Свои реакции светятся", true,
        `${S.reactionMe} { box-shadow: 0 0 10px ${mixAccent(45)}, inset 0 0 0 1px ${ACCENT} !important; }`),

    /* ---------- chat chrome ---------- */
    toggle("systemMsgDim", "Служебное", "Приглушить системные сообщения", false,
        `${S.messageLi}[data-vv-sys] { opacity: .55; transition: opacity var(--vv-speed) ease; } ${S.messageLi}[data-vv-sys]:hover { opacity: 1; }`),
    toggle("newMessagesBarGradient", "Служебное", "Плашка «новые сообщения» градиентом", true,
        `${S.newMessagesBar} { background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2}) !important; box-shadow: 0 4px 16px ${mixAccent(40)} !important; }`),
    toggle("unreadDividerAccent", "Служебное", "Линия непрочитанного цветом акцента", true,
        `${S.unreadDivider} { border-color: ${ACCENT} !important; } ${S.unreadDivider} span, ${S.unreadDivider} [class*="unreadPill_"] { background: ${ACCENT} !important; color: #fff !important; }`),
    toggle("typingAccent", "Служебное", "Индикатор «печатает» цветом акцента", true,
        `${S.typing} circle, ${S.typing} [class*="dot_"] { fill: ${ACCENT} !important; background-color: ${ACCENT} !important; } ${S.typing} strong { color: ${ACCENT} !important; }`),

    /* ---------- keywords (marked by fx/keywords.ts) ---------- */
    { id: "kwEnabled", cat: "messages", group: "Ключевые слова", kind: "toggle", label: "Подсветка сообщений с ключевыми словами", desc: "Сообщения с этими словами выделяются цветом", default: false },
    { id: "kwList", cat: "messages", group: "Ключевые слова", kind: "text", label: "Слова через запятую", placeholder: "матян, стрим, срочно", default: "", dependsOn: "kwEnabled" },
    {
        id: "kwColor", cat: "messages", group: "Ключевые слова", kind: "color", label: "Цвет подсветки слов", default: "#ffd166", dependsOn: "kwEnabled",
        css: (color, v) => {
            if (!v.kwEnabled) return "";
            const c = normalizeHex(color) ?? "#ffd166";
            // background-image only, so the hover background-color still shows through
            return `${S.messageLi}[data-vv-kw] > [class*="message_"] { background-image: linear-gradient(90deg, color-mix(in srgb, ${c} 22%, transparent), transparent 70%) !important; --vv-ms-kw: inset 3px 0 0 ${c}; }`;
        }
    }
];
