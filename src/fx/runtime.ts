/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { SelectedChannelStore, showToast, UserStore } from "@webpack/common";

import { FALLBACK_ACCENT, FALLBACK_ACCENT2 } from "../build";
import { isSeeThrough } from "../features/background";
import { effectiveThemeId, resolvePalette } from "../features/theme";
import { Values } from "../registry";
import { BurstKind, FxConfig, FxEngine } from "./engine";
import { configureKeywords, MessageTags } from "./keywords";
import { configureWidgets, WidgetConfig } from "./widgets";

interface RuntimeOpts {
    getValues: () => Values;
    rebuild: () => void;
}

type Timer = ReturnType<typeof setTimeout>;
type Interval = ReturnType<typeof setInterval>;

const LIVE_ACCENT = "--vv-live-accent";
const LIVE_ACCENT2 = "--vv-live-accent2";
/** hue step of the rainbow accent per update, and the update interval bounds (each update restyles the whole page) */
const RAINBOW_STEP_DEG = 3;
const RAINBOW_MIN_MS = 250;
const RAINBOW_MAX_MS = 1000;
/** the canvas engine gets the hue in coarse buckets so its sprite cache is reused instead of re-rendered */
const ENGINE_HUE_BUCKET = 15;
const TEXTBOX = '[class*="slateTextArea_"], [role="textbox"]';
const CHAT_INPUT = '[class*="channelTextArea_"]';
const CHAT_CONTENT = '[class*="chatContent_"]';
const SEEN_CAP = 50;

let opts: RuntimeOpts | null = null;
let engine: FxEngine | null = null;
let paused = false;

/* engine: config key without accents (null = disabled) + last accent pair */
let engineKey: string | null = null;
let engineAccent = "";

let widgetsKey: string | null = null;
let keywordsKey: string | null = null;

/* rainbow accent */
let rainbowOn = false;
let rainbowTimer: Interval | null = null;
let rainbowVisBound = false;
let rainbowMs = 0;
let rainbowHue = 0;
let rainbowLast = 0;
let rainbowSpeed = 20;
let rainbowSat = 85;
let rainbowPauseUnfocused = true;

/* auto theme */
let autoThemeTimer: Interval | null = null;
let lastThemeId = "";

/* parallax */
let parallaxOn = false;
let parallaxFrame = 0;
let pointerX = 0;
let pointerY = 0;

/* listeners */
let hotkeyOn = false;
let sparksOn = false;

/* one-shot effects */
let shakeTimer: Timer | null = null;
let flashEl: HTMLElement | null = null;
let flashTimer: Timer | null = null;
const oneShotTimers = new Set<Timer>();
const seenSends = new Set<string>();

function safe(what: string, fn: () => void) {
    try {
        fn();
    } catch (e) {
        console.error(`[VenVisual] ${what} failed:`, e);
    }
}

function later(fn: () => void, ms: number): Timer {
    const id = setTimeout(() => {
        oneShotTimers.delete(id);
        fn();
    }, ms);
    oneShotTimers.add(id);
    return id;
}

/* ---------- engine ---------- */

function setEngine(cfg: FxConfig | null) {
    const eng = engine;
    if (!eng) return;

    if (!cfg) {
        if (engineKey !== null) {
            engineKey = null;
            engineAccent = "";
            safe("fx engine", () => eng.configure(null));
        }
        return;
    }

    const { accent, accent2, ...rest } = cfg;
    const key = JSON.stringify(rest);
    const accentPair = `${accent}|${accent2}`;

    if (key !== engineKey) {
        engineKey = key;
        engineAccent = accentPair;
        safe("fx engine", () => eng.configure(cfg));
    } else if (accentPair !== engineAccent) {
        engineAccent = accentPair;
        safe("fx engine accent", () => eng.setAccent(accent, accent2));
    }
}

