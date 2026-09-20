/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";
import { EN_BACKGROUND } from "./background";
import { EN_EFFECTS } from "./effects";
import { EN_EXTRAS } from "./extras";
import { EN_HOVER } from "./hover";
import { EN_INTERFACE } from "./interface";
import { EN_MESSAGES } from "./messages";
import { EN_NAMES } from "./names";
import { EN_THEME } from "./theme";

export { EN_CATEGORIES, EN_PRESETS, EN_UI } from "./ui";

export const EN_FEATURES: Record<string, FeatureText> = {
    ...EN_THEME,
    ...EN_HOVER,
    ...EN_MESSAGES,
    ...EN_NAMES,
    ...EN_BACKGROUND,
    ...EN_EFFECTS,
    ...EN_INTERFACE,
    ...EN_EXTRAS
};
