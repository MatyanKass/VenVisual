/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Canvas effects engine: ambient particles, cursor trail / ring, click effects and one-shot bursts.
// The backing store follows the quality setting (not the raw dpr), each frame only clears the boxes the previous
// one drew into, and the frame cap / resolution adapt when drawing gets expensive.
// Everything is drawn on one fixed front canvas; only when particles are on the "back" layer they get a second
// canvas behind the interface. The rAF loop only runs while something animates.
// Depth: every ambient particle carries a z in [0,1] that scales its size / speed / alpha and picks one of the
// pre-blurred sprite variants; nothing is blurred per frame. The engine never reads layout.

export interface FxConfig {
    particles: string;
    count: number;
    speed: number;
    size: number;
    opacity: number;
    wind: number;
    mouseRepel: boolean;
    layer: "front" | "back";
    /** particles get a depth z: back layers smaller / slower / dimmer / blurred, front ones bigger and sharper */
    depth: boolean;
    /** how strongly the depth changes size, speed and dimming (0..100) */
    depthAmount: number;
    /** rotation / tumble speed in percent (100 = as before) */
    spin: number;
    trail: string;
    trailLength: number;
    /** "accent" = same palette as the other effects, "custom" = trailColor1, "rainbow" */
    trailColors: string;
    trailColor1: string;
    trailWidth: number;
    /** how fast the trail melts away, percent (60 = as before) */
    trailFade: number;
    ring: boolean;
    ringSize: number;
    ringWidth: number;
    /** "" = take the color from the palette */
    ringColor: string;
    /** how far the ring lags behind the cursor (18 = as before) */
    ringLag: number;
    click: string;
    clickIntensity: number;
    /** "" = take the color from the palette */
    clickColor: string;
    /** particles per click (18 = as before) */
    clickCount: number;
    /** size of the "message sent" burst, percent */
    sendSize: number;
    colors: string;
    /** used when colors === "custom" */
    color1: string;
    color2: string;
    pauseUnfocused: boolean;
    /** frame cap: 0 = unlimited, 30 / 60 = fixed, "auto" (or a negative number) = adaptive */
    fps: number | "auto";
    /** backing store resolution: high = min(dpr, 2), medium = 1, low = 0.75, auto = adaptive 1 / 0.85 / 0.7 */
    quality: FxQuality;
    accent: string;
    accent2: string;
}

export type FxQuality = "auto" | "high" | "medium" | "low";

export interface FxStats {
    fps: number;
    drawMs: number;
    particles: number;
    scale: number;
    cap: number;
}

export type BurstKind = "confetti" | "fireworks" | "hearts" | "stars" | "sparks";

/* ------------------------------------------------------------------ types */

interface Col { css: string; r: number; g: number; b: number; }

interface Amb {
    x: number; y: number; vx: number; vy: number;
    size: number; rot: number; vr: number; phase: number;
    /** color seed 0..1 */
    c: number;
    life: number; max: number;
    /** per particle alpha / misc factor */
    a: number;
    /** depth 0 (far back) .. 1 (front); the array is kept sorted by it so the front layers draw last */
    z: number;
}

interface Column {
    x: number; y: number; speed: number; len: number; row: number;
    glyphs: number[]; c: number;
}

interface Bp {
    x: number; y: number; vx: number; vy: number;
    age: number; life: number; size: number;
    rot: number; vr: number; g: number; drag: number;
    shape: number; grp: string; c: number; phase: number;
    delay: number; boom: number;
}

interface TrailPoint { x: number; y: number; age: number; c: number; }

/* -------------------------------------------------------------- constants */

const TAU = Math.PI * 2;
const MAX_BURST = 1500;
/** particles a single frame may spawn (rocket tails / explosions run inside the update loop) */
const MAX_SPAWN = 600;
const MAX_SPRITES = 160;
const REPEL_R = 110;
const SPR = 64;
const CELL = 32;

/** dirty rectangles: how many boxes are tracked before falling back to a full clear */
const MAX_RECTS = 384;
/** padding added to every tracked box (anti-aliasing / glow bleed), CSS px */
const RECT_PAD = 3;
/** above this share of the viewport a full clear is cheaper than many small ones */
const DIRTY_LIMIT = 0.35;
/** that many live ambient particles count as "full screen" */
const FULL_PARTICLES = 150;

// Auto mode stays conservative on purpose: dropping to 30 fps looks choppier than it saves, and
// changing the resolution reallocates the backing store, which is a visible hitch every time.
const AUTO_FPS = [60, 48];
const AUTO_SCALE = [1, 1];
/** minimum delay between two quality steps (ms) */
const STEP_COOLDOWN = 2000;
/** accent colors are rounded to this many units before they invalidate sprite / palette caches */
const COL_QUANT = 8;

const SH_DOT = 0;
const SH_SPARK = 1;
const SH_STAR = 2;
const SH_HEART = 3;
const SH_RECT = 4;
const SH_BUBBLE = 5;
const SH_RING = 6;
const SH_ROCKET = 7;

const FRONT_Z = 2147483100;

const AMBIENT_KINDS = new Set(["snow", "sakura", "leaves", "rain", "stars", "fireflies", "bubbles", "hearts", "embers", "dust", "matrix", "confetti"]);
const TRAIL_KINDS = new Set(["dots", "sparkles", "rainbow", "comet", "bubbles", "stars"]);
const LINE_TRAILS = new Set(["dots", "rainbow", "comet"]);
const CLICK_KINDS = new Set(["ripple", "burst", "stars", "hearts", "confetti"]);
const BURST_KINDS = new Set<string>(["confetti", "fireworks", "hearts", "stars", "sparks"]);
const COLOR_MODES = new Set(["accent", "rainbow", "white", "natural", "custom"]);
const TRAIL_COLOR_MODES = new Set(["accent", "custom", "rainbow"]);
const QUALITIES = new Set<string>(["auto", "high", "medium", "low"]);
const FALLING = new Set(["snow", "sakura", "leaves", "rain", "confetti"]);
const RISING = new Set(["bubbles", "hearts", "embers"]);
/** blur radii (px, on the 64px sprite) of the pre-rendered depth variants */
const BLUR_STEPS = [0.9, 2.1];

const SPRITE_OF: Record<string, string> = {
    snow: "soft",
    sakura: "petal",
    leaves: "leaf",
    stars: "star",
    fireflies: "glow",
    bubbles: "bubble",
    hearts: "heart",
    embers: "glow",
    dust: "glow"
};

const GLYPHS = Array.from("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789");

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => v < a ? a : v > b ? b : v;

/* ----------------------------------------------------------------- colors */

function makeCol(r: number, g: number, b: number): Col {
    r = clamp(Math.round(r), 0, 255);
    g = clamp(Math.round(g), 0, 255);
    b = clamp(Math.round(b), 0, 255);
    return { css: `rgb(${r},${g},${b})`, r, g, b };
}

