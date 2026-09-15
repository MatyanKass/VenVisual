/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";
import definePlugin, { StartAt } from "@utils/types";

import { buildCss } from "./build";
import { DEFAULTS, FEATURE_BY_ID, FEATURES, withDefaults } from "./features/index";
import { isPaused, onMessageCreate, startRuntime, stopRuntime, updateRuntime } from "./fx/runtime";
import { Values } from "./registry";
import { getValues, saveAll, setApplyHandler, settings } from "./settings";

const STYLE_ID = "vc-venvisual";
let styleEl: HTMLStyleElement | null = null;

function apply(v: Values) {
    const paused = isPaused();
    if (styleEl) {
        try {
            styleEl.textContent = buildCss(v, paused);
        } catch (e) {
            console.error("[VenVisual] buildCss failed:", e);
        }
    }
    try {
        updateRuntime(v, paused);
    } catch (e) {
        console.error("[VenVisual] runtime update failed:", e);
    }
}

/* ---------- migration from the old flat settings (v1) ---------- */

/** [old key, new feature id, old default]. Values equal to the old default were never chosen by the user and are skipped */
const OLD_KEYS: [string, string, unknown][] = [
    ["theme", "theme", "none"],
    ["customAccent", "accent", ""],
    ["customAccent2", "accent2", ""],
    ["customBackground", "bgColor", ""],
    ["customText", "textColor", ""],
    ["hoverEnabled", "hoverEnabled", true],
    ["hoverChannels", "hoverChannels", true],
    ["hoverDMs", "hoverDMs", true],
    ["hoverMembers", "hoverMembers", true],
    ["hoverServers", "hoverServers", true],
    ["hoverMessages", "msgHover", false],
    ["highlightSelected", "highlightSelected", true],
    ["hoverShift", "hoverShift", 6],
    ["hoverGlow", "hoverGlow", 12],
    ["bgImage", "bgImage", ""],
    ["bgBlur", "bgBlur", 4],
    ["bgDim", "bgDim", 40],
    ["panelOpacity", "panelOpacity", 70],
    ["glassPanels", "glassPanels", false],
    ["radius", "radius", 8],
    ["fontFamily", "fontFamily", ""],
    ["fontScale", "msgFontScale", 100],
    ["messageSpacing", "msgSpacing", 17],
    ["nameStyle", "nameStyle", "none"],
    ["animations", "msgAppear", true],
    ["animationSpeed", "animSpeed", 200]
];

function migrateOldSettings() {
    try {
        const plain = settings.plain as Record<string, any> | undefined;
        if (!plain) return;

        const present = OLD_KEYS.filter(([oldKey]) => plain[oldKey] !== undefined);
        if (!present.length) return;

        const current = plain.values;
        const valuesEmpty = !current || typeof current !== "object" || Object.keys(current).length === 0;

        const migrated: Values = {};
        if (valuesEmpty) {
            for (const [oldKey, newKey, oldDefault] of present) {
                const val = plain[oldKey];
                if (val === oldDefault) continue;

                switch (oldKey) {
                    case "hoverServers":
                        migrated.hoverServers = typeof val === "boolean" ? (val ? "lift" : "off") : val;
                        break;
                    case "animations":
                        if (val === false) migrated.msgAppear = "off";
                        break;
                    case "bgImage":
                        if (typeof val === "string" && val.trim()) {
                            migrated.bgImage = val;
                            migrated.bgMode = "image";
                        }
                        break;
                    default:
                        migrated[newKey] = val;
                }
            }
        }

        // the old sliders stored fractional numbers and old select values may no longer exist
        for (const [id, val] of Object.entries(migrated)) {
            const f = FEATURE_BY_ID.get(id);
            if (!f) delete migrated[id];
            else if (f.kind === "slider" && typeof val === "number") {
                const step = f.step ?? 1;
                migrated[id] = Math.min(f.max, Math.max(f.min, Math.round(val / step) * step));
            } else if (f.kind === "select" && !f.options.some(o => o.value === val)) delete migrated[id];
        }

        const store = settings.store as Record<string, any>;
        for (const [oldKey] of present) delete store[oldKey];

        if (valuesEmpty && Object.keys(migrated).length) saveAll(migrated);
    } catch (e) {
        console.error("[VenVisual] settings migration failed:", e);
    }
}

export default definePlugin({
    name: "VenVisual",
    description: "Больше 100 визуальных настроек: темы, подсветка, фон, частицы, эффекты курсора, стили ников и сообщений, виджеты. Всё настраивается в удобной панели.",
    authors: [{ name: "MatyanKass", id: 0n }],
    tags: ["Appearance", "Customisation"],
    settings,

    startAt: StartAt.DOMContentLoaded,

    flux: {
        MESSAGE_CREATE: onMessageCreate
    },

    start() {
        styleEl ??= createAndAppendStyle(STYLE_ID, managedStyleRootNode);
        migrateOldSettings();
        setApplyHandler(apply);
        startRuntime({ getValues, rebuild: () => apply(getValues()) });
        apply(getValues());
    },

    stop() {
        stopRuntime();
        styleEl?.remove();
        styleEl = null;
        setApplyHandler(null);
    },

    debug: { buildCss, FEATURES, DEFAULTS, withDefaults, getValues }
});