function engineConfig(v: Values): FxConfig | null {
    const visual = v.particles !== "none" || v.cursorTrail !== "none" || !!v.cursorRing || v.clickEffect !== "none";
    if (!visual && v.sendEffect === "none" && !v.typingSparks) return null;

    let accent: string, accent2: string;
    if (rainbowTimer) {
        [accent, accent2] = rainbowColors(ENGINE_HUE_BUCKET);
    } else {
        const palette = resolvePalette(v);
        accent = palette?.accent ?? FALLBACK_ACCENT;
        accent2 = palette?.accent2 ?? FALLBACK_ACCENT2;
    }

    return {
        particles: String(v.particles),
        count: Number(v.particleCount),
        speed: Number(v.particleSpeed),
        size: Number(v.particleSize),
        opacity: Number(v.particleOpacity),
        wind: Number(v.particleWind),
        mouseRepel: !!v.particleMouse,
        layer: v.fxLayer === "back" ? "back" : "front",
        trail: String(v.cursorTrail),
        trailLength: Number(v.trailLength),
        ring: !!v.cursorRing,
        click: String(v.clickEffect),
        clickIntensity: Number(v.clickIntensity),
        colors: String(v.fxColors),
        pauseUnfocused: !!v.fxPauseUnfocused,
        fps: v.fxFps === "auto" ? -1 : Number(v.fxFps) || 0,
        quality: v.fxQuality,
        accent,
        accent2
    };
}

/* ---------- widgets & keywords ---------- */

function widgetConfig(v: Values): WidgetConfig | null {
    if (!v.clock && !v.sessionTimer && !v.fpsCounter) return null;
    return {
        clock: !!v.clock,
        clockSeconds: !!v.clockSeconds,
        clockDate: !!v.clockDate,
        sessionTimer: !!v.sessionTimer,
        fps: !!v.fpsCounter,
        position: String(v.widgetPosition),
        style: String(v.widgetStyle)
    };
}

function setWidgets(cfg: WidgetConfig | null) {
    const key = cfg ? JSON.stringify(cfg) : null;
    if (key === widgetsKey) return;
    widgetsKey = key;
    safe("widgets", () => configureWidgets(cfg));
}

function parseKeywords(list: unknown): string[] | null {
    const words = String(list ?? "").split(",").map(w => w.trim()).filter(Boolean);
    return words.length ? words : null;
}

function setKeywords(cfg: MessageTags | null) {
    const key = cfg ? JSON.stringify(cfg) : null;
    if (key === keywordsKey) return;
    keywordsKey = key;
    safe("keywords", () => configureKeywords(cfg));
}

/** which message marks the stylesheet currently needs; all of them are set as attributes, never matched with :has() */
function messageTags(v: Values, pausedNow: boolean): MessageTags | null {
    if (pausedNow) return null;
    const cfg: MessageTags = {
        words: (v.kwEnabled && parseKeywords(v.kwList)) || [],
        links: !!v.linkMsgHighlight,
        attachments: !!v.attachmentHighlight,
        system: !!v.systemMsgDim
    };
    return cfg.words.length || cfg.links || cfg.attachments || cfg.system ? cfg : null;
}

/* ---------- rainbow accent ---------- */

/** bucket > 0 snaps the hue to multiples of bucket degrees */
function rainbowColors(bucket = 0): [string, string] {
    const hue = bucket > 0 ? (Math.round(rainbowHue / bucket) * bucket) % 360 : rainbowHue;
    const h1 = hue.toFixed(1);
    const h2 = ((hue + 60) % 360).toFixed(1);
    return [`hsl(${h1}, ${rainbowSat}%, 64%)`, `hsl(${h2}, ${rainbowSat}%, 64%)`];
}

function writeRainbow() {
    const [a, b] = rainbowColors();
    // an inline custom property on <html>: cheaper than rewriting a stylesheet
    const { style } = document.documentElement;
    style.setProperty(LIVE_ACCENT, a);
    style.setProperty(LIVE_ACCENT2, b);

    const eng = engine;
    if (eng && engineKey !== null) {
        const [ea, eb] = rainbowColors(ENGINE_HUE_BUCKET);
        const pair = `${ea}|${eb}`;
        if (pair !== engineAccent) {
            engineAccent = pair;
            safe("fx engine accent", () => eng.setAccent(ea, eb));
        }
    }
}

