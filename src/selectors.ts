/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Discord hashes class names (e.g. "link__2ea32"), so everything is matched by prefix.
// Verified against the live client (visual refresh, 2026-09).

const c = (name: string) => `[class*="${name}_"]`;

export const S = {
    appMount: "#app-mount",
    systemBar: c("systemBar"),
    winButtons: c("winButtons"),

    guilds: c("guilds"),
    guildItem: `${c("guilds")} ${c("listItem")}`,
    /** icon container of a guild list item, relative to the item: listItemWrapper_ (home, discover), blobContainer_ or wrapper_ (servers) */
    guildIconTail: `> span:not(${c("hiddenVisually")}) > div`,
    guildIcon: `${c("guilds")} ${c("listItem")} > span:not(${c("hiddenVisually")}) > div`,
    guildPill: `${c("guilds")} ${c("listItem")} > ${c("wrapper")} > ${c("item")}`,
    guildSeparator: c("guildSeparator"),
    guildFolder: c("folderGroupBackground"),

    sidebar: c("sidebar"),
    sidebarList: c("sidebarList"),
    panels: c("panels"),

    channelContainer: c("containerDefault"),
    channel: `${c("containerDefault")} ${c("link")}`,
    channelName: `${c("containerDefault")} ${c("name")}`,
    channelIcon: `${c("containerDefault")} ${c("icon")}`,
    channelSelected: `${c("modeSelected")} ${c("link")}`,
    channelUnread: `${c("modeUnreadImportant")} ${c("link")}`,
    channelMuted: c("modeMuted"),
    channelConnected: `${c("modeConnected")} ${c("link")}`,
    categoryName: `${c("containerDefault")} ${c("mainContent")} h3, ${c("categoryName")}`,

    dmList: c("privateChannels"),
    dm: `${c("privateChannels")} ${c("interactive")}`,
    dmSelected: `${c("privateChannels")} ${c("interactiveSelected")}`,
    dmStoreLinks: `${c("privateChannels")} ${c("channel")}:has(a[href="/store"], a[href="/shop"], a[href="/quest-home"])`,

    membersWrap: c("membersWrap"),
    member: `${c("membersWrap")} ${c("member")}`,
    memberAvatar: `${c("membersWrap")} ${c("avatar")}`,

    chatContent: c("chatContent"),
    messagesWrapper: c("messagesWrapper"),
    messageLi: 'li[id^="chat-messages-"]',
    message: `li[id^="chat-messages-"] > ${c("message")}`,
    messageGroupStart: `li[id^="chat-messages-"] > ${c("groupStart")}`,
    messageContent: c("messageContent"),
    mentioned: `li[id^="chat-messages-"] > ${c("mentioned")}`,
    username: `${c("header")} ${c("username")}`,
    chatAvatar: `li[id^="chat-messages-"] img${c("avatar")}`,
    timestamp: `li[id^="chat-messages-"] ${c("timestamp")}`,
    timestampHover: c("timestampVisibleOnHover"),
    edited: c("edited"),
    reply: c("repliedMessage"),
    blockquote: c("blockquoteDivider"),
    codeBlock: `${c("markup")} pre`,
    inlineCode: c("inlineCode"),
    spoiler: `${c("spoilerContent")}${c("hidden")}`,
    embed: 'article[class*="embed_"]',
    image: `li[id^="chat-messages-"] ${c("imageWrapper")}`,
    emoji: `${c("messageContent")} img.emoji`,
    jumboEmoji: `${c("messageContent")} img${c("emojiJumbo")}`,
    reaction: c("reaction"),
    reactionMe: `${c("reaction")}${c("reactionMe")}`,
    systemMessage: c("systemMessage"),
    newMessagesBar: c("newMessagesBar"),
    unreadDivider: `${c("divider")}${c("isUnread")}`,
    botTag: c("botTag"),
    anchor: `${c("messageContent")} a${c("anchor")}`,
    mentionInline: `${c("messageContent")} .mention`,

    chatForm: c("form"),
    chatInput: c("channelTextArea"),
    chatInputButtons: `${c("channelTextArea")} ${c("buttons")}`,
    placeholder: `${c("channelTextArea")} ${c("placeholder")}`,
    typing: c("typing"),

    headerBar: c("headerBar"),
    title: `section${c("title")}`,

    menu: c("menu"),
    menuItem: `${c("menu")} ${c("item")}`,
    menuFocused: `${c("menu")} ${c("focused")}`,
    tooltip: c("tooltip"),
    dialog: '[role="dialog"]',
    layerContainer: c("layerContainer"),
    backdrop: c("backdrop"),

    numberBadge: c("numberBadge"),
    unreadPill: c("unreadPill"),
    speaking: c("speaking"),
    voiceUser: c("voiceUser"),
    statusDot: 'rect[mask*="svg-mask-status"]',
    scroller: c("scrollerBase")
};
