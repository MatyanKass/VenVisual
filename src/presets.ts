/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FEATURE_BY_ID, withDefaults } from "./features/index";
import { Values } from "./registry";
import { THEMES } from "./themes";

export interface Preset {
    id: string;
    label: string;
    desc: string;
    /** only the settings that differ from defaults; everything else is reset */
    values: Values;
}

export const PRESETS: Preset[] = [
    {
        id: "cyberpunk",
        label: "⚡ Неоновый киберпанк",
        desc: "Неоновая тема, радужные ники, неоновая подсветка, ретро-сетка на фоне, пылинки и светящаяся рамка окна",
        values: {
            theme: "neon",
            hoverStyle: "neon",
            hoverGlow: 20,
            hoverServers: "spin",
            selectedPulse: true,
            categoryAccent: true,
            msgAppear: "side",
            mentionStyle: "pulse",
            msgTextGlow: true,
            nameStyle: "rainbow",
            nameInMembers: true,
            avatarShape: "hexagon",
            avatarRing: true,
            bgMode: "grid",
            bgBlur: 0,
            bgDim: 30,
            panelOpacity: 62,
            gradientSpeed: 24,
            scanlines: 8,
            vignette: 30,
            particles: "dust",
            particleCount: 60,
            cursorTrail: "sparkles",
            trailLength: 18,
            clickEffect: "burst",
            scrollbarStyle: "gradient",
            inputGradientBorder: true,
            systemBarGradient: true,
            popupAnim: "flip",
            windowFrame: "accent"
        }
    },
    {
        id: "glass",
        label: "🧊 Стеклянный",
        desc: "Полупрозрачные стеклянные панели поверх северного сияния, мягкие скругления и сообщения карточками",
        values: {
            theme: "catppuccin",
            hoverStyle: "soft",
            hoverGlow: 8,
            msgAppear: "blur",
            msgBubbles: true,
            nameStyle: "accent",
            avatarShape: "squircle",
            bgMode: "aurora",
            bgBlur: 24,
            bgDim: 25,
            bgSaturation: 130,
            gradientSpeed: 30,
            panelOpacity: 42,
            glassPanels: true,
            glassStrength: 18,
            radius: 14,
            backdropBlur: 8,
            popupAnim: "blur",
            focusRingAccent: true
        }
    },
    {
        id: "sakura",
        label: "🌸 Уютная сакура",
        desc: "Розовая тема, падающие лепестки, аватарки-сердечки и тёплые мягкие цвета",
        values: {
            theme: "sakura",
            hoverStyle: "gradient",
            hoverServers: "bounce",
            msgAppear: "pop",
            nameStyle: "custom",
            nameColor1: "#ff8fb8",
            nameColor2: "#ffc38f",
            avatarShape: "heart",
            avatarHover: "jelly",
            bgMode: "mesh",
            bgBlur: 0,
            bgDim: 20,
            panelOpacity: 78,
            radius: 16,
            warmth: 8,
            particles: "sakura",
            particleCount: 45,
            particleSpeed: 70,
            particleWind: 20,
            fxColors: "natural",
            clickEffect: "hearts",
            sendEffect: "hearts",
            spoilerGlass: true
        }
    },
    {
        id: "hacker",
        label: "💻 Хакер",
        desc: "Тема «Матрица», цифровой дождь, терминальные виджеты, моноширинный шрифт и строгие квадратные формы",
        values: {
            theme: "matrix",
            hoverStyle: "underline",
            hoverShift: 4,
            hoverServers: "off",
            msgAppear: "fade",
            timestampsAlways: true,
            timestampAccent: true,
            nameStyle: "toxic",
            avatarShape: "square",
            avatarHover: "off",
            particles: "matrix",
            particleCount: 90,
            particleOpacity: 40,
            particleMouse: false,
            cursorTrail: "dots",
            typingSparks: true,
            scanlines: 12,
            vignette: 40,
            radius: 2,
            fontFamily: "Consolas",
            codeFont: "JetBrains Mono",
            scrollbarWidth: 4,
            inputPlaceholder: "> введи команду_",
            popupAnim: "off",
            clock: true,
            clockSeconds: true,
            sessionTimer: true,
            widgetPosition: "top-right",
            widgetStyle: "terminal",
            chatWatermark: "root@discord"
        }
    },
    {
        id: "winter",
        label: "❄️ Зима",
        desc: "Холодная арктическая тема, снегопад, ледяные ники и звёздное небо",
        values: {
            theme: "arctic",
            hoverStyle: "soft",
            hoverServers: "scale",
            msgAppear: "blur",
            nameStyle: "ice",
            nameInMembers: true,
            avatarRing: true,
            bgMode: "stars",
            bgBlur: 0,
            bgDim: 15,
            gradientSpeed: 40,
            panelOpacity: 72,
            vignette: 25,
            radius: 12,
            particles: "snow",
            particleCount: 120,
            particleSpeed: 80,
            particleWind: 15,
            fxColors: "natural",
            clickEffect: "stars",
            sendEffect: "stars",
            windowFrame: "breathing"
        }
    },
    {
        id: "minimal",
        label: "◻️ Минимализм",
        desc: "Чёрная AMOLED-тема, никаких свечений и лишних кнопок, быстрые спокойные анимации",
        values: {
            theme: "amoled",
            hoverStyle: "underline",
            hoverShift: 0,
            hoverGlow: 0,
            hoverServers: "off",
            hoverMenus: false,
            selectedServerGlow: false,
            serverPillAccent: false,
            unreadGlow: false,
            voiceConnectedPulse: false,
            channelIconAccent: false,
            folderTint: false,
            msgAppear: "fade",
            mentionInlineGlow: false,
            codeBlockStyle: false,
            blockquoteGradient: false,
            botTagGradient: false,
            embedAccent: false,
            imageHoverZoom: false,
            reactionPop: false,
            reactionMeGlow: false,
            newMessagesBarGradient: false,
            systemMsgDim: true,
            nameHoverUnderline: false,
            resetNameStyles: true,
            roleDotGlow: false,
            avatarHover: "off",
            statusGlow: false,
            hideDecorations: true,
            hideNameplates: true,
            hideClanTags: true,
            radius: 4,
            animSpeed: 120,
            scrollbarWidth: 3,
            inputGlow: false,
            hideGifButton: true,
            hideStickerButton: true,
            hideAppsButton: true,
            hideActivityPanel: true,
            hideServerSeparators: true,
            userPanelGradient: false,
            badgeGradient: false,
            buttonsGlow: false,
            menuGlass: false,
            popupAnim: "off",
            popoutGlow: false,
            tooltipAccent: false
        }
    },
    {
        id: "sunset",
        label: "🌇 Закат",
        desc: "Тёплые оранжевые тона, огненные ники, искры костра и медленно переливающийся градиент",
        values: {
            theme: "sunset",
            hoverStyle: "gradient",
            hoverGlow: 16,
            hoverServers: "lift",
            mentionStyle: "pulse",
            nameStyle: "fire",
            avatarHover: "tilt",
            avatarRing: true,
            bgMode: "gradient",
            bgBlur: 0,
            bgDim: 30,
            gradientSpeed: 30,
            panelOpacity: 74,
            vignette: 35,
            warmth: 12,
            particles: "embers",
            particleCount: 55,
            fxColors: "natural",
            clickEffect: "burst",
            sendEffect: "fireworks",
            windowFrame: "breathing"
        }
    },
    {
        id: "synthwave",
        label: "🌆 Синтвейв",
        desc: "Ретро-80-е: неоновая сетка, розово-голубые ники, радужный след курсора и полосы ЭЛТ-монитора",
        values: {
            theme: "synthwave",
            hoverStyle: "neon",
            hoverGlow: 18,
            hoverServers: "wiggle",
            mentionStyle: "rainbow",
            msgAppear: "pop",
            nameStyle: "custom",
            nameColor1: "#ff7edb",
            nameColor2: "#72f1f8",
            nameUppercase: true,
            avatarShape: "diamond",
            bgMode: "grid",
            bgBlur: 0,
            bgDim: 20,
            bgSaturation: 140,
            gradientSpeed: 16,
            panelOpacity: 58,
            scanlines: 10,
            grain: 6,
            particles: "stars",
            particleCount: 50,
            cursorTrail: "rainbow",
            trailLength: 26,
            scrollbarStyle: "gradient",
            inputGradientBorder: true,
            systemBarGradient: true,
            popupAnim: "flip",
            windowFrame: "rainbow"
        }
    },
    {
        id: "quietNight",
        label: "🌙 Тихая ночь",
        desc: "Тёмно-синяя тема, звёздное небо, редкие светлячки и тёплый фильтр, чтобы глаза отдыхали",
        values: {
            theme: "midnight",
            hoverStyle: "soft",
            hoverGlow: 8,
            msgAppear: "fade",
            nameStyle: "glow",
            bgMode: "stars",
            bgBlur: 0,
            bgDim: 25,
            gradientSpeed: 60,
            panelOpacity: 70,
            vignette: 30,
            warmth: 25,
            brightness: 92,
            particles: "fireflies",
            particleCount: 30,
            particleSpeed: 60,
            particleOpacity: 70,
            fxColors: "natural",
            fxFps: "30",
            animSpeed: 260,
            clock: true,
            widgetPosition: "top-center",
            widgetStyle: "minimal"
        }
    },
    {
        id: "streamer",
        label: "🎥 Стример",
        desc: "Чистый вид для трансляций: размытые ЛС и картинки до наведения, без лишних кнопок, часы и таймер сессии",
        values: {
            theme: "tokyo",
            hoverStyle: "slide",
            mentionStyle: "rainbow",
            timestampsAlways: true,
            msgFontScale: 110,
            msgSpacing: 20,
            avatarShape: "rounded",
            radius: 10,
            hideGifButton: true,
            hideStickerButton: true,
            hideAppsButton: true,
            hideActivityPanel: true,
            blurDMList: true,
            blurImages: true,
            clock: true,
            sessionTimer: true,
            widgetPosition: "top-left",
            widgetStyle: "glass"
        }
    }
];

