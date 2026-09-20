/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Feature, normalizeHex, Values } from "../registry";
import { backgroundFeatures } from "./background";
import { effectFeatures } from "./effects";
import { extraFeatures } from "./extras";
import { hoverFeatures } from "./hover";
import { interfaceFeatures } from "./interface";
import { messageFeatures } from "./messages";
import { nameFeatures } from "./names";
import { themeFeatures } from "./theme";

export const FEATURES: Feature[] = [
    ...themeFeatures,
    ...hoverFeatures,
    ...messageFeatures,
    ...nameFeatures,
    ...backgroundFeatures,
    ...effectFeatures,
    ...interfaceFeatures,
    ...extraFeatures
];

export const FEATURE_BY_ID = new Map(FEATURES.map(f => [f.id, f]));

export const DEFAULTS: Values = Object.fromEntries(FEATURES.map(f => [f.id, f.default]));

/** stored values merged over defaults; unknown ids and invalid values (wrong type, unknown option, bad color) are dropped */
export function withDefaults(stored: Values | undefined): Values {
    const out = { ...DEFAULTS };
    if (!stored || typeof stored !== "object") return out;
    for (const [id, val] of Object.entries(stored)) {
        const f = FEATURE_BY_ID.get(id);
        if (!f) continue;
        switch (f.kind) {
            case "toggle":
                if (typeof val === "boolean") out[id] = val;
                break;
            case "select":
                if (typeof val === "string" && f.options.some(o => o.value === val)) out[id] = val;
                break;
            case "slider":
                if (typeof val === "number" && Number.isFinite(val)) {
                    const step = f.step ?? 1;
                    const decimals = (String(step).split(".")[1] ?? "").length;
                    const clamped = Math.min(f.max, Math.max(f.min, val));
                    const snapped = f.min + Math.round((clamped - f.min) / step) * step;
                    out[id] = Math.min(f.max, Number(snapped.toFixed(decimals)));
                }
                break;
            case "color":
                if (typeof val === "string") {
                    const hex = normalizeHex(val);
                    if (hex) out[id] = hex;
                    else if (val.trim() === "" && f.default === "") out[id] = "";
                }
                break;
            case "text":
                if (typeof val === "string") out[id] = val;
                break;
        }
    }
    return out;
}

/** the option currently has an effect: its own condition holds and the whole dependsOn chain is on */
export function isActive(f: Feature, v: Values, depth = 0): boolean {
    if (depth > 8) return true;
    if (f.activeWhen && !f.activeWhen(v)) return false;
    if (!f.dependsOn) return true;
    const parent = FEATURE_BY_ID.get(f.dependsOn);
    return isOn(v[f.dependsOn]) && (!parent || isActive(parent, v, depth + 1));
}

/** only values that differ from defaults (for export) */
export function diffFromDefaults(v: Values): Values {
    return Object.fromEntries(Object.entries(v).filter(([id, val]) => FEATURE_BY_ID.has(id) && DEFAULTS[id] !== val));
}

/** a feature counts as "on" for dependsOn purposes */
export const isOn = (val: unknown) => !(val === false || val === "none" || val === "off" || val === "" || val === 0);