function hexCol(hex: string): Col {
    const n = parseInt(hex.slice(1, 7), 16);
    return makeCol((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function hslCol(h: number, s: number, l: number): Col {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return makeCol(f(0) * 255, f(8) * 255, f(4) * 255);
}

function mix(c: Col, t: Col, k: number): Col {
    return makeCol(c.r + (t.r - c.r) * k, c.g + (t.g - c.g) * k, c.b + (t.b - c.b) * k);
}

function rgba(c: Col, a: number): string {
    return `rgba(${c.r},${c.g},${c.b},${a})`;
}

/** Snaps a color to a coarse grid so a slowly cycling accent does not re-render sprite atlases every tick. */
function quantCol(c: Col): Col {
    return makeCol(Math.round(c.r / COL_QUANT) * COL_QUANT, Math.round(c.g / COL_QUANT) * COL_QUANT, Math.round(c.b / COL_QUANT) * COL_QUANT);
}

const WHITE = makeCol(255, 255, 255);
const WHITES = [WHITE, makeCol(238, 244, 255)];
const DEF_ACCENT = hexCol("#5865f2");
const DEF_ACCENT2 = hexCol("#eb459e");
const RAINBOW: Col[] = Array.from({ length: 24 }, (_, i) => hslCol(i * 15, 0.9, 0.65));

const NATURAL_HEX: Record<string, string[]> = {
    snow: ["#ffffff", "#eef6ff", "#dbeaff"],
    sakura: ["#ffb7c5", "#ffc9d6", "#f7a1b5", "#ffd9e2"],
    leaves: ["#e8743b", "#c0392b", "#f1c40f", "#d35400", "#b5651d"],
    rain: ["#9ec9ff", "#b8d8ff", "#cfe6ff"],
    stars: ["#fff6d5", "#ffffff", "#d6e6ff", "#ffe8a3"],
    fireflies: ["#d8ff6a", "#f4ff7a", "#b8ff5a"],
    bubbles: ["#bfe9ff", "#d9f3ff", "#a8dcff"],
    hearts: ["#ff5c8a", "#ff8fab", "#ff3366", "#ff7aa8"],
    embers: ["#ff9a3c", "#ff6a00", "#ffcf5a", "#ff4d1a"],
    dust: ["#ffe9c4", "#fff6e6", "#f5deb3"],
    matrix: ["#39ff7a"],
    confetti: ["#ff4d6d", "#ffd23f", "#3bceac", "#4d96ff", "#b388ff", "#ff9f1c"],
    star: ["#ffe066", "#fff3b0", "#ffd23f"],
    spark: ["#ffd27a", "#ffb347", "#fff0c2"],
    firework: ["#ff4d6d", "#ffd23f", "#3bceac", "#4d96ff", "#b388ff", "#ff9f1c", "#ffffff"]
};

const NATURAL: Record<string, Col[]> = {};
for (const key of Object.keys(NATURAL_HEX)) NATURAL[key] = NATURAL_HEX[key].map(hexCol);

let probe: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color the canvas understands (hex, rgb(), hsl(), named) to rgb. */
function toCol(input: string, fallback: Col): Col {
    const s = String(input ?? "").trim();
    if (!s) return fallback;
    if (/^#[0-9a-f]{6}$/i.test(s)) return hexCol(s);
    if (!probe) probe = document.createElement("canvas").getContext("2d");
    if (!probe) return fallback;
    probe.fillStyle = "#010203";
    probe.fillStyle = s;
    const out = String(probe.fillStyle);
    if (out === "#010203") return s.toLowerCase() === "#010203" ? hexCol(out) : fallback;
    if (out[0] === "#") return hexCol(out);
    const m = out.match(/[\d.]+/g);
    if (!m || m.length < 3) return fallback;
    return makeCol(+m[0], +m[1], +m[2]);
}

/* ---------------------------------------------------------------- sprites */

function renderSprite(shape: string, col: Col): HTMLCanvasElement {
    const cv = document.createElement("canvas");
    if (shape === "matrix") {
        cv.width = GLYPHS.length * CELL;
        cv.height = CELL;
        const x = cv.getContext("2d");
        if (!x) return cv;
        x.font = "bold 24px \"MS Gothic\", \"Meiryo\", \"Noto Sans JP\", monospace";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillStyle = col.css;
        GLYPHS.forEach((g, i) => x.fillText(g, i * CELL + CELL / 2, CELL / 2 + 1));
        return cv;
    }

    cv.width = SPR;
    cv.height = SPR;
    const x = cv.getContext("2d");
    if (!x) return cv;
    const c = SPR / 2;

    switch (shape) {
        case "glow": {
            const g = x.createRadialGradient(c, c, 0, c, c, c);
            g.addColorStop(0, rgba(mix(col, WHITE, 0.55), 1));
            g.addColorStop(0.18, rgba(col, 0.9));
            g.addColorStop(0.42, rgba(col, 0.32));
            g.addColorStop(1, rgba(col, 0));
            x.fillStyle = g;
            x.fillRect(0, 0, SPR, SPR);
            break;
        }
        case "soft": {
            const g = x.createRadialGradient(c, c, 0, c, c, c);
            g.addColorStop(0, rgba(col, 1));
            g.addColorStop(0.45, rgba(col, 0.85));
            g.addColorStop(1, rgba(col, 0));
            x.fillStyle = g;
            x.fillRect(0, 0, SPR, SPR);
            break;
        }
        case "halo": {
            const g = x.createRadialGradient(c, c, 0, c, c, c);
            g.addColorStop(0, rgba(col, 0));
            g.addColorStop(0.32, rgba(col, 0));
            g.addColorStop(0.5, rgba(col, 0.6));
            g.addColorStop(0.7, rgba(col, 0.16));
            g.addColorStop(1, rgba(col, 0));
            x.fillStyle = g;
            x.fillRect(0, 0, SPR, SPR);
            break;
        }
        case "petal": {
            x.translate(c, c);
            x.beginPath();
            x.moveTo(0, 28);
            x.bezierCurveTo(-24, 14, -20, -18, -6, -28);
            x.lineTo(0, -21);
            x.lineTo(6, -28);
            x.bezierCurveTo(20, -18, 24, 14, 0, 28);
            x.closePath();
            const g = x.createLinearGradient(0, 28, 0, -28);
            g.addColorStop(0, mix(col, WHITE, 0.5).css);
            g.addColorStop(1, col.css);
            x.fillStyle = g;
            x.fill();
            break;
        }
        case "leaf": {
            x.translate(c, c);
            x.beginPath();
            x.moveTo(0, -30);
            x.bezierCurveTo(20, -18, 22, 12, 0, 30);
            x.bezierCurveTo(-22, 12, -20, -18, 0, -30);
            x.closePath();
            x.fillStyle = col.css;
            x.fill();
            x.strokeStyle = "rgba(0,0,0,0.28)";
            x.lineWidth = 2;
            x.beginPath();
            x.moveTo(0, -24);
            x.lineTo(0, 30);
            x.moveTo(0, -6);
            x.lineTo(9, -14);
            x.moveTo(0, 6);
            x.lineTo(-10, -2);
            x.moveTo(0, 14);
            x.lineTo(9, 6);
            x.stroke();
            break;
        }
        case "heart": {
            x.beginPath();
            x.moveTo(32, 54);
            x.bezierCurveTo(4, 36, 2, 14, 18, 10);
            x.bezierCurveTo(26, 8, 31, 14, 32, 20);
            x.bezierCurveTo(33, 14, 38, 8, 46, 10);
            x.bezierCurveTo(62, 14, 60, 36, 32, 54);
            x.closePath();
            x.fillStyle = col.css;
            x.fill();
            x.fillStyle = "rgba(255,255,255,0.38)";
            x.beginPath();
            x.ellipse(21, 20, 5, 3.2, -0.6, 0, TAU);
            x.fill();
            break;
        }
        case "star": {
            const g = x.createRadialGradient(c, c, 0, c, c, c * 0.7);
            g.addColorStop(0, rgba(col, 0.45));
            g.addColorStop(1, rgba(col, 0));
            x.fillStyle = g;
            x.fillRect(0, 0, SPR, SPR);
            x.beginPath();
            for (let i = 0; i < 8; i++) {
                const ang = i * Math.PI / 4 - Math.PI / 2;
                const r = i % 2 ? 6 : 30;
                x.lineTo(c + Math.cos(ang) * r, c + Math.sin(ang) * r);
            }
            x.closePath();
            x.fillStyle = mix(col, WHITE, 0.35).css;
            x.fill();
            break;
        }
        case "bubble": {
            x.beginPath();
            x.arc(c, c, 27, 0, TAU);
            x.fillStyle = rgba(col, 0.12);
            x.fill();
            x.strokeStyle = rgba(col, 0.85);
            x.lineWidth = 3;
            x.stroke();
            x.beginPath();
            x.arc(c, c, 19, Math.PI * 1.1, Math.PI * 1.45);
            x.strokeStyle = "rgba(255,255,255,0.8)";
            x.lineWidth = 3.5;
            x.lineCap = "round";
            x.stroke();
            break;
        }
    }
    return cv;
}

/** Pre-renders a blurred copy of a sprite once, so the depth layers never need a per-frame filter. */
function blurSprite(src: HTMLCanvasElement, radius: number): HTMLCanvasElement {
    const cv = document.createElement("canvas");
    cv.width = src.width;
    cv.height = src.height;
    const x = cv.getContext("2d");
    if (!x) return cv;
    x.filter = `blur(${radius}px)`;
    x.drawImage(src, 0, 0);
    return cv;
}

/** Small LRU of pre-rendered sprites keyed by shape + blur level + color. */
class SpriteCache {
    private shapes = new Map<string, Map<string, { cv: HTMLCanvasElement; used: number; }>>();
    private count = 0;
    private tick = 0;

    /** blur: 0 = sharp, 1 / 2 = the pre-blurred depth variants */
    get(shape: string, col: Col, blur = 0): HTMLCanvasElement {
        const key = blur > 0 ? `${shape}~${blur}` : shape;
        let byColor = this.shapes.get(key);
        if (!byColor) {
            byColor = new Map();
            this.shapes.set(key, byColor);
        }
        const hit = byColor.get(col.css);
        if (hit) {
            hit.used = ++this.tick;
            return hit.cv;
        }
        if (this.count >= MAX_SPRITES) this.evict();
        const cv = blur > 0
            ? blurSprite(this.get(shape, col), BLUR_STEPS[Math.min(blur, BLUR_STEPS.length) - 1])
            : renderSprite(shape, col);
        byColor.set(col.css, { cv, used: ++this.tick });
        this.count++;
        return cv;
    }

    private evict() {
        let oldest = Infinity;
        let owner: Map<string, { cv: HTMLCanvasElement; used: number; }> | null = null;
        let oldKey = "";
        for (const m of this.shapes.values()) {
            for (const [k, e] of m) {
                if (e.used < oldest) {
                    oldest = e.used;
                    owner = m;
                    oldKey = k;
                }
            }
        }
        if (owner) {
            owner.delete(oldKey);
            this.count--;
        }
    }

    clear() {
        this.shapes.clear();
        this.count = 0;
    }
}

/**
 * Bounding boxes (CSS px) of everything drawn in a frame, so the next frame only has to clear those.
 * Two flat number arrays are swapped every frame, so the tracker never allocates while drawing.
 */
class DirtyRects {
    private cur: number[] = [];
    private prev: number[] = [];
    private curN = 0;
    private prevN = 0;
    private curArea = 0;
    private prevArea = 0;
    private curFull = true;
    private prevFull = true;

    /** Opens a new frame: what was collected last frame becomes what has to be cleared now. */
    begin() {
        const swap = this.prev;
        this.prev = this.cur;
        this.cur = swap;
        this.prevN = this.curN;
        this.prevArea = this.curArea;
        this.prevFull = this.curFull;
        this.curN = 0;
        this.curArea = 0;
        this.curFull = false;
    }

    /** Resize / config change: the whole canvas has to be cleared once. */
    invalidate() {
        this.curFull = true;
        this.prevFull = true;
    }

    /** This frame covers most of the screen - clear it in one go next time. */
    markFull() {
        this.curFull = true;
    }

    add(x0: number, y0: number, x1: number, y1: number) {
        if (this.curFull) return;
        if (this.curN >= MAX_RECTS * 4) {
            this.curFull = true;
            return;
        }
        const a = this.cur;
        const i = this.curN;
        a[i] = x0;
        a[i + 1] = y0;
        a[i + 2] = x1;
        a[i + 3] = y1;
        this.curN = i + 4;
        this.curArea += (x1 - x0) * (y1 - y0);
    }

    /** true while the canvas still holds something from an earlier frame */
    pending(): boolean {
        return this.prevFull || this.prevN > 0;
    }

    needsFull(viewport: number): boolean {
        return this.prevFull || this.prevArea > viewport * DIRTY_LIMIT;
    }

    list(): number[] {
        return this.prev;
    }

    count(): number {
        return this.prevN;
    }
}

function num(v: any, def: number, min: number, max: number): number {
    const n = Number(v);
    return Number.isFinite(n) ? clamp(n, min, max) : def;
}

/** "auto" and anything negative become -1 (adaptive); 0 stays unlimited. */
function normFps(v: number | "auto"): number {
    if (v === "auto") return -1;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return n < 0 ? -1 : 60;
    return Math.round(clamp(n, 0, 1000));
}

function normalize(c: FxConfig): FxConfig {
    return {
        particles: AMBIENT_KINDS.has(c.particles) ? c.particles : "none",
        count: Math.round(num(c.count, 70, 10, 400)),
        speed: num(c.speed, 100, 10, 400),
        size: num(c.size, 100, 30, 300),
        opacity: num(c.opacity, 80, 10, 100),
        wind: num(c.wind, 0, -100, 100),
        mouseRepel: !!c.mouseRepel,
        layer: c.layer === "back" ? "back" : "front",
        depth: !!c.depth,
        depthAmount: num(c.depthAmount, 60, 0, 100),
        spin: num(c.spin, 100, 0, 200),
        trail: TRAIL_KINDS.has(c.trail) ? c.trail : "none",
        trailLength: num(c.trailLength, 20, 5, 60),
        trailColors: TRAIL_COLOR_MODES.has(c.trailColors) ? c.trailColors : "accent",
        trailColor1: String(c.trailColor1 ?? ""),
        trailWidth: num(c.trailWidth, 4, 1, 12),
        trailFade: num(c.trailFade, 60, 10, 100),
        ring: !!c.ring,
        ringSize: num(c.ringSize, 16, 6, 48),
        ringWidth: num(c.ringWidth, 2, 1, 6),
        ringColor: String(c.ringColor ?? ""),
        ringLag: num(c.ringLag, 18, 5, 60),
        click: CLICK_KINDS.has(c.click) ? c.click : "none",
        clickIntensity: num(c.clickIntensity, 100, 30, 300),
        clickColor: String(c.clickColor ?? ""),
        clickCount: Math.round(num(c.clickCount, 18, 4, 60)),
        sendSize: num(c.sendSize, 100, 30, 300),
        colors: COLOR_MODES.has(c.colors) ? c.colors : "accent",
        color1: String(c.color1 ?? ""),
        color2: String(c.color2 ?? ""),
        pauseUnfocused: !!c.pauseUnfocused,
        fps: normFps(c.fps),
        quality: QUALITIES.has(c.quality) ? c.quality : "auto",
        accent: String(c.accent ?? ""),
        accent2: String(c.accent2 ?? "")
    };
}

/* ----------------------------------------------------------------- engine */

export class FxEngine {
    private cfg: FxConfig | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    /** ambient particles on the "back" layer (behind the interface); trail, ring and bursts always stay in front */
    private back: HTMLCanvasElement | null = null;
    private backCtx: CanvasRenderingContext2D | null = null;
    private w = 0;
    private h = 0;
    private dpr = 1;
    /** backing store factor actually in use (CSS px -> device px) */
    private scale = 1;
    private quality: FxQuality = "auto";
    /** normalized fps setting: -1 adaptive, 0 unlimited, otherwise a cap */
    private fpsMode = 60;

    /** boxes drawn on the front / back canvas, used to clear only what changed */
    private frontTrk = new DirtyRects();
    private backTrk = new DirtyRects();
    /** tracker the current draw calls report into */
    private trk: DirtyRects | null = null;

    private raf = 0;
    private running = false;
    private lastFrame = 0;
    private time = 0;
    private spawned = 0;

    /* adaptive quality */
    private level = 0;
    private lastStep = 0;
    private avgDraw = 0;
    private avgGap = 0;
    private lateRun = 0;
    private calmRun = 0;
    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private focused = true;
    private moveBound = false;
    private clickBound = false;

    private sprites = new SpriteCache();
    private palettes = new Map<string, Col[]>();
    private accentSrc = "";
    private accent2Src = "";
    private accent: Col = DEF_ACCENT;
    private accent2: Col = DEF_ACCENT2;

    private kind = "none";
    private amb: Amb[] = [];
    private cols: Column[] = [];

    /** eased horizontal parallax offset of the front depth layer (CSS px) */
    private para = 0;
    private bursts: Bp[] = [];
    private trail: TrailPoint[] = [];
    private trailSeq = 0;
    private trailAcc = 0;
    private trailHue = 0;

    private mx = 0;
    private my = 0;
    private lastMx = 0;
    private lastMy = 0;
    private mouseActive = false;
    private ringX = 0;
    private ringY = 0;
    private ringInit = false;

    /* ---------------------------------------------------------- public API */

    configure(input: FxConfig | null): void {
        if (!input) {
            this.teardown();
            return;
        }
        const prev = this.cfg;
        const next = normalize(input);
        this.cfg = next;
        this.fpsMode = normFps(next.fps);
        const qualityChanged = this.quality !== next.quality;
        this.quality = next.quality;
        if (qualityChanged) this.level = 0;
        if (!this.canvas) this.measure();
        else if (qualityChanged) this.rescale();
        this.frontTrk.invalidate();
        this.backTrk.invalidate();

        const accentChanged = this.applyAccent(next.accent, next.accent2);
        if (!prev || accentChanged || prev.colors !== next.colors || prev.color1 !== next.color1 || prev.color2 !== next.color2
            || prev.trailColors !== next.trailColors || prev.trailColor1 !== next.trailColor1
            || prev.ringColor !== next.ringColor || prev.clickColor !== next.clickColor) this.palettes.clear();

        if (!prev || prev.particles !== next.particles) {
            this.kind = next.particles;
            this.amb = [];
            this.cols = [];
            this.syncAmbient();
        } else if (prev.count !== next.count) {
            this.syncAmbient();
        }

        if (!prev || prev.trail !== next.trail) {
            this.trail.length = 0;
            this.trailAcc = 0;
        }
        if (!next.ring) this.ringInit = false;

        if (this.persistentNeed()) {
            this.ensureCanvas();
        } else if (this.bursts.length === 0) {
            this.removeCanvas();
        }
        this.syncBack();

        this.bindInput();
        this.kick(true);
    }

    setAccent(accent: string, accent2: string): void {
        const a = String(accent ?? "");
        const a2 = String(accent2 ?? "");
        if (this.cfg) {
            this.cfg.accent = a;
            this.cfg.accent2 = a2;
        }
        // quantized: a rainbow accent only invalidates the caches when it really moved a visible step
        if (!this.applyAccent(a, a2)) return;
        this.palettes.clear();
        // no forced redraw: a resting canvas picks the new color up on its next real frame
        this.kick(false);
    }

    getStats(): FxStats {
        return {
            fps: this.avgGap > 0 ? Math.round(1000 / this.avgGap) : 0,
            drawMs: Math.round(this.avgDraw * 100) / 100,
            particles: this.amb.length + this.cols.length + this.bursts.length + this.trail.length,
            scale: this.scale,
            cap: this.fpsCap()
        };
    }

    burstAt(x: number, y: number, kind: BurstKind, intensity = 1): void {
        const { cfg } = this;
        if (!cfg || document.hidden || !BURST_KINDS.has(kind)) return;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        // "sparks" is the typing effect and keeps its own scale; the message-send burst follows sendSize
        const user = kind === "sparks" ? 1 : cfg.sendSize / 100;
        const s = clamp((Number(intensity) || 1) * user, 0.1, 5);
        if (!this.ensureCanvas()) return;

        switch (kind) {
            case "confetti": {
                const n = Math.round(110 * s);
                for (let i = 0; i < n; i++) {
                    const ang = -Math.PI / 2 + rand(-0.85, 0.85);
                    const sp = rand(6, 15);
                    const p = this.emit(SH_RECT, "confetti", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(90, 160), rand(6, 11));
                    if (!p) break;
                    p.g = 0.24;
                    p.drag = 0.975;
                    p.vr = rand(-0.35, 0.35);
                }
                break;
            }
            case "fireworks": {
                const n = 3 + Math.floor(Math.random() * 3);
                let delay = 0;
                for (let i = 0; i < n; i++) {
                    const tx = clamp(x + rand(-260, 260), 40, Math.max(40, this.w - 40));
                    const sy = clamp(y + 10, 0, this.h);
                    const ty = clamp(y - rand(140, 380), 40, Math.max(40, sy - 60));
                    const frames = rand(26, 38);
                    const p = this.emit(SH_ROCKET, "firework", tx, sy, rand(-0.4, 0.4), (ty - sy) / frames, frames, 2);
                    if (!p) break;
                    p.delay = delay;
                    p.boom = s;
                    delay += rand(10, 22);
                }
                break;
            }
            case "hearts": {
                const n = Math.round(14 * s);
                for (let i = 0; i < n; i++) {
                    const p = this.emit(SH_HEART, "hearts", x + rand(-30, 30), y + rand(-10, 10), rand(-1.8, 1.8), rand(-3.5, -1.2), rand(70, 110), rand(9, 16));
                    if (!p) break;
                    p.g = -0.012;
                    p.drag = 0.985;
                }
                break;
            }
            case "stars": {
                const n = Math.round(16 * s);
                for (let i = 0; i < n; i++) {
                    const ang = Math.random() * TAU;
                    const sp = rand(2, 6.5);
                    const p = this.emit(SH_STAR, "star", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(50, 80), rand(7, 13));
                    if (!p) break;
                    p.g = 0.07;
                    p.drag = 0.955;
                    p.vr = rand(-0.25, 0.25);
                }
                break;
            }
            case "sparks": {
                const n = Math.max(1, Math.round(rand(3, 5) * s));
                for (let i = 0; i < n; i++) {
                    const ang = -Math.PI / 2 + rand(-1.2, 1.2);
                    const sp = rand(2, 5);
                    const p = this.emit(SH_SPARK, "spark", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(14, 26), rand(1, 1.8));
                    if (!p) break;
                    p.g = 0.16;
                    p.drag = 0.94;
                }
                break;
            }
        }
        this.kick(false);
    }

    destroy(): void {
        this.teardown();
    }

    /* ------------------------------------------------------ lifecycle bits */

    private teardown() {
        this.cfg = null;
        this.stopLoop();
        this.bindInput();
        this.removeCanvas();
        this.amb = [];
        this.cols = [];
        this.bursts = [];
        this.trail = [];
        this.kind = "none";
        this.ringInit = false;
        this.mouseActive = false;
        this.trk = null;
        this.spawned = 0;
        this.frontTrk.invalidate();
        this.backTrk.invalidate();
        this.level = 0;
        this.avgDraw = 0;
        this.avgGap = 0;
        this.lateRun = 0;
        this.calmRun = 0;
        this.sprites.clear();
        this.palettes.clear();
    }

    private applyAccent(a: string, a2: string): boolean {
        if (a === this.accentSrc && a2 === this.accent2Src) return false;
        this.accentSrc = a;
        this.accent2Src = a2;
        const c1 = quantCol(toCol(a, DEF_ACCENT));
        const c2 = quantCol(toCol(a2, DEF_ACCENT2));
        if (c1.css === this.accent.css && c2.css === this.accent2.css) return false;
        this.accent = c1;
        this.accent2 = c2;
        return true;
    }

    private persistentNeed(): boolean {
        const { cfg } = this;
        return !!cfg && (this.kind !== "none" || cfg.trail !== "none" || cfg.ring);
    }

    private measure() {
        this.dpr = clamp(window.devicePixelRatio || 1, 1, 4);
        this.w = Math.max(1, window.innerWidth);
        this.h = Math.max(1, window.innerHeight);
        this.scale = this.targetScale();
    }

    /** Backing store factor for the current quality setting. */
    private targetScale(): number {
        switch (this.quality) {
            case "high": return Math.min(this.dpr, 2);
            case "medium": return 1;
            case "low": return 0.75;
            default: return AUTO_SCALE[this.level];
        }
    }

    private fpsCap(): number {
        return this.fpsMode < 0 ? AUTO_FPS[this.level] : this.fpsMode;
    }

    /** true while either the frame cap or the resolution is allowed to adapt */
    private adaptive(): boolean {
        return this.fpsMode < 0 || this.quality === "auto";
    }

    /** Applies a new resolution factor to both canvases; a no-op when nothing changed. */
    private rescale() {
        const next = this.targetScale();
        if (Math.abs(next - this.scale) < 0.001) return;
        this.scale = next;
        this.applySize();
    }

    private applySize() {
        const { canvas } = this;
        if (!canvas) return;
        const cw = Math.max(1, Math.round(this.w * this.scale));
        const ch = Math.max(1, Math.round(this.h * this.scale));
        if (canvas.width !== cw || canvas.height !== ch) {
            canvas.width = cw;
            canvas.height = ch;
        }
        if (this.back && (this.back.width !== cw || this.back.height !== ch)) {
            this.back.width = cw;
            this.back.height = ch;
        }
        this.frontTrk.invalidate();
        this.backTrk.invalidate();
    }

    private ensureCanvas(): boolean {
        if (this.canvas) return true;
        if (!this.cfg || !document.body) return false;
        const cv = document.createElement("canvas");
        cv.id = "vv-fx";
        cv.setAttribute("aria-hidden", "true");
        const ctx = cv.getContext("2d");
        if (!ctx) return false;
        // handle for the perf tooling: document.getElementById("vv-fx").__fx.getStats()
        (cv as any).__fx = this;
        this.canvas = cv;
        this.ctx = ctx;
        this.placeCanvas();
        this.resize();
        window.addEventListener("resize", this.onResize, { passive: true });
        document.addEventListener("visibilitychange", this.onVisibility);
        window.addEventListener("focus", this.onFocus);
        window.addEventListener("blur", this.onBlur);
        this.focused = document.hasFocus();
        return true;
    }

    private placeCanvas() {
        const { canvas, cfg } = this;
        if (!canvas || !cfg || !document.body) return;
        canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;user-select:none;contain:strict;image-rendering:auto;z-index:${FRONT_Z};`;
        document.body.appendChild(canvas);
        this.frontTrk.invalidate();
        this.syncBack();
    }

    private wantsBack(): boolean {
        return !!this.cfg && this.cfg.layer === "back" && this.kind !== "none";
    }

    /** creates / removes the back layer canvas. It lives inside #app-mount so it shares a stacking context with the
     *  background layer (#app-mount::before) even when a window filter turns #app-mount into its own context. */
    private syncBack() {
        if (!this.canvas || !this.wantsBack()) {
            this.removeBack();
            return;
        }
        if (this.back) return;
        const host = document.getElementById("app-mount") ?? document.body;
        if (!host) return;
        const cv = document.createElement("canvas");
        cv.id = "vv-fx-back";
        cv.setAttribute("aria-hidden", "true");
        const ctx = cv.getContext("2d");
        if (!ctx) return;
        // z-index 0 as the first child of #app-mount: above the background layer (#app-mount::before, z-index -1),
        // below the positioned interface, and inside the same filter / stacking context as the app itself
        cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;user-select:none;contain:strict;image-rendering:auto;z-index:0;";
        cv.width = Math.max(1, Math.round(this.w * this.scale));
        cv.height = Math.max(1, Math.round(this.h * this.scale));
        host.prepend(cv);
        this.back = cv;
        this.backCtx = ctx;
        // ambient particles move off the front canvas
        this.frontTrk.invalidate();
        this.backTrk.invalidate();
    }

    private removeBack() {
        if (!this.back) return;
        this.back.remove();
        this.back = null;
        this.backCtx = null;
        this.backTrk.invalidate();
        // whatever the back canvas showed has to be drawn on the front one again
        this.frontTrk.invalidate();
    }

    private removeCanvas() {
        this.clearIdle();
        this.stopLoop();
        this.removeBack();
        if (!this.canvas) return;
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener("visibilitychange", this.onVisibility);
        window.removeEventListener("focus", this.onFocus);
        window.removeEventListener("blur", this.onBlur);
        this.canvas.remove();
        this.canvas = null;
        this.ctx = null;
    }

    private resize() {
        if (!this.canvas) return;
        const ow = this.w;
        const oh = this.h;
        this.measure();
        this.applySize();
        if (ow > 0 && oh > 0 && (ow !== this.w || oh !== this.h)) {
            const sx = this.w / ow;
            const sy = this.h / oh;
            for (const p of this.amb) {
                p.x *= sx;
                p.y *= sy;
            }
            if (this.kind === "matrix") this.syncAmbient();
        }
    }

    private bindInput() {
        const { cfg } = this;
        const particlesOn = !!cfg && cfg.particles !== "none";
        const wantMove = !!cfg && (cfg.trail !== "none" || cfg.ring
            || (particlesOn && (cfg.mouseRepel || (cfg.depth && cfg.depthAmount > 0))));
        if (wantMove !== this.moveBound) {
            if (wantMove) {
                window.addEventListener("pointermove", this.onMove, { passive: true });
                document.addEventListener("pointerout", this.onOut, { passive: true });
            } else {
                window.removeEventListener("pointermove", this.onMove);
                document.removeEventListener("pointerout", this.onOut);
                this.mouseActive = false;
            }
            this.moveBound = wantMove;
        }
        const wantClick = !!cfg && cfg.click !== "none";
        if (wantClick !== this.clickBound) {
            if (wantClick) window.addEventListener("pointerdown", this.onDown, { capture: true, passive: true });
            else window.removeEventListener("pointerdown", this.onDown, { capture: true });
            this.clickBound = wantClick;
        }
    }

    private clearIdle() {
        if (this.idleTimer != null) clearTimeout(this.idleTimer);
        this.idleTimer = null;
    }

    private scheduleIdle() {
        this.clearIdle();
        if (this.persistentNeed()) return;
        this.idleTimer = setTimeout(() => {
            this.idleTimer = null;
            if (!this.running && !this.persistentNeed() && this.bursts.length === 0) this.removeCanvas();
        }, 4000);
    }

    /* ---------------------------------------------------------- listeners */

    private onResize = () => {
        this.resize();
        this.kick(true);
    };

    private onVisibility = () => {
        if (!document.hidden) this.kick(true);
    };

    private onFocus = () => {
        this.focused = true;
        this.kick(true);
    };

    private onBlur = () => {
        this.focused = false;
    };

    private onMove = (e: PointerEvent) => {
        const { cfg } = this;
        if (!cfg) return;
        const px = e.clientX;
        const py = e.clientY;
        const wasActive = this.mouseActive;
        this.mx = px;
        this.my = py;
        this.mouseActive = true;
        if (cfg.ring && !this.ringInit) {
            this.ringX = px;
            this.ringY = py;
            this.ringInit = true;
        }
        if (cfg.trail !== "none" && !this.canRun()) {
            // paused (unfocused / hidden): nothing would age the trail, so do not collect a backlog
            this.trail.length = 0;
            this.trailAcc = 0;
        } else if (cfg.trail !== "none") {
            if (!wasActive) {
                this.lastMx = px;
                this.lastMy = py;
                this.trail.length = 0;
                this.trailAcc = 0;
            }
            this.addTrail(px, py, cfg);
        }
        this.lastMx = px;
        this.lastMy = py;
        if (cfg.trail !== "none" || cfg.ring) this.kick(false);
    };

    private onOut = (e: PointerEvent) => {
        if (e.relatedTarget) return;
        this.mouseActive = false;
        if (this.cfg?.ring) this.kick(true);
    };

    private onDown = (e: PointerEvent) => {
        const { cfg } = this;
        if (!cfg || cfg.click === "none" || e.button !== 0 || document.hidden) return;
        this.clickFx(e.clientX, e.clientY, cfg.click, cfg.clickIntensity / 100);
    };

    /* --------------------------------------------------------------- loop */

    private canRun(): boolean {
        if (document.hidden) return false;
        return !(this.cfg?.pauseUnfocused && !this.focused);
    }

    private needsFrame(): boolean {
        const { cfg } = this;
        if (!cfg) return false;
        if (this.kind !== "none" || this.bursts.length > 0 || this.trail.length > 0) return true;
        // the lagging ring is the only thing left: settle it and let the loop stop
        return cfg.ring && this.ringInit && this.mouseActive
            && Math.abs(this.mx - this.ringX) + Math.abs(this.my - this.ringY) > 0.25;
    }

    /** Starts the loop if needed. force = draw at least one frame even if nothing animates. */
    private kick(force: boolean) {
        if (!this.cfg || this.running) return;
        if (!force && !this.needsFrame()) return;
        if (!this.canvas) {
            if (!this.needsFrame() || !this.ensureCanvas()) return;
        }
        if (!this.canRun()) return;
        this.clearIdle();
        this.running = true;
        this.lastFrame = 0;
        this.spawned = 0;
        this.raf = requestAnimationFrame(this.frame);
    }

    private stopLoop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.running = false;
        this.lastFrame = 0;
    }

    private frame = (now: number) => {
        this.raf = 0;
        const { cfg, ctx } = this;
        if (!cfg || !ctx || !this.canRun()) {
            this.running = false;
            this.lastFrame = 0;
            return;
        }
        const cap = this.fpsCap();
        const interval = cap > 0 ? 1000 / cap : 0;
        if (this.lastFrame && interval && now - this.lastFrame < interval - 3) {
            this.raf = requestAnimationFrame(this.frame);
            return;
        }
        const gap = this.lastFrame ? now - this.lastFrame : 1000 / 60;
        const dt = clamp(gap / (1000 / 60), 0.05, 3);
        this.lastFrame = now;
        this.time += dt;

        const t0 = performance.now();

        this.updateAmbient(dt, cfg);
        this.updateBursts(dt);
        this.updateTrail(dt, cfg);
        this.updateRing(dt, cfg);

        const back = this.back && this.wantsBack() ? this.backCtx : null;
        const frontHas = this.trail.length > 0 || this.bursts.length > 0
            || (cfg.ring && this.ringInit && this.mouseActive)
            || (!back && this.kind !== "none");

        // begin() first: it promotes what the last frame drew to "has to be cleared now"
        this.frontTrk.begin();
        if (back) {
            this.backTrk.begin();
            this.clearDirty(back, this.backTrk);
            this.trk = this.backTrk;
            back.globalAlpha = 1;
            this.drawAmbient(back, cfg);
            back.globalAlpha = 1;
        }

        // an idle front canvas is left untouched (no clear / re-upload every frame)
        if (frontHas || this.frontTrk.pending()) {
            this.clearDirty(ctx, this.frontTrk);
            this.trk = this.frontTrk;
            ctx.globalAlpha = 1;
            if (!back) this.drawAmbient(ctx, cfg);
            this.drawTrail(ctx, cfg);
            this.drawBursts(ctx);
            this.drawRing(ctx, cfg);
            ctx.globalAlpha = 1;
        }
        this.trk = null;
        this.spawned = 0;

        this.avgDraw = this.avgDraw * 0.85 + (performance.now() - t0) * 0.15;
        this.avgGap = this.avgGap > 0 ? this.avgGap * 0.9 + gap * 0.1 : gap;
        if (this.adaptive()) this.tune(now, interval || 1000 / 60);

        if (this.needsFrame()) {
            this.raf = requestAnimationFrame(this.frame);
        } else {
            this.running = false;
            this.lastFrame = 0;
            this.scheduleIdle();
        }
    };

    /**
     * Adaptive quality: steps the frame cap (60 / 45 / 30) and, with quality "auto", the resolution factor
     * (1 / 0.85 / 0.7) down while drawing is expensive or frames arrive late, and slowly back up when it is cheap.
     */
    private tune(now: number, target: number) {
        const late = this.avgDraw > 6 || this.avgGap > target * 1.6;
        this.lateRun = late ? this.lateRun + 1 : 0;
        this.calmRun = !late && this.avgDraw < 2.2 && this.avgGap < target * 1.15 ? this.calmRun + 1 : 0;
        if (now - this.lastStep < STEP_COOLDOWN) return;
        // ~2s of consistently late frames before stepping down, ~10s of calm before stepping back up
        if (this.lateRun > 120 && this.level < AUTO_FPS.length - 1) {
            this.level++;
        } else if (this.calmRun > 600 && this.level > 0) {
            this.level--;
        } else {
            return;
        }
        this.lastStep = now;
        this.lateRun = 0;
        this.calmRun = 0;
    }

    /** Clears only the boxes the previous frame drew into, or everything when that got too expensive. */
    private clearDirty(ctx: CanvasRenderingContext2D, trk: DirtyRects) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        if (trk.needsFull(this.w * this.h)) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }
        const s = this.scale;
        const r = trk.list();
        const n = trk.count();
        for (let i = 0; i < n; i += 4) {
            const x0 = Math.floor(r[i] * s);
            const y0 = Math.floor(r[i + 1] * s);
            ctx.clearRect(x0, y0, Math.ceil(r[i + 2] * s) - x0 + 1, Math.ceil(r[i + 3] * s) - y0 + 1);
        }
    }

    /* ------------------------------------------------------------ helpers */

    private pal(group: string): Col[] {
        let p = this.palettes.get(group);
        if (p) return p;
        const { cfg } = this;
        const mode = cfg?.colors ?? "accent";
        if (group.endsWith("Light")) {
            p = this.pal(group.slice(0, -5)).map(c => mix(c, WHITE, 0.65));
        } else if (group === "trail" && cfg && cfg.trailColors !== "accent") {
            p = cfg.trailColors === "rainbow" ? RAINBOW : [quantCol(toCol(cfg.trailColor1, this.accent))];
        } else if (group === "ring" && cfg?.ringColor) {
            p = [quantCol(toCol(cfg.ringColor, this.accent))];
        } else if (group === "click" && cfg?.clickColor) {
            p = [quantCol(toCol(cfg.clickColor, this.accent))];
        } else if (mode === "rainbow") {
            p = RAINBOW;
        } else if (mode === "white") {
            p = WHITES;
        } else if (mode === "custom" && cfg) {
            const c1 = quantCol(toCol(cfg.color1, this.accent));
            const c2 = quantCol(toCol(cfg.color2, this.accent2));
            p = [c1, c2, mix(c1, c2, 0.5)];
            if (group === "confetti" || group === "firework") p.push(mix(c1, WHITE, 0.45), mix(c2, WHITE, 0.45));
        } else if (mode === "natural" && NATURAL[group]) {
            p = NATURAL[group];
        } else {
            p = [this.accent, this.accent2, mix(this.accent, WHITE, 0.5)];
            if (group === "confetti" || group === "firework") p.push(mix(this.accent2, WHITE, 0.45), WHITE);
        }
        this.palettes.set(group, p);
        return p;
    }

    /** Draws an image centered at x,y (CSS px) with optional rotation and flip scales (sy vertical, sx horizontal). */
    private put(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h: number, rot: number, sy: number, sx = 1) {
        const d = this.scale;
        if (rot === 0 && sy === 1 && sx === 1) {
            ctx.setTransform(d, 0, 0, d, x * d, y * d);
        } else {
            const c = Math.cos(rot) * d;
            const s = Math.sin(rot) * d;
            ctx.setTransform(c * sx, s * sx, -s * sy, c * sy, x * d, y * d);
        }
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        const { trk } = this;
        if (trk) {
            // a rotated sprite needs its half diagonal, an upright one just half its size
            const e = (rot === 0 ? Math.max(w, h) / 2 : Math.max(w, h) * 0.71) + RECT_PAD;
            trk.add(x - e, y - e, x + e, y + e);
        }
    }

    private base(ctx: CanvasRenderingContext2D) {
        ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    }

    /** Registers a box (center + half extents, CSS px) for the next dirty-rect clear. */
    private markBox(x: number, y: number, ex: number, ey: number) {
        const { trk } = this;
        if (trk) trk.add(x - ex, y - ey, x + ex, y + ey);
    }

    /** Registers the bounding box of a line segment. */
    private markSeg(x0: number, y0: number, x1: number, y1: number, pad: number) {
        const { trk } = this;
        if (!trk) return;
        const p = pad + RECT_PAD;
        trk.add(Math.min(x0, x1) - p, Math.min(y0, y1) - p, Math.max(x0, x1) + p, Math.max(y0, y1) + p);
    }

    private emit(shape: number, grp: string, x: number, y: number, vx: number, vy: number, life: number, size: number): Bp | null {
        if (this.bursts.length >= MAX_BURST || this.spawned >= MAX_SPAWN) return null;
        this.spawned++;
        const p: Bp = {
            x, y, vx, vy, age: 0, life, size,
            rot: Math.random() * TAU, vr: 0, g: 0, drag: 1,
            shape, grp, c: Math.random(), phase: Math.random() * TAU,
            delay: 0, boom: 0
        };
        this.bursts.push(p);
        return p;
    }

    /* ------------------------------------------------------------ depth */

    /** how strongly depth is applied, 0 = not at all */
    private depthK(cfg: FxConfig): number {
        return cfg.depth ? cfg.depthAmount / 100 : 0;
    }

    private sizeF(z: number, k: number): number {
        return 1 + (z - 0.5) * 0.8 * k;
    }

    private speedF(z: number, k: number): number {
        return 1 + (z - 0.5) * 0.7 * k;
    }

    private dimF(z: number, k: number): number {
        return 1 - (1 - z) * 0.55 * k;
    }

    /** which pre-blurred sprite variant a depth belongs to (0 = sharp) */
    private blurF(z: number, k: number): number {
        if (k < 0.3) return 0;
        return z < 0.3 ? 2 : z < 0.62 ? 1 : 0;
    }

    /* ----------------------------------------------------------- ambient */

    private syncAmbient() {
        const { cfg } = this;
        if (!cfg || this.kind === "none") {
            this.amb.length = 0;
            this.cols.length = 0;
            return;
        }
        if (this.kind === "matrix") {
            const slots = Math.max(1, Math.floor(this.w / 18));
            const n = Math.max(1, Math.min(cfg.count, slots));
            while (this.cols.length < n) this.cols.push(this.spawnColumn(true));
            this.cols.length = n;
            // spread columns over random distinct slots
            const order = Array.from({ length: slots }, (_, i) => i);
            for (let i = slots - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                const t = order[i];
                order[i] = order[j];
                order[j] = t;
            }
            const step = this.w / slots;
            this.cols.forEach((col, i) => { col.x = (order[i] + 0.5) * step; });
            return;
        }
        while (this.amb.length < cfg.count) this.amb.push(this.spawn(true));
        this.amb.length = cfg.count;
        // one depth per slot, ascending: the array stays sorted by z forever, so the front layers draw last
        const n = this.amb.length;
        for (let i = 0; i < n; i++) this.amb[i].z = (i + 0.5) / n;
    }

    private spawn(initial: boolean): Amb {
        const { w, h } = this;
        const p: Amb = {
            x: Math.random() * w,
            y: initial ? Math.random() * h : -20,
            vx: 0, vy: 0, size: 1,
            rot: Math.random() * TAU, vr: 0, phase: Math.random() * TAU,
            c: Math.random(), life: 0, max: 1, a: 1,
            z: 0.5
        };
        switch (this.kind) {
            case "snow":
                p.size = rand(1, 3.6);
                p.vy = 0.35 + p.size * 0.28;
                p.vx = rand(-0.15, 0.15);
                p.a = rand(0.55, 1);
                break;
            case "sakura":
                p.size = rand(5, 10);
                p.vy = rand(0.55, 1.2);
                p.vx = rand(0.2, 0.7);
                p.vr = rand(-0.035, 0.035);
                p.a = rand(0.75, 1);
                break;
            case "leaves":
                p.size = rand(8, 14);
                p.vy = rand(0.8, 1.6);
                p.vx = rand(-0.3, 0.3);
                p.vr = rand(-0.04, 0.04);
                break;
            case "rain":
                p.size = rand(10, 22);
                p.vy = rand(9, 15);
                p.vx = rand(-0.3, 0.3);
                p.rot = p.vx;
                p.a = rand(0.35, 0.8);
                if (!initial) p.y = -p.size - Math.random() * 40;
                break;
            case "stars":
                p.size = rand(2.5, 7);
                p.vx = rand(-0.06, 0.06);
                p.vy = rand(-0.04, 0.04);
                p.vr = rand(0.5, 1.6);
                break;
            case "fireflies":
                p.size = rand(5, 11);
                p.vy = rand(0.25, 0.7);
                if (!initial) p.y = Math.random() * h;
                break;
            case "bubbles":
                p.size = rand(4, 13);
                p.vy = -rand(0.4, 1.2);
                p.a = rand(0.5, 1);
                if (!initial) p.y = h + 20;
                break;
            case "hearts":
                p.size = rand(6, 13);
                p.vy = -rand(0.45, 1.1);
                p.a = rand(0.7, 1);
                if (!initial) p.y = h + 20;
                break;
            case "embers":
                p.size = rand(1.2, 3.2);
                p.vy = -rand(0.7, 2.2);
                p.vx = rand(-0.3, 0.3);
                p.max = rand(90, 240);
                p.life = initial ? rand(1, p.max) : p.max;
                if (!initial) p.y = h + rand(0, 20);
                break;
            case "dust":
                p.size = rand(0.8, 2.2);
                p.vx = rand(-0.15, 0.15);
                p.vy = rand(-0.12, 0.12);
                p.a = rand(0.35, 1);
                if (!initial) p.y = Math.random() * h;
                break;
            case "confetti":
                p.size = rand(5, 9);
                p.vy = rand(1, 2.4);
                p.vx = rand(-0.4, 0.4);
                p.vr = rand(-0.08, 0.08);
                p.a = rand(0.04, 0.1);
                break;
        }
        return p;
    }

    private updateAmbient(dt: number, cfg: FxConfig) {
        const { kind } = this;
        if (kind === "none") return;
        const sp = cfg.speed / 100;
        if (kind === "matrix") {
            this.updateMatrix(dt, sp, cfg);
            return;
        }
        const wind = cfg.wind / 100;
        const t = this.time;
        const base = sp * dt;
        const { w, h, mx, my } = this;
        const m = 30 * (cfg.size / 100) + 20;
        const repel = cfg.mouseRepel && this.mouseActive;
        const falling = FALLING.has(kind);
        const rising = RISING.has(kind);
        const arr = this.amb;
        const k = this.depthK(cfg);
        const spin = cfg.spin / 100;

        // horizontal parallax: eased here so the draw pass only reads it, front layers shift more
        if (k > 0) {
            const target = this.mouseActive ? (mx / w - 0.5) * -26 * k : 0;
            this.para += (target - this.para) * (1 - Math.pow(0.88, dt));
        } else if (this.para !== 0) {
            this.para = 0;
        }

        for (let i = 0; i < arr.length; i++) {
            let p = arr[i];
            const s = k > 0 ? base * this.speedF(p.z, k) : base;

            switch (kind) {
                case "snow":
                    p.x += (p.vx + Math.sin(t * 0.02 + p.phase) * 0.45 + wind * 1.8) * s;
                    p.y += p.vy * s;
                    break;
                case "sakura":
                    p.x += (p.vx + Math.sin(t * 0.016 + p.phase) * 0.7 + wind * 2.2) * s;
                    p.y += p.vy * s;
                    p.rot += p.vr * spin * s;
                    break;
                case "leaves":
                    p.x += (p.vx + Math.sin(t * 0.012 + p.phase) * 1.1 + wind * 2.4) * s;
                    p.y += (p.vy + Math.cos(t * 0.02 + p.phase) * 0.25) * s;
                    p.rot += (p.vr + Math.sin(t * 0.01 + p.phase) * 0.02) * spin * s;
                    break;
                case "rain":
                    p.rot = p.vx + wind * 5;
                    p.x += p.rot * s;
                    p.y += p.vy * s;
                    break;
                case "stars":
                    p.x += (p.vx + wind * 0.3) * s;
                    p.y += p.vy * s;
                    break;
                case "dust":
                    p.vx = clamp(p.vx + (Math.random() - 0.5) * 0.012 * dt, -0.25, 0.25);
                    p.vy = clamp(p.vy + (Math.random() - 0.5) * 0.012 * dt, -0.25, 0.25);
                    p.x += (p.vx + wind * 0.4) * s;
                    p.y += p.vy * s;
                    break;
                case "fireflies":
                    p.rot += (Math.random() - 0.5) * 0.3 * dt;
                    p.x += (Math.cos(p.rot) * p.vy + wind * 0.6) * s;
                    p.y += Math.sin(p.rot) * p.vy * s;
                    break;
                case "bubbles":
                    p.x += (Math.sin(t * 0.03 + p.phase) * 0.35 + wind * 1.2) * s;
                    p.y += p.vy * s;
                    break;
                case "hearts":
                    p.x += (Math.sin(t * 0.02 + p.phase) * 0.55 + wind * 1.2) * s;
                    p.y += p.vy * s;
                    p.rot = Math.sin(t * 0.025 + p.phase) * 0.35;
                    break;
                case "embers":
                    p.life -= s;
                    p.x += (p.vx + Math.sin(t * 0.05 + p.phase) * 0.35 + wind * 1.5) * s;
                    p.y += p.vy * s;
                    if (p.life <= 0) {
                        const { z } = p;
                        p = this.spawn(false);
                        p.z = z;
                        arr[i] = p;
                    }
                    break;
                case "confetti":
                    p.x += (p.vx + Math.sin(t * 0.03 + p.phase) * 0.6 + wind * 2) * s;
                    p.y += p.vy * s;
                    p.rot += p.vr * spin * s;
                    break;
            }

            if (repel) {
                const dx = p.x - mx;
                const dy = p.y - my;
                const d2 = dx * dx + dy * dy;
                if (d2 < REPEL_R * REPEL_R && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const f = (1 - d / REPEL_R) * 4 * dt;
                    p.x += (dx / d) * f;
                    p.y += (dy / d) * f;
                }
            }

            if (p.x < -m) p.x += w + m * 2;
            else if (p.x > w + m) p.x -= w + m * 2;

            if (p.y > h + m) {
                if (falling) {
                    p.y = -m * 0.9;
                    p.x = Math.random() * w;
                } else if (!rising) {
                    p.y -= h + m * 2;
                }
            } else if (p.y < -m) {
                if (rising) {
                    if (kind === "embers") {
                        const { z } = p;
                        p = this.spawn(false);
                        p.z = z;
                        arr[i] = p;
                    } else {
                        p.y = h + m * 0.9;
                        p.x = Math.random() * w;
                    }
                } else if (!falling) {
                    p.y += h + m * 2;
                }
            }
        }
    }

    private drawAmbient(ctx: CanvasRenderingContext2D, cfg: FxConfig) {
        const { kind } = this;
        if (kind === "none") return;
        const op = cfg.opacity / 100;
        const sz = cfg.size / 100;
        // these cover most of the viewport anyway: one full clear beats hundreds of small ones
        if (this.trk && (kind === "matrix" || kind === "rain" || this.amb.length > FULL_PARTICLES)) this.trk.markFull();
        if (kind === "matrix") {
            this.drawMatrix(ctx, op, sz);
            return;
        }
        const t = this.time;
        const pal = this.pal(kind);
        const pn = pal.length;
        const arr = this.amb;
        const d = this.scale;

        if (kind === "rain") {
            this.base(ctx);
            ctx.lineCap = "round";
            ctx.lineWidth = 1.2 * sz;
            ctx.globalAlpha = op * 0.7;
            for (let k = 0; k < pn; k++) {
                let any = false;
                ctx.beginPath();
                for (const p of arr) {
                    if (((p.c * pn) | 0) !== k) continue;
                    const len = p.size * sz;
                    const slant = p.rot / p.vy;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - slant * len, p.y - len);
                    any = true;
                }
                if (!any) continue;
                ctx.strokeStyle = pal[k].css;
                ctx.stroke();
            }
            return;
        }

        const k = this.depthK(cfg);
        const spin = cfg.spin / 100;
        const { para } = this;

        if (kind === "confetti") {
            for (const p of arr) {
                const flip = Math.cos(t * p.a + p.phase);
                const c = Math.cos(p.rot) * d;
                const sn = Math.sin(p.rot) * d;
                const px = k > 0 ? p.x + para * (0.3 + 0.7 * p.z) : p.x;
                ctx.globalAlpha = k > 0 ? Math.min(1, op * this.dimF(p.z, k)) : op;
                ctx.setTransform(c, sn, -sn * flip, c * flip, px * d, p.y * d);
                ctx.fillStyle = pal[(p.c * pn) | 0].css;
                const rw = p.size * sz * (k > 0 ? this.sizeF(p.z, k) : 1);
                const rh = rw * 0.6;
                ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
                this.markBox(px, p.y, rw * 0.6 + RECT_PAD, rw * 0.6 + RECT_PAD);
            }
            return;
        }

        const shape = SPRITE_OF[kind] ?? "glow";
        for (const p of arr) {
            const img = this.sprites.get(shape, pal[(p.c * pn) | 0], k > 0 ? this.blurF(p.z, k) : 0);
            let size = p.size * sz;
            let alpha = op * p.a;
            let rot = 0;
            let sy = 1;
            let sx = 1;
            switch (kind) {
                case "snow":
                    size *= 2.4;
                    break;
                case "sakura":
                case "leaves": {
                    size *= 2.2;
                    rot = p.rot;
                    if (k > 0) {
                        // tumbling: squashing the sprite horizontally (and through zero) reads as turning over
                        const f = Math.cos(t * 0.03 * spin + p.phase);
                        sx = f < 0 ? Math.min(f, -0.15) : Math.max(f, 0.15);
                    } else {
                        const f = Math.sin(t * 0.03 + p.phase);
                        sy = f < 0 ? Math.min(f, -0.2) : Math.max(f, 0.2);
                    }
                    break;
                }
                case "stars": {
                    const tw = 0.5 + 0.5 * Math.sin(t * 0.045 * p.vr + p.phase);
                    size *= 2.6 * (0.55 + 0.45 * tw);
                    alpha *= 0.2 + 0.8 * tw;
                    break;
                }
                case "fireflies": {
                    const pu = 0.5 + 0.5 * Math.sin(t * 0.035 + p.phase);
                    size *= 3.2 * (0.7 + 0.3 * pu);
                    alpha *= 0.12 + 0.88 * pu;
                    break;
                }
                case "bubbles":
                    size *= 2;
                    break;
                case "hearts":
                    size *= 2;
                    rot = p.rot;
                    break;
                case "embers": {
                    const lf = p.life / p.max;
                    size *= 4.5;
                    alpha *= Math.min(1, lf * 1.6) * Math.min(1, (p.max - p.life) / 12) * (0.75 + 0.25 * Math.sin(t * 0.3 + p.phase));
                    break;
                }
                case "dust":
                    size *= 4;
                    alpha *= 0.5 + 0.5 * Math.sin(t * 0.02 + p.phase);
                    break;
            }
            let px = p.x;
            if (k > 0) {
                size *= this.sizeF(p.z, k);
                alpha *= this.dimF(p.z, k);
                px += para * (0.3 + 0.7 * p.z);
            }
            if (alpha <= 0.01) continue;
            ctx.globalAlpha = alpha > 1 ? 1 : alpha;
            this.put(ctx, img, px, p.y, size, size, rot, sy, sx);
        }
    }

    /* ------------------------------------------------------------ matrix */

    private spawnColumn(initial: boolean): Column {
        const len = 6 + ((Math.random() * 12) | 0);
        const glyphs: number[] = [];
        for (let i = 0; i <= len; i++) glyphs.push((Math.random() * GLYPHS.length) | 0);
        return {
            x: 0,
            y: initial ? Math.random() * this.h * 1.2 - this.h * 0.2 : -Math.random() * this.h * 0.4,
            speed: rand(0.35, 0.9),
            len,
            row: -1,
            glyphs,
            c: Math.random()
        };
    }

    private updateMatrix(dt: number, sp: number, cfg: FxConfig) {
        const step = 15 * (cfg.size / 100) * 1.15;
        for (let i = 0; i < this.cols.length; i++) {
            const col = this.cols[i];
            col.y += col.speed * 6 * sp * dt;
            const row = Math.floor(col.y / step);
            if (row !== col.row) {
                col.glyphs.pop();
                col.glyphs.unshift((Math.random() * GLYPHS.length) | 0);
                col.row = row;
            }
            if (Math.random() < 0.03 * dt) col.glyphs[(Math.random() * col.glyphs.length) | 0] = (Math.random() * GLYPHS.length) | 0;
            if ((row - col.len - 1) * step > this.h) {
                const fresh = this.spawnColumn(false);
                fresh.x = col.x;
                fresh.row = Math.floor(fresh.y / step);
                this.cols[i] = fresh;
            }
        }
    }

    private drawMatrix(ctx: CanvasRenderingContext2D, op: number, sz: number) {
        const fs = 15 * sz;
        const step = fs * 1.15;
        const pal = this.pal("matrix");
        const light = this.pal("matrixLight");
        const pn = pal.length;
        const { h } = this;
        this.base(ctx);
        for (const col of this.cols) {
            const k = (col.c * pn) | 0;
            const atlas = this.sprites.get("matrix", pal[k]);
            const head = this.sprites.get("matrix", light[k]);
            const n = col.glyphs.length;
            for (let j = 0; j < n; j++) {
                const yy = (col.row - j) * step;
                if (yy < -step || yy > h + step) continue;
                ctx.globalAlpha = op * (j === 0 ? 1 : (1 - j / n) * 0.85);
                ctx.drawImage(j === 0 ? head : atlas, col.glyphs[j] * CELL, 0, CELL, CELL, col.x - fs / 2, yy - fs / 2, fs, fs);
            }
        }
    }

    /* ------------------------------------------------------------- trail */

    /** 60 (the default) keeps the original timing; higher melts faster, lower lets the trail linger */
    private fadeK(cfg: FxConfig): number {
        return (120 - cfg.trailFade) / 60;
    }

    private trailLife(cfg: FxConfig): number {
        return (6 + cfg.trailLength * 0.9) * this.fadeK(cfg);
    }

    private addTrail(x: number, y: number, cfg: FxConfig) {
        const dx = x - this.lastMx;
        const dy = y - this.lastMy;

        if (LINE_TRAILS.has(cfg.trail)) {
            const last = this.trail[this.trail.length - 1];
            if (last && Math.abs(last.x - x) + Math.abs(last.y - y) < 2) return;
            this.trail.push({ x, y, age: 0, c: (this.trailSeq++ % 24) / 24 });
            const max = Math.round(cfg.trailLength * 1.5) + 2;
            if (this.trail.length > max) this.trail.splice(0, this.trail.length - max);
            return;
        }

        if (document.hidden) return;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0) return;
        this.trailAcc += dist;
        const spacing = Math.max(8, 44 - cfg.trailLength * 0.6);
        const life = (18 + cfg.trailLength * 0.9) * this.fadeK(cfg);
        let guard = 0;
        while (this.trailAcc >= spacing && guard++ < 6) {
            this.trailAcc -= spacing;
            const k = Math.min(1, this.trailAcc / dist);
            const px = x - dx * k;
            const py = y - dy * k;
            // with the default "accent" the particles keep their own palette group, so nothing changes
            const custom = cfg.trailColors !== "accent";
            const wf = cfg.trailWidth / 4;
            if (cfg.trail === "sparkles") {
                const p = this.emit(SH_STAR, custom ? "trail" : "star", px + rand(-4, 4), py + rand(-4, 4), rand(-0.8, 0.8), rand(-0.8, 0.6), life * rand(0.7, 1), rand(3, 6) * wf);
                if (!p) break;
                p.g = 0.03;
                p.drag = 0.97;
                p.vr = rand(-0.1, 0.1);
            } else if (cfg.trail === "bubbles") {
                const p = this.emit(SH_BUBBLE, custom ? "trail" : "bubbles", px + rand(-3, 3), py + rand(-3, 3), rand(-0.4, 0.4), rand(-1.2, -0.4), life * rand(0.8, 1.2), rand(3, 8) * wf);
                if (!p) break;
                p.g = -0.01;
                p.drag = 0.99;
            } else {
                const p = this.emit(SH_STAR, custom ? "trail" : "star", px, py, rand(-1.5, 1.5), rand(-1.5, 1.5), life * rand(0.8, 1.1), rand(5, 10) * wf);
                if (!p) break;
                p.g = 0.05;
                p.drag = 0.96;
                p.vr = rand(-0.15, 0.15);
            }
        }
        if (this.trailAcc > spacing) this.trailAcc = 0;
    }

    private updateTrail(dt: number, cfg: FxConfig) {
        const pts = this.trail;
        if (!pts.length) return;
        if (!LINE_TRAILS.has(cfg.trail)) {
            pts.length = 0;
            return;
        }
        const life = this.trailLife(cfg);
        for (const p of pts) p.age += dt;
        let drop = 0;
        while (drop < pts.length && pts[drop].age >= life) drop++;
        if (drop) pts.splice(0, drop);
    }

    private drawTrail(ctx: CanvasRenderingContext2D, cfg: FxConfig) {
        const pts = this.trail;
        const n = pts.length;
        if (!n) return;
        const life = this.trailLife(cfg);
        const wf = cfg.trailWidth / 4;
        this.base(ctx);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (cfg.trail === "dots") {
            const pal = this.pal("trail");
            for (let i = 0; i < n; i++) {
                const p = pts[i];
                const k = 1 - p.age / life;
                if (k <= 0) continue;
                ctx.globalAlpha = k * 0.9;
                ctx.fillStyle = pal[(p.c * pal.length) | 0].css;
                const r = (1 + 4.5 * k) * wf;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, TAU);
                ctx.fill();
                this.markBox(p.x, p.y, r + RECT_PAD, r + RECT_PAD);
            }
            return;
        }

        if (cfg.trail === "rainbow") {
            this.trailHue = (this.time * 3) % 360;
            for (let i = 1; i < n; i++) {
                const a = pts[i - 1];
                const b = pts[i];
                const k = (i / n) * Math.max(0, 1 - b.age / life);
                if (k <= 0) continue;
                ctx.globalAlpha = Math.min(1, k * 1.2);
                ctx.strokeStyle = `hsl(${Math.round(this.trailHue + (n - i) * 14) % 360},95%,62%)`;
                const lw = (1 + 6 * k) * wf;
                ctx.lineWidth = lw;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                this.markSeg(a.x, a.y, b.x, b.y, lw);
            }
            return;
        }

        // comet
        const pal = this.pal("trail");
        const light = this.pal("trailLight");
        const hi = pal.length > 3 ? ((this.time / 6) | 0) % pal.length : 0;
        for (let pass = 0; pass < 2; pass++) {
            ctx.strokeStyle = pass ? light[hi].css : pal[hi].css;
            for (let i = 1; i < n; i++) {
                const a = pts[i - 1];
                const b = pts[i];
                const k = (i / n) * Math.max(0, 1 - b.age / life);
                if (k <= 0) continue;
                ctx.globalAlpha = pass ? k * 0.9 : k * 0.7;
                const lw = ((pass ? 3 : 9) * k + 0.5) * wf;
                ctx.lineWidth = lw;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                // only the wide first pass is tracked; the thin one stays inside that box
                if (!pass) this.markSeg(a.x, a.y, b.x, b.y, lw);
            }
        }
        const head = pts[n - 1];
        const hk = 1 - head.age / life;
        if (hk > 0) {
            ctx.globalAlpha = hk * 0.85;
            const hs = 34 * wf;
            this.put(ctx, this.sprites.get("glow", pal[hi]), head.x, head.y, hs, hs, 0, 1);
        }
    }

    /* -------------------------------------------------------------- ring */

    private updateRing(dt: number, cfg: FxConfig) {
        if (!cfg.ring || !this.ringInit) return;
        // ringLag 18 (the default) reproduces the original 0.78 per frame follow
        const k = 1 - Math.pow(Math.pow(0.78, 18 / cfg.ringLag), dt);
        this.ringX += (this.mx - this.ringX) * k;
        this.ringY += (this.my - this.ringY) * k;
        if (Math.abs(this.mx - this.ringX) + Math.abs(this.my - this.ringY) <= 0.25) {
            this.ringX = this.mx;
            this.ringY = this.my;
        }
    }

    private drawRing(ctx: CanvasRenderingContext2D, cfg: FxConfig) {
        if (!cfg.ring || !this.ringInit || !this.mouseActive) return;
        const pal = this.pal("ring");
        const col = pal[pal.length > 3 ? ((this.time / 6) | 0) % pal.length : 0];
        const r = cfg.ringSize;
        const halo = r * 4;
        ctx.globalAlpha = 0.55;
        this.put(ctx, this.sprites.get("halo", col), this.ringX, this.ringY, halo, halo, 0, 1);
        this.base(ctx);
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = col.css;
        ctx.lineWidth = cfg.ringWidth;
        ctx.beginPath();
        ctx.arc(this.ringX, this.ringY, r, 0, TAU);
        ctx.stroke();
        // the halo sprite (4x the radius) already covers the stroked circle
        ctx.globalAlpha = 1;
        ctx.fillStyle = mix(col, WHITE, 0.6).css;
        ctx.beginPath();
        ctx.arc(this.mx, this.my, 2.5, 0, TAU);
        ctx.fill();
        this.markBox(this.mx, this.my, 3 + RECT_PAD, 3 + RECT_PAD);
    }

    /* ------------------------------------------------------------ clicks */

    private clickFx(x: number, y: number, kind: string, s: number) {
        const { cfg } = this;
        if (!cfg || !this.ensureCanvas()) return;
        // clickCount 18 (the default) keeps the original particle counts; an own color moves them to their own palette
        const cnt = cfg.clickCount / 18;
        const own = !!cfg.clickColor;
        switch (kind) {
            case "ripple":
                for (let i = 0; i < 3; i++) {
                    const p = this.emit(SH_RING, own ? "click" : "ring", x, y, 0, 0, 38, (30 + i * 12) * s);
                    if (!p) break;
                    p.delay = i * 7;
                }
                break;
            case "burst": {
                const n = Math.max(1, Math.round(18 * s * cnt));
                for (let i = 0; i < n; i++) {
                    const ang = (i / n) * TAU + rand(-0.2, 0.2);
                    const sp = rand(2, 5.5) * (0.7 + 0.3 * s);
                    const p = this.emit(SH_DOT, own ? "click" : "dot", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(28, 48), rand(2, 4));
                    if (!p) break;
                    p.g = 0.12;
                    p.drag = 0.95;
                }
                break;
            }
            case "stars": {
                const n = Math.max(1, Math.round(8 * s * cnt));
                for (let i = 0; i < n; i++) {
                    const ang = Math.random() * TAU;
                    const sp = rand(1.5, 4);
                    const p = this.emit(SH_STAR, own ? "click" : "star", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(40, 60), rand(6, 11));
                    if (!p) break;
                    p.g = 0.06;
                    p.drag = 0.96;
                    p.vr = rand(-0.2, 0.2);
                }
                break;
            }
            case "hearts": {
                const n = Math.max(1, Math.round(6 * s * cnt));
                for (let i = 0; i < n; i++) {
                    const p = this.emit(SH_HEART, own ? "click" : "hearts", x, y, rand(-1.6, 1.6), rand(-3.2, -1.4), rand(50, 75), rand(8, 14));
                    if (!p) break;
                    p.g = -0.01;
                    p.drag = 0.985;
                }
                break;
            }
            case "confetti": {
                const n = Math.max(1, Math.round(22 * s * cnt));
                for (let i = 0; i < n; i++) {
                    const ang = -Math.PI / 2 + rand(-0.9, 0.9);
                    const sp = rand(3, 7.5);
                    const p = this.emit(SH_RECT, own ? "click" : "confetti", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(60, 95), rand(5, 9));
                    if (!p) break;
                    p.g = 0.16;
                    p.drag = 0.965;
                    p.vr = rand(-0.3, 0.3);
                }
                break;
            }
        }
        this.kick(false);
    }

    /* ------------------------------------------------------------ bursts */

    private explode(x: number, y: number, s: number, c: number) {
        const flash = this.emit(SH_DOT, "fireworkLight", x, y, 0, 0, 12, 12);
        if (flash) flash.c = c;
        const n = Math.round(rand(50, 75) * s);
        for (let i = 0; i < n; i++) {
            const ang = Math.random() * TAU;
            const sp = (0.35 + 0.65 * Math.sqrt(Math.random())) * 5.5 * (0.8 + 0.2 * Math.min(s, 3));
            const p = this.emit(SH_SPARK, "firework", x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, rand(45, 75), rand(1.4, 2.4));
            if (!p) break;
            p.g = 0.055;
            p.drag = 0.955;
            p.c = Math.random() < 0.75 ? c : Math.random();
        }
    }

    private updateBursts(dt: number) {
        const arr = this.bursts;
        if (!arr.length) return;
        let j = 0;
        // note: explode()/rocket tails push into arr while iterating; they are processed in the same pass
        for (let i = 0; i < arr.length; i++) {
            const p = arr[i];
            if (p.delay > 0) {
                p.delay -= dt;
                arr[j++] = p;
                continue;
            }
            p.age += dt;
            if (p.age >= p.life) {
                if (p.boom) this.explode(p.x, p.y, p.boom, p.c);
                continue;
            }
            if (p.drag !== 1) {
                const drag = Math.pow(p.drag, dt);
                p.vx *= drag;
                p.vy *= drag;
            }
            p.vy += p.g * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vr * dt;
            if (p.shape === SH_ROCKET) {
                // ~0.6 tail particles per 60 fps frame, independent of the real frame rate
                for (let n = 0.6 * dt; n > 0; n--) {
                    if (n < 1 && Math.random() >= n) break;
                    const tail = this.emit(SH_DOT, "firework", p.x + rand(-1, 1), p.y, rand(-0.3, 0.3), rand(0.2, 0.8), rand(10, 16), rand(0.8, 1.4));
                    if (!tail) break;
                    tail.c = p.c;
                }
            }
            arr[j++] = p;
        }
        arr.length = j;
    }

    private drawBursts(ctx: CanvasRenderingContext2D) {
        const arr = this.bursts;
        if (!arr.length) return;
        for (const p of arr) {
            if (p.delay > 0) continue;
            const q = p.age / p.life;
            const k = 1 - q;
            if (k <= 0) continue;
            const pal = this.pal(p.grp);
            const col = pal[(p.c * pal.length) | 0];
            switch (p.shape) {
                case SH_DOT: {
                    const ds = p.size * 4 * (0.5 + 0.5 * k);
                    ctx.globalAlpha = k;
                    this.put(ctx, this.sprites.get("glow", col), p.x, p.y, ds, ds, 0, 1);
                    break;
                }
                case SH_SPARK: {
                    let alpha = Math.min(1, k * 1.5);
                    if (p.grp === "firework" && k < 0.45) alpha *= 0.55 + 0.45 * Math.sin(p.age * 0.9 + p.phase);
                    if (alpha <= 0.01) break;
                    this.base(ctx);
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = col.css;
                    ctx.lineWidth = p.size;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
                    ctx.stroke();
                    this.markSeg(p.x, p.y, p.x - p.vx * 3, p.y - p.vy * 3, p.size);
                    break;
                }
                case SH_STAR: {
                    const ds = p.size * 2.4 * (0.6 + 0.4 * k);
                    ctx.globalAlpha = Math.min(1, k * 2.5);
                    this.put(ctx, this.sprites.get("star", col), p.x, p.y, ds, ds, p.rot, 1);
                    break;
                }
                case SH_HEART: {
                    const ds = p.size * 2;
                    ctx.globalAlpha = Math.min(1, k * 2.5);
                    this.put(ctx, this.sprites.get("heart", col), p.x, p.y, ds, ds, Math.sin(p.age * 0.08 + p.phase) * 0.3, 1);
                    break;
                }
                case SH_RECT: {
                    const d = this.scale;
                    const flip = Math.cos(p.age * 0.25 + p.phase);
                    const c = Math.cos(p.rot) * d;
                    const sn = Math.sin(p.rot) * d;
                    ctx.setTransform(c, sn, -sn * flip, c * flip, p.x * d, p.y * d);
                    ctx.globalAlpha = Math.min(1, k * 3);
                    ctx.fillStyle = col.css;
                    ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
                    this.markBox(p.x, p.y, p.size * 0.6 + RECT_PAD, p.size * 0.6 + RECT_PAD);
                    break;
                }
                case SH_BUBBLE: {
                    const ds = p.size * 2 * (1 + 0.3 * q);
                    ctx.globalAlpha = Math.min(1, k * 2);
                    this.put(ctx, this.sprites.get("bubble", col), p.x, p.y, ds, ds, 0, 1);
                    break;
                }
                case SH_RING: {
                    const r = p.size * (1 - k * k * k);
                    if (r <= 0.5) break;
                    this.base(ctx);
                    ctx.globalAlpha = k * 0.9;
                    ctx.strokeStyle = col.css;
                    const lw = 3 * k + 0.5;
                    ctx.lineWidth = lw;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, 0, TAU);
                    ctx.stroke();
                    this.markBox(p.x, p.y, r + lw + RECT_PAD, r + lw + RECT_PAD);
                    break;
                }
                case SH_ROCKET: {
                    ctx.globalAlpha = 1;
                    const lp = this.pal("fireworkLight");
                    this.put(ctx, this.sprites.get("glow", lp[(p.c * lp.length) | 0]), p.x, p.y, 14, 14, 0, 1);
                    this.base(ctx);
                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = col.css;
                    ctx.lineWidth = p.size;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
                    ctx.stroke();
                    this.markSeg(p.x, p.y, p.x - p.vx * 4, p.y - p.vy * 4, p.size);
                    break;
                }
            }
        }
    }
}
