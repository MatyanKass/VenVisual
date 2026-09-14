/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { buildCss, normalizeHex, VVSettings } from "./css";
import { THEMES } from "./themes";

const STYLE_ID = "vc-venvisual";
let styleEl: HTMLStyleElement | null = null;

function applyStyles() {
    if (!styleEl) return;
    styleEl.textContent = buildCss(settings.store as unknown as VVSettings);
}

const live = { onChange: applyStyles };
const isHexOrEmpty = (v: string) => !v?.trim() || normalizeHex(v) !== null || "Нужен HEX цвет, например #ff2bd6";

export const settings = definePluginSettings({
    /* ---------- theme ---------- */
    theme: {
        type: OptionType.SELECT,
        description: "Тема",
        options: [
            { label: "Discord (без изменений)", value: "none", default: true },
            ...Object.entries(THEMES).map(([value, t]) => ({ label: t.label, value }))
        ],
        ...live
    },
    customAccent: {
        type: OptionType.STRING,
        description: "Свой акцентный цвет (HEX, пусто = из темы)",
        placeholder: "#ff2bd6",
        default: "",
        isValid: isHexOrEmpty,
        ...live
    },
    customAccent2: {
        type: OptionType.STRING,
        description: "Второй акцент для градиентов (HEX, пусто = из темы)",
        placeholder: "#00e5ff",
        default: "",
        isValid: isHexOrEmpty,
        ...live
    },
    customBackground: {
        type: OptionType.STRING,
        description: "Свой цвет фона (HEX, пусто = из темы)",
        placeholder: "#151926",
        default: "",
        isValid: isHexOrEmpty,
        ...live
    },
    customText: {
        type: OptionType.STRING,
        description: "Свой цвет текста (HEX, пусто = из темы)",
        placeholder: "#dfe3f0",
        default: "",
        isValid: isHexOrEmpty,
        ...live
    },

    /* ---------- hover highlight ---------- */
    hoverEnabled: {
        type: OptionType.BOOLEAN,
        description: "Подсветка при наведении (элемент светится и отъезжает в сторону)",
        default: true,
        ...live
    },
    hoverChannels: { type: OptionType.BOOLEAN, description: "— каналы сервера", default: true, ...live },
    hoverDMs: { type: OptionType.BOOLEAN, description: "— личные сообщения", default: true, ...live },
    hoverMembers: { type: OptionType.BOOLEAN, description: "— список участников", default: true, ...live },
    hoverServers: { type: OptionType.BOOLEAN, description: "— иконки серверов", default: true, ...live },
    hoverMessages: { type: OptionType.BOOLEAN, description: "— сообщения в чате (только подсветка)", default: false, ...live },
    highlightSelected: {
        type: OptionType.BOOLEAN,
        description: "Выделять открытый канал/ЛС градиентом",
        default: true,
        ...live
    },
    hoverShift: {
        type: OptionType.SLIDER,
        description: "Насколько отъезжает при наведении (px)",
        markers: [0, 2, 4, 6, 8, 10, 12, 16],
        default: 6,
        stickToMarkers: false,
        ...live
    },
    hoverGlow: {
        type: OptionType.SLIDER,
        description: "Сила свечения (px)",
        markers: [0, 4, 8, 12, 16, 24],
        default: 12,
        stickToMarkers: false,
        ...live
    },

    /* ---------- background ---------- */
    bgImage: {
        type: OptionType.STRING,
        description: "Фоновая картинка (прямая ссылка на изображение, пусто = выкл)",
        placeholder: "https://i.imgur.com/....jpg",
        default: "",
        ...live
    },
    bgBlur: {
        type: OptionType.SLIDER,
        description: "Размытие фона (px)",
        markers: [0, 2, 4, 8, 12, 16, 24],
        default: 4,
        stickToMarkers: false,
        ...live
    },
    bgDim: {
        type: OptionType.SLIDER,
        description: "Затемнение фона (%)",
        markers: [0, 20, 40, 60, 80],
        default: 40,
        stickToMarkers: false,
        ...live
    },
    panelOpacity: {
        type: OptionType.SLIDER,
        description: "Непрозрачность панелей поверх фона (%)",
        markers: [0, 20, 40, 60, 80, 100],
        default: 70,
        stickToMarkers: false,
        ...live
    },
    glassPanels: {
        type: OptionType.BOOLEAN,
        description: "Эффект стекла (размытие под панелями, чуть тяжелее для ПК)",
        default: false,
        ...live
    },

    /* ---------- shape & typography ---------- */
    radius: {
        type: OptionType.SLIDER,
        description: "Скругление углов (px)",
        markers: [0, 4, 8, 12, 16, 20, 24],
        default: 8,
        stickToMarkers: false,
        ...live
    },
    fontFamily: {
        type: OptionType.STRING,
        description: "Шрифт (название установленного шрифта, пусто = стандартный)",
        placeholder: "Inter",
        default: "",
        ...live
    },
    fontScale: {
        type: OptionType.SLIDER,
        description: "Размер текста сообщений (%)",
        markers: [80, 90, 100, 110, 120, 130],
        default: 100,
        stickToMarkers: false,
        ...live
    },
    messageSpacing: {
        type: OptionType.SLIDER,
        description: "Отступ между группами сообщений (px)",
        markers: [0, 4, 8, 12, 17, 24, 32],
        default: 17,
        stickToMarkers: false,
        ...live
    },

    /* ---------- animations ---------- */
    animations: {
        type: OptionType.BOOLEAN,
        description: "Анимации (появление сообщений, меню, плавные переходы)",
        default: true,
        ...live
    },
    animationSpeed: {
        type: OptionType.SLIDER,
        description: "Длительность анимаций (мс)",
        markers: [80, 150, 200, 300, 400, 600],
        default: 200,
        stickToMarkers: false,
        ...live
    },

    /* ---------- usernames ---------- */
    nameStyle: {
        type: OptionType.SELECT,
        description: "Стиль ников в чате",
        options: [
            { label: "Обычные", value: "none", default: true },
            { label: "Градиент из акцентов темы", value: "accent" },
            { label: "Переливающаяся радуга", value: "rainbow" },
            { label: "Блик по цвету роли", value: "roleShine" },
            { label: "Свечение цвета роли", value: "glow" }
        ],
        ...live
    }
});

export default definePlugin({
    name: "VenVisual",
    description: "Темы, подсветка каналов при наведении, фон с размытием, скругления, шрифты, анимации и градиентные ники.",
    authors: [{ name: "MatyanKass", id: 0n }],
    tags: ["Appearance", "Customisation"],
    settings,

    startAt: StartAt.DOMContentLoaded,

    start() {
        styleEl ??= createAndAppendStyle(STYLE_ID, managedStyleRootNode);
        applyStyles();
    },

    stop() {
        styleEl?.remove();
        styleEl = null;
    }
});
