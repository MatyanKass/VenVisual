/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Feature, Values } from "../registry";
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

/** stored values merged over defaults, with unknown / wrongly typed entries dropped */
export function withDefaults(stored: Values | undefined): Values {
    const out = { ...DEFAULTS };
    if (!stored) return out;
    for (const [id, val] of Object.entries(stored)) {
        const f = FEATURE_BY_ID.get(id);
        if (!f) continue;
        if (f.kind === "toggle" ? typeof val === "boolean"
            : f.kind === "slider" ? typeof val === "number" && Number.isFinite(val)
                : typeof val === "string") {
            out[id] = f.kind === "slider" ? Math.min(f.max, Math.max(f.min, val)) : val;
        }
    }
    return out;
}

/** only values that differ from defaults (for export) */
export function diffFromDefaults(v: Values): Values {
    return Object.fromEntries(Object.entries(v).filter(([id, val]) => FEATURE_BY_ID.has(id) && DEFAULTS[id] !== val));
}

/** a feature counts as "on" for dependsOn purposes */
export const isOn = (val: unknown) => !(val === false || val === "none" || val === "off" || val === "" || val === 0);
