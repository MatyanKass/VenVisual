/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, cssSafe, Feature, mixAccent, normalizeHex } from "../registry";
import { S } from "../selectors";

const hide = (id: string, label: string, selector: string, def = false, desc?: string): Feature =>
    ({ id, cat: "interface", group: "Скрыть лишнее", kind: "toggle", label, desc, default: def, css: on => on && `${selector} { display: none !important; }` });

/** "Inter, Nunito" -> "Inter", "Nunito" (each family quoted separately) */
const fontList = (input: unknown) => cssSafe(String(input ?? ""))
    .split(",")
    .map(s => s.trim().replace(/['"]/g, ""))
    .filter(Boolean)
    .map(s => `"${s}"`)
    .join(", ");

/* ---------- guards: a slider / color that is missing or broken must never reach the css ---------- */

/** numeric setting, or the fallback when it is missing / NaN */
const nz = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
/** color override, or the theme color when the user left it empty */
const col = (value: unknown, fallback = ACCENT) => normalizeHex(typeof value === "string" ? value : undefined) ?? fallback;
/** percentage for color-mix(), clamped and rounded so it is always a valid integer */
const pct = (value: number, fallback: number, scale = 1) => {
    const n = Math.round(nz(value, fallback) * scale);
    return Math.min(100, Math.max(0, Number.isFinite(n) ? n : fallback));
};

export const interfaceFeatures: Feature[] = [
    /* ---------- shape & fonts ---------- */
    {
        id: "radius", cat: "interface", group: "Форма и шрифты", kind: "slider", label: "Скругление углов", default: 8, min: 0, max: 28, unit: " px",
        css: (value, v) => {
            const r = nz(value, 8);
            if (!v.radiusSeparate) {
                return `:root { --vv-radius: ${r}px; }
${S.channel}, ${S.dm}, ${S.member} { border-radius: ${Math.min(r, 14)}px !important; }
${S.chatInput} [class*="scrollableContainer_"], ${S.chatInput} > [class*="inner_"] { border-radius: ${r}px !important; }
${S.embed}, ${S.image}, ${S.messageLi} :is([class*="attachment_"], [class*="attachmentContainer_"]), ${S.menu}, ${S.layerContainer} ${S.dialog}, ${S.codeBlock} { border-radius: ${r}px !important; }
${S.message} { border-radius: ${Math.min(r, 12)}px; }`;
            }
            const rp = nz(v.radiusPanels, r);
            const rm = nz(v.radiusMedia, r);
            const rs = nz(v.radiusMessages, r);
            return `:root { --vv-radius: ${r}px; }
${S.channel}, ${S.dm}, ${S.member} { border-radius: ${Math.min(rp, 14)}px !important; }
${S.chatInput} [class*="scrollableContainer_"], ${S.chatInput} > [class*="inner_"] { border-radius: ${rp}px !important; }
${S.menu}, ${S.layerContainer} ${S.dialog} { border-radius: ${rp}px !important; }
${S.embed}, ${S.image}, ${S.messageLi} :is([class*="attachment_"], [class*="attachmentContainer_"]), ${S.codeBlock} { border-radius: ${rm}px !important; }
${S.message} { border-radius: ${Math.min(rs, 12)}px; }`;
        }
    },
    {
        id: "radiusSeparate", cat: "interface", group: "Форма и шрифты", kind: "toggle", default: false,
        label: "Своё скругление для сообщений, панелей и картинок",
        desc: "Пока выключено, всё берёт значение выше"
    },
    { id: "radiusMessages", cat: "interface", group: "Форма и шрифты", kind: "slider", label: "Скругление сообщений", default: 8, min: 0, max: 28, unit: " px", dependsOn: "radiusSeparate" },
    { id: "radiusPanels", cat: "interface", group: "Форма и шрифты", kind: "slider", label: "Скругление панелей, меню и поля ввода", default: 8, min: 0, max: 28, unit: " px", dependsOn: "radiusSeparate" },
    { id: "radiusMedia", cat: "interface", group: "Форма и шрифты", kind: "slider", label: "Скругление картинок, вложений и кода", default: 8, min: 0, max: 28, unit: " px", dependsOn: "radiusSeparate" },
    {
        id: "fontFamily", cat: "interface", group: "Форма и шрифты", kind: "text", label: "Шрифт интерфейса", desc: "Название установленного шрифта, например Inter, Nunito, Comic Sans MS", placeholder: "Inter", default: "",
        css: f => {
            const font = fontList(f);
            return font && `:root, .theme-dark, .theme-light { --font-primary: ${font}, "gg sans", sans-serif !important; --font-display: ${font}, "gg sans", sans-serif !important; --font-headline: ${font}, "gg sans", sans-serif !important; }
body, input, textarea, button { font-family: ${font}, "gg sans", sans-serif; }`;
        }
    },
    {
        id: "codeFont", cat: "interface", group: "Форма и шрифты", kind: "text", label: "Шрифт для кода", placeholder: "JetBrains Mono", default: "",
        css: f => {
            const font = fontList(f);
            return font && `:root, .theme-dark, .theme-light { --font-code: ${font}, Consolas, monospace !important; } code, pre, ${S.inlineCode} { font-family: ${font}, Consolas, monospace !important; }`;
        }
    },
    { id: "animSpeed", cat: "interface", group: "Форма и шрифты", kind: "slider", label: "Длительность всех анимаций", default: 200, min: 60, max: 800, step: 10, unit: " мс" },
    {
        id: "smoothScroll", cat: "interface", group: "Форма и шрифты", kind: "toggle", label: "Плавная прокрутка", desc: "Кроме самого чата: там она мешает подгрузке истории", default: false,
        css: on => on && `${S.scroller}:not(${S.messagesWrapper} *) { scroll-behavior: smooth; }`
    },

    /* ---------- scrollbars ---------- */
    {
        id: "scrollbarStyle", cat: "interface", group: "Полосы прокрутки", kind: "select", label: "Полосы прокрутки", default: "accent",
        options: [
            { value: "default", label: "Как в Discord" },
            { value: "accent", label: "Цветом акцента" },
            { value: "gradient", label: "Градиентные" },
            { value: "hidden", label: "Скрыть" }
        ],
        css: (mode, v) => {
            const w = nz(v.scrollbarWidth, 6);
            if (mode === "default") return "";
            if (mode === "hidden") return `::-webkit-scrollbar { width: 0 !important; height: 0 !important; } ${S.scroller} { scrollbar-width: none !important; }`;
            const c1 = col(v.scrollbarColor);
            const c2 = col(v.scrollbarColor2, ACCENT2);
            const hover = col(v.scrollbarHoverColor);
            const thumb = mode === "gradient" ? `linear-gradient(180deg, ${c1}, ${c2})` : mixAccent(55, c1);
            // Chromium 121+ ignores ::-webkit-scrollbar* once scrollbar-color / scrollbar-width are set, so force them back to auto.
            // Scrollers Discord hides on purpose (none_) are left alone.
            const bar = ':not([class*="none_"])';
            return `${S.scroller} { scrollbar-color: auto !important; scrollbar-width: auto !important; }
${bar}::-webkit-scrollbar { width: ${w}px !important; height: ${w}px !important; }
${bar}::-webkit-scrollbar-thumb { background: ${thumb} !important; border-radius: ${w}px !important; border: none !important; min-height: 40px; }
${bar}::-webkit-scrollbar-thumb:hover { background: ${hover} !important; }
${bar}::-webkit-scrollbar-track { background: transparent !important; border: none !important; }`;
        }
    },
    {
        id: "scrollbarWidth", cat: "interface", group: "Полосы прокрутки", kind: "slider", label: "Толщина полос прокрутки", default: 6, min: 2, max: 16, unit: " px", dependsOn: "scrollbarStyle",
        activeWhen: v => v.scrollbarStyle === "accent" || v.scrollbarStyle === "gradient", activeHint: "Работает с полосами «Цветом акцента» и «Градиентные»"
    },
    {
        id: "scrollbarColor", cat: "interface", group: "Полосы прокрутки", kind: "color", label: "Цвет полос прокрутки", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "scrollbarStyle",
        activeWhen: v => v.scrollbarStyle === "accent" || v.scrollbarStyle === "gradient", activeHint: "Работает с полосами «Цветом акцента» и «Градиентные»"
    },
    {
        id: "scrollbarColor2", cat: "interface", group: "Полосы прокрутки", kind: "color", label: "Второй цвет градиента полос", default: "", dependsOn: "scrollbarStyle",
        activeWhen: v => v.scrollbarStyle === "gradient", activeHint: "Работает с полосами «Градиентные»"
    },
    {
        id: "scrollbarHoverColor", cat: "interface", group: "Полосы прокрутки", kind: "color", label: "Цвет полос при наведении", default: "", dependsOn: "scrollbarStyle",
        activeWhen: v => v.scrollbarStyle === "accent" || v.scrollbarStyle === "gradient", activeHint: "Работает с полосами «Цветом акцента» и «Градиентные»"
    },

    /* ---------- chat input ---------- */
    {
        id: "inputGlow", cat: "interface", group: "Поле ввода", kind: "toggle", label: "Свечение поля ввода при наборе", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c = col(v.inputGlowColor);
            const r = nz(v.inputGlowRadius, 18);
            return `${S.chatInput} { transition: box-shadow var(--vv-speed) ease !important; border-radius: var(--vv-radius, 8px); }
${S.chatInput}:focus-within { box-shadow: 0 0 0 1px ${mixAccent(70, c)}, 0 0 ${r}px ${mixAccent(35, c)} !important; }`;
        }
    },
    { id: "inputGlowColor", cat: "interface", group: "Поле ввода", kind: "color", label: "Цвет свечения поля ввода", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "inputGlow" },
    { id: "inputGlowRadius", cat: "interface", group: "Поле ввода", kind: "slider", label: "Радиус свечения поля ввода", default: 18, min: 0, max: 60, unit: " px", dependsOn: "inputGlow" },
    {
        id: "inputGradientBorder", cat: "interface", group: "Поле ввода", kind: "toggle", label: "Бегущая градиентная рамка поля ввода", default: false,
        css: (on, v) => {
            if (!on) return "";
            const c1 = col(v.inputBorderColor1);
            const c2 = col(v.inputBorderColor2, ACCENT2);
            const speed = nz(v.inputBorderSpeed, 4);
            return `@property --vv-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes vv-spin-angle { to { --vv-angle: 360deg; } }
${S.chatInput} { position: relative; }
${S.chatInput}::before { content: ""; position: absolute; inset: -2px; border-radius: calc(var(--vv-radius, 8px) + 2px); padding: 2px; background: conic-gradient(from var(--vv-angle), ${c1}, ${c2}, ${c1}); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: 0; }
/* the gradient only spins while you are actually writing: otherwise it would repaint the input box forever */
${S.chatInput}:focus-within::before, ${S.chatInput}:hover::before { animation: vv-spin-angle ${speed}s linear infinite; }`;
        }
    },
    { id: "inputBorderColor1", cat: "interface", group: "Поле ввода", kind: "color", label: "Первый цвет рамки поля ввода", desc: "Пусто — цвета акцентов темы", default: "", dependsOn: "inputGradientBorder" },
    { id: "inputBorderColor2", cat: "interface", group: "Поле ввода", kind: "color", label: "Второй цвет рамки поля ввода", default: "", dependsOn: "inputGradientBorder" },
    { id: "inputBorderSpeed", cat: "interface", group: "Поле ввода", kind: "slider", label: "Оборот рамки за", default: 4, min: 1, max: 20, step: 0.5, unit: " с", dependsOn: "inputGradientBorder" },
    {
        id: "inputPlaceholder", cat: "interface", group: "Поле ввода", kind: "text", label: "Свой текст-подсказка в поле ввода", placeholder: "Напиши что-нибудь красивое…", default: "",
        css: text => {
            const t = cssSafe(text?.trim() ?? "").replace(/'/g, "\\'");
            return t && `${S.placeholder} { font-size: 0 !important; } ${S.placeholder}::after { content: '${t}'; font-size: 1rem; color: var(--text-muted); }`;
        }
    },

    /* ---------- hide stuff ---------- */
    // gift: the only plain container_ before the expression picker buttons; GIF: the picker button that is neither stickers nor emoji
    hide("hideGiftButton", "Кнопку подарка в поле ввода", `${S.chatInputButtons} > :is(:has([aria-label="Отправить подарок"], [aria-label="Send a gift"]), [class*="container_"]:not([class*="buttonContainer_"]):has(~ .expression-picker-chat-input-button))`, true),
    hide("hideGifButton", "Кнопку GIF", `${S.chatInputButtons} > :is(:has([aria-label="Открыть меню GIF"], [aria-label="Open GIF picker"]), .expression-picker-chat-input-button:not(:has([class*="stickerButton_"], [class*="emojiButton_"])))`),
    hide("hideStickerButton", "Кнопку стикеров", `${S.chatInputButtons} > :has([aria-label="Открыть меню выбора стикеров"], [aria-label="Open sticker picker"], [class*="stickerButton_"])`),
    hide("hideAppsButton", "Кнопку «Приложения»", ".app-launcher-entrypoint"),
    hide("hideStoreLinks", "Nitro, Магазин и Квесты в списке ЛС", S.dmStoreLinks, true),
    hide("hideActivityPanel", "Панель «сейчас играет» над профилем", `${S.panels} [class*="activityPanel_"]`),
    hide("hideMemberList", "Список участников", S.membersWrap),
    hide("hideServerSeparators", "Разделители в списке серверов", S.guildSeparator),

    {
        id: "memberListWidth", cat: "interface", group: "Размеры", kind: "slider", label: "Ширина списка участников", default: 240, min: 160, max: 400, unit: " px",
        css: w => w !== 240 && `${S.membersWrap}, ${S.membersWrap} [class*="members_"] { width: ${nz(w, 240)}px !important; min-width: ${nz(w, 240)}px !important; }`
    },
    {
        id: "sidebarWidth", cat: "interface", group: "Размеры", kind: "slider", label: "Ширина списка каналов", default: 240, min: 160, max: 420, unit: " px",
        // [class*="sidebar_"] is the channel / DM column; flex-basis has to go too or Discord keeps its own 240px
        css: w => w !== 240 && `${S.sidebar} { width: ${nz(w, 240)}px !important; min-width: ${nz(w, 240)}px !important; flex-basis: ${nz(w, 240)}px !important; }`
    },
    { id: "compactServers", cat: "interface", group: "Размеры", kind: "slider", label: "Размер иконок серверов", default: 100, min: 60, max: 120, unit: "%", css: s => s !== 100 && `${S.guildIcon} { zoom: ${nz(s, 100) / 100}; }` },

    /* ---------- chrome ---------- */
    {
        id: "systemBarGradient", cat: "interface", group: "Оформление окна", kind: "toggle", label: "Верхняя полоса окна градиентом", default: false,
        css: (on, v) => {
            if (!on) return "";
            const c1 = col(v.systemBarColor1);
            const c2 = col(v.systemBarColor2, ACCENT2);
            const o = pct(v.systemBarOpacity, 28);
            return `${S.systemBar} { background: linear-gradient(90deg, ${mixAccent(o, c1)}, transparent 40%, transparent 60%, ${mixAccent(o, c2)}) !important; }`;
        }
    },
    { id: "systemBarColor1", cat: "interface", group: "Оформление окна", kind: "color", label: "Левый цвет верхней полосы", desc: "Пусто — цвета акцентов темы", default: "", dependsOn: "systemBarGradient" },
    { id: "systemBarColor2", cat: "interface", group: "Оформление окна", kind: "color", label: "Правый цвет верхней полосы", default: "", dependsOn: "systemBarGradient" },
    { id: "systemBarOpacity", cat: "interface", group: "Оформление окна", kind: "slider", label: "Насыщенность верхней полосы", default: 28, min: 0, max: 100, unit: "%", dependsOn: "systemBarGradient" },
    {
        id: "macButtons", cat: "interface", group: "Оформление окна", kind: "toggle", label: "Кнопки окна как на macOS", desc: "Цветные кружки вместо свернуть/развернуть/закрыть", default: false,
        css: on => on && `${S.winButtons} [class*="winButton_"] { width: 28px !important; }
${S.winButtons} [class*="winButton_"] svg { opacity: 0; transition: opacity var(--vv-speed); }
${S.winButtons} [class*="winButton_"]::before { content: ""; position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #febc2e; box-shadow: 0 0 6px rgba(254,188,46,.6); }
${S.winButtons} [class*="winButton_"] { position: relative; display: flex !important; align-items: center; justify-content: center; background: transparent !important; }
${S.winButtons} [class*="winButton_"]:first-child::before { background: #28c840; box-shadow: 0 0 6px rgba(40,200,64,.6); }
${S.winButtons} [class*="winButtonClose_"]::before { background: #ff5f57; box-shadow: 0 0 6px rgba(255,95,87,.6); }
${S.winButtons} [class*="winButton_"]:hover::before { filter: brightness(1.2); transform: scale(1.15); }`
    },
    {
        id: "userPanelGradient", cat: "interface", group: "Оформление окна", kind: "toggle", label: "Панель профиля внизу с градиентом", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c1 = col(v.userPanelColor1);
            const c2 = col(v.userPanelColor2, ACCENT2);
            const k = nz(v.userPanelOpacity, 100) / 100;
            return `${S.panels} { background: linear-gradient(135deg, ${mixAccent(pct(18, 18, k), c1)}, ${mixAccent(pct(8, 8, k), c2)}) !important; border-top: 1px solid ${mixAccent(pct(25, 25, k), c1)}; }`;
        }
    },
    { id: "userPanelColor1", cat: "interface", group: "Оформление окна", kind: "color", label: "Первый цвет панели профиля", desc: "Пусто — цвета акцентов темы", default: "", dependsOn: "userPanelGradient" },
    { id: "userPanelColor2", cat: "interface", group: "Оформление окна", kind: "color", label: "Второй цвет панели профиля", default: "", dependsOn: "userPanelGradient" },
    { id: "userPanelOpacity", cat: "interface", group: "Оформление окна", kind: "slider", label: "Насыщенность панели профиля", default: 100, min: 0, max: 250, step: 5, unit: "%", dependsOn: "userPanelGradient" },
    {
        id: "badgeGradient", cat: "interface", group: "Оформление окна", kind: "toggle", label: "Счётчики упоминаний градиентом", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c1 = col(v.badgeColor1);
            const c2 = col(v.badgeColor2, ACCENT2);
            return `${S.numberBadge} { background: linear-gradient(135deg, ${c1}, ${c2}) !important; box-shadow: 0 0 8px ${mixAccent(55, c1)}; }`;
        }
    },
    { id: "badgeColor1", cat: "interface", group: "Оформление окна", kind: "color", label: "Первый цвет счётчиков", desc: "Пусто — цвета акцентов темы", default: "", dependsOn: "badgeGradient" },
    { id: "badgeColor2", cat: "interface", group: "Оформление окна", kind: "color", label: "Второй цвет счётчиков", default: "", dependsOn: "badgeGradient" },
    {
        id: "buttonsGlow", cat: "interface", group: "Оформление окна", kind: "toggle", label: "Кнопки светятся при наведении", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c = col(v.buttonsGlowColor);
            const r = nz(v.buttonsGlowRadius, 16);
            return `button[class*="colorBrand_"], button[class*="lookFilled_"] { transition: box-shadow var(--vv-speed) ease, transform var(--vv-speed) var(--vv-ease), filter var(--vv-speed) !important; }
button[class*="colorBrand_"]:hover, button[class*="lookFilled_"]:hover { box-shadow: 0 0 ${r}px ${mixAccent(55, c)}; transform: translateY(-1px); filter: brightness(1.08); }`;
        }
    },
    { id: "buttonsGlowColor", cat: "interface", group: "Оформление окна", kind: "color", label: "Цвет свечения кнопок", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "buttonsGlow" },
    { id: "buttonsGlowRadius", cat: "interface", group: "Оформление окна", kind: "slider", label: "Радиус свечения кнопок", default: 16, min: 0, max: 60, unit: " px", dependsOn: "buttonsGlow" },

    /* ---------- popups ---------- */
    {
        id: "menuGlass", cat: "interface", group: "Меню и окна", kind: "toggle", label: "Стеклянные контекстные меню", default: true,
        css: (on, v) => {
            if (!on) return "";
            const blur = nz(v.menuBlur, 16);
            const o = pct(v.menuOpacity, 78);
            return `${S.menu} { background: color-mix(in srgb, var(--background-surface-high, #232428) ${o}%, transparent) !important; backdrop-filter: blur(${blur}px) saturate(150%); border: 1px solid ${mixAccent(25)} !important; box-shadow: 0 12px 40px rgba(0,0,0,.45), 0 0 20px ${mixAccent(15)} !important; }`;
        }
    },
    { id: "menuBlur", cat: "interface", group: "Меню и окна", kind: "slider", label: "Размытие под меню", default: 16, min: 0, max: 40, unit: " px", dependsOn: "menuGlass" },
    { id: "menuOpacity", cat: "interface", group: "Меню и окна", kind: "slider", label: "Непрозрачность фона меню", default: 78, min: 20, max: 100, unit: "%", dependsOn: "menuGlass" },
    {
        id: "popupAnim", cat: "interface", group: "Меню и окна", kind: "select", label: "Появление меню и окон", default: "pop",
        options: [
            { value: "off", label: "Как в Discord" },
            { value: "pop", label: "Выпрыгивание" },
            { value: "slide", label: "Выезд снизу" },
            { value: "flip", label: "Переворот" },
            { value: "blur", label: "Из размытия" }
        ],
        css: mode => {
            const frames: Record<string, string> = {
                pop: "from { opacity: 0; transform: scale(.94); }",
                slide: "from { opacity: 0; transform: translateY(10px); }",
                flip: "from { opacity: 0; transform: perspective(600px) rotateX(-18deg); }",
                blur: "from { opacity: 0; filter: blur(8px); }"
            };
            // "backwards": nothing persists after the entry, so Discord's own close animations still work
            return frames[mode] && `@keyframes vv-pop-in { ${frames[mode]} }
${S.menu}, ${S.layerContainer} ${S.dialog} { animation: vv-pop-in var(--vv-speed) var(--vv-ease) backwards; }`;
        }
    },
    {
        id: "popoutGlow", cat: "interface", group: "Меню и окна", kind: "toggle", label: "Рамка со свечением у окон и профилей", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c = col(v.popoutGlowColor);
            const k = nz(v.popoutGlowStrength, 100) / 100;
            return `${S.layerContainer} ${S.dialog} { box-shadow: 0 0 0 1px ${mixAccent(pct(35, 35, k), c)}, 0 16px 48px rgba(0,0,0,.5), 0 0 28px ${mixAccent(pct(18, 18, k), c)} !important; }`;
        }
    },
    { id: "popoutGlowColor", cat: "interface", group: "Меню и окна", kind: "color", label: "Цвет свечения окон", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "popoutGlow" },
    { id: "popoutGlowStrength", cat: "interface", group: "Меню и окна", kind: "slider", label: "Сила свечения окон", default: 100, min: 0, max: 280, step: 5, unit: "%", dependsOn: "popoutGlow" },
    {
        id: "tooltipAccent", cat: "interface", group: "Меню и окна", kind: "toggle", label: "Подсказки в цветах темы", default: true,
        css: (on, v) => {
            if (!on) return "";
            const k = nz(v.tooltipStrength, 100) / 100;
            return `[class*="tooltipPrimary_"] { background: linear-gradient(135deg, color-mix(in srgb, var(--background-surface-highest, #2b2d31) ${100 - pct(8, 8, k)}%, ${ACCENT}), var(--background-surface-highest, #2b2d31)) !important; border: 1px solid ${mixAccent(pct(35, 35, k))}; box-shadow: 0 0 14px ${mixAccent(pct(22, 22, k))} !important; }`;
        }
    },
    { id: "tooltipStrength", cat: "interface", group: "Меню и окна", kind: "slider", label: "Сила акцента в подсказках", default: 100, min: 0, max: 300, step: 5, unit: "%", dependsOn: "tooltipAccent" },
    {
        id: "backdropBlur", cat: "interface", group: "Меню и окна", kind: "slider", label: "Размытие позади модальных окон", default: 0, min: 0, max: 20, unit: " px", heavy: true,
        css: b => b > 0 && `${S.backdrop} { backdrop-filter: blur(${nz(b, 0)}px); }`
    },

    /* ---------- focus ---------- */
    { id: "focusMode", cat: "interface", group: "Фокус", kind: "toggle", label: "Фокус-режим", desc: "Боковые панели полупрозрачные, пока на них не наведёшь", default: false },
    {
        id: "focusOpacity", cat: "interface", group: "Фокус", kind: "slider", label: "Прозрачность списка каналов в фокус-режиме", default: 35, min: 5, max: 90, unit: "%", dependsOn: "focusMode",
        css: (value, v) => {
            if (!v.focusMode) return "";
            const o = nz(value, 35);
            const m = nz(v.focusMembersOpacity, 35);
            const fade = nz(v.focusFade, 2);
            const t = `transition: opacity calc(var(--vv-speed) * ${fade}) ease !important; will-change: opacity;`;
            // one rule while both panels share an opacity, so the common case stays a single style
            const head = m === o
                ? `${S.sidebar}, ${S.membersWrap} { opacity: ${o / 100}; ${t} }`
                : `${S.sidebar} { opacity: ${o / 100}; ${t} }\n${S.membersWrap} { opacity: ${m / 100}; ${t} }`;
            return `${head}\n${S.sidebar}:hover, ${S.membersWrap}:hover, ${S.sidebar}:focus-within { opacity: 1; }`;
        }
    },
    { id: "focusMembersOpacity", cat: "interface", group: "Фокус", kind: "slider", label: "Прозрачность списка участников в фокус-режиме", default: 35, min: 5, max: 90, unit: "%", dependsOn: "focusMode" },
    {
        id: "focusFade", cat: "interface", group: "Фокус", kind: "slider", label: "Длительность появления панелей", default: 2, min: 0.5, max: 10, step: 0.5, unit: "×", dependsOn: "focusMode",
        desc: "Во столько раз дольше обычной анимации интерфейса"
    }
];