function rainbowTick() {
    const now = Date.now();
    const elapsed = rainbowLast ? now - rainbowLast : rainbowMs;
    rainbowLast = now;
    rainbowHue = (rainbowHue + 360 * Math.min(elapsed, 5000) / 1000 / rainbowSpeed) % 360;
    if (document.hidden || (rainbowPauseUnfocused && !document.hasFocus())) return;
    writeRainbow();
}

function startRainbowTimer() {
    if (rainbowTimer || document.hidden) return;
    rainbowLast = Date.now();
    rainbowTimer = setInterval(rainbowTick, rainbowMs);
}

function stopRainbowTimer() {
    if (!rainbowTimer) return;
    clearInterval(rainbowTimer);
    rainbowTimer = null;
}

/** a hidden window gets no ticks at all, the accent simply resumes where it stopped */
function onRainbowVisibility() {
    if (document.hidden) stopRainbowTimer();
    else if (rainbowOn) startRainbowTimer();
}

function bindRainbowVisibility(on: boolean) {
    if (on === rainbowVisBound) return;
    rainbowVisBound = on;
    if (on) document.addEventListener("visibilitychange", onRainbowVisibility);
    else document.removeEventListener("visibilitychange", onRainbowVisibility);
}

function enableRainbow(v: Values) {
    rainbowSpeed = Math.max(1, Number(v.rainbowSpeed) || 20);
    rainbowSat = Math.min(100, Math.max(0, Number(v.rainbowSat) || 0));
    rainbowPauseUnfocused = !!v.fxPauseUnfocused;
    const ms = Math.round(Math.min(RAINBOW_MAX_MS, Math.max(RAINBOW_MIN_MS, rainbowSpeed * 1000 * RAINBOW_STEP_DEG / 360)));
    if (rainbowTimer && ms !== rainbowMs) stopRainbowTimer();
    rainbowMs = ms;
    rainbowOn = true;
    bindRainbowVisibility(true);
    startRainbowTimer();
    writeRainbow();
}

function disableRainbow() {
    rainbowOn = false;
    bindRainbowVisibility(false);
    stopRainbowTimer();
    rainbowLast = 0;
    const { style } = document.documentElement;
    style.removeProperty(LIVE_ACCENT);
    style.removeProperty(LIVE_ACCENT2);
}

/* ---------- auto theme ---------- */

function autoThemeTick() {
    if (!opts) return;
    const v = opts.getValues();
    if (!v.autoTheme) return;
    const id = effectiveThemeId(v);
    if (id !== lastThemeId) {
        lastThemeId = id;
        opts.rebuild();
    }
}

function setAutoTheme(v: Values | null) {
    if (v?.autoTheme) {
        lastThemeId = effectiveThemeId(v);
        autoThemeTimer ??= setInterval(autoThemeTick, 60_000);
    } else if (autoThemeTimer) {
        clearInterval(autoThemeTimer);
        autoThemeTimer = null;
    }
}

/* ---------- parallax ---------- */

const clampUnit = (n: number) => Math.min(1, Math.max(-1, n));

function parallaxFrameCb() {
    parallaxFrame = 0;
    if (!parallaxOn) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    // inverted: the background drifts away from the cursor
    const px = clampUnit(1 - (pointerX / w) * 2);
    const py = clampUnit(1 - (pointerY / h) * 2);
    const { style } = document.documentElement;
    style.setProperty("--vv-px", px.toFixed(3));
    style.setProperty("--vv-py", py.toFixed(3));
}

function onPointerMove(e: PointerEvent) {
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(parallaxFrameCb);
}

function setParallax(on: boolean) {
    if (on === parallaxOn) return;
    parallaxOn = on;
    if (on) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
    } else {
        window.removeEventListener("pointermove", onPointerMove);
        if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
        parallaxFrame = 0;
        const { style } = document.documentElement;
        style.removeProperty("--vv-px");
        style.removeProperty("--vv-py");
    }
}

/* ---------- panic hotkey ---------- */

