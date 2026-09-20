/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Feature } from "../registry";

// All of these are handled by fx/engine.ts (canvas), no CSS.

export const PARTICLE_OPTIONS = [
    { value: "none", label: "Выключены" },
    { value: "snow", label: "❄️ Снег" },
    { value: "sakura", label: "🌸 Лепестки сакуры" },
    { value: "leaves", label: "🍂 Осенние листья" },
    { value: "rain", label: "🌧️ Дождь" },
    { value: "stars", label: "✨ Мерцающие звёзды" },
    { value: "fireflies", label: "🪲 Светлячки" },
    { value: "bubbles", label: "🫧 Пузыри" },
    { value: "hearts", label: "💖 Сердечки" },
    { value: "embers", label: "🔥 Искры костра" },
    { value: "dust", label: "🌫️ Пылинки цвета акцента" },
    { value: "matrix", label: "🟩 Цифровой дождь (Матрица)" },
    { value: "confetti", label: "🎊 Конфетти" }
];

export const effectFeatures: Feature[] = [
    { id: "particles", cat: "effects", group: "Частицы на экране", kind: "select", label: "Частицы", default: "none", options: PARTICLE_OPTIONS },
    { id: "particleCount", cat: "effects", group: "Частицы на экране", kind: "slider", label: "Количество", default: 70, min: 10, max: 400, dependsOn: "particles", heavy: true },
    { id: "particleSpeed", cat: "effects", group: "Частицы на экране", kind: "slider", label: "Скорость", default: 100, min: 10, max: 400, unit: "%", dependsOn: "particles" },
    { id: "particleSize", cat: "effects", group: "Частицы на экране", kind: "slider", label: "Размер", default: 100, min: 30, max: 300, unit: "%", dependsOn: "particles" },
    { id: "particleOpacity", cat: "effects", group: "Частицы на экране", kind: "slider", label: "Непрозрачность", default: 80, min: 10, max: 100, unit: "%", dependsOn: "particles" },
    { id: "particleWind", cat: "effects", group: "Частицы на экране", kind: "slider", label: "Ветер", default: 0, min: -100, max: 100, dependsOn: "particles" },
    { id: "particleMouse", cat: "effects", group: "Частицы на экране", kind: "toggle", label: "Частицы разлетаются от курсора", default: true, dependsOn: "particles" },
    {
        id: "fxLayer", cat: "effects", group: "Частицы на экране", kind: "select", label: "Слой частиц", default: "front",
        options: [{ value: "front", label: "Поверх интерфейса" }, { value: "back", label: "Позади интерфейса (видно через прозрачные панели)" }]
    },

    {
        id: "cursorTrail", cat: "effects", group: "Курсор", kind: "select", label: "След за курсором", default: "none",
        options: [
            { value: "none", label: "Выключен" },
            { value: "dots", label: "Точки" },
            { value: "sparkles", label: "Искорки" },
            { value: "rainbow", label: "Радужная линия" },
            { value: "comet", label: "Комета" },
            { value: "bubbles", label: "Пузырьки" },
            { value: "stars", label: "Звёздочки" }
        ]
    },
    { id: "trailLength", cat: "effects", group: "Курсор", kind: "slider", label: "Длина следа", default: 20, min: 5, max: 60, dependsOn: "cursorTrail" },
    { id: "cursorRing", cat: "effects", group: "Курсор", kind: "toggle", label: "Кольцо, которое догоняет курсор", default: false },

    {
        id: "clickEffect", cat: "effects", group: "Клики и события", kind: "select", label: "Эффект при клике", default: "none",
        options: [
            { value: "none", label: "Выключен" },
            { value: "ripple", label: "Круги на воде" },
            { value: "burst", label: "Взрыв частиц" },
            { value: "stars", label: "Звёздочки" },
            { value: "hearts", label: "Сердечки" },
            { value: "confetti", label: "Конфетти" }
        ]
    },
    { id: "clickIntensity", cat: "effects", group: "Клики и события", kind: "slider", label: "Сила эффекта клика", default: 100, min: 30, max: 300, unit: "%", dependsOn: "clickEffect" },
    {
        id: "sendEffect", cat: "effects", group: "Клики и события", kind: "select", label: "Когда отправляешь сообщение", default: "none",
        options: [
            { value: "none", label: "Ничего" },
            { value: "confetti", label: "🎊 Конфетти" },
            { value: "fireworks", label: "🎆 Салют" },
            { value: "hearts", label: "💖 Сердечки" },
            { value: "stars", label: "⭐ Звёзды" }
        ]
    },
    { id: "typingSparks", cat: "effects", group: "Клики и события", kind: "toggle", label: "Искры при наборе текста", desc: "Из поля ввода вылетают искорки на каждую букву", default: false },
    { id: "mentionFlash", cat: "effects", group: "Клики и события", kind: "toggle", label: "Вспышка по краям экрана, когда тебя упомянули", default: false },
    { id: "mentionShake", cat: "effects", group: "Клики и события", kind: "toggle", label: "Лёгкая встряска чата при упоминании", default: false },

    {
        id: "fxColors", cat: "effects", group: "Общее", kind: "select", label: "Цвета эффектов", default: "accent",
        options: [
            { value: "accent", label: "Акценты темы" },
            { value: "rainbow", label: "Радуга" },
            { value: "white", label: "Белый" },
            { value: "natural", label: "Естественные (у снега белый, у сакуры розовый…)" }
        ]
    },
    { id: "fxPauseUnfocused", cat: "effects", group: "Общее", kind: "toggle", label: "Пауза, когда Discord не в фокусе", desc: "Экономит ресурсы", default: true },
    {
        id: "fxFps", cat: "effects", group: "Общее", kind: "select", label: "Ограничение FPS эффектов", default: "auto",
        desc: "«Авто» сам снижает частоту, если кадры начинают опаздывать",
        options: [
            { value: "auto", label: "Авто (рекомендуется)" },
            { value: "30", label: "30 FPS" },
            { value: "60", label: "60 FPS" },
            { value: "0", label: "Без ограничения (тяжело для видеокарты)" }
        ]
    },
    {
        id: "fxQuality", cat: "effects", group: "Общее", kind: "select", label: "Качество отрисовки эффектов", default: "auto",
        desc: "Разрешение холста с частицами. Чем ниже, тем меньше нагрузка на видеокарту",
        options: [
            { value: "auto", label: "Авто (рекомендуется)" },
            { value: "high", label: "Высокое (как экран)" },
            { value: "medium", label: "Среднее" },
            { value: "low", label: "Низкое (максимум производительности)" }
        ]
    }
];
