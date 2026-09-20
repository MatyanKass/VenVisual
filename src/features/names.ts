/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, Feature, normalizeHex, Values } from "../registry";
import { S } from "../selectors";

const MEMBER_NAME = `${S.membersWrap} [class*="nameAndDecorators_"] [class*="name_"]`;

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

/** rgba() from a #rrggbb hex, so a colored speaking ring keeps the compact stock form */
const rgba = (hex: string, a: number) => {
    const n = Number.parseInt(hex.slice(1), 16);
    if (!Number.isFinite(n)) return hex;
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${num(a)})`;
};

function nameTargets(v: Values) {
    return v.nameInMembers ? `${S.username}, ${MEMBER_NAME}` : S.username;
}

const clipText = (gradient: string, extra = "") => `background-image: ${gradient} !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    ${extra}`;

/** shapes cut with clip-path, which also cuts off box-shadow rings */
const CLIPPED_SHAPES = new Set(["hexagon", "diamond", "heart"]);

/** name styles painted with a moving gradient: they use the speed and angle sliders */
const FLOWING_NAMES = new Set(["custom", "rainbow", "roleShine", "fire", "ice", "gold", "toxic"]);
/** every style drawn with a gradient (the angle slider also turns the static accent one) */
const GRADIENT_NAMES = new Set(["accent", ...FLOWING_NAMES]);

const SHAPES: Record<string, string> = {
    circle: "border-radius: 50% !important;",
    squircle: "border-radius: 32% !important;",
    rounded: "border-radius: 20% !important;",
    square: "border-radius: 3px !important;",
    hexagon: "border-radius: 0 !important; clip-path: polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%);",
    diamond: "border-radius: 0 !important; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);",
    heart: "border-radius: 0 !important; clip-path: path('M20 36 C20 36 2 24 2 12 C2 6 6 2 11 2 C15 2 18 4 20 8 C22 4 25 2 29 2 C34 2 38 6 38 12 C38 24 20 36 20 36Z');"
};

export const nameFeatures: Feature[] = [
    {
        id: "nameStyle", cat: "names", group: "Ники", kind: "select", label: "Стиль ников", default: "none", heavy: true,
        desc: "Переливающиеся стили анимируют каждый ник на экране",
        options: [
            { value: "none", label: "Обычные" },
            { value: "accent", label: "Градиент из акцентов" },
            { value: "custom", label: "Свой градиент (цвета ниже)" },
            { value: "rainbow", label: "Переливающаяся радуга" },
            { value: "roleShine", label: "Блик по цвету роли" },
            { value: "glow", label: "Свечение цвета роли" },
            { value: "fire", label: "Огонь" },
            { value: "ice", label: "Лёд" },
            { value: "gold", label: "Золото" },
            { value: "toxic", label: "Токсичный" },
            { value: "neon", label: "Мигающий неон" }
        ],
        css: (mode, v) => {
            const t = nameTargets(v);
            const c1 = normalizeHex(v.nameColor1) ?? "#ff2bd6";
            const c2 = normalizeHex(v.nameColor2) ?? "#00e5ff";
            const flow = "@keyframes vv-name-flow { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }";
            // one speed slider for every flowing style: 100 % keeps each style's own tempo
            const speed = Math.max(0.1, numberOr(v.nameSpeed, 100) / 100);
            const angle = Math.round(Math.max(0, Math.min(360, numberOr(v.nameAngle, 90))));
            const grad = (stops: string) => `linear-gradient(${angle}deg, ${stops})`;
            const anim = (s: number) => `animation: vv-name-flow ${num(s * speed)}s linear infinite;`;
            switch (mode) {
                case "accent": return `${t} { ${clipText(grad(`${ACCENT}, ${ACCENT2}, ${ACCENT}`))} }`;
                case "custom": return `${flow} ${t} { ${clipText(grad(`${c1}, ${c2}, ${c1}`), anim(4))} }`;
                case "rainbow": return `${flow} ${t} { ${clipText(grad("#ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d"), anim(4))} }`;
                case "roleShine": return `${flow} ${t} { ${clipText(grad("currentColor 35%, #ffffff 50%, currentColor 65%"), anim(3))} }`;
                case "glow": {
                    const gc = normalizeHex(v.nameGlowColor) ?? "currentColor";
                    const blur = Math.max(1, pxOr(v.nameGlowBlur, 8));
                    return `${t} { text-shadow: 0 0 ${blur}px ${gc}, 0 0 ${Math.max(1, Math.round(blur / 4))}px ${gc}; }`;
                }
                case "fire": return `${flow} ${t} { ${clipText(grad("#ff3b00, #ffb300, #ff6a00, #ff3b00"), anim(2))} filter: drop-shadow(0 0 4px rgba(255,90,0,.6)); }`;
                case "ice": return `${flow} ${t} { ${clipText(grad("#b8f4ff, #5ac8fa, #ffffff, #b8f4ff"), anim(5))} filter: drop-shadow(0 0 4px rgba(120,210,255,.6)); }`;
                case "gold": return `${flow} ${t} { ${clipText(grad("#b8860b, #ffd700, #fff3a0, #ffd700, #b8860b"), anim(3))} }`;
                case "toxic": return `${flow} ${t} { ${clipText(grad("#39ff14, #ccff00, #00ff9c, #39ff14"), anim(3))} filter: drop-shadow(0 0 4px rgba(57,255,20,.55)); }`;
                case "neon": return `@keyframes vv-neon { 0%,18%,22%,25%,53%,57%,100% { text-shadow: 0 0 4px #fff, 0 0 10px ${ACCENT}, 0 0 20px ${ACCENT}; opacity: 1; } 20%,24%,55% { text-shadow: none; opacity: .75; } }
${t} { color: #fff !important; animation: vv-neon 3s infinite; }`;
            }
        }
    },
    { id: "nameColor1", cat: "names", group: "Ники", kind: "color", label: "Свой градиент: цвет 1", default: "#ff2bd6", dependsOn: "nameStyle", activeWhen: v => v.nameStyle === "custom", activeHint: "Работает со стилем «Свой градиент»" },
    { id: "nameColor2", cat: "names", group: "Ники", kind: "color", label: "Свой градиент: цвет 2", default: "#00e5ff", dependsOn: "nameStyle", activeWhen: v => v.nameStyle === "custom", activeHint: "Работает со стилем «Свой градиент»" },
    {
        id: "nameSpeed", cat: "names", group: "Ники", kind: "slider", label: "Длительность перелива ников", desc: "Больше — медленнее переливается", default: 100, min: 25, max: 400, step: 5, unit: "%", dependsOn: "nameStyle",
        activeWhen: v => FLOWING_NAMES.has(v.nameStyle), activeHint: "Работает с переливающимися стилями"
    },
    {
        id: "nameAngle", cat: "names", group: "Ники", kind: "slider", label: "Угол градиента ников", default: 90, min: 0, max: 360, step: 5, unit: "°", dependsOn: "nameStyle",
        activeWhen: v => GRADIENT_NAMES.has(v.nameStyle), activeHint: "Работает с градиентными стилями"
    },
    {
        id: "nameGlowColor", cat: "names", group: "Ники", kind: "color", label: "Свечение ника: цвет", desc: "Пусто — цвет роли", default: "", dependsOn: "nameStyle",
        activeWhen: v => v.nameStyle === "glow", activeHint: "Работает со стилем «Свечение цвета роли»"
    },
    {
        id: "nameGlowBlur", cat: "names", group: "Ники", kind: "slider", label: "Свечение ника: размытие", default: 8, min: 1, max: 24, unit: " px", dependsOn: "nameStyle",
        activeWhen: v => v.nameStyle === "glow", activeHint: "Работает со стилем «Свечение цвета роли»"
    },
    { id: "nameInMembers", cat: "names", group: "Ники", kind: "toggle", label: "Применять стиль и в списке участников", default: false },
    { id: "nameWeight", cat: "names", group: "Ники", kind: "slider", label: "Толщина ников", default: 500, min: 300, max: 900, step: 100, css: (w, v) => numberOr(w, 500) !== 500 && `${nameTargets(v)} { font-weight: ${Math.round(numberOr(w, 500))} !important; }` },
    { id: "nameUppercase", cat: "names", group: "Ники", kind: "toggle", label: "Ники заглавными буквами", default: false, css: (on, v) => on && `${nameTargets(v)} { text-transform: uppercase; letter-spacing: .04em; }` },
    {
        id: "nameHoverUnderline", cat: "names", group: "Ники", kind: "toggle", label: "Анимированное подчёркивание ника", default: true,
        css: (on, v) => {
            if (!on) return "";
            const u1 = normalizeHex(v.underlineColor1) ?? ACCENT;
            const u2 = normalizeHex(v.underlineColor2) ?? ACCENT2;
            const h = Math.max(1, pxOr(v.underlineWidth, 2));
            return `${S.username} { position: relative; } ${S.username}::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: ${h}px; background: linear-gradient(90deg, ${u1}, ${u2}); transform: scaleX(0); transform-origin: left; transition: transform var(--vv-speed) var(--vv-ease); } ${S.username}:hover::after { transform: scaleX(1); } ${S.username}:hover { text-decoration: none !important; }`;
        }
    },
    { id: "underlineColor1", cat: "names", group: "Ники", kind: "color", label: "Подчёркивание: цвет слева", default: "", dependsOn: "nameHoverUnderline" },
    { id: "underlineColor2", cat: "names", group: "Ники", kind: "color", label: "Подчёркивание: цвет справа", default: "", dependsOn: "nameHoverUnderline" },
    { id: "underlineWidth", cat: "names", group: "Ники", kind: "slider", label: "Подчёркивание: толщина", default: 2, min: 1, max: 5, unit: " px", dependsOn: "nameHoverUnderline" },
    {
        id: "resetNameStyles", cat: "names", group: "Ники", kind: "toggle", label: "Отключить шрифты и эффекты ников Discord", desc: "Nitro-стили отображаемых имён", default: false,
        css: on => on && "[class*=\"dnsFont_\"] { font-family: inherit !important; } [class*=\"withDisplayNameStyles_\"] [class*=\"username_\"] { text-shadow: none !important; animation: none !important; }"
    },
    {
        id: "roleDotGlow", cat: "names", group: "Ники", kind: "toggle", label: "Цветные точки ролей светятся", default: true,
        css: (on, v) => on && `[class*="roleDot_"], [class*="roleCircle_"] { filter: drop-shadow(0 0 ${Math.max(1, pxOr(v.roleDotRadius, 3))}px currentColor); }`
    },
    { id: "roleDotRadius", cat: "names", group: "Ники", kind: "slider", label: "Сила свечения точек ролей", default: 3, min: 1, max: 12, unit: " px", dependsOn: "roleDotGlow" },

    {
        id: "avatarShape", cat: "names", group: "Аватары", kind: "select", label: "Форма аватарок в чате", default: "circle",
        options: [
            { value: "circle", label: "Круг" },
            { value: "squircle", label: "Скруглённый квадрат" },
            { value: "rounded", label: "Мягкий квадрат" },
            { value: "square", label: "Квадрат" },
            { value: "hexagon", label: "Шестиугольник" },
            { value: "diamond", label: "Ромб" },
            { value: "heart", label: "Сердечко" }
        ],
        css: shape => shape !== "circle" && `${S.chatAvatar} { ${SHAPES[shape]} }`
    },
    {
        id: "avatarHover", cat: "names", group: "Аватары", kind: "select", label: "Аватарка при наведении", default: "scale",
        options: [
            { value: "off", label: "Ничего" },
            { value: "scale", label: "Увеличение" },
            { value: "spin", label: "Поворот" },
            { value: "tilt", label: "Наклон" },
            { value: "jelly", label: "Желе" }
        ],
        css: (mode, v) => {
            // only the spin uses its own duration; the other modes keep the stock 1.5x transition
            const spin = num(Math.max(0.1, Math.min(10, numberOr(v.avatarSpinTime, 1.5))));
            const base = `${S.chatAvatar} { transition: transform calc(var(--vv-speed) * ${mode === "spin" ? spin : "1.5"}) var(--vv-ease), box-shadow var(--vv-speed) ease !important; }`;
            switch (mode) {
                case "scale": return `${base} ${S.chatAvatar}:hover { transform: scale(${num(Math.max(100, Math.min(200, numberOr(v.avatarHoverScale, 112))) / 100)}); }`;
                case "spin": return `${base} ${S.chatAvatar}:hover { transform: rotate(360deg); }`;
                case "tilt": return `${base} ${S.chatAvatar}:hover { transform: rotate(-${Math.max(0, Math.round(numberOr(v.avatarTilt, 12)))}deg) scale(1.08); }`;
                case "jelly": return `@keyframes vv-jelly { 0%,100% { transform: scale(1,1); } 30% { transform: scale(1.2,.85); } 50% { transform: scale(.9,1.12); } 70% { transform: scale(1.06,.96); } } ${S.chatAvatar}:hover { animation: vv-jelly .6s ease; }`;
            }
        }
    },
    { id: "avatarHoverScale", cat: "names", group: "Аватары", kind: "slider", label: "Аватарка: насколько увеличивается", default: 112, min: 100, max: 160, unit: "%", dependsOn: "avatarHover", activeWhen: v => v.avatarHover === "scale", activeHint: "Работает с эффектом «Увеличение»" },
    { id: "avatarTilt", cat: "names", group: "Аватары", kind: "slider", label: "Аватарка: угол наклона", default: 12, min: 0, max: 45, unit: "°", dependsOn: "avatarHover", activeWhen: v => v.avatarHover === "tilt", activeHint: "Работает с эффектом «Наклон»" },
    { id: "avatarSpinTime", cat: "names", group: "Аватары", kind: "slider", label: "Аватарка: длительность поворота", desc: "Во столько раз дольше общей скорости анимаций", default: 1.5, min: 0.5, max: 6, step: 0.5, unit: " ×", dependsOn: "avatarHover", activeWhen: v => v.avatarHover === "spin", activeHint: "Работает с эффектом «Поворот»" },
    {
        id: "avatarRing", cat: "names", group: "Аватары", kind: "toggle", label: "Кольцо цветом акцента вокруг аватарок", default: false,
        activeWhen: v => !CLIPPED_SHAPES.has(v.avatarShape), activeHint: "Не видно у фигурных аватарок (шестиугольник, ромб, сердечко)",
        // ring color / glow come from properties that avatarRingPulse animates (the box-shadow itself is !important)
        css: (on, v) => {
            if (!on) return "";
            const ring = `color-mix(in srgb, ${normalizeHex(v.avatarRingColor) ?? ACCENT}, ${ACCENT2} var(--vv-ring-mix, 0%))`;
            return `${S.chatAvatar} { box-shadow: 0 0 0 ${Math.max(1, pxOr(v.avatarRingWidth, 2))}px ${ring}, 0 0 var(--vv-ring-glow, ${pxOr(v.avatarRingGlow, 10)}px) color-mix(in srgb, ${ring} 55%, transparent) !important; }`;
        }
    },
    { id: "avatarRingColor", cat: "names", group: "Аватары", kind: "color", label: "Цвет кольца", desc: "Пусто — цвет акцента темы", default: "", dependsOn: "avatarRing" },
    { id: "avatarRingWidth", cat: "names", group: "Аватары", kind: "slider", label: "Толщина кольца", default: 2, min: 1, max: 6, unit: " px", dependsOn: "avatarRing" },
    { id: "avatarRingGlow", cat: "names", group: "Аватары", kind: "slider", label: "Свечение кольца", default: 10, min: 0, max: 30, unit: " px", dependsOn: "avatarRing" },
    {
        id: "avatarRingPulse", cat: "names", group: "Аватары", kind: "toggle", label: "Кольцо пульсирует", default: false, dependsOn: "avatarRing",
        css: (on, v) => {
            if (!on || !v.avatarRing) return "";
            const glow = pxOr(v.avatarRingGlow, 10);
            return `@property --vv-ring-glow { syntax: "<length>"; inherits: false; initial-value: ${glow}px; }
@property --vv-ring-mix { syntax: "<percentage>"; inherits: false; initial-value: 0%; }
@keyframes vv-ring { 0%,100% { --vv-ring-glow: ${Math.round(glow * 0.4)}px; --vv-ring-mix: 0%; } 50% { --vv-ring-glow: ${Math.round(glow * 1.6)}px; --vv-ring-mix: 100%; } }
${S.chatAvatar} { animation: vv-ring 2.5s ease-in-out infinite; }`;
        }
    },
    {
        id: "statusGlow", cat: "names", group: "Аватары", kind: "toggle", label: "Статусы (онлайн/не беспокоить) светятся", default: true,
        // Discord colors the dot with the fill attribute, so currentColor has to be set per status first
        css: on => on && `rect[mask*="svg-mask-status-online"] { color: var(--status-positive, #45a366); }
rect[mask*="svg-mask-status-idle"] { color: var(--status-warning, #ffc04e); }
rect[mask*="svg-mask-status-dnd"] { color: var(--status-danger, #da3e44); }
rect[mask*="svg-mask-status-streaming"] { color: #9147ff; }
${S.statusDot}:not([mask*="status-offline"]) { filter: drop-shadow(0 0 3px currentColor) drop-shadow(0 0 2px currentColor); }`
    },
    {
        id: "speakingGlow", cat: "names", group: "Аватары", kind: "toggle", label: "Говорящие в голосовом светятся сильнее", default: true,
        css: (on, v) => {
            if (!on) return "";
            const c = normalizeHex(v.speakingColor) ?? "#3ba55d";
            const r = Math.max(1, pxOr(v.speakingRadius, 16));
            const idle = Math.max(1, Math.round(r * 3 / 8));
            return `@keyframes vv-speak { 0%,100% { box-shadow: 0 0 0 2px ${c}, 0 0 ${idle}px ${rgba(c, 0.5)}; } 50% { box-shadow: 0 0 0 2px ${c}, 0 0 ${r}px ${rgba(c, 0.9)}; } }
[class*="voiceUser_"] [class*="avatarSpeaking"], [class*="voiceUser_"] [class*="speaking_"][class*="avatar"], [class*="tile_"] [class*="speaking_"] { animation: vv-speak 1.2s ease-in-out infinite; border-radius: 50%; }`;
        }
    },
    { id: "speakingColor", cat: "names", group: "Аватары", kind: "color", label: "Цвет свечения говорящих", desc: "Пусто — зелёный Discord", default: "", dependsOn: "speakingGlow" },
    { id: "speakingRadius", cat: "names", group: "Аватары", kind: "slider", label: "Размер свечения говорящих", default: 16, min: 4, max: 40, unit: " px", dependsOn: "speakingGlow" },
    { id: "hideDecorations", cat: "names", group: "Аватары", kind: "toggle", label: "Скрыть украшения аватарок", default: false, css: on => on && "[class*=\"avatarDecoration_\"] { display: none !important; }" },
    { id: "hideNameplates", cat: "names", group: "Аватары", kind: "toggle", label: "Скрыть анимированные таблички в списке участников", default: false, css: on => on && "[class*=\"nameplated_\"] > [class*=\"container_\"]:has(video, img) { display: none !important; }" },
    { id: "hideClanTags", cat: "names", group: "Аватары", kind: "toggle", label: "Скрыть теги гильдий у ников", default: false, css: on => on && "[class*=\"clanTag_\"], [class*=\"chipletContainerInline_\"] { display: none !important; }" }
];
