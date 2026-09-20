/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";

export interface WidgetConfig {
    clock: boolean;
    clockSeconds: boolean;
    clockDate: boolean;
    sessionTimer: boolean;
    fps: boolean;
    position: string; // "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center"
    style: string; // "glass" | "neon" | "minimal" | "terminal"
}

const ROOT_ID = "vv-widgets";
const STYLE_ID = "vc-venvisual-widgets";

const POSITIONS = ["top-right", "top-left", "bottom-right", "bottom-left", "top-center"];
const STYLES = ["glass", "neon", "minimal", "terminal"];

/** session start = module load */
const SESSION_START = Date.now();

const WIDGETS_CSS = `#vv-widgets {
    position: fixed;
    z-index: 2147483300;
    pointer-events: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font: 600 13px var(--font-primary, "gg sans", sans-serif);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    white-space: nowrap;
    user-select: none;
}
#vv-widgets.vv-w-pos-top-right { top: 40px; right: 16px; }
#vv-widgets.vv-w-pos-top-left { top: 40px; left: 16px; }
#vv-widgets.vv-w-pos-bottom-right { bottom: 16px; right: 16px; }
#vv-widgets.vv-w-pos-bottom-left { bottom: 16px; left: 16px; }
#vv-widgets.vv-w-pos-top-center { top: 40px; left: 50%; transform: translateX(-50%); }
@keyframes vv-w-in { from { opacity: 0; transform: translateY(-4px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes vv-w-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
#vv-widgets .vv-w-item {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 12px;
    animation: vv-w-in .35s cubic-bezier(.2, .8, .2, 1) both;
}
#vv-widgets .vv-w-date { opacity: .72; font-weight: 500; }

#vv-widgets.vv-w-style-glass .vv-w-item {
    color: #fff;
    background: rgba(18, 18, 26, .42);
    backdrop-filter: blur(12px) saturate(140%);
    border: 1px solid color-mix(in srgb, var(--vv-accent, #5865f2) 45%, rgba(255, 255, 255, .12));
    border-radius: 999px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, .25), inset 0 1px 0 rgba(255, 255, 255, .06);
    text-shadow: 0 1px 2px rgba(0, 0, 0, .35);
}

#vv-widgets.vv-w-style-neon .vv-w-item {
    color: var(--vv-accent, #5865f2);
    background: rgba(8, 8, 14, .82);
    border: 1px solid var(--vv-accent, #5865f2);
    border-radius: 8px;
    text-shadow: 0 0 4px var(--vv-accent, #5865f2), 0 0 12px color-mix(in srgb, var(--vv-accent, #5865f2) 70%, transparent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--vv-accent, #5865f2) 60%, transparent), inset 0 0 8px color-mix(in srgb, var(--vv-accent, #5865f2) 30%, transparent);
}

#vv-widgets.vv-w-style-minimal .vv-w-item {
    color: #fff;
    background: none;
    padding: 2px 4px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, .9), 0 0 8px rgba(0, 0, 0, .6);
}

#vv-widgets.vv-w-style-terminal .vv-w-item {
    color: #00ff41;
    background: #000;
    border: 1px solid rgba(0, 255, 65, .35);
    border-radius: 3px;
    font-family: "Cascadia Mono", Consolas, "JetBrains Mono", "Courier New", monospace;
    font-weight: 500;
    text-shadow: 0 0 4px rgba(0, 255, 65, .55);
    box-shadow: 0 2px 10px rgba(0, 0, 0, .5);
}
#vv-widgets.vv-w-style-terminal .vv-w-time::after {
    content: "";
    display: inline-block;
    width: .55em;
    height: 1em;
    margin-left: 3px;
    vertical-align: -2px;
    background: #00ff41;
    box-shadow: 0 0 4px rgba(0, 255, 65, .6);
    animation: vv-w-blink 1s steps(1) infinite;
}`;

let styleEl: HTMLStyleElement | null = null;
let root: HTMLDivElement | null = null;
let currentKey: string | null = null;

/* cached text nodes: writing nodeValue keeps the node in place, textContent would replace it
   and emit a childList mutation that wakes every observer watching the document */
let timeText: Text | null = null;
let dateText: Text | null = null;
let timerText: Text | null = null;
let fpsText: Text | null = null;

let tickHandle: ReturnType<typeof setTimeout> | null = null;
let rafHandle: number | null = null;

/* what the current config asked for; the loops stay stopped while the window is hidden */
let wantTicker = false;
let wantFps = false;
let visBound = false;

let showSeconds = false;
let showDate = false;

let fmtTime: Intl.DateTimeFormat | null = null;
let fmtTimeSec: Intl.DateTimeFormat | null = null;
let fmtDate: Intl.DateTimeFormat | null = null;

function timeFormatter(seconds: boolean): Intl.DateTimeFormat {
    if (seconds) {
        return fmtTimeSec ??= new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    }
    return fmtTime ??= new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

function dateFormatter(): Intl.DateTimeFormat {
    return fmtDate ??= new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "short" });
}

function pad2(n: number): string {
    return n < 10 ? "0" + n : String(n);
}

