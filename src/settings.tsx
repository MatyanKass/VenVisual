/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { diffFromDefaults, FEATURE_BY_ID, withDefaults } from "./features/index";
import { Values } from "./registry";
import { Panel } from "./ui/Panel";

const PERSIST_DELAY = 250;
/** text fields (font name, image url) rebuild the whole stylesheet, so wait for a pause in typing */
const TEXT_PREVIEW_DELAY = 350;

export const settings = definePluginSettings({
    panel: {
        type: OptionType.COMPONENT,
        component: () => <Panel />
    },
    values: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, any>
    }
});

let applyHandler: ((v: Values) => void) | null = null;
/** changes made through saveValue that are not written to the settings store yet */
let pending: Values | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
/** previews are coalesced: one CSS rebuild per frame at most, and one per typing pause for text fields */
let applyFrame: number | null = null;
let textTimer: ReturnType<typeof setTimeout> | null = null;

function storedValues(): Values {
    const stored = settings.store.values;
    return stored && typeof stored === "object" ? { ...stored } : {};
}

function runApply() {
    const handler = applyHandler;
    if (!handler) return;
    try {
        handler(getValues());
    } catch (e) {
        console.error("[VenVisual] apply failed:", e);
    }
}

function cancelPreview() {
    if (applyFrame !== null) {
        cancelAnimationFrame(applyFrame);
        applyFrame = null;
    }
    if (textTimer !== null) {
        clearTimeout(textTimer);
        textTimer = null;
    }
}

/**
 * Queues a live preview. Every apply rebuilds the whole stylesheet from the current values,
 * so dropping an earlier queued preview never loses a change - the next one carries it.
 */
function queuePreview(id: string) {
    if (!applyHandler) return;

    if (FEATURE_BY_ID.get(id)?.kind === "text") {
        // a frame preview is already queued: it will pick up the typed text as well
        if (applyFrame !== null) return;
        if (textTimer !== null) clearTimeout(textTimer);
        textTimer = setTimeout(() => {
            textTimer = null;
            runApply();
        }, TEXT_PREVIEW_DELAY);
        return;
    }

    if (textTimer !== null) {
        clearTimeout(textTimer);
        textTimer = null;
    }
    if (applyFrame !== null) return;
    applyFrame = requestAnimationFrame(() => {
        applyFrame = null;
        runApply();
    });
}

function cancelPersist() {
    if (persistTimer != null) {
        clearTimeout(persistTimer);
        persistTimer = null;
    }
}

function persistPending() {
    cancelPersist();
    if (!pending) return;
    const merged = { ...storedValues(), ...pending };
    pending = null;
    settings.store.values = diffFromDefaults(withDefaults(merged));
}

export function setApplyHandler(fn: ((v: Values) => void) | null) {
    // a preview queued for the old handler must not fire into a plugin that is stopping
    if (!fn) cancelPreview();
    applyHandler = fn;
    // plugin is stopping: do not lose a change that is still waiting for the debounce
    if (!fn) persistPending();
}

export function getValues(): Values {
    return withDefaults(pending ? { ...storedValues(), ...pending } : storedValues());
}

export function saveValue(id: string, value: any) {
    (pending ??= {})[id] = value;
    queuePreview(id);
    cancelPersist();
    persistTimer = setTimeout(persistPending, PERSIST_DELAY);
}

export function saveAll(values: Values) {
    cancelPreview();
    cancelPersist();
    pending = null;
    settings.store.values = diffFromDefaults(withDefaults(values));
    runApply();
}

export function resetAll() {
    saveAll({});
}
