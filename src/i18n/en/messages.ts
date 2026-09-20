/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { FeatureText } from "..";

/** English labels for src/features/messages.ts, keyed by feature id. Missing entries fall back to Russian. */

const GROUP_LOOK = "How messages look";
const GROUP_TEXT = "Text";
const GROUP_MARKDOWN = "Markdown";
const GROUP_MEDIA = "Attachments and media";
const GROUP_SYSTEM = "System and indicators";
const GROUP_KEYWORDS = "Keywords";

const MENTION_ANY = "Works with every style except “Same as Discord”";
const MENTION_PULSE = "Works with the “Pulsing glow” style";

export const EN_MESSAGES: Record<string, FeatureText> = {
    msgHover: {
        label: "Highlight a message on hover",
        group: GROUP_LOOK
    },
    msgHoverColor: {
        label: "Message highlight color",
        desc: "Empty — the theme's accent color",
        group: GROUP_LOOK
    },
    msgHoverTint: {
        label: "Message highlight strength",
        group: GROUP_LOOK
    },
    msgBubbles: {
        label: "Messages as cards",
        desc: "Every message sits on a rounded, semi-transparent backing",
        group: GROUP_LOOK
    },
    msgBubbleColor: {
        label: "Card background color",
        desc: "Empty — the theme's surface color",
        group: GROUP_LOOK
    },
    msgBubbleOpacity: {
        label: "Card background opacity",
        group: GROUP_LOOK
    },
    msgBubbleMargin: {
        label: "Card margins on the sides",
        group: GROUP_LOOK
    },
    msgAppear: {
        label: "How new messages appear",
        desc: "Only messages that just arrived animate, scrolling through history does not",
        group: GROUP_LOOK,
        options: {
            off: "No animation",
            fade: "Fade in",
            slide: "Slide up",
            side: "Slide in from the side",
            pop: "Pop in",
            blur: "Out of a blur"
        }
    },
    mentionStyle: {
        label: "Messages that mention you",
        desc: "Pulse and rainbow animate on every such message in the loaded history",
        group: GROUP_LOOK,
        options: {
            off: "Same as Discord",
            accent: "Gradient in the accent color",
            pulse: "Pulsing glow",
            rainbow: "Rainbow stripe"
        }
    },
    mentionColor1: {
        label: "Mention: color on the left",
        group: GROUP_LOOK,
        activeHint: MENTION_ANY
    },
    mentionColor2: {
        label: "Mention: color on the right",
        group: GROUP_LOOK,
        activeHint: MENTION_ANY
    },
    mentionStripeColor: {
        label: "Mention: stripe color",
        group: GROUP_LOOK,
        activeHint: "The rainbow stripe brings its own colors"
    },
    mentionGlow: {
        label: "Mention: glow strength",
        group: GROUP_LOOK,
        activeHint: MENTION_PULSE
    },
    mentionPulseSpeed: {
        label: "Mention: pulse length",
        group: GROUP_LOOK,
        activeHint: MENTION_PULSE
    },
    hideChatAvatars: {
        label: "Hide avatars in chat",
        group: GROUP_LOOK
    },
    attachmentHighlight: {
        label: "Mark messages with images and files",
        group: GROUP_LOOK
    },
    attachmentColor: {
        label: "Attachment mark color",
        group: GROUP_LOOK
    },
    linkMsgHighlight: {
        label: "Mark messages with links",
        group: GROUP_LOOK
    },
    linkMsgColor: {
        label: "Link mark color",
        group: GROUP_LOOK
    },

    msgFontScale: {
        label: "Message text size",
        group: GROUP_TEXT
    },
    msgLineHeight: {
        label: "Line spacing",
        group: GROUP_TEXT
    },
    msgLetterSpacing: {
        label: "Letter spacing",
        group: GROUP_TEXT
    },
    msgSpacing: {
        label: "Gap between message groups",
        group: GROUP_TEXT
    },
    msgTextGlow: {
        label: "Faint glow on text",
        desc: "A shadow behind all chat text: noticeably pricier while scrolling",
        group: GROUP_TEXT
    },
    msgGlowColor: {
        label: "Text glow color",
        group: GROUP_TEXT
    },
    msgGlowBlur: {
        label: "Text glow blur",
        group: GROUP_TEXT
    },
    msgGlowStrength: {
        label: "Text glow strength",
        group: GROUP_TEXT
    },
    timestampsAlways: {
        label: "Always show the timestamp on every message",
        group: GROUP_TEXT
    },
    timestampAccent: {
        label: "Timestamps in the accent color",
        group: GROUP_TEXT
    },
    timestampColor: {
        label: "Timestamp color",
        group: GROUP_TEXT
    },
    editedAccent: {
        label: "“edited” tag in the accent color",
        group: GROUP_TEXT
    },
    editedColor: {
        label: "“edited” tag color",
        group: GROUP_TEXT
    },

    linkUnderline: {
        label: "Animated underline on links",
        group: GROUP_MARKDOWN
    },
    mentionInlineGlow: {
        label: "Gradient on @mentions",
        group: GROUP_MARKDOWN
    },
    codeBlockStyle: {
        label: "Fancy code blocks",
        group: GROUP_MARKDOWN
    },
    codeBlockColor: {
        label: "Code block border color",
        group: GROUP_MARKDOWN
    },
    codeBlockGlow: {
        label: "Code block glow",
        group: GROUP_MARKDOWN
    },
    inlineCodeAccent: {
        label: "Inline `code` in the accent color",
        group: GROUP_MARKDOWN
    },
    inlineCodeColor: {
        label: "Inline code color",
        group: GROUP_MARKDOWN
    },
    inlineCodeGlow: {
        label: "Inline code glow",
        group: GROUP_MARKDOWN
    },
    blockquoteGradient: {
        label: "Gradient bar on quotes",
        group: GROUP_MARKDOWN
    },
    blockquoteColor: {
        label: "Quote: color at the top",
        group: GROUP_MARKDOWN
    },
    blockquoteColor2: {
        label: "Quote: color at the bottom",
        group: GROUP_MARKDOWN
    },
    replySpineAccent: {
        label: "Reply line in the accent color",
        group: GROUP_MARKDOWN
    },
    replyLineColor: {
        label: "Reply line color",
        group: GROUP_MARKDOWN
    },
    spoilerGlass: {
        label: "Spoilers as frosted glass",
        group: GROUP_MARKDOWN
    },
    botTagGradient: {
        label: "Gradient BOT tag",
        group: GROUP_MARKDOWN
    },

    embedAccent: {
        label: "Gradient edge on embeds",
        group: GROUP_MEDIA
    },
    imageHoverZoom: {
        label: "Images zoom in on hover",
        group: GROUP_MEDIA
    },
    imageZoom: {
        label: "How far images zoom in",
        group: GROUP_MEDIA
    },
    imageGlowColor: {
        label: "Color of the shadow under an image",
        group: GROUP_MEDIA
    },
    emojiHoverScale: {
        label: "Emoji grow on hover",
        group: GROUP_MEDIA
    },
    jumboWiggle: {
        label: "Jumbo emoji wiggle",
        group: GROUP_MEDIA
    },
    reactionPop: {
        label: "Reactions jump on hover",
        group: GROUP_MEDIA
    },
    reactionLift: {
        label: "How high reactions jump",
        group: GROUP_MEDIA
    },
    reactionMeGlow: {
        label: "Your own reactions glow",
        group: GROUP_MEDIA
    },
    reactionMeColor: {
        label: "Glow color of your own reactions",
        group: GROUP_MEDIA
    },
    reactionMeGlowSize: {
        label: "Glow strength of your own reactions",
        group: GROUP_MEDIA
    },

    systemMsgDim: {
        label: "Dim system messages",
        group: GROUP_SYSTEM
    },
    newMessagesBarGradient: {
        label: "Gradient on the “new messages” bar",
        group: GROUP_SYSTEM
    },
    unreadDividerAccent: {
        label: "Unread divider in the accent color",
        group: GROUP_SYSTEM
    },
    typingAccent: {
        label: "“typing” indicator in the accent color",
        group: GROUP_SYSTEM
    },

    kwEnabled: {
        label: "Highlight messages with keywords",
        desc: "Messages containing these words get a color of their own",
        group: GROUP_KEYWORDS
    },
    kwList: {
        placeholder: "my name, stream, urgent",
        label: "Words, separated by commas",
        group: GROUP_KEYWORDS
    },
    kwColor: {
        label: "Keyword highlight color",
        group: GROUP_KEYWORDS
    },
    kwStyle: {
        label: "How to mark them",
        group: GROUP_KEYWORDS,
        options: {
            stripe: "Stripe on the left and a light fill",
            bg: "Background fill",
            border: "Border",
            glow: "Glow"
        }
    },
    kwStrength: {
        label: "Mark strength",
        group: GROUP_KEYWORDS
    }
};
