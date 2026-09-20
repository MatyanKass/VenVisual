/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, Feature, mixAccent, normalizeHex, Values } from "../registry";
import { S } from "../selectors";

/** css number: at most 4 decimals, no trailing zeros, ".5" like the hand-written values */
const num = (x: number) => {
    if (!Number.isFinite(x)) return "0";
    const s = String(Number(x.toFixed(4)));
    if (s.startsWith("0.")) return s.slice(1);
    if (s.startsWith("-0.")) return "-" + s.slice(2);
    return s;
};

/** slider value with a fallback, so a missing or broken value never reaches the css */
const numberOr = (val: unknown, fallback: number) => (typeof val === "number" && Number.isFinite(val) ? val : fallback);
/** whole pixels, never negative */
const pxOr = (val: unknown, fallback: number) => Math.max(0, Math.round(numberOr(val, fallback)));
/** color-mix percentage, rounded and clamped to 0..100 */
const pctOr = (val: unknown, fallback: number) => Math.max(0, Math.min(100, Math.round(numberOr(val, fallback))));

const toggle = (id: string, group: string, label: string, def: boolean, css: string | ((v: Values) => string), desc?: string, heavy?: boolean): Feature =>
    ({ id, cat: "messages", group, kind: "toggle", label, desc, heavy, default: def, css: (on, v) => on && (typeof css === "string" ? css : css(v)) });

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

/** mention styles that draw the ::before stripe in a flat color (rainbow paints its own) */
const MENTION_PLAIN = new Set(["accent", "pulse"]);

const KW_STYLES = [
    { value: "stripe", label: "Полоска слева и лёгкая заливка" },
    { value: "bg", label: "Заливка фона" },
    { value: "border", label: "Рамка" },
    { value: "glow", label: "Свечение" }
];

