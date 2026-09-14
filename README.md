# VenVisual

Vencord userplugin for nicer Discord visuals.

- **Themes**: Midnight, AMOLED, Neon/Cyber, Sakura, Ocean, Forest, Dracula, Nord, Sunset, plus custom accent / second accent / background / text colors
- **Hover highlight**: channels, DMs, members and server icons glow and slide aside on hover; the open channel gets a gradient
- **Background image** with blur, dimming, translucent panels and optional glass effect
- **Shape & text**: corner radius, custom font, message text size, spacing between message groups
- **Animations**: messages and menus fade in, smooth transitions
- **Usernames**: accent gradient, flowing rainbow, shine or glow over role color

Every setting applies live, no restart needed.

## Install

Requires a Vencord source checkout (default `D:\Projects\Vencord`), Node.js and pnpm.

```powershell
.\deploy.ps1           # copy to src/userplugins, lint, typecheck, build
.\deploy.ps1 -Inject   # same, then run the Vencord installer (patch Discord)
```

Then restart Discord and enable **VenVisual** in Settings → Vencord → Plugins.
