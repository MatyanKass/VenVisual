/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, cssSafe, Feature, Values } from "../registry";

export const backgroundFeatures: Feature[] = [
    {
        id: "bgMode", cat: "background", group: "Фон", kind: "select", label: "Фон окна", default: "none",
        options: [
            { value: "none", label: "Без фона" },
            { value: "image", label: "Картинка по ссылке" },
            { value: "gradient", label: "Переливающийся градиент" },
            { value: "aurora", label: "Северное сияние" },
            { value: "mesh", label: "Мягкие пятна цвета" },
            { value: "stars", label: "Звёздное небо" },
            { value: "grid", label: "Неоновая сетка (ретро)" }
        ]
    },
    { id: "bgImage", cat: "background", group: "Фон", kind: "text", label: "Ссылка на картинку", desc: "Прямая ссылка на jpg/png/gif/webp", placeholder: "https://i.imgur.com/....jpg", default: "", dependsOn: "bgMode" },
    {
        id: "bgPosition", cat: "background", group: "Фон", kind: "select", label: "Положение картинки", default: "center", dependsOn: "bgMode",
        options: [{ value: "center", label: "По центру" }, { value: "top", label: "Сверху" }, { value: "bottom", label: "Снизу" }, { value: "left", label: "Слева" }, { value: "right", label: "Справа" }]
    },
    { id: "bgBlur", cat: "background", group: "Фон", kind: "slider", label: "Размытие фона", default: 4, min: 0, max: 40, unit: " px", dependsOn: "bgMode" },
    { id: "bgDim", cat: "background", group: "Фон", kind: "slider", label: "Затемнение фона", default: 40, min: 0, max: 95, unit: "%", dependsOn: "bgMode" },
    { id: "bgSaturation", cat: "background", group: "Фон", kind: "slider", label: "Насыщенность фона", default: 100, min: 0, max: 250, unit: "%", dependsOn: "bgMode" },
    { id: "gradientSpeed", cat: "background", group: "Фон", kind: "slider", label: "Скорость анимированного фона", default: 20, min: 4, max: 120, unit: " с", dependsOn: "bgMode" },
    { id: "kenBurns", cat: "background", group: "Фон", kind: "toggle", label: "Медленный наезд камеры", desc: "Картинка плавно приближается и отдаляется", default: false, dependsOn: "bgMode" },
    { id: "parallax", cat: "background", group: "Фон", kind: "toggle", label: "Параллакс за мышкой", desc: "Фон немного смещается вслед за курсором", default: false, dependsOn: "bgMode" },
    { id: "parallaxStrength", cat: "background", group: "Фон", kind: "slider", label: "Сила параллакса", default: 18, min: 4, max: 60, unit: " px", dependsOn: "parallax" },

    { id: "panelOpacity", cat: "background", group: "Панели поверх фона", kind: "slider", label: "Непрозрачность панелей", default: 70, min: 0, max: 100, unit: "%", dependsOn: "bgMode" },
    { id: "glassPanels", cat: "background", group: "Панели поверх фона", kind: "toggle", label: "Эффект стекла", desc: "Размытие под панелями", default: false, heavy: true, dependsOn: "bgMode" },
    { id: "glassStrength", cat: "background", group: "Панели поверх фона", kind: "slider", label: "Сила стекла", default: 14, min: 2, max: 40, unit: " px", dependsOn: "glassPanels" },

    { id: "vignette", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Виньетка по краям", default: 0, min: 0, max: 90, unit: "%" },
    { id: "grain", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Плёночное зерно", default: 0, min: 0, max: 30, unit: "%" },
    { id: "scanlines", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Полосы как на ЭЛТ-мониторе", default: 0, min: 0, max: 40, unit: "%" }
];

export const isSeeThrough = (v: Values) => v.bgMode !== "none" && !(v.bgMode === "image" && !v.bgImage?.trim());

const dark = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, #05050a)`;

function layerBackground(v: Values): string {
    switch (v.bgMode) {
        case "image": {
            const url = cssSafe(v.bgImage.trim()).replace(/[()'\s]/g, m => encodeURIComponent(m));
            return `background: url("${url}") ${v.bgPosition} / cover no-repeat;`;
        }
        case "gradient":
            return `background: linear-gradient(125deg, #05050a, ${dark(ACCENT, 55)}, ${dark(ACCENT2, 45)}, #05050a, ${dark(ACCENT, 40)}); background-size: 400% 400%; animation: vv-bg-pan var(--vv-bg-speed) ease-in-out infinite alternate;`;
        case "aurora":
            return `background: radial-gradient(40% 55% at 20% 30%, ${dark(ACCENT, 70)}, transparent 70%), radial-gradient(45% 50% at 80% 20%, ${dark(ACCENT2, 65)}, transparent 70%), radial-gradient(60% 50% at 50% 90%, ${dark(ACCENT, 45)}, transparent 70%), #04040a; background-size: 160% 160%; animation: vv-bg-aurora var(--vv-bg-speed) ease-in-out infinite alternate;`;
        case "mesh":
            return `background: radial-gradient(at 10% 10%, ${dark(ACCENT, 60)} 0, transparent 50%), radial-gradient(at 90% 15%, ${dark(ACCENT2, 55)} 0, transparent 50%), radial-gradient(at 85% 90%, ${dark(ACCENT, 45)} 0, transparent 50%), radial-gradient(at 15% 85%, ${dark(ACCENT2, 40)} 0, transparent 50%), #07070d;`;
        case "stars": {
            const stars = Array.from({ length: 40 }, (_, i) => {
                const x = (i * 37 + 11) % 100, y = (i * 61 + 7) % 100, s = i % 5 === 0 ? 2 : 1;
                return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${0.5 + (i % 5) / 10}), transparent)`;
            }).join(", ");
            return `background: ${stars}, radial-gradient(ellipse at bottom, ${dark(ACCENT, 25)}, #020208 70%); background-size: 400px 400px, 400px 400px, 100% 100%; animation: vv-bg-stars calc(var(--vv-bg-speed) * 6) linear infinite;`;
        }
        case "grid":
            return `background: linear-gradient(transparent 0 calc(100% - 1px), ${dark(ACCENT, 80)} calc(100% - 1px)) 0 0 / 100% 44px, linear-gradient(90deg, transparent 0 calc(100% - 1px), ${dark(ACCENT2, 70)} calc(100% - 1px)) 0 0 / 44px 100%, linear-gradient(180deg, #06020f, ${dark(ACCENT, 30)}); animation: vv-bg-grid calc(var(--vv-bg-speed) / 4) linear infinite;`;
    }
    return "";
}

export function backgroundCss(v: Values): string {
    const out: string[] = [];

    if (isSeeThrough(v)) {
        const blur = v.bgBlur;
        out.push(`@keyframes vv-bg-pan { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
@keyframes vv-bg-aurora { 0% { background-position: 0% 0%; } 50% { background-position: 100% 40%; } 100% { background-position: 30% 100%; } }
@keyframes vv-bg-stars { to { background-position: 400px 800px, -400px 400px, 0 0; } }
@keyframes vv-bg-grid { to { background-position: 0 44px, 0 0, 0 0; } }
@keyframes vv-kenburns { from { scale: 1.04; } to { scale: 1.16; } }
:root { --vv-bg-speed: ${v.gradientSpeed}s; }
html { background: #000 !important; }
body, #app-mount { background: transparent !important; }
#app-mount::before {
    content: "";
    position: fixed;
    inset: ${blur > 0 || v.parallax ? `-${blur * 2 + (v.parallax ? v.parallaxStrength : 0)}px` : "0"};
    z-index: -1;
    pointer-events: none;
    ${layerBackground(v)}
    filter: blur(${blur}px) brightness(${(100 - v.bgDim) / 100}) saturate(${v.bgSaturation / 100});
    translate: calc(var(--vv-px, 0) * ${v.parallaxStrength}px) calc(var(--vv-py, 0) * ${v.parallaxStrength}px);
    transition: translate .25s ease-out;
    ${v.kenBurns ? "animation: vv-kenburns 40s ease-in-out infinite alternate;" : ""}
}
[class*="appMount_"], [class*="app_"], [class*="bg_"], [class*="layers_"], [class*="layer_"], [class*="baseLayer_"] > [class*="container_"], [class*="baseLayer_"] > [class*="container_"] > [class*="base_"], [class*="page_"], [class*="chat_"], [class*="chatContent_"] {
    background: transparent !important;
}`);
        if (v.glassPanels) {
            out.push(`[class*="sidebarList_"], [class*="guilds_"], [class*="membersWrap_"], [class*="chatContent_"], [class*="panels_"], ${"section[class*=\"title_\"]"} {
    backdrop-filter: blur(${v.glassStrength}px) saturate(140%);
}`);
        }
    }

    const layers: string[] = [];
    if (v.scanlines > 0) layers.push(`repeating-linear-gradient(0deg, rgba(0,0,0,${v.scanlines / 100}) 0 1px, transparent 1px 3px)`);
    if (v.grain > 0) layers.push(`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='${(v.grain / 100).toFixed(2)}'/></svg>")`);
    if (v.vignette > 0) layers.push(`radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${v.vignette / 100}) 100%)`);
    if (layers.length) {
        out.push(`#app-mount::after { content: ""; position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; background: ${layers.join(", ")}; mix-blend-mode: normal; }`);
    }

    return out.join("\n");
}
