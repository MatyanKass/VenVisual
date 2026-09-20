/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Marks messages with plain attributes (data-vv-kw / -link / -att / -sys) so the stylesheet can
 * target them without `:has()`. Chromium re-evaluates `:has()` rules on the whole message list
 * whenever anything inside it changes — including every hover — which is enough to make hovering
 * a message stutter on a busy chat. One throttled walk over new messages is far cheaper.
 */

const THROTTLE_MS = 250;
/** while no message list is mounted (friends page, settings) retry at most this often */
const RETRY_MS = 1000;
const MESSAGE_SEL = 'li[id^="chat-messages-"]';
const CONTENT_SEL = '[id^="message-content-"]';
/** message lists to watch: the main chat plus any open thread / side panel */
const LIST_SEL = '[class*="messagesWrapper_"]';
const LIST_FALLBACK_SEL = '[class*="chatContent_"]';
/** the root observer only has to notice that a message list was replaced, so it can skip body-level portals */
const APP_ROOT_SEL = "#app-mount";
const SEEN_ATTR = "data-vv-seen";
/** a channel switch adds fresh unseen <li>s anyway, skip the per-record walk on batches that big */
const BIG_BATCH = 200;

const LINK_SEL = 'a[class*="anchor_"]';
const ATTACHMENT_SEL = '[class*="imageWrapper_"], [class*="attachment_"]';
const SYSTEM_SEL = '[class*="systemMessage_"]';

export interface MessageTags {
    /** lowercase words; a message containing any of them gets data-vv-kw */
    words: string[];
    /** mark messages that contain a link with data-vv-link */
    links: boolean;
    /** mark messages with images / files with data-vv-att */
    attachments: boolean;
    /** mark Discord's own system messages with data-vv-sys */
    system: boolean;
}

const TAG_ATTRS = ["data-vv-kw", "data-vv-link", "data-vv-att", "data-vv-sys"];

let tags: MessageTags = { words: [], links: false, attachments: false, system: false };
let tagsKey = "";
let version = 0;

/** watches the message lists themselves (new / re-rendered messages) */
let listObserver: MutationObserver | null = null;
/** watches the app root, only to notice that the message list was replaced (channel / view switch) */
let rootObserver: MutationObserver | null = null;
let lists: HTMLElement[] = [];
let retryAt = 0;

let timer: ReturnType<typeof setTimeout> | null = null;
let lastRun = 0;

function normalizeWords(list: string[] | null | undefined): string[] {
    if (!list) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of list) {
        if (typeof raw !== "string") continue;
        const w = raw.trim().toLowerCase();
        if (!w || seen.has(w)) continue;
        seen.add(w);
        out.push(w);
    }
    return out;
}

function normalize(cfg: MessageTags | null): MessageTags {
    return {
        words: normalizeWords(cfg?.words),
        links: !!cfg?.links,
        attachments: !!cfg?.attachments,
        system: !!cfg?.system
    };
}

const anyWanted = (t: MessageTags) => t.words.length > 0 || t.links || t.attachments || t.system;

function resolveLists(): HTMLElement[] {
    const found = document.querySelectorAll<HTMLElement>(LIST_SEL);
    if (found.length) return [...found];
    const fallback = document.querySelector<HTMLElement>(LIST_FALLBACK_SEL);
    return fallback ? [fallback] : [];
}

function listsAlive(): boolean {
    return lists.length > 0 && lists.every(el => el.isConnected);
}

/** (re)binds the list observer; a no-op while the same lists are still mounted */
function attach(): boolean {
    const next = resolveLists();
    if (next.length === lists.length && next.every((el, i) => el === lists[i])) return next.length > 0;

    lists = next;
    listObserver ??= new MutationObserver(onListMutations);
    listObserver.disconnect();
    for (const el of next) listObserver.observe(el, { childList: true, subtree: true });
    return next.length > 0;
}

function setFlag(li: HTMLElement, attr: string, on: boolean) {
    if (on) {
        if (!li.hasAttribute(attr)) li.setAttribute(attr, "");
    } else if (li.hasAttribute(attr)) {
        li.removeAttribute(attr);
    }
}

