# VenVisual

Vencord userplugin for nicer Discord visuals. 320 settings across eight tabs, with a searchable
settings panel, ready-made presets, export/import and a "⚡ Ускорить" button.

- **Themes**: 24 palettes (Midnight, AMOLED, Neon, Synthwave, Sakura, Dracula, Catppuccin, Nord,
  Gruvbox, Tokyo Night…), custom accent / background / text colors, a rainbow accent that cycles,
  automatic day/night switching, and whole-window color correction.
- **Hover highlight**: channels, DMs, members, menu items and server icons light up and slide aside,
  in six styles, with your own colors, glow strength and stripe width. The open chat gets a gradient.
- **Messages**: hover tint, bubbles, entry animations (only for messages that actually arrive),
  mention styles, keyword highlighting, code blocks, quotes, reactions, images, timestamps — each
  with its own colors and intensities.
- **Names and avatars**: gradient / rainbow / fire / ice / gold / neon names with adjustable speed and
  angle, avatar shapes, hover effects, rings and status glow.
- **Background**: image, animated gradient, aurora, colour mesh, starfield or retro grid, with blur,
  dimming, parallax, translucent panels and glass, plus vignette, film grain and CRT lines.
- **Effects** (canvas): 12 particle kinds with depth ("объёмный полёт"), six cursor trails, a lagging
  cursor ring, click bursts, confetti or fireworks when you send a message, typing sparks.
- **Interface**: corner radius (separately for messages, panels and media), fonts, scrollbars, chat
  input glow, hiding clutter, window chrome gradients, glass menus, popup animations, focus mode.
- **Extras**: clock / session timer / FPS widgets, privacy blurs for streaming, a glowing window
  frame, a chat watermark, and a Ctrl+Alt+V panic hotkey.

Everything applies live, no restart needed.

## Performance

The plugin is written to stay off Chromium's slow paths, because Discord renders as a web page:

- no `:has()` in the message list and no universal selectors in hot rules — one `:has()` rule once
  made every style recalculation in the client ~60ms (measured), which stuttered hovering and scrolling
- messages are tagged with attributes by a throttled observer instead of being matched structurally
- animations move `transform` / `opacity` rather than repainting shadows, gradients or blurs
- the particle canvas clears only the boxes it drew into, caps its resolution and frame rate, and
  stops its loop entirely when nothing moves
- every looping animation pauses while the Discord window is not focused

Measured after this work: 60fps while idle, scrolling and hovering; the whole stylesheet adds about
0.03ms per style recalculation.

## Install

Requires a Vencord source checkout (default `D:\Projects\Vencord`), Node.js and pnpm.

```powershell
.\deploy.ps1           # copy to src/userplugins, lint, typecheck, build
.\deploy.ps1 -Inject   # same, then run the Vencord installer (patch Discord)
```

Then restart Discord (Ctrl+R is enough after a rebuild) and enable **VenVisual** in
Settings → Vencord → Plugins.