function onHotkey(e: KeyboardEvent) {
    if (!e.ctrlKey || !e.altKey || e.shiftKey || e.metaKey || e.code !== "KeyV") return;
    // on Windows AltGr is reported as Ctrl+Alt: AltGr+V types "@" on Hungarian / Croatian / Slovenian layouts, leave that alone
    const key = e.key.toLowerCase();
    if (e.getModifierState?.("AltGraph") && key.length === 1 && key !== "v" && key !== "м") return;
    e.preventDefault();
    if (e.repeat) return;
    paused = !paused;
    opts?.rebuild();
    safe("toast", () => showToast(paused ? "VenVisual: эффекты выключены" : "VenVisual: эффекты включены"));
}

function setHotkey(on: boolean) {
    if (on === hotkeyOn) return;
    hotkeyOn = on;
    if (on) window.addEventListener("keydown", onHotkey, true);
    else window.removeEventListener("keydown", onHotkey, true);
}

/* ---------- typing sparks ---------- */

function caretPoint(box: Element): { x: number; y: number; } {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (box.contains(range.startContainer)) {
            const rects = range.getClientRects();
            const rect = rects.length ? rects[0] : range.getBoundingClientRect();
            if (rect.left || rect.top) return { x: rect.left, y: rect.top + rect.height / 2 };
        }
    }
    const r = box.getBoundingClientRect();
    return { x: r.left, y: r.top + r.height / 2 };
}

function onTypingKey(e: KeyboardEvent) {
    const eng = engine;
    if (!eng || engineKey === null || paused) return;

    const { key, target } = e;
    const printable = key.length === 1
        ? !e.metaKey && !(e.ctrlKey && !e.altKey)
        : key === "Backspace" || key === "Enter";
    if (!printable || !(target instanceof Element)) return;

    const box = target.closest(TEXTBOX);
    if (!box) return;

    const { x, y } = caretPoint(box);
    safe("typing sparks", () => eng.burstAt(x, y, "sparks", 0.6));
}

function setTypingSparks(on: boolean) {
    if (on === sparksOn) return;
    sparksOn = on;
    if (on) document.addEventListener("keydown", onTypingKey, { capture: true, passive: true });
    else document.removeEventListener("keydown", onTypingKey, true);
}

/* ---------- mention flash ---------- */

function showFlash() {
    if (flashEl?.isConnected) {
        // a second mention restarts the same overlay instead of stacking another one on top
        flashEl.style.animation = "none";
        void flashEl.offsetWidth;
        flashEl.style.animation = "";
    } else {
        flashEl?.remove();
        flashEl = document.createElement("div");
        flashEl.className = "vv-flash";
        document.body.appendChild(flashEl);
    }

    // one removal timer at a time, otherwise the first mention cuts the restarted flash short
    if (flashTimer) {
        clearTimeout(flashTimer);
        oneShotTimers.delete(flashTimer);
    }
    flashTimer = later(() => {
        flashTimer = null;
        flashEl?.remove();
        flashEl = null;
    }, 1200);
}

/* ---------- public api ---------- */

export function isPaused() {
    return paused;
}

export function startRuntime(o: { getValues: () => Values; rebuild: () => void; }) {
    opts = o;
    engine ??= new FxEngine();
}

export function updateRuntime(v: Values, pausedNow: boolean) {
    if (!opts) return;
    engine ??= new FxEngine();

    // never leave the user stuck in paused state without a way to unpause
    if (paused && !v.panicHotkey) {
        paused = false;
        queueMicrotask(() => opts?.rebuild());
    }

    const off = pausedNow || !!v.perfMode;

    setHotkey(!!v.panicHotkey);
    setAutoTheme(v);

    if (!off && v.rainbowAccent) enableRainbow(v);
    else disableRainbow();

    setParallax(!off && isSeeThrough(v) && !!v.parallax);
    setKeywords(messageTags(v, pausedNow));
    // economy mode keeps the cheap clock / timer, only the FPS counter (its own animation frame loop) goes away
    setWidgets(pausedNow ? null : widgetConfig(v.perfMode ? { ...v, fpsCounter: false } : v));
    setEngine(off ? null : engineConfig(v));
    setTypingSparks(!off && !!v.typingSparks);
}