function pass() {
    lastRun = Date.now();
    if (!anyWanted(tags)) return;

    // the chat container is thrown away on channel / view switches, so resolve it lazily here
    if (!attach()) {
        retryAt = Date.now() + RETRY_MS;
        return;
    }

    const ver = String(version);
    const sel = `${MESSAGE_SEL}:not([${SEEN_ATTR}="${ver}"])`;
    for (const list of lists) {
        for (const li of list.querySelectorAll<HTMLElement>(sel)) {
            if (tags.words.length) {
                const text = li.querySelector(CONTENT_SEL)?.textContent?.toLowerCase() ?? "";
                setFlag(li, "data-vv-kw", text.length > 0 && tags.words.some(w => text.includes(w)));
            }
            if (tags.links) setFlag(li, "data-vv-link", !!li.querySelector(LINK_SEL));
            if (tags.attachments) setFlag(li, "data-vv-att", !!li.querySelector(ATTACHMENT_SEL));
            if (tags.system) setFlag(li, "data-vv-sys", !!li.querySelector(SYSTEM_SEL));
            li.setAttribute(SEEN_ATTR, ver);
        }
    }
}

function schedule() {
    if (timer !== null) return;
    const wait = Math.max(0, lastRun + THROTTLE_MS - Date.now());
    timer = setTimeout(() => {
        timer = null;
        pass();
    }, wait);
}

function addsMessage(r: MutationRecord): boolean {
    for (const node of r.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        if (el.matches(MESSAGE_SEL) || el.querySelector(MESSAGE_SEL)) return true;
    }
    return false;
}

function onListMutations(records: MutationRecord[]) {
    // huge batches (channel switch) add fresh unseen <li>s anyway, skip the per-record walk there
    if (records.length > BIG_BATCH) {
        schedule();
        return;
    }

    let relevant = false;
    for (const r of records) {
        if (addsMessage(r)) {
            relevant = true;
            continue;
        }
        // messages edited / re-rendered in place keep their <li>, so mark them for a re-check
        const t = r.target;
        if (t.nodeType !== Node.ELEMENT_NODE) continue;
        const li = (t as Element).closest(MESSAGE_SEL);
        if (!li) continue;
        if (li.hasAttribute(SEEN_ATTR)) li.removeAttribute(SEEN_ATTR);
        relevant = true;
    }
    // nothing message-shaped in this batch (avatars, typing indicator, ...): do not wake the pass
    if (relevant) schedule();
}

function onRootMutations() {
    // deliberately cheap: everything else is handled by the observer bound to the list itself
    if (listsAlive()) return;
    if (Date.now() < retryAt) return;
    schedule();
}

function clearAttributes() {
    const selector = [...TAG_ATTRS, SEEN_ATTR].map(a => `[${a}]`).join(", ");
    for (const el of document.querySelectorAll(selector)) {
        for (const a of TAG_ATTRS) el.removeAttribute(a);
        el.removeAttribute(SEEN_ATTR);
    }
}

function teardown() {
    listObserver?.disconnect();
    listObserver = null;
    rootObserver?.disconnect();
    rootObserver = null;
    lists = [];
    retryAt = 0;
    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
}

export function configureKeywords(cfg: MessageTags | null): void {
    const next = normalize(cfg);

    if (!anyWanted(next)) {
        if (rootObserver || listObserver || timer !== null || anyWanted(tags)) {
            teardown();
            tags = next;
            tagsKey = "";
            clearAttributes();
        }
        return;
    }

    const key = JSON.stringify([next.words, next.links, next.attachments, next.system]);
    if (key === tagsKey && rootObserver) return;

    // a tag that was just switched off must lose its attribute, and every message needs a re-check
    const dropped = TAG_ATTRS.filter((_, i) =>
        [tags.words.length > 0, tags.links, tags.attachments, tags.system][i]
        && ![next.words.length > 0, next.links, next.attachments, next.system][i]);
    for (const attr of dropped) {
        for (const el of document.querySelectorAll(`[${attr}]`)) el.removeAttribute(attr);
    }

    tags = next;
    tagsKey = key;
    version++;

    if (!rootObserver) {
        const root = document.querySelector<HTMLElement>(APP_ROOT_SEL) ?? document.body ?? document.documentElement;
        rootObserver = new MutationObserver(onRootMutations);
        rootObserver.observe(root, { childList: true, subtree: true });
    }

    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
    retryAt = 0;
    pass();
}
