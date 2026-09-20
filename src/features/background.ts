/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ACCENT, ACCENT2, alpha, Feature, normalizeHex, Values } from "../registry";

const BG_MODES = ["none", "image", "gradient", "aurora", "mesh", "stars", "grid"];
const BG_POSITIONS = ["center", "top", "bottom", "left", "right"];
const ANIMATED_MODES = new Set(["gradient", "aurora", "stars", "grid"]);
/** modes drawn from the two accent colors, i.e. everything generated instead of loaded */
const COLOR_MODES = new Set(["gradient", "aurora", "mesh", "stars", "grid"]);

const IMAGE_ONLY = { activeWhen: (v: Values) => v.bgMode === "image", activeHint: "Работает с фоном «Картинка по ссылке»" };
const SEE_THROUGH_ONLY = { activeWhen: (v: Values) => isSeeThrough(v), activeHint: "Работает, когда выбран фон (для картинки нужна ссылка)" };
const GENERATED_ONLY = { activeWhen: (v: Values) => COLOR_MODES.has(v.bgMode), activeHint: "Работает с рисованными фонами (не с картинкой)" };

/* ---------- guards: a slider / color that is missing or broken must never reach the css ---------- */

/** numeric setting, or the fallback when it is missing / NaN */
const nz = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
/** color override, or the theme color when the user left it empty */
const col = (value: unknown, fallback: string) => normalizeHex(typeof value === "string" ? value : undefined) ?? fallback;
/** short css number: 0.9 -> ".9", 4 -> "4"; never NaN */
const num = (n: number) => (Number.isFinite(n) ? String(Number(n.toFixed(4))).replace(/^(-?)0\./, "$1.") : "0");

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
    { id: "bgImage", cat: "background", group: "Фон", kind: "text", label: "Ссылка на картинку", desc: "Прямая ссылка на jpg/png/gif/webp или data:-ссылка", placeholder: "https://i.imgur.com/....jpg", default: "", dependsOn: "bgMode", ...IMAGE_ONLY },
    {
        id: "bgPosition", cat: "background", group: "Фон", kind: "select", label: "Положение картинки", default: "center", dependsOn: "bgMode", ...IMAGE_ONLY,
        options: [{ value: "center", label: "По центру" }, { value: "top", label: "Сверху" }, { value: "bottom", label: "Снизу" }, { value: "left", label: "Слева" }, { value: "right", label: "Справа" }]
    },
    { id: "bgColor1", cat: "background", group: "Фон", kind: "color", label: "Первый цвет фона", desc: "Пусто — цвета акцентов темы", default: "", dependsOn: "bgMode", ...GENERATED_ONLY },
    { id: "bgColor2", cat: "background", group: "Фон", kind: "color", label: "Второй цвет фона", default: "", dependsOn: "bgMode", ...GENERATED_ONLY },
    { id: "bgDarkness", cat: "background", group: "Фон", kind: "slider", label: "Подмешать черноты в цвета фона", desc: "Минус — цвета ярче, плюс — темнее", default: 0, min: -50, max: 80, step: 5, unit: "%", dependsOn: "bgMode", ...GENERATED_ONLY },
    { id: "bgBlur", cat: "background", group: "Фон", kind: "slider", label: "Размытие фона", default: 4, min: 0, max: 40, unit: " px", dependsOn: "bgMode" },
    { id: "bgDim", cat: "background", group: "Фон", kind: "slider", label: "Затемнение фона", default: 40, min: 0, max: 95, unit: "%", dependsOn: "bgMode" },
    { id: "bgSaturation", cat: "background", group: "Фон", kind: "slider", label: "Насыщенность фона", default: 100, min: 0, max: 250, unit: "%", dependsOn: "bgMode" },
    { id: "gradientSpeed", cat: "background", group: "Фон", kind: "slider", label: "Скорость анимированного фона", default: 20, min: 4, max: 120, unit: " с", dependsOn: "bgMode", activeWhen: v => ANIMATED_MODES.has(v.bgMode), activeHint: "Работает с анимированными фонами" },
    { id: "kenBurns", cat: "background", group: "Фон", kind: "toggle", label: "Медленный наезд камеры", desc: "Фон плавно приближается и отдаляется", default: false, dependsOn: "bgMode" },
    { id: "parallax", cat: "background", group: "Фон", kind: "toggle", label: "Параллакс за мышкой", desc: "Фон немного смещается вслед за курсором", default: false, dependsOn: "bgMode", ...SEE_THROUGH_ONLY },
    { id: "parallaxStrength", cat: "background", group: "Фон", kind: "slider", label: "Сила параллакса", default: 18, min: 4, max: 60, unit: " px", dependsOn: "parallax" },

    { id: "panelOpacity", cat: "background", group: "Панели поверх фона", kind: "slider", label: "Непрозрачность панелей", default: 70, min: 0, max: 100, unit: "%", dependsOn: "bgMode", ...SEE_THROUGH_ONLY },
    { id: "glassPanels", cat: "background", group: "Панели поверх фона", kind: "toggle", label: "Эффект стекла", desc: "Размытие под панелями", default: false, heavy: true, dependsOn: "bgMode", ...SEE_THROUGH_ONLY },
    { id: "glassStrength", cat: "background", group: "Панели поверх фона", kind: "slider", label: "Сила стекла", default: 14, min: 2, max: 40, unit: " px", dependsOn: "glassPanels" },
    { id: "glassSaturation", cat: "background", group: "Панели поверх фона", kind: "slider", label: "Насыщенность под стеклом", default: 140, min: 50, max: 300, step: 5, unit: "%", dependsOn: "glassPanels" },

    { id: "vignette", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Виньетка по краям", default: 0, min: 0, max: 90, unit: "%" },
    { id: "vignetteColor", cat: "background", group: "Наложения на всё окно", kind: "color", label: "Цвет виньетки", desc: "Пусто — чёрная", default: "", dependsOn: "vignette" },
    { id: "vignetteSoftness", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Где виньетка начинается", desc: "Меньше — затемнение ползёт ближе к центру", default: 55, min: 5, max: 95, unit: "%", dependsOn: "vignette" },
    { id: "grain", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Плёночное зерно", default: 0, min: 0, max: 30, unit: "%" },
    { id: "grainSize", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Размер зерна", default: 100, min: 30, max: 400, step: 10, unit: "%", dependsOn: "grain" },
    { id: "grainAnimated", cat: "background", group: "Наложения на всё окно", kind: "toggle", label: "Живое зерно", desc: "Зерно дёргается, как на плёнке (всё время перерисовывает слой)", default: false, heavy: true, dependsOn: "grain" },
    { id: "scanlines", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Полосы как на ЭЛТ-мониторе", default: 0, min: 0, max: 40, unit: "%" },
    { id: "scanlineThickness", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Толщина полос", default: 1, min: 1, max: 8, unit: " px", dependsOn: "scanlines" },
    { id: "scanlineGap", cat: "background", group: "Наложения на всё окно", kind: "slider", label: "Промежуток между полосами", default: 2, min: 1, max: 20, unit: " px", dependsOn: "scanlines" }
];

export const isSeeThrough = (v: Values) => BG_MODES.includes(v.bgMode) && v.bgMode !== "none" && !(v.bgMode === "image" && !v.bgImage?.trim());

/* stars: every star layer tiles at 400px and drifts, the last layer is the sky (explicit lists, css would otherwise repeat short ones) */
const STAR_COUNT = 40;
const STAR_SIZES = [...Array(STAR_COUNT).fill("400px 400px"), "100% 100%"].join(", ");
const STAR_LAYERS = Array.from({ length: STAR_COUNT }, (_, i) => {
    const x = (i * 37 + 11) % 100, y = (i * 61 + 7) % 100, s = i % 5 === 0 ? 2 : 1;
    return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${0.5 + (i % 5) / 10}), transparent)`;
}).join(", ");

/** percent-encode only what could end the quoted url("") string; everything else (e.g. ";" of data: urls) is kept */
const cssUrl = (s: string) => s.replace(/["\\\n\r\f]/g, m => encodeURIComponent(m));

/**
 * Every animated mode moves the whole layer with `transform`, never `background-position`:
 * a transform is handed to the compositor, so the blurred layer is rasterized once instead of
 * being repainted and re-blurred every frame. `padPx` / `padPct` say how far the layer drifts,
 * so it can be grown by that much and never show an edge. The tiled modes (stars, grid) drift
 * by exactly one tile, which loops seamlessly.
 */
interface BgLayer { css: string; anim: string; padPx: number; padPct: number; }

function layerBackground(v: Values): BgLayer {
    const c1 = col(v.bgColor1, ACCENT);
    const c2 = col(v.bgColor2, ACCENT2);
    // bgDarkness shifts how much of the accent survives the mix with near-black; 0% keeps the stock look
    const keep = (100 - Math.min(80, Math.max(-50, nz(v.bgDarkness, 0)))) / 100;
    const dark = (color: string, pct: number) => `color-mix(in srgb, ${color} ${Math.min(100, Math.max(0, Math.round(pct * keep)))}%, #05050a)`;

    switch (v.bgMode) {
        case "image": {
            const pos = BG_POSITIONS.includes(v.bgPosition) ? v.bgPosition : "center";
            return { css: `background: url("${cssUrl(String(v.bgImage ?? "").trim())}") ${pos} / cover no-repeat;`, anim: "", padPx: 0, padPct: 0 };
        }
        case "gradient":
            return { css: `background: linear-gradient(125deg, #05050a, ${dark(c1, 55)}, ${dark(c2, 45)}, #05050a, ${dark(c1, 40)}); background-size: 200% 200%;`, anim: "vv-bg-pan var(--vv-bg-speed) ease-in-out infinite alternate", padPx: 0, padPct: 18 };
        case "aurora":
            return { css: `background: radial-gradient(40% 55% at 20% 30%, ${dark(c1, 70)}, transparent 70%), radial-gradient(45% 50% at 80% 20%, ${dark(c2, 65)}, transparent 70%), radial-gradient(60% 50% at 50% 90%, ${dark(c1, 45)}, transparent 70%), #04040a; background-size: 140% 140%;`, anim: "vv-bg-aurora var(--vv-bg-speed) ease-in-out infinite alternate", padPx: 0, padPct: 22 };
        case "mesh":
            return { css: `background: radial-gradient(at 10% 10%, ${dark(c1, 60)} 0, transparent 50%), radial-gradient(at 90% 15%, ${dark(c2, 55)} 0, transparent 50%), radial-gradient(at 85% 90%, ${dark(c1, 45)} 0, transparent 50%), radial-gradient(at 15% 85%, ${dark(c2, 40)} 0, transparent 50%), #07070d;`, anim: "", padPx: 0, padPct: 0 };
        case "stars":
            return { css: `background: ${STAR_LAYERS}, radial-gradient(ellipse at bottom, ${dark(c1, 25)}, #020208 70%); background-size: ${STAR_SIZES};`, anim: "vv-bg-stars calc(var(--vv-bg-speed) * 6) linear infinite", padPx: 400, padPct: 0 };
        case "grid":
            return { css: `background: linear-gradient(transparent 0 calc(100% - 1px), ${dark(c1, 80)} calc(100% - 1px)) 0 0 / 100% 44px, linear-gradient(90deg, transparent 0 calc(100% - 1px), ${dark(c2, 70)} calc(100% - 1px)) 0 0 / 44px 100%, linear-gradient(180deg, #06020f, ${dark(c1, 30)});`, anim: "vv-bg-grid calc(var(--vv-bg-speed) / 4) linear infinite", padPx: 44, padPct: 0 };
    }
    return { css: "", anim: "", padPx: 0, padPct: 0 };
}

/** the film grain tile; `size` is a percentage, bigger = coarser grain */
function grainUrl(v: Values): string {
    const scale = Math.max(0.1, nz(v.grainSize, 100) / 100);
    const freq = num(0.9 / scale);
    return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='${(nz(v.grain, 0) / 100).toFixed(2)}'/></svg>")`;
}

export function backgroundCss(v: Values): string {
    const out: string[] = [];

    if (isSeeThrough(v)) {
        const blur = nz(v.bgBlur, 4);
        const layer = layerBackground(v);
        // three separate properties so they compose instead of overwriting each other:
        // drift uses `transform`, ken burns uses `scale`, the parallax uses `translate`
        const anims = [layer.anim, v.kenBurns ? "vv-kenburns 40s ease-in-out infinite alternate" : ""].filter(Boolean);
        const pad = `calc(-${blur * 2 + (v.parallax ? nz(v.parallaxStrength, 18) : 0) + layer.padPx}px${layer.padPct ? ` - ${layer.padPct}%` : ""})`;
        out.push(`@keyframes vv-bg-pan { to { transform: translate3d(-14%, -7%, 0); } }
@keyframes vv-bg-aurora { 0% { transform: translate3d(-7%, -4%, 0) scale(1.04); } 50% { transform: translate3d(7%, 5%, 0) scale(1.12); } 100% { transform: translate3d(-3%, 7%, 0) scale(1.06); } }
@keyframes vv-bg-stars { to { transform: translate3d(-400px, 400px, 0); } }
@keyframes vv-bg-grid { to { transform: translate3d(0, 44px, 0); } }
@keyframes vv-kenburns { from { scale: 1.04; } to { scale: 1.16; } }
:root { --vv-bg-speed: ${nz(v.gradientSpeed, 20)}s; }
html { background: #000 !important; }
body, #app-mount { background: transparent !important; }
#app-mount::before {
    content: "";
    position: fixed;
    inset: ${blur > 0 || v.parallax || layer.padPx || layer.padPct ? pad : "0"};
    z-index: -1;
    pointer-events: none;
    ${layer.css}
    filter: blur(${blur}px) brightness(${(100 - nz(v.bgDim, 40)) / 100}) saturate(${nz(v.bgSaturation, 100) / 100});
    translate: calc(var(--vv-px, 0) * ${nz(v.parallaxStrength, 18)}px) calc(var(--vv-py, 0) * ${nz(v.parallaxStrength, 18)}px);
    transition: translate .25s ease-out;
    ${anims.length ? `animation: ${anims.join(", ")};\n    will-change: transform;\n    backface-visibility: hidden;` : ""}
}
[class*="appMount_"], [class*="app_"], [class*="bg_"], [class*="layers_"], [class*="layer_"], [class*="baseLayer_"] > [class*="container_"], [class*="baseLayer_"] > [class*="container_"] > [class*="base_"], [class*="page_"], [class*="chat_"], [class*="chatContent_"] {
    background: transparent !important;
}`);
        if (v.glassPanels) {
            out.push(`[class*="sidebarList_"], [class*="guilds_"], [class*="membersWrap_"], [class*="chatContent_"], [class*="panels_"], ${"section[class*=\"title_\"]"} {
    backdrop-filter: blur(${nz(v.glassStrength, 14)}px) saturate(${Math.round(nz(v.glassSaturation, 140))}%);
}`);
        }
    }

    const animatedGrain = v.grain > 0 && v.grainAnimated === true;
    const layers: string[] = [];
    if (v.scanlines > 0) {
        const t = Math.max(1, Math.round(nz(v.scanlineThickness, 1)));
        const gap = Math.max(1, Math.round(nz(v.scanlineGap, 2)));
        layers.push(`repeating-linear-gradient(0deg, rgba(0,0,0,${nz(v.scanlines, 0) / 100}) 0 ${t}px, transparent ${t}px ${t + gap}px)`);
    }
    if (v.grain > 0 && !animatedGrain) layers.push(grainUrl(v));
    if (v.vignette > 0) {
        const soft = Math.min(99, Math.max(0, Math.round(nz(v.vignetteSoftness, 55))));
        const tint = normalizeHex(typeof v.vignetteColor === "string" ? v.vignetteColor : undefined);
        const edge = tint ? alpha(tint, nz(v.vignette, 0)) : `rgba(0,0,0,${nz(v.vignette, 0) / 100})`;
        layers.push(`radial-gradient(ellipse at center, transparent ${soft}%, ${edge} 100%)`);
    }
    if (layers.length) {
        out.push(`#app-mount::after { content: ""; position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; background: ${layers.join(", ")}; mix-blend-mode: normal; }`);
    }

    if (animatedGrain) {
        // its own layer on <html> (nothing else in the plugin uses html::after) so the jitter never
        // drags the scanlines or the vignette with it; only `transform` moves, in 8 discrete steps,
        // so the noise tile is rasterized once and the compositor does the rest
        out.push(`@keyframes vv-grain-drift {
    0% { transform: translate3d(0, 0, 0); }
    12.5% { transform: translate3d(-24px, 14px, 0); }
    25% { transform: translate3d(18px, -22px, 0); }
    37.5% { transform: translate3d(-32px, -10px, 0); }
    50% { transform: translate3d(26px, 24px, 0); }
    62.5% { transform: translate3d(-12px, -28px, 0); }
    75% { transform: translate3d(30px, 8px, 0); }
    87.5% { transform: translate3d(-20px, 26px, 0); }
    100% { transform: translate3d(0, 0, 0); }
}
html::after { content: ""; position: fixed; inset: -40px; z-index: 2147483001; pointer-events: none; background: ${grainUrl(v)} repeat; animation: vv-grain-drift .8s steps(1, end) infinite; will-change: transform; backface-visibility: hidden; }`);
        // the global pause rule in build.ts only reaches descendants of <html>, so html::after needs its own
        if (v.pauseAnimUnfocused && !v.perfMode) out.push("html:not(.app-focused)::after { animation-play-state: paused !important; }");
    }

    return out.join("\n");
}