export const messageFeatures: Feature[] = [
    /* ---------- look ---------- */
    toggle("msgHover", "Вид сообщений", "Подсветка сообщения при наведении", true, v => {
        const c = normalizeHex(v.msgHoverColor) ?? ACCENT;
        return `${S.message} { transition: background-color var(--vv-speed) ease !important; }
${S.message}:hover { background-color: ${mixAccent(pctOr(v.msgHoverTint, 6), c)} !important; --vv-ms-hover: inset 2px 0 0 ${c}; }`;
    }),
    { id: "msgHoverColor", cat: "messages", group: "Вид сообщений", kind: "color", label: "Цвет подсветки сообщения", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "msgHover" },
    { id: "msgHoverTint", cat: "messages", group: "Вид сообщений", kind: "slider", label: "Плотность подсветки сообщения", default: 6, min: 0, max: 40, unit: "%", dependsOn: "msgHover" },
    toggle("msgBubbles", "Вид сообщений", "Сообщения карточками", false, v => {
        const bg = normalizeHex(v.msgBubbleColor) ?? "var(--background-surface-high, #2b2d31)";
        const m = pxOr(v.msgBubbleMargin, 12);
        // left margin is a bit smaller than the right one, as in the stock 2px 12px 2px 8px
        return `${S.message} { background: color-mix(in srgb, ${bg} ${pctOr(v.msgBubbleOpacity, 45)}%, transparent); margin: 2px ${m}px 2px ${Math.round(m * 2 / 3)}px !important; border-radius: var(--vv-radius, 10px); }
${S.messageGroupStart} { margin-top: 10px !important; }`;
    },
        "Каждое сообщение на полупрозрачной подложке со скруглением"),
    { id: "msgBubbleColor", cat: "messages", group: "Вид сообщений", kind: "color", label: "Цвет подложки карточек", desc: "Пусто — цвет поверхности темы", default: "", dependsOn: "msgBubbles" },
    { id: "msgBubbleOpacity", cat: "messages", group: "Вид сообщений", kind: "slider", label: "Плотность подложки", default: 45, min: 0, max: 100, step: 5, unit: "%", dependsOn: "msgBubbles" },
    { id: "msgBubbleMargin", cat: "messages", group: "Вид сообщений", kind: "slider", label: "Отступы карточек по краям", default: 12, min: 0, max: 40, unit: " px", dependsOn: "msgBubbles" },
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
        css: (mode, v) => {
            if (mode === "off") return "";
            const g1 = normalizeHex(v.mentionColor1) ?? ACCENT2;
            const g2 = normalizeHex(v.mentionColor2) ?? ACCENT;
            const stripe = normalizeHex(v.mentionStripeColor) ?? ACCENT2;
            const base = `${S.mentioned} { background: linear-gradient(90deg, ${mixAccent(22, g1)}, ${mixAccent(4, g2)}) !important; } ${S.mentioned}::before { background: ${stripe} !important; width: 3px !important; }`;
            // the glow lives on its own layer and only its opacity animates: animating the blurred
            // shadow itself repaints every mentioned message in the loaded history, every frame
            if (mode === "pulse") return `${base} @keyframes vv-mention { 0%,100% { opacity: 0; } 50% { opacity: 1; } }
${S.mentioned} { position: relative; }
${S.mentioned}::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 ${pxOr(v.mentionGlow, 22)}px ${mixAccent(30, g1)}; animation: vv-mention ${num(Math.max(0.2, numberOr(v.mentionPulseSpeed, 2.2)))}s ease-in-out infinite; }`;
            if (mode === "rainbow") return `${base} @keyframes vv-rainbow-bg { to { background-position: 0 200%; } } ${S.mentioned}::before { background: linear-gradient(180deg, #ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d) !important; background-size: 100% 200% !important; animation: vv-rainbow-bg 2s linear infinite; }`;
            return base;
        }
    },
    { id: "mentionColor1", cat: "messages", group: "Вид сообщений", kind: "color", label: "Упоминание: цвет слева", default: "", dependsOn: "mentionStyle", activeWhen: v => v.mentionStyle !== "off", activeHint: "Работает со всеми стилями, кроме «Как в Discord»" },
    { id: "mentionColor2", cat: "messages", group: "Вид сообщений", kind: "color", label: "Упоминание: цвет справа", default: "", dependsOn: "mentionStyle", activeWhen: v => v.mentionStyle !== "off", activeHint: "Работает со всеми стилями, кроме «Как в Discord»" },
    { id: "mentionStripeColor", cat: "messages", group: "Вид сообщений", kind: "color", label: "Упоминание: цвет полоски", default: "", dependsOn: "mentionStyle", activeWhen: v => MENTION_PLAIN.has(v.mentionStyle), activeHint: "У радужной полоски свои цвета" },
    { id: "mentionGlow", cat: "messages", group: "Вид сообщений", kind: "slider", label: "Упоминание: сила свечения", default: 22, min: 0, max: 60, unit: " px", dependsOn: "mentionStyle", activeWhen: v => v.mentionStyle === "pulse", activeHint: "Работает со стилем «Пульсирующее свечение»" },
    { id: "mentionPulseSpeed", cat: "messages", group: "Вид сообщений", kind: "slider", label: "Упоминание: длительность пульса", default: 2.2, min: 0.6, max: 6, step: 0.2, unit: " с", dependsOn: "mentionStyle", activeWhen: v => v.mentionStyle === "pulse", activeHint: "Работает со стилем «Пульсирующее свечение»" },
    toggle("hideChatAvatars", "Вид сообщений", "Скрыть аватарки в чате", false,
        `${S.chatAvatar} { display: none !important; } ${S.message} [class*="contents_"] { padding-left: 0 !important; }`),
    toggle("attachmentHighlight", "Вид сообщений", "Отмечать сообщения с картинками и файлами", false,
        v => `${S.messageLi}[data-vv-att] > [class*="message_"] { --vv-ms-att: inset 2px 0 0 ${normalizeHex(v.attachmentColor) ?? ACCENT2}; }`),
    { id: "attachmentColor", cat: "messages", group: "Вид сообщений", kind: "color", label: "Цвет метки вложений", default: "", dependsOn: "attachmentHighlight" },
    toggle("linkMsgHighlight", "Вид сообщений", "Отмечать сообщения со ссылками", false,
        v => `${S.messageLi}[data-vv-link] > [class*="message_"] { --vv-ms-link: inset 4px 0 0 ${normalizeHex(v.linkMsgColor) ?? `color-mix(in srgb, ${ACCENT} 60%, ${ACCENT2})`}; }`),
    { id: "linkMsgColor", cat: "messages", group: "Вид сообщений", kind: "color", label: "Цвет метки ссылок", default: "", dependsOn: "linkMsgHighlight" },

    /* ---------- text ---------- */
    { id: "msgFontScale", cat: "messages", group: "Текст", kind: "slider", label: "Размер текста сообщений", default: 100, min: 70, max: 150, unit: "%", css: val => numberOr(val, 100) !== 100 && `${S.messageContent} { font-size: calc(1rem * ${numberOr(val, 100) / 100}) !important; }` },
    { id: "msgLineHeight", cat: "messages", group: "Текст", kind: "slider", label: "Межстрочный интервал", default: 138, min: 100, max: 200, unit: "%", css: val => numberOr(val, 138) !== 138 && `${S.messageContent} { line-height: ${numberOr(val, 138) / 100} !important; }` },
    { id: "msgLetterSpacing", cat: "messages", group: "Текст", kind: "slider", label: "Расстояние между буквами", default: 0, min: -1, max: 3, step: 0.1, unit: " px", css: val => numberOr(val, 0) !== 0 && `${S.messageContent} { letter-spacing: ${numberOr(val, 0)}px; }` },
    { id: "msgSpacing", cat: "messages", group: "Текст", kind: "slider", label: "Отступ между группами сообщений", default: 16, min: 0, max: 40, unit: " px", css: val => numberOr(val, 16) !== 16 && `${S.messageGroupStart} { margin-top: ${numberOr(val, 16)}px !important; }` },
    toggle("msgTextGlow", "Текст", "Лёгкое свечение текста", false,
        v => `${S.messageContent} { text-shadow: 0 0 ${pxOr(v.msgGlowBlur, 4)}px ${mixAccent(pctOr(v.msgGlowStrength, 35), normalizeHex(v.msgGlowColor) ?? ACCENT)}; }`,
        "Тень у всего текста чата: заметно дороже при прокрутке", true),
    { id: "msgGlowColor", cat: "messages", group: "Текст", kind: "color", label: "Цвет свечения текста", default: "", dependsOn: "msgTextGlow" },
    { id: "msgGlowBlur", cat: "messages", group: "Текст", kind: "slider", label: "Размытие свечения текста", default: 4, min: 1, max: 16, unit: " px", dependsOn: "msgTextGlow" },
    { id: "msgGlowStrength", cat: "messages", group: "Текст", kind: "slider", label: "Плотность свечения текста", default: 35, min: 5, max: 100, step: 5, unit: "%", dependsOn: "msgTextGlow" },
    toggle("timestampsAlways", "Текст", "Время у каждого сообщения всегда видно", false, `${S.timestampHover} { opacity: 1 !important; }`),
    toggle("timestampAccent", "Текст", "Время цветом акцента", false,
        v => `${S.timestamp}, ${S.timestamp} time { color: ${mixAccent(80, normalizeHex(v.timestampColor) ?? ACCENT)} !important; }`),
    { id: "timestampColor", cat: "messages", group: "Текст", kind: "color", label: "Цвет времени", default: "", dependsOn: "timestampAccent" },
    toggle("editedAccent", "Текст", "Метка «изменено» цветом акцента", false,
        v => `${S.edited} { color: ${normalizeHex(v.editedColor) ?? ACCENT2} !important; font-style: italic; }`),
    { id: "editedColor", cat: "messages", group: "Текст", kind: "color", label: "Цвет метки «изменено»", default: "", dependsOn: "editedAccent" },

    /* ---------- markdown ---------- */
    toggle("linkUnderline", "Разметка", "Анимированное подчёркивание ссылок", true,
        `${S.anchor} { text-decoration: none !important; background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2}) left bottom / 0% 2px no-repeat; transition: background-size var(--vv-speed) var(--vv-ease); }
${S.anchor}:hover { background-size: 100% 2px; }`),
    toggle("mentionInlineGlow", "Разметка", "Упоминания (@ник) с градиентом", true,
        `${S.mentionInline} { background: linear-gradient(90deg, ${mixAccent(30)}, ${mixAccent(25, ACCENT2)}) !important; color: var(--text-strong, #fff) !important; border-radius: 4px; transition: box-shadow var(--vv-speed) ease; }
${S.mentionInline}:hover { box-shadow: 0 0 10px ${mixAccent(55)}; }`),
    toggle("codeBlockStyle", "Разметка", "Красивые блоки кода", true, v => {
        const c = normalizeHex(v.codeBlockColor) ?? ACCENT;
        return `${S.codeBlock} { border: 1px solid ${mixAccent(35, c)} !important; border-radius: 10px !important; box-shadow: 0 0 ${pxOr(v.codeBlockGlow, 18)}px ${mixAccent(12, c)}, inset 0 0 0 1px ${mixAccent(8, c)}; }
${S.codeBlock} code { border: none !important; background: color-mix(in srgb, var(--background-base-lowest, #111) 80%, transparent) !important; }`;
    }),
    { id: "codeBlockColor", cat: "messages", group: "Разметка", kind: "color", label: "Цвет рамки блоков кода", default: "", dependsOn: "codeBlockStyle" },
    { id: "codeBlockGlow", cat: "messages", group: "Разметка", kind: "slider", label: "Свечение блоков кода", default: 18, min: 0, max: 40, unit: " px", dependsOn: "codeBlockStyle" },
    toggle("inlineCodeAccent", "Разметка", "Короткий `код` цветом акцента", true, v => {
        const c = normalizeHex(v.inlineCodeColor) ?? ACCENT;
        const glow = pxOr(v.inlineCodeGlow, 0);
        return `${S.inlineCode} { color: ${c} !important; background: ${mixAccent(12, c)} !important; border: 1px solid ${mixAccent(25, c)} !important; border-radius: 5px !important;${glow ? ` box-shadow: 0 0 ${glow}px ${mixAccent(45, c)};` : ""} }`;
    }),
    { id: "inlineCodeColor", cat: "messages", group: "Разметка", kind: "color", label: "Цвет короткого кода", default: "", dependsOn: "inlineCodeAccent" },
    { id: "inlineCodeGlow", cat: "messages", group: "Разметка", kind: "slider", label: "Свечение короткого кода", default: 0, min: 0, max: 20, unit: " px", dependsOn: "inlineCodeAccent" },
    toggle("blockquoteGradient", "Разметка", "Цитаты с градиентной полоской", true, v => {
        const c1 = normalizeHex(v.blockquoteColor) ?? ACCENT;
        const c2 = normalizeHex(v.blockquoteColor2) ?? ACCENT2;
        return `${S.blockquote} { background: linear-gradient(180deg, ${c1}, ${c2}) !important; box-shadow: 0 0 8px ${mixAccent(40, c1)}; }`;
    }),
    { id: "blockquoteColor", cat: "messages", group: "Разметка", kind: "color", label: "Цитата: цвет сверху", default: "", dependsOn: "blockquoteGradient" },
    { id: "blockquoteColor2", cat: "messages", group: "Разметка", kind: "color", label: "Цитата: цвет снизу", default: "", dependsOn: "blockquoteGradient" },
    toggle("replySpineAccent", "Разметка", "Линия ответа цветом акцента", true,
        v => `${S.reply}::before { border-color: ${mixAccent(70, normalizeHex(v.replyLineColor) ?? ACCENT)} !important; }`),
    { id: "replyLineColor", cat: "messages", group: "Разметка", kind: "color", label: "Цвет линии ответа", default: "", dependsOn: "replySpineAccent" },
    toggle("spoilerGlass", "Разметка", "Спойлеры как матовое стекло", false,
        `${S.spoiler} { background: repeating-linear-gradient(45deg, ${mixAccent(25)} 0 6px, ${mixAccent(12, ACCENT2)} 6px 12px) !important; border-radius: 6px; }`),
    toggle("botTagGradient", "Разметка", "Метка BOT с градиентом", true,
        `${S.botTag} { background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2}) !important; }`),

    /* ---------- media ---------- */
    toggle("embedAccent", "Вложения и медиа", "Эмбеды с градиентной рамкой", true,
        `${S.embed} { border-left: 4px solid !important; border-image: linear-gradient(180deg, ${ACCENT}, ${ACCENT2}) 1 !important; box-shadow: 0 6px 20px rgba(0,0,0,.25); }`),
    toggle("imageHoverZoom", "Вложения и медиа", "Картинки увеличиваются при наведении", true, v => {
        const zoom = num(Math.max(100, Math.min(200, numberOr(v.imageZoom, 102))) / 100);
        return `${S.image} { transition: transform var(--vv-speed) var(--vv-ease), box-shadow var(--vv-speed) ease !important; }
${S.image}:hover { transform: scale(${zoom}); box-shadow: 0 8px 28px ${mixAccent(35, normalizeHex(v.imageGlowColor) ?? ACCENT)}; z-index: 1; }`;
    }),
    { id: "imageZoom", cat: "messages", group: "Вложения и медиа", kind: "slider", label: "Насколько увеличиваются картинки", default: 102, min: 100, max: 130, unit: "%", dependsOn: "imageHoverZoom" },
    { id: "imageGlowColor", cat: "messages", group: "Вложения и медиа", kind: "color", label: "Цвет тени под картинкой", default: "", dependsOn: "imageHoverZoom" },
    toggle("emojiHoverScale", "Вложения и медиа", "Эмодзи увеличиваются при наведении", true,
        `${S.emoji} { transition: transform var(--vv-speed) var(--vv-ease) !important; } ${S.emoji}:hover { transform: scale(1.45); }`),
    toggle("jumboWiggle", "Вложения и медиа", "Большие эмодзи покачиваются", false,
        `@keyframes vv-jumbo { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-8deg) scale(1.05); } 75% { transform: rotate(8deg) scale(1.05); } }
${S.jumboEmoji}:hover { animation: vv-jumbo .6s ease-in-out infinite; }`),
    toggle("reactionPop", "Вложения и медиа", "Реакции выпрыгивают при наведении", true, v => {
        const lift = Math.max(0, Math.round(numberOr(v.reactionLift, 2)));
        return `${S.reaction} { transition: transform var(--vv-speed) var(--vv-ease), box-shadow var(--vv-speed) ease !important; }
${S.reaction}:hover { transform: translateY(${num(-lift)}px) scale(1.08); box-shadow: 0 4px 12px ${mixAccent(35)}; }`;
    }),
    { id: "reactionLift", cat: "messages", group: "Вложения и медиа", kind: "slider", label: "Насколько подпрыгивают реакции", default: 2, min: 0, max: 8, unit: " px", dependsOn: "reactionPop" },
    toggle("reactionMeGlow", "Вложения и медиа", "Свои реакции светятся", true, v => {
        const c = normalizeHex(v.reactionMeColor) ?? ACCENT;
        return `${S.reactionMe} { box-shadow: 0 0 ${pxOr(v.reactionMeGlowSize, 10)}px ${mixAccent(45, c)}, inset 0 0 0 1px ${c} !important; }`;
    }),
    { id: "reactionMeColor", cat: "messages", group: "Вложения и медиа", kind: "color", label: "Цвет свечения своих реакций", default: "", dependsOn: "reactionMeGlow" },
    { id: "reactionMeGlowSize", cat: "messages", group: "Вложения и медиа", kind: "slider", label: "Сила свечения своих реакций", default: 10, min: 0, max: 30, unit: " px", dependsOn: "reactionMeGlow" },

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
            const s = pctOr(v.kwStrength, 22);
            const row = `${S.messageLi}[data-vv-kw] > [class*="message_"]`;
            // background-image only, so the hover background-color still shows through
            switch (v.kwStyle) {
                case "bg": return `${row} { background-image: linear-gradient(90deg, ${mixAccent(s, c)}, ${mixAccent(Math.round(s / 3), c)} 80%) !important; }`;
                case "border": return `${row} { --vv-ms-kw: inset 0 0 0 2px ${mixAccent(Math.min(100, s * 3), c)}; }`;
                case "glow": return `${row} { --vv-ms-kw: 0 0 ${Math.max(2, Math.round(s * 0.8))}px ${mixAccent(Math.min(100, s * 2), c)}; }`;
                default: return `${row} { background-image: linear-gradient(90deg, ${mixAccent(s, c)}, transparent 70%) !important; --vv-ms-kw: inset 3px 0 0 ${c}; }`;
            }
        }
    },
    { id: "kwStyle", cat: "messages", group: "Ключевые слова", kind: "select", label: "Как выделять", default: "stripe", options: KW_STYLES, dependsOn: "kwEnabled" },
    { id: "kwStrength", cat: "messages", group: "Ключевые слова", kind: "slider", label: "Сила выделения", default: 22, min: 0, max: 60, unit: "%", dependsOn: "kwEnabled" }
];
