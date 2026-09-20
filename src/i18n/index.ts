/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Russian is the source language: every label lives inline in src/features/*.ts and is what the
 * panel shows by default. English is an overlay keyed by feature id (src/i18n/en/*), so a missing
 * translation simply falls back to the Russian text instead of showing a key.
 */

import { CategoryId, Feature } from "../registry";
import { EN_CATEGORIES,EN_FEATURES, EN_PRESETS, EN_UI } from "./en";

export type Lang = "ru" | "en";

export const LANGS: { value: Lang; label: string; }[] = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" }
];

export const asLang = (value: unknown): Lang => value === "en" ? "en" : "ru";

export interface FeatureText {
    label?: string;
    desc?: string;
    group?: string;
    activeHint?: string;
    /** only for text fields whose example text is language-specific */
    placeholder?: string;
    /** option value -> label */
    options?: Record<string, string>;
}

export interface PresetText {
    label: string;
    desc: string;
}

export interface UiStrings {
    subtitle(total: number, changed: number): string;
    language: string;

    speedUp: string;
    speedUpTitle: string;
    speedUpDone(n: number): string;
    speedUpNothing: string;

    random: string;
    randomTitle: string;

    exportBtn: string;
    exportTitle: string;
    exportOk: string;
    exportFail: string;

    importBtn: string;
    importTitle: string;
    importNote: string;
    importCancel: string;
    importApply: string;
    importNotJson: string;
    importNotObject: string;
    importNoSettings: string;
    importOk(n: number): string;

    resetBtn: string;
    resetArmed: string;
    resetTitle: string;
    resetOk: string;

    searchPlaceholder: string;
    searchClear: string;
    searchFound(n: number): string;
    searchNone: string;

    colorTitle: string;
    colorFromTheme: string;
    colorHexPlaceholder: string;
    colorClear: string;

    heavyTitle: string;
    resetOneTitle: string;
    groupOther: string;
}

/** 1 настройка / 2 настройки / 5 настроек */
const ruPlural = (n: number, one: string, few: string, many: string) => {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
};

const ruSettings = (n: number) => `${n} ${ruPlural(n, "настройка", "настройки", "настроек")}`;
const enSettings = (n: number) => `${n} ${n === 1 ? "setting" : "settings"}`;

const RU_UI: UiStrings = {
    subtitle: (total, changed) => `${ruSettings(total)} · изменено ${changed}`,
    language: "Язык",

    speedUp: "⚡ Ускорить",
    speedUpTitle: "Убрать самые тяжёлые эффекты, не трогая цвета и темы",
    speedUpDone: n => `Ускорено: изменено ${ruSettings(n)}`,
    speedUpNothing: "Всё уже настроено на быструю работу",

    random: "🎲 Случайный стиль",
    randomTitle: "Собрать случайный стиль из тем, фонов и эффектов",

    exportBtn: "📤 Экспорт",
    exportTitle: "Скопировать изменённые настройки в буфер обмена",
    exportOk: "Настройки скопированы",
    exportFail: "Не удалось скопировать в буфер обмена",

    importBtn: "📥 Импорт",
    importTitle: "Вставить настройки из JSON",
    importNote: "Все настройки заменятся на вставленные, остальные вернутся по умолчанию",
    importCancel: "Отмена",
    importApply: "Применить",
    importNotJson: "Это не похоже на JSON",
    importNotObject: "Нужен JSON-объект с настройками",
    importNoSettings: "В этом JSON нет настроек VenVisual",
    importOk: n => `Импортировано: ${ruSettings(n)}`,

    resetBtn: "↺ Сбросить всё",
    resetArmed: "Точно сбросить?",
    resetTitle: "Вернуть все настройки к значениям по умолчанию",
    resetOk: "Все настройки сброшены",

    searchPlaceholder: "Поиск по настройкам…",
    searchClear: "Очистить поиск",
    searchFound: n => `Найдено: ${ruSettings(n)}`,
    searchNone: "Ничего не найдено",

    colorTitle: "Цвет из темы. Нажми, чтобы выбрать свой",
    colorFromTheme: "из темы",
    colorHexPlaceholder: "#rrggbb",
    colorClear: "Убрать свой цвет (брать из темы)",

    heavyTitle: "Может нагружать слабый ПК",
    resetOneTitle: "Вернуть значение по умолчанию",
    groupOther: "Прочее"
};

export const ui = (lang: Lang): UiStrings => lang === "en" ? EN_UI : RU_UI;

export const enSettingsCount = enSettings;

/** label / desc / group / activeHint of a feature in the chosen language */
export function featureText(f: Feature, lang: Lang) {
    const en = lang === "en" ? EN_FEATURES[f.id] : undefined;
    return {
        label: en?.label ?? f.label,
        desc: en?.desc ?? f.desc,
        group: en?.group ?? f.group,
        activeHint: en?.activeHint ?? f.activeHint
    };
}

/** slider units live on the feature itself, so translate the few that are words rather than symbols */
const EN_UNITS: Record<string, string> = {
    " мс": " ms",
    " с": " s",
    " с/круг": " s/turn",
    " ч": " h"
};

export function unitText(unit: string | undefined, lang: Lang): string {
    if (!unit) return "";
    return lang === "en" ? EN_UNITS[unit] ?? unit : unit;
}

export function placeholderText(featureId: string, fallback: string | undefined, lang: Lang): string | undefined {
    if (lang !== "en") return fallback;
    return EN_FEATURES[featureId]?.placeholder ?? fallback;
}

export function optionLabel(featureId: string, value: string, fallback: string, lang: Lang): string {
    if (lang !== "en") return fallback;
    return EN_FEATURES[featureId]?.options?.[value] ?? fallback;
}

export function categoryLabel(id: CategoryId, fallback: string, lang: Lang): string {
    return lang === "en" ? EN_CATEGORIES[id] ?? fallback : fallback;
}

export function presetText(id: string, fallback: PresetText, lang: Lang): PresetText {
    return lang === "en" ? EN_PRESETS[id] ?? fallback : fallback;
}

/** everything searchable about a feature, in BOTH languages, so search works whichever is shown */
export function searchText(f: Feature, categoryLabels: string[]): string {
    const en = EN_FEATURES[f.id];
    const parts = [
        f.id, f.label, f.desc ?? "", f.group ?? "", f.activeHint ?? "",
        en?.label ?? "", en?.desc ?? "", en?.group ?? "", en?.activeHint ?? "",
        ...categoryLabels
    ];
    if (f.kind === "select") {
        for (const o of f.options) {
            parts.push(o.label);
            const t = en?.options?.[o.value];
            if (t) parts.push(t);
        }
    }
    return parts.join(" ");
}
