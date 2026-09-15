/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, Feature, mixAccent, normalizeHex, Values } from "../registry";
import { S } from "../selectors";

const MEMBER_NAME = `${S.membersWrap} [class*="nameAndDecorators_"] [class*="name_"]`;

function nameTargets(v: Values) {
    return v.nameInMembers ? `${S.username}, ${MEMBER_NAME}` : S.username;
}

const clipText = (gradient: string, extra = "") => `background-image: ${gradient} !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    ${extra}`;

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
        id: "nameStyle", cat: "names", group: "Ники", kind: "select", label: "Стиль ников", default: "none",
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
            const anim = (s: number) => `animation: vv-name-flow ${s}s linear infinite;`;
            switch (mode) {
                case "accent": return `${t} { ${clipText(`linear-gradient(90deg, ${ACCENT}, ${ACCENT2}, ${ACCENT})`)} }`;
                case "custom": return `${flow} ${t} { ${clipText(`linear-gradient(90deg, ${c1}, ${c2}, ${c1})`, anim(4))} }`;
                case "rainbow": return `${flow} ${t} { ${clipText("linear-gradient(90deg, #ff5f6d, #ffc371, #7ed957, #2ad4c4, #6c8cff, #d66cff, #ff5f6d)", anim(4))} }`;
                case "roleShine": return `${flow} ${t} { ${clipText("linear-gradient(90deg, currentColor 35%, #ffffff 50%, currentColor 65%)", anim(3))} }`;
                case "glow": return `${t} { text-shadow: 0 0 8px currentColor, 0 0 2px currentColor; }`;
                case "fire": return `${flow} ${t} { ${clipText("linear-gradient(90deg, #ff3b00, #ffb300, #ff6a00, #ff3b00)", anim(2))} filter: drop-shadow(0 0 4px rgba(255,90,0,.6)); }`;
                case "ice": return `${flow} ${t} { ${clipText("linear-gradient(90deg, #b8f4ff, #5ac8fa, #ffffff, #b8f4ff)", anim(5))} filter: drop-shadow(0 0 4px rgba(120,210,255,.6)); }`;
                case "gold": return `${flow} ${t} { ${clipText("linear-gradient(90deg, #b8860b, #ffd700, #fff3a0, #ffd700, #b8860b)", anim(3))} }`;
                case "toxic": return `${flow} ${t} { ${clipText("linear-gradient(90deg, #39ff14, #ccff00, #00ff9c, #39ff14)", anim(3))} filter: drop-shadow(0 0 4px rgba(57,255,20,.55)); }`;
                case "neon": return `@keyframes vv-neon { 0%,18%,22%,25%,53%,57%,100% { text-shadow: 0 0 4px #fff, 0 0 10px ${ACCENT}, 0 0 20px ${ACCENT}; opacity: 1; } 20%,24%,55% { text-shadow: none; opacity: .75; } }
${t} { color: #fff !important; animation: vv-neon 3s infinite; }`;
            }
        }
    },
    { id: "nameColor1", cat: "names", group: "Ники", kind: "color", label: "Свой градиент: цвет 1", default: "#ff2bd6", dependsOn: "nameStyle" },
    { id: "nameColor2", cat: "names", group: "Ники", kind: "color", label: "Свой градиент: цвет 2", default: "#00e5ff", dependsOn: "nameStyle" },
    { id: "nameInMembers", cat: "names", group: "Ники", kind: "toggle", label: "Применять стиль и в списке участников", default: false },
    { id: "nameWeight", cat: "names", group: "Ники", kind: "slider", label: "Толщина ников", default: 500, min: 300, max: 900, step: 100, css: (w, v) => w !== 500 && `${nameTargets(v)} { font-weight: ${w} !important; }` },
    { id: "nameUppercase", cat: "names", group: "Ники", kind: "toggle", label: "Ники заглавными буквами", default: false, css: (on, v) => on && `${nameTargets(v)} { text-transform: uppercase; letter-spacing: .04em; }` },
    {
        id: "nameHoverUnderline", cat: "names", group: "Ники", kind: "toggle", label: "Анимированное подчёркивание ника", default: true,
        css: on => on && `${S.username} { position: relative; } ${S.username}::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2}); transform: scaleX(0); transform-origin: left; transition: transform var(--vv-speed) var(--vv-ease); } ${S.username}:hover::after { transform: scaleX(1); } ${S.username}:hover { text-decoration: none !important; }`
    },
    {
        id: "resetNameStyles", cat: "names", group: "Ники", kind: "toggle", label: "Отключить шрифты и эффекты ников Discord", desc: "Nitro-стили отображаемых имён", default: false,
        css: on => on && "[class*=\"dnsFont_\"] { font-family: inherit !important; } [class*=\"withDisplayNameStyles_\"] [class*=\"username_\"] { text-shadow: none !important; animation: none !important; }"
    },
    { id: "roleDotGlow", cat: "names", group: "Ники", kind: "toggle", label: "Цветные точки ролей светятся", default: true, css: on => on && "[class*=\"roleDot_\"], [class*=\"roleCircle_\"] { filter: drop-shadow(0 0 3px currentColor); }" },

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
        css: mode => {
            const base = `${S.chatAvatar} { transition: transform calc(var(--vv-speed) * 1.5) var(--vv-ease), box-shadow var(--vv-speed) ease !important; }`;
            switch (mode) {
                case "scale": return `${base} ${S.chatAvatar}:hover { transform: scale(1.12); }`;
                case "spin": return `${base} ${S.chatAvatar}:hover { transform: rotate(360deg); }`;
                case "tilt": return `${base} ${S.chatAvatar}:hover { transform: rotate(-12deg) scale(1.08); }`;
                case "jelly": return `@keyframes vv-jelly { 0%,100% { transform: scale(1,1); } 30% { transform: scale(1.2,.85); } 50% { transform: scale(.9,1.12); } 70% { transform: scale(1.06,.96); } } ${S.chatAvatar}:hover { animation: vv-jelly .6s ease; }`;
            }
        }
    },
    {
        id: "avatarRing", cat: "names", group: "Аватары", kind: "toggle", label: "Кольцо цветом акцента вокруг аватарок", default: false,
        css: on => on && `${S.chatAvatar} { box-shadow: 0 0 0 2px ${ACCENT}, 0 0 10px ${mixAccent(50)} !important; }`
    },
    {
        id: "avatarRingPulse", cat: "names", group: "Аватары", kind: "toggle", label: "Кольцо пульсирует", default: false, dependsOn: "avatarRing",
        css: (on, v) => on && v.avatarRing && `@keyframes vv-ring { 0%,100% { box-shadow: 0 0 0 2px ${ACCENT}, 0 0 4px ${mixAccent(30)}; } 50% { box-shadow: 0 0 0 2px ${ACCENT2}, 0 0 16px ${mixAccent(70, ACCENT2)}; } } ${S.chatAvatar} { animation: vv-ring 2.5s ease-in-out infinite; }`
    },
    { id: "statusGlow", cat: "names", group: "Аватары", kind: "toggle", label: "Статусы (онлайн/не беспокоить) светятся", default: true, css: on => on && `${S.statusDot} { filter: drop-shadow(0 0 3px currentColor) drop-shadow(0 0 2px currentColor); }` },
    {
        id: "speakingGlow", cat: "names", group: "Аватары", kind: "toggle", label: "Говорящие в голосовом светятся сильнее", default: true,
        css: on => on && `@keyframes vv-speak { 0%,100% { box-shadow: 0 0 0 2px #3ba55d, 0 0 6px rgba(59,165,93,.5); } 50% { box-shadow: 0 0 0 2px #3ba55d, 0 0 16px rgba(59,165,93,.9); } }
[class*="voiceUser_"] [class*="avatarSpeaking_"], [class*="voiceUser_"] [class*="speaking_"][class*="avatar"], [class*="tile_"] [class*="speaking_"] { animation: vv-speak 1.2s ease-in-out infinite; border-radius: 50%; }`
    },
    { id: "hideDecorations", cat: "names", group: "Аватары", kind: "toggle", label: "Скрыть украшения аватарок", default: false, css: on => on && "[class*=\"avatarDecoration_\"] { display: none !important; }" },
    { id: "hideNameplates", cat: "names", group: "Аватары", kind: "toggle", label: "Скрыть анимированные таблички в списке участников", default: false, css: on => on && "[class*=\"nameplated_\"] > [class*=\"container_\"]:has(video, img) { display: none !important; }" },
    { id: "hideClanTags", cat: "names", group: "Аватары", kind: "toggle", label: "Скрыть теги гильдий у ников", default: false, css: on => on && "[class*=\"clanTag_\"], [class*=\"chipletContainerInline_\"] { display: none !important; }" }
];
