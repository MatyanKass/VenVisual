/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/hover.ts, keyed by feature id. Missing entries fall back to Russian. */

const GROUP_HOVER = "Hover";
const GROUP_WHERE = "Where to highlight";
const GROUP_OPEN = "Open chat";
const GROUP_STATES = "Channel states";

export const EN_HOVER: Record<string, FeatureText> = {
    hoverEnabled: {
        label: "Highlight on hover",
        desc: "The row glows and slides aside, the way the open one does",
        group: GROUP_HOVER
    },
    hoverStyle: {
        label: "Highlight style",
        group: GROUP_HOVER,
        options: {
            slide: "Slide + glow + stripe",
            soft: "Soft slide",
            gradient: "Gradient fill",
            neon: "Neon outline",
            scale: "Zoom with a shadow",
            underline: "Underline"
        }
    },
    hoverColor: {
        label: "Your own highlight color",
        desc: "Empty — the theme's accent color",
        group: GROUP_HOVER
    },
    hoverShift: {
        label: "How far it slides",
        group: GROUP_HOVER
    },
    hoverGlow: {
        label: "Glow strength",
        group: GROUP_HOVER
    },
    hoverTint: {
        label: "Background fill strength",
        desc: "100% = the stock look",
        group: GROUP_HOVER
    },
    hoverStripe: {
        label: "Stripe thickness",
        group: GROUP_HOVER,
        activeHint: "Only the “Slide + glow + stripe” and “Underline” styles draw it"
    },

    hoverChannels: {
        label: "Server channels",
        group: GROUP_WHERE
    },
    hoverDMs: {
        label: "DMs",
        group: GROUP_WHERE
    },
    hoverMembers: {
        label: "Member list",
        group: GROUP_WHERE
    },
    hoverMenus: {
        label: "Context menu items",
        group: GROUP_WHERE
    },
    hoverServers: {
        label: "Server icons",
        group: GROUP_WHERE,
        options: {
            off: "No effect",
            lift: "Shift + glow",
            scale: "Zoom",
            spin: "Spin",
            wiggle: "Wiggle",
            bounce: "Bounce"
        }
    },
    serverHoverPower: {
        label: "Server icon effect strength",
        desc: "How far the icon grows, wiggles and jumps",
        group: GROUP_WHERE
    },
    serverHoverSpeed: {
        label: "Icon animation length",
        group: GROUP_WHERE,
        activeHint: "For spin, wiggle and bounce"
    },

    highlightSelected: {
        label: "Highlight the open channel / DM",
        desc: "A gradient and a stripe on the chat you are in",
        group: GROUP_OPEN
    },
    selColor1: {
        label: "Open chat: color on the left",
        desc: "The stripe uses it too",
        group: GROUP_OPEN
    },
    selColor2: {
        label: "Open chat: color on the right",
        group: GROUP_OPEN
    },
    selStrength: {
        label: "Highlight strength",
        group: GROUP_OPEN
    },
    selectedPulse: {
        label: "Open chat pulses",
        group: GROUP_OPEN
    },
    selectedServerGlow: {
        label: "Glow on the current server",
        group: GROUP_OPEN
    },
    serverPillAccent: {
        label: "Server pill in the accent color",
        group: GROUP_OPEN
    },

    unreadGlow: {
        label: "Unread channels glow",
        group: GROUP_STATES
    },
    unreadColor: {
        label: "Unread channel color",
        group: GROUP_STATES
    },
    mutedOpacity: {
        label: "Muted channel transparency",
        group: GROUP_STATES
    },
    voiceConnectedPulse: {
        label: "Pulse on the voice channel you are in",
        group: GROUP_STATES
    },
    voiceColor: {
        label: "Voice channel pulse color",
        desc: "Empty — Discord green",
        group: GROUP_STATES
    },
    channelIconAccent: {
        label: "Channel icons in the accent color on hover",
        group: GROUP_STATES
    },
    channelIconColor: {
        label: "Channel icon color",
        group: GROUP_STATES
    },
    categoryAccent: {
        label: "Category names in the accent color",
        group: GROUP_STATES
    },
    categoryColor: {
        label: "Category name color",
        group: GROUP_STATES
    },
    hoverBold: {
        label: "Name turns bold on hover",
        group: GROUP_STATES
    },
    folderTint: {
        label: "Accent tint on open server folders",
        group: GROUP_STATES
    }
};