export function stopRuntime() {
    setTypingSparks(false);
    setHotkey(false);
    setParallax(false);
    disableRainbow();
    setAutoTheme(null);

    widgetsKey = null;
    keywordsKey = null;
    safe("widgets", () => configureWidgets(null));
    safe("keywords", () => configureKeywords(null));

    const eng = engine;
    if (eng) safe("fx engine", () => eng.destroy());
    engine = null;
    engineKey = null;
    engineAccent = "";

    for (const id of oneShotTimers) clearTimeout(id);
    oneShotTimers.clear();
    shakeTimer = null;
    flashTimer = null;
    flashEl?.remove();
    flashEl = null;
    document.querySelectorAll(".vv-flash").forEach(el => el.remove());
    document.querySelectorAll(".vv-shake").forEach(el => el.classList.remove("vv-shake"));

    seenSends.clear();
    paused = false;
    opts = null;
}

/**
 * The entry animation is scoped to `[data-vv-new]` so it runs only on messages that just arrived.
 * Otherwise every message mounted while scrolling back through history animates as well, which
 * makes scrolling far more expensive than it needs to be.
 */
function tagNewMessage(channelId: string, messageId: unknown) {
    if (messageId == null) return;
    const id = `chat-messages-${channelId}-${String(messageId)}`;
    let tries = 0;
    const attempt = () => {
        const li = document.getElementById(id);
        if (li) {
            li.setAttribute("data-vv-new", "");
            later(() => li.removeAttribute("data-vv-new"), 1500);
        } else if (++tries < 4) {
            later(attempt, 60);
        }
    };
    attempt();
}

export function onMessageCreate(e: { channelId: string; message: any; optimistic?: boolean; }) {
    if (!opts || paused) return;
    const { message } = e;
    if (!message) return;

    if (opts.getValues().msgAppear !== "off") tagNewMessage(e.channelId, message.id);

    const me: string | undefined = UserStore?.getCurrentUser()?.id;
    if (!me) return;

    const authorId = message.author?.id;

    if (authorId === me) {
        if (e.channelId !== SelectedChannelStore?.getChannelId()) return;

        const rawKey = message.nonce ?? message.id;
        if (rawKey != null) {
            const dedupeKey = String(rawKey);
            if (seenSends.has(dedupeKey)) return;
            seenSends.add(dedupeKey);
            if (seenSends.size > SEEN_CAP) {
                const oldest = seenSends.values().next().value;
                if (oldest !== undefined) seenSends.delete(oldest);
            }
        }

        const v = opts.getValues();
        const eng = engine;
        if (v.sendEffect === "none" || !eng) return;

        let x = window.innerWidth / 2;
        let y = window.innerHeight - 80;
        const input = document.querySelector(CHAT_INPUT);
        if (input) {
            const r = input.getBoundingClientRect();
            if (r.width > 0) {
                x = r.left + r.width / 2;
                y = r.top;
            }
        }
        safe("send effect", () => eng.burstAt(x, y, v.sendEffect as BurstKind));
        return;
    }

    if (e.optimistic || !Array.isArray(message.mentions)) return;
    const mentioned = message.mentions.some((u: any) => (typeof u === "string" ? u : u?.id) === me);
    if (!mentioned) return;

    const v = opts.getValues();

    if (v.mentionFlash) showFlash();

    if (v.mentionShake) {
        const chat = document.querySelector<HTMLElement>(CHAT_CONTENT);
        if (chat) {
            // restart the animation if it is already running
            chat.classList.remove("vv-shake");
            void chat.offsetWidth;
            chat.classList.add("vv-shake");
            // one removal timer at a time, otherwise an earlier mention cuts the restarted shake short
            if (shakeTimer) {
                clearTimeout(shakeTimer);
                oneShotTimers.delete(shakeTimer);
            }
            shakeTimer = later(() => {
                shakeTimer = null;
                chat.classList.remove("vv-shake");
            }, 500);
        }
    }
}
