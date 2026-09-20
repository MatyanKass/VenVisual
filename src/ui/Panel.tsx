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
import { asLang, categoryLabel, featureText, Lang, LANGS, optionLabel, placeholderText, presetText, searchText, ui, unitText } from "../i18n";
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

/**
 * The panel renders in one language at a time and re-renders as a whole when it changes, so the
 * current language lives in a module variable instead of being threaded through every component.
 */
let LANG: Lang = "ru";
const T = () => ui(LANG);

// searchable in both languages, whichever one is on screen
const HAYSTACK = new Map(FEATURES.map(f => [f.id, norm(searchText(f, [
    CATEGORY_BY_ID.get(f.cat)?.label ?? "",
    categoryLabel(f.cat, "", "en")
]))]));

function groupFeatures(list: Feature[], withCategory: boolean): Section[] {
    const sections = new Map<string, Section>();
    for (const f of list) {
        const group = featureText(f, LANG).group ?? T().groupOther;
        const key = withCategory ? `${f.cat}/${group}` : group;
        let section = sections.get(key);
        if (!section) {
            const cat = CATEGORY_BY_ID.get(f.cat);
            section = {
                key,
                title: group,
                category: withCategory && cat ? `${cat.icon} ${categoryLabel(cat.id, cat.label, LANG)}` : undefined,
                features: []
            };
            sections.set(key, section);
        }
        section.features.push(f);
    }
    return [...sections.values()];
}

/** sections per tab, rebuilt once per language (group titles are translated) */
const TAB_SECTIONS_BY_LANG = new Map<Lang, Map<CategoryId, Section[]>>();

function tabSections(lang: Lang): Map<CategoryId, Section[]> {
    let cached = TAB_SECTIONS_BY_LANG.get(lang);
    if (!cached) {
        cached = new Map(CATEGORIES.map(c => [c.id, groupFeatures(FEATURES.filter(f => f.cat === c.id), false)]));
        TAB_SECTIONS_BY_LANG.set(lang, cached);
    }
    return cached;
}

const PRESET_DIFFS = PRESETS.map(p => diffFromDefaults(withDefaults(p.values)));

function sameDiff(a: Values, b: Values): boolean {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(k => a[k] === b[k]);
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
            <span className="vv-slider-value">{value.toFixed(decimals)}{unitText(f.unit, LANG)}</span>
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
            <label className={"vv-swatch" + (hex ? "" : " vv-swatch-empty")} title={hex || T().colorTitle}>
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
                placeholder={clearable ? T().colorFromTheme : T().colorHexPlaceholder}
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
                <button type="button" className="vv-icon-btn" title={T().colorClear} onClick={() => onChange("")}>✕</button>
            )}
        </div>
    );
}