function formatSession(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `⏱ ${h}:${pad2(m)}:${pad2(s)}`;
}

function setText(node: Text | null, text: string) {
    if (node && node.nodeValue !== text) node.nodeValue = text;
}

function updateClockAndTimer() {
    const now = new Date();
    if (timeText) setText(timeText, timeFormatter(showSeconds).format(now));
    if (dateText && showDate) setText(dateText, dateFormatter().format(now));
    if (timerText) setText(timerText, formatSession(now.getTime() - SESSION_START));
}

/** self-rescheduling timeout aligned to the next second boundary (acts as a 1s interval) */
function startTicker() {
    stopTicker();
    if (!wantTicker || document.hidden) return;
    const loop = () => {
        updateClockAndTimer();
        tickHandle = setTimeout(loop, 1000 - (Date.now() % 1000) + 5);
    };
    loop();
}

function stopTicker() {
    if (tickHandle !== null) {
        clearTimeout(tickHandle);
        tickHandle = null;
    }
}

function startFps() {
    stopFps();
    if (!wantFps || document.hidden) return;
    let frames = 0;
    let last = performance.now();
    const frame = (now: number) => {
        frames++;
        const elapsed = now - last;
        if (elapsed >= 500) {
            setText(fpsText, `${Math.round((frames * 1000) / elapsed)} FPS`);
            frames = 0;
            last = now;
        }
        rafHandle = requestAnimationFrame(frame);
    };
    rafHandle = requestAnimationFrame(frame);
}

function stopFps() {
    if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
    }
}

/** a hidden window gets no widget updates at all: no interval, no animation frame loop */
function onVisibility() {
    if (document.hidden) {
        stopTicker();
        stopFps();
        return;
    }
    startTicker();
    startFps();
}

function bindVisibility(on: boolean) {
    if (on === visBound) return;
    visBound = on;
    if (on) document.addEventListener("visibilitychange", onVisibility);
    else document.removeEventListener("visibilitychange", onVisibility);
}

function makeItem(kind: string): HTMLSpanElement {
    const el = document.createElement("span");
    el.className = `vv-w-item vv-w-${kind}`;
    return el;
}

function makeText(parent: HTMLElement, initial = ""): Text {
    const node = document.createTextNode(initial);
    parent.append(node);
    return node;
}

function teardown() {
    wantTicker = false;
    wantFps = false;
    bindVisibility(false);
    stopTicker();
    stopFps();
    root?.remove();
    root = null;
    timeText = dateText = timerText = fpsText = null;
    styleEl?.remove();
    styleEl = null;
    currentKey = null;
}

export function configureWidgets(cfg: WidgetConfig | null): void {
    if (!cfg || !(cfg.clock || cfg.sessionTimer || cfg.fps)) {
        if (root || styleEl || visBound || tickHandle !== null || rafHandle !== null) teardown();
        return;
    }

    const position = POSITIONS.includes(cfg.position) ? cfg.position : "top-right";
    const style = STYLES.includes(cfg.style) ? cfg.style : "glass";
    const key = [
        cfg.clock ? 1 : 0,
        cfg.clock && cfg.clockSeconds ? 1 : 0,
        cfg.clock && cfg.clockDate ? 1 : 0,
        cfg.sessionTimer ? 1 : 0,
        cfg.fps ? 1 : 0,
        position,
        style
    ].join("|");

    // same config and everything still in place -> nothing to do
    if (key === currentKey && root?.isConnected && styleEl?.isConnected) return;

    if (!styleEl || !styleEl.isConnected) {
        styleEl?.remove();
        styleEl = createAndAppendStyle(STYLE_ID, managedStyleRootNode);
        styleEl.textContent = WIDGETS_CSS;
    }

    wantTicker = false;
    wantFps = false;
    stopTicker();
    stopFps();
    root?.remove();
    document.getElementById(ROOT_ID)?.remove(); // stale leftover (e.g. hot reload)
    timeText = dateText = timerText = fpsText = null;

    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = `vv-w-pos-${position} vv-w-style-${style}`;
    root.setAttribute("aria-hidden", "true");

    showSeconds = cfg.clockSeconds;
    showDate = cfg.clockDate;

    if (cfg.clock) {
        const item = makeItem("clock");
        const timeEl = document.createElement("span");
        timeEl.className = "vv-w-time";
        timeText = makeText(timeEl);
        item.append(timeEl);
        if (showDate) {
            const dateEl = document.createElement("span");
            dateEl.className = "vv-w-date";
            dateText = makeText(dateEl);
            item.append(dateEl);
        }
        root.append(item);
    }

    if (cfg.sessionTimer) {
        const item = makeItem("timer");
        timerText = makeText(item);
        root.append(item);
    }

    if (cfg.fps) {
        const item = makeItem("fps");
        fpsText = makeText(item, "-- FPS");
        root.append(item);
    }

    updateClockAndTimer();
    (document.body ?? document.documentElement).append(root);
    currentKey = key;

    wantTicker = cfg.clock || cfg.sessionTimer;
    wantFps = cfg.fps;
    bindVisibility(wantTicker || wantFps);
    startTicker();
    startFps();
}
