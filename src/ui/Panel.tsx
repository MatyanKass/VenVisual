/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./panel.css";

import { copyToClipboard } from "@utils/clipboard";
import { showToast, Toasts, useEffect, useMemo, useRef, useState } from "@webpack/common";
import type { CSSProperties, JSX } from "react";

import { DEFAULTS, diffFromDefaults, FEATURE_BY_ID, FEATURES, isOn, withDefaults } from "../features/index";
import { PRESETS, randomValues } from "../presets";
import { CATEGORIES, CategoryId, ColorFeature, Feature, normalizeHex, SelectFeature, SliderFeature, TextFeature, Values } from "../registry";
import { getValues, resetAll, saveAll, saveValue } from "../settings";
import { THEMES } from "../themes";

/* ---------- static data (computed once) ---------- */

interface Section {
    key: string;
    title: string;
    /** category chip, only in search results */
    category?: string;
    features: Feature[];
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

const CATEGORY_BY_ID = new Map(CATEGORIES.map(c => [c.id, c]));

const HAYSTACK = new Map(FEATURES.map(f => [f.id, norm([
    f.id,
    f.label,
    f.desc ?? "",
    f.group ?? "",
    CATEGORY_BY_ID.get(f.cat)?.label ?? "",
    f.kind === "select" ? f.options.map(o => o.label).join(" ") : ""
].join(" "))]));

function groupFeatures(list: Feature[], withCategory: boolean): Section[] {
    const sections = new Map<string, Section>();
    for (const f of list) {
        const group = f.group ?? "Прочее";
        const key = withCategory ? `${f.cat}/${group}` : group;
        let section = sections.get(key);
        if (!section) {
            const cat = CATEGORY_BY_ID.get(f.cat);
            section = { key, title: group, category: withCategory && cat ? `${cat.icon} ${cat.label}` : undefined, features: [] };
            sections.set(key, section);
        }
        section.features.push(f);
    }
    return [...sections.values()];
}

const TAB_SECTIONS = new Map<CategoryId, Section[]>(
    CATEGORIES.map(c => [c.id, groupFeatures(FEATURES.filter(f => f.cat === c.id), false)])
);

const PRESET_DIFFS = PRESETS.map(p => diffFromDefaults(withDefaults(p.values)));

function sameDiff(a: Values, b: Values): boolean {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(k => a[k] === b[k]);
}

function plural(n: number, one: string, few: string, many: string): string {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

const toastOk = (msg: string) => showToast(msg, Toasts.Type.SUCCESS);
const toastFail = (msg: string) => showToast(msg, Toasts.Type.FAILURE);

/** a broken random roll must never kill the panel */
function randomValuesSafe(): Values {
    try {
        return randomValues();
    } catch (e) {
        console.error("[VenVisual] randomValues failed:", e);
        return getValues();
    }
}

/** remembered while Discord is running, so reopening the settings keeps the tab */
let lastTab: CategoryId = "theme";

/* ---------- controls ---------- */

type OnChange = (value: any) => void;

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: OnChange; }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            aria-label={label}
            className={"vv-switch" + (value ? " vv-on" : "")}
            onClick={() => onChange(!value)}
        >
            <span className="vv-switch-knob" />
        </button>
    );
}

function Slider({ f, value, onChange }: { f: SliderFeature; value: number; onChange: OnChange; }) {
    const step = f.step ?? 1;
    const decimals = (String(step).split(".")[1] ?? "").length;
    const fill = f.max > f.min ? Math.min(1, Math.max(0, (value - f.min) / (f.max - f.min))) : 0;
    const style = { "--vv-fill": String(fill) } as CSSProperties;

    return (
        <div className="vv-slider">
            <input
                className="vv-range"
                type="range"
                min={f.min}
                max={f.max}
                step={step}
                value={value}
                style={style}
                aria-label={f.label}
                onChange={e => onChange(Number(e.currentTarget.value))}
            />
            <span className="vv-slider-value">{value.toFixed(decimals)}{f.unit ?? ""}</span>
        </div>
    );
}

const FULL_HEX_RE = /^#?[0-9a-f]{6}$/i;