function Select({ f, value, onChange }: { f: SelectFeature; value: string; onChange: OnChange; }) {
    return (
        <div className="vv-select-wrap">
            <select className="vv-select" value={value} aria-label={f.label} onChange={e => onChange(e.currentTarget.value)}>
                {f.options.map(o => <option key={o.value} value={o.value}>{optionLabel(f.id, o.value, o.label, LANG)}</option>)}
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
                placeholder={placeholderText(f.id, f.placeholder, LANG)}
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
            placeholder={placeholderText(f.id, f.placeholder, LANG)}
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
    const text = featureText(f, LANG);
    const stacked = f.kind === "text" && f.multiline;

    const cls = ["vv-row", `vv-kind-${f.kind}`];
    if (dimmed) cls.push("vv-row-dimmed");
    if (changed) cls.push("vv-row-changed");
    if (stacked) cls.push("vv-row-stacked");

    return (
        <div className={cls.join(" ")}>
            <div className="vv-row-text">
                <div className="vv-row-label">
                    <span>{text.label}</span>
                    {f.heavy && <span className="vv-badge-heavy" title={T().heavyTitle}>🐢</span>}
                    {changed && (
                        <button type="button" className="vv-reset-one" title={T().resetOneTitle} onClick={() => onChange(f.id, f.default)}>↺</button>
                    )}
                </div>
                {text.desc && <div className="vv-row-desc">{text.desc}</div>}
                {parent && <div className="vv-row-hint">{LANG === "en" ? `Works when “${featureText(parent, LANG).label}” is on` : `Работает, когда включено «${featureText(parent, LANG).label}»`}</div>}
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

/** heaviest settings, turned down by the "Ускорить" button; colors and layout are left alone */
const ANIMATED_NAME_STYLES = new Set(["custom", "rainbow", "roleShine", "fire", "ice", "gold", "toxic", "neon"]);

function speedUpPatch(v: Values): Values {
    const p: Values = {
        fxFps: "auto",
        fxQuality: "low",
        fxPauseUnfocused: true,
        pauseAnimUnfocused: true,
        glassPanels: false,
        backdropBlur: 0,
        kenBurns: false,
        msgTextGlow: false,
        attachmentHighlight: false,
        linkMsgHighlight: false,
        systemMsgDim: false,
        inputGradientBorder: false,
        partyMode: false,
        chatWatermark: "",
        grain: 0,
        scanlines: 0,
        selectedPulse: false,
        voiceConnectedPulse: false,
        avatarRingPulse: false,
        jumboWiggle: false
    };
    if (v.particleCount > 40) p.particleCount = 40;
    if (v.bgBlur > 10) p.bgBlur = 10;
    if (v.mentionStyle === "pulse" || v.mentionStyle === "rainbow") p.mentionStyle = "accent";
    if (v.windowFrame === "rainbow" || v.windowFrame === "breathing") p.windowFrame = "accent";
    if (v.popupAnim === "blur") p.popupAnim = "pop";
    if (v.msgAppear === "blur") p.msgAppear = "fade";
    if (ANIMATED_NAME_STYLES.has(v.nameStyle)) p.nameStyle = "accent";
    return p;
}

/* ---------- panel ---------- */

export function Panel(): JSX.Element {
    const [values, setValues] = useState<Values>(() => getValues());
    LANG = asLang(values.lang);
    const t = T();
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

    const onSpeedUp = () => {
        const patch = speedUpPatch(values);
        const changedIds = Object.keys(patch).filter(id => values[id] !== patch[id]);
        replaceAll({ ...values, ...patch });
        showToast(changedIds.length ? t.speedUpDone(changedIds.length) : t.speedUpNothing, Toasts.Type.SUCCESS);
    };

    const onExport = () => {
        const json = JSON.stringify(diffFromDefaults(values), null, 2);
        Promise.resolve()
            .then(() => copyToClipboard(json))
            .then(() => toastOk(t.exportOk))
            .catch(() => toastFail(t.exportFail));
    };

    const onImportApply = () => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(importText);
        } catch {
            toastFail(t.importNotJson);
            return;
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            toastFail(t.importNotObject);
            return;
        }
        const keys = Object.keys(parsed);
        const known = keys.filter(k => FEATURE_BY_ID.has(k)).length;
        if (keys.length && !known) {
            toastFail(t.importNoSettings);
            return;
        }
        replaceAll(parsed as Values);
        setImportOpen(false);
        setImportText("");
        toastOk(t.importOk(known));
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
        toastOk(t.resetOk);
    };

    /* ----- render ----- */

    const total = FEATURES.length;
    const sections = search ? search.sections : tabSections(LANG).get(tab) ?? [];

    return (
        <div className="vv-panel">
            <div className="vv-hero">
                <div className="vv-hero-top">
                    <div className="vv-title-wrap">
                        <div className="vv-title">VenVisual</div>
                        <div className="vv-subtitle">{t.subtitle(total, changed.total)}</div>
                    </div>
                    <div className="vv-actions">
                        <div className="vv-lang" role="group" aria-label={t.language}>
                            {LANGS.map(l => (
                                <button
                                    key={l.value}
                                    type="button"
                                    className={"vv-lang-btn" + (LANG === l.value ? " vv-active" : "")}
                                    title={t.language}
                                    onClick={() => setOne("lang", l.value)}
                                >
                                    {l.value.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button type="button" className="vv-btn" onClick={onSpeedUp} title={t.speedUpTitle}>{t.speedUp}</button>
                        <button type="button" className="vv-btn vv-btn-primary" onClick={onRandom} title={t.randomTitle}>{t.random}</button>
                        <button type="button" className="vv-btn" onClick={onExport} title={t.exportTitle}>{t.exportBtn}</button>
                        <button type="button" className={"vv-btn" + (importOpen ? " vv-btn-active" : "")} onClick={() => setImportOpen(o => !o)} title={t.importTitle}>{t.importBtn}</button>
                        <button
                            type="button"
                            className={"vv-btn vv-btn-danger" + (resetArmed ? " vv-btn-armed" : "")}
                            onClick={onReset}
                            title={t.resetTitle}
                        >
                            {resetArmed ? t.resetArmed : t.resetBtn}
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
                            <span className="vv-import-note">{t.importNote}</span>
                            <button type="button" className="vv-btn" onClick={() => setImportOpen(false)}>{t.importCancel}</button>
                            <button type="button" className="vv-btn vv-btn-primary" disabled={!importText.trim()} onClick={onImportApply}>{t.importApply}</button>
                        </div>
                    </div>
                )}

                <div className="vv-presets">
                    {PRESETS.map(p => {
                        const pal = THEMES[p.values.theme];
                        const dot = pal ? { background: `linear-gradient(135deg, ${pal.accent}, ${pal.accent2})` } : undefined;
                        const pt = presetText(p.id, { label: p.label, desc: p.desc }, LANG);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                className={"vv-preset" + (activePreset === p.id ? " vv-active" : "")}
                                title={pt.desc}
                                onClick={() => replaceAll(p.values)}
                            >
                                {dot && <span className="vv-preset-dot" style={dot} />}
                                {pt.label}
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
                        placeholder={t.searchPlaceholder}
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
                        <button type="button" className="vv-icon-btn vv-search-clear" title={t.searchClear} onClick={() => setQuery("")}>✕</button>
                    )}
                </div>

                {search ? (
                    <div className="vv-search-info">
                        {search.count ? t.searchFound(search.count) : t.searchNone}
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
                                    <span>{categoryLabel(c.id, c.label, LANG)}</span>
                                    {count > 0 && <span className="vv-tab-count" title={LANG === "en" ? `Changed: ${count}` : `Изменено: ${count}`}>{count}</span>}
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