/* ---------- random style ---------- */

function randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(list: readonly T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

const chance = (p: number) => Math.random() < p;

/** a random option of a select feature, optionally excluding some values */
function pickOption(id: string, exclude: string[] = []): string {
    const f = FEATURE_BY_ID.get(id);
    if (f?.kind !== "select") throw new Error(`[VenVisual] ${id} is not a select feature`);
    const opts = f.options.map(o => o.value).filter(v => !exclude.includes(v));
    return opts.length ? pick(opts) : f.default;
}

function hslToHex(h: number, s: number, l: number): string {
    const sat = s / 100;
    const lig = l / 100;
    const a = sat * Math.min(lig, 1 - lig);
    const channel = (n: number) => {
        const k = (n + h / 30) % 12;
        const c = lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(c * 255).toString(16).padStart(2, "0");
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const randomColor = (hue: number) => hslToHex(hue, randInt(65, 95), randInt(55, 68));

/** a fun random look built only from real features and valid values */
export function randomValues(): Values {
    const v: Values = {};

    v.theme = pick(Object.keys(THEMES));
    if (chance(0.35)) {
        const hue = randInt(0, 359);
        v.accent = randomColor(hue);
        v.accent2 = randomColor((hue + randInt(40, 180)) % 360);
    }
    v.rainbowAccent = chance(0.1);

    v.hoverStyle = pickOption("hoverStyle");
    v.hoverShift = randInt(2, 12);
    v.hoverGlow = randInt(4, 24);
    v.hoverServers = pickOption("hoverServers");
    v.selectedPulse = chance(0.3);

    v.msgAppear = pickOption("msgAppear");
    v.mentionStyle = pickOption("mentionStyle");
    v.msgBubbles = chance(0.25);

    v.nameStyle = pickOption("nameStyle");
    if (v.nameStyle === "custom") {
        const hue = randInt(0, 359);
        v.nameColor1 = randomColor(hue);
        v.nameColor2 = randomColor((hue + randInt(60, 200)) % 360);
    }
    v.avatarShape = chance(0.5) ? "circle" : pickOption("avatarShape", ["circle"]);
    v.avatarHover = pickOption("avatarHover");
    v.avatarRing = chance(0.3);

    v.bgMode = pick(["gradient", "aurora", "mesh", "stars", "grid", "none"]);
    if (v.bgMode !== "none") {
        v.bgBlur = v.bgMode === "stars" || v.bgMode === "grid" ? 0 : randInt(0, 16);
        v.bgDim = randInt(15, 45);
        v.gradientSpeed = randInt(12, 45);
        v.panelOpacity = randInt(50, 80);
    }
    v.vignette = chance(0.3) ? randInt(15, 40) : 0;

    v.particles = chance(0.5) ? "none" : pickOption("particles", ["none"]);
    if (v.particles !== "none") {
        v.particleCount = randInt(30, 110);
        v.particleSpeed = randInt(60, 140);
        v.fxColors = pickOption("fxColors");
    }
    v.cursorTrail = chance(0.7) ? "none" : pickOption("cursorTrail", ["none"]);
    v.clickEffect = chance(0.6) ? "none" : pickOption("clickEffect", ["none"]);

    v.radius = randInt(4, 18);
    v.popupAnim = pickOption("popupAnim");
    v.scrollbarStyle = pick(["accent", "gradient"]);
    v.inputGradientBorder = chance(0.3);
    v.windowFrame = chance(0.7) ? "none" : pickOption("windowFrame", ["none"]);

    return withDefaults(v);
}