function ColorPicker({ f, value, onChange }: { f: ColorFeature; value: string; onChange: OnChange; }) {
    const [draft, setDraft] = useState(value);
    const clearable = f.default === "";
    const hex = normalizeHex(value);

    // follow outside changes (reset, presets) without clobbering what is being typed
    useEffect(() => {
        setDraft(d => (normalizeHex(d) ?? d.trim()) === value ? d : value);
    }, [value]);

    const commitDraft = () => {
        const n = normalizeHex(draft);
        if (n) {
            onChange(n);
            setDraft(n);
        } else if (!draft.trim() && clearable) {
            onChange("");
            setDraft("");
        } else {
            setDraft(value);
        }
    };

    const invalid = draft.trim() !== "" && !normalizeHex(draft);

    return (
        <div className="vv-color">
            <label className={"vv-swatch" + (hex ? "" : " vv-swatch-empty")} title={hex || "Цвет из темы. Нажми, чтобы выбрать свой"}>
                <input
                    type="color"
                    value={hex ?? "#000000"}
                    aria-label={f.label}
                    onChange={e => onChange(e.currentTarget.value.toLowerCase())}
                />
            </label>
            <input
                className={"vv-input vv-hex" + (invalid ? " vv-invalid" : "")}
                type="text"
                value={draft}
                maxLength={7}
                spellCheck={false}
                placeholder={clearable ? "из темы" : "#rrggbb"}
                onChange={e => {
                    const text = e.currentTarget.value;
                    setDraft(text);
                    if (FULL_HEX_RE.test(text.trim())) onChange(normalizeHex(text));
                    else if (!text.trim() && clearable) onChange("");
                }}
                onBlur={commitDraft}
                onKeyDown={e => {
                    if (e.key === "Enter") commitDraft();
                }}
            />
            {clearable && value !== "" && (
                <button type="button" className="vv-icon-btn" title="Убрать свой цвет (брать из темы)" onClick={() => onChange("")}>✕</button>
            )}
        </div>
    );
}

