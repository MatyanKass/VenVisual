/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { diffFromDefaults, withDefaults } from "./features/index";
import { Values } from "./registry";
import { Panel } from "./ui/Panel";

const PERSIST_DELAY = 250;

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
    applyHandler = fn;
    // plugin is stopping: do not lose a change that is still waiting for the debounce
    if (!fn) persistPending();
}

export function getValues(): Values {
    return withDefaults(pending ? { ...storedValues(), ...pending } : storedValues());
}

export function saveValue(id: string, value: any) {
    (pending ??= {})[id] = value;
    runApply();
    cancelPersist();
    persistTimer = setTimeout(persistPending, PERSIST_DELAY);
}

export function saveAll(values: Values) {
    cancelPersist();
    pending = null;
    settings.store.values = diffFromDefaults(withDefaults(values));
    runApply();
}

export function resetAll() {
    saveAll({});
}