function Select({ f, value, onChange }: { f: SelectFeature; value: string; onChange: OnChange; }) {
    return (
        <div className="vv-select-wrap">
            <select className="vv-select" value={value} aria-label={f.label} onChange={e => onChange(e.currentTarget.value)}>
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function TextInput({ f, value, onChange }: { f: TextFeature; value: string; onChange: OnChange; }) {
    if (f.multiline) {
        return (
            <textarea
                className="vv-input vv-textarea"
                rows={3}
                value={value}
                placeholder={f.placeholder}
                spellCheck={false}
                aria-label={f.label}
                onChange={e => onChange(e.currentTarget.value)}
            />
        );
    }
    return (
        <input
            className="vv-input"
            type="text"
            value={value}
            placeholder={f.placeholder}
            spellCheck={false}
            aria-label={f.label}
            onChange={e => onChange(e.currentTarget.value)}
        />
    );
}

function Control({ f, value, onChange }: { f: Feature; value: any; onChange: OnChange; }) {
    switch (f.kind) {
        case "toggle": return <Toggle label={f.label} value={value === true} onChange={onChange} />;
        case "slider": return <Slider f={f} value={typeof value === "number" ? value : f.default} onChange={onChange} />;
        case "color": return <ColorPicker f={f} value={typeof value === "string" ? value : f.default} onChange={onChange} />;
        case "select": return <Select f={f} value={typeof value === "string" ? value : f.default} onChange={onChange} />;
        case "text": return <TextInput f={f} value={typeof value === "string" ? value : f.default} onChange={onChange} />;
    }
}

/* ---------- rows & sections ---------- */

function Row({ f, value, dimmed, onChange }: { f: Feature; value: any; dimmed: boolean; onChange: (id: string, value: any) => void; }) {
    const changed = value !== f.default;
    const parent = dimmed && f.dependsOn ? FEATURE_BY_ID.get(f.dependsOn) : undefined;
    const stacked = f.kind === "text" && f.multiline;

    const cls = ["vv-row", `vv-kind-${f.kind}`];
    if (dimmed) cls.push("vv-row-dimmed");
    if (changed) cls.push("vv-row-changed");
    if (stacked) cls.push("vv-row-stacked");

    return (
        <div className={cls.join(" ")}>
            <div className="vv-row-text">
                <div className="vv-row-label">
                    <span>{f.label}</span>
                    {f.heavy && <span className="vv-badge-heavy" title="Может нагружать слабый ПК">🐢</span>}
                    {changed && (
                        <button type="button" className="vv-reset-one" title="Вернуть значение по умолчанию" onClick={() => onChange(f.id, f.default)}>↺</button>
                    )}
                </div>
                {f.desc && <div className="vv-row-desc">{f.desc}</div>}
                {parent && <div className="vv-row-hint">Работает, когда включено «{parent.label}»</div>}
            </div>
            <div className="vv-row-control">
                <Control f={f} value={value} onChange={v => v !== value && onChange(f.id, v)} />
            </div>
        </div>
    );
}

function Sections({ sections, values, onChange }: { sections: Section[]; values: Values; onChange: (id: string, value: any) => void; }) {
    return (
        <>
            {sections.map(s => (
                <section className="vv-section" key={s.key}>
                    <div className="vv-section-head">
                        {s.category && <span className="vv-section-cat">{s.category}</span>}
                        <span className="vv-section-title">{s.title}</span>
                    </div>
                    <div className="vv-card">
                        {s.features.map(f => (
                            <Row
                                key={f.id}
                                f={f}
                                value={values[f.id]}
                                dimmed={!!f.dependsOn && !isOn(values[f.dependsOn])}
                                onChange={onChange}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </>
    );
}

/* ---------- panel ---------- */

export function Panel(): JSX.Element {
    const [values, setValues] = useState<Values>(() => getValues());
    const [tab, setTabState] = useState<CategoryId>(lastTab);
    const [query, setQuery] = useState("");
    const [importOpen, setImportOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [resetArmed, setResetArmed] = useState(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (resetTimer.current) clearTimeout(resetTimer.current);
    }, []);

    const setTab = (id: CategoryId) => {
        lastTab = id;
        setTabState(id);
    };

    const setOne = (id: string, value: any) => {
        setValues(prev => ({ ...prev, [id]: value }));
        saveValue(id, value);
    };

    const replaceAll = (next: Values) => {
        saveAll(next);
        setValues(getValues());
    };

    const changed = useMemo(() => {
        const perCat = new Map<CategoryId, number>();
        let total = 0;
        for (const f of FEATURES) {
            if (values[f.id] === DEFAULTS[f.id]) continue;
            total++;
            perCat.set(f.cat, (perCat.get(f.cat) ?? 0) + 1);
        }
        return { total, perCat };
    }, [values]);

    const activePreset = useMemo(() => {
        const current = diffFromDefaults(values);
        const idx = PRESET_DIFFS.findIndex(d => sameDiff(d, current));
        return idx === -1 ? null : PRESETS[idx].id;
    }, [values]);

    const search = useMemo(() => {
        const words = norm(query).split(/\s+/).filter(Boolean);
        if (!words.length) return null;
        const found = FEATURES.filter(f => {
            const hay = HAYSTACK.get(f.id) ?? "";
            return words.every(w => hay.includes(w));
        });
        return { count: found.length, sections: groupFeatures(found, true) };
    }, [query]);

    /* ----- actions ----- */

    const onRandom = () => replaceAll(randomValuesSafe());

    const onExport = () => {
        const json = JSON.stringify(diffFromDefaults(values), null, 2);
        Promise.resolve()
            .then(() => copyToClipboard(json))
            .then(() => toastOk("Настройки скопированы"))
            .catch(() => toastFail("Не удалось скопировать в буфер обмена"));
    };

    const onImportApply = () => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(importText);
        } catch {
            toastFail("Это не похоже на JSON");
            return;
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            toastFail("Нужен JSON-объект с настройками");
            return;
        }
        const keys = Object.keys(parsed);
        const known = keys.filter(k => FEATURE_BY_ID.has(k)).length;
        if (keys.length && !known) {
            toastFail("В этом JSON нет настроек VenVisual");
            return;
        }
        replaceAll(parsed as Values);
        setImportOpen(false);
        setImportText("");
        toastOk(`Импортировано: ${known} ${plural(known, "настройка", "настройки", "настроек")}`);
    };

    const onReset = () => {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        if (!resetArmed) {
            setResetArmed(true);
            resetTimer.current = setTimeout(() => setResetArmed(false), 3000);
            return;
        }
        resetTimer.current = null;
        setResetArmed(false);
        resetAll();
        setValues(getValues());
        toastOk("Все настройки сброшены");
    };

    /* ----- render ----- */

    const total = FEATURES.length;
    const sections = search ? search.sections : TAB_SECTIONS.get(tab) ?? [];

    return (
        <div className="vv-panel">
            <div className="vv-hero">
                <div className="vv-hero-top">
                    <div className="vv-title-wrap">
                        <div className="vv-title">VenVisual</div>
                        <div className="vv-subtitle">
                            {total} {plural(total, "настройка", "настройки", "настроек")} · изменено {changed.total}
                        </div>
                    </div>
                    <div className="vv-actions">
                        <button type="button" className="vv-btn vv-btn-primary" onClick={onRandom} title="Собрать случайный стиль из тем, фонов и эффектов">🎲 Случайный стиль</button>
                        <button type="button" className="vv-btn" onClick={onExport} title="Скопировать изменённые настройки в буфер обмена">📤 Экспорт</button>
                        <button type="button" className={"vv-btn" + (importOpen ? " vv-btn-active" : "")} onClick={() => setImportOpen(o => !o)} title="Вставить настройки из JSON">📥 Импорт</button>
                        <button
                            type="button"
                            className={"vv-btn vv-btn-danger" + (resetArmed ? " vv-btn-armed" : "")}
                            onClick={onReset}
                            title="Вернуть все настройки к значениям по умолчанию"
                        >
                            {resetArmed ? "Точно сбросить?" : "↺ Сбросить всё"}
                        </button>
                    </div>
                </div>

                {importOpen && (
                    <div className="vv-import">
                        <textarea
                            className="vv-input vv-textarea vv-import-text"
                            value={importText}
                            placeholder={"{\n  \"theme\": \"neon\",\n  \"particles\": \"snow\"\n}"}
                            spellCheck={false}
                            autoFocus
                            onChange={e => setImportText(e.currentTarget.value)}
                        />
                        <div className="vv-import-actions">
                            <span className="vv-import-note">Все настройки заменятся на вставленные, остальные вернутся по умолчанию</span>
                            <button type="button" className="vv-btn" onClick={() => setImportOpen(false)}>Отмена</button>
                            <button type="button" className="vv-btn vv-btn-primary" disabled={!importText.trim()} onClick={onImportApply}>Применить</button>
                        </div>
                    </div>
                )}

                <div className="vv-presets">
                    {PRESETS.map(p => {
                        const pal = THEMES[p.values.theme];
                        const dot = pal ? { background: `linear-gradient(135deg, ${pal.accent}, ${pal.accent2})` } : undefined;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                className={"vv-preset" + (activePreset === p.id ? " vv-active" : "")}
                                title={p.desc}
                                onClick={() => replaceAll(p.values)}
                            >
                                {dot && <span className="vv-preset-dot" style={dot} />}
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="vv-sticky">
                <div className="vv-search">
                    <span className="vv-search-icon" aria-hidden="true">🔍</span>
                    <input
                        className="vv-input vv-search-input"
                        type="text"
                        value={query}
                        placeholder="Поиск по настройкам…"
                        spellCheck={false}
                        onChange={e => setQuery(e.currentTarget.value)}
                        onKeyDown={e => {
                            if (e.key === "Escape" && query) {
                                e.stopPropagation();
                                setQuery("");
                            }
                        }}
                    />
                    {query && (
                        <button type="button" className="vv-icon-btn vv-search-clear" title="Очистить поиск" onClick={() => setQuery("")}>✕</button>
                    )}
                </div>

                {search ? (
                    <div className="vv-search-info">
                        {search.count
                            ? `Найдено: ${search.count} ${plural(search.count, "настройка", "настройки", "настроек")}`
                            : "Ничего не найдено"}
                    </div>
                ) : (
                    <div className="vv-tabs" role="tablist">
                        {CATEGORIES.map(c => {
                            const count = changed.perCat.get(c.id) ?? 0;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === c.id}
                                    className={"vv-tab" + (tab === c.id ? " vv-active" : "")}
                                    onClick={() => setTab(c.id)}
                                >
                                    <span className="vv-tab-icon">{c.icon}</span>
                                    <span>{c.label}</span>
                                    {count > 0 && <span className="vv-tab-count" title={`Изменено: ${count}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="vv-content" key={search ? "search" : tab}>
                {search && !search.count
                    ? (
                        <div className="vv-empty">
                            <div className="vv-empty-icon">🔎</div>
                            <div>По запросу «{query.trim()}» ничего нет. Попробуй другое слово.</div>
                        </div>
                    )
                    : <Sections sections={sections} values={values} onChange={setOne} />}
            </div>
        </div>
    );
}
