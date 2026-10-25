# Sprite Maker & Style Studio

## Sprite Maker

Custom images for plugins are PNG files in your plugin's `resources/` folder (max 1024 × 1024). Lua reaches them through `Plugin.resources`, with folders as sub-tables: `resources/ui/play_btn.png` is `Plugin.resources.ui.play_btn`.

**Start:** run **RS3: New Sprite…** (also on the RS3 sidebar, in the preview's **Sprites…** button, and on right-click of a folder inside `resources/`). Pick a template:

| Template | Size | Use |
|---|---|---|
| Icon | 32 × 32 | `ui.Sprite`, stretched to the component's size |
| Button (9-slice) | 24 × 24 | `button.sprite`: corners stay sharp at any button size |
| Panel frame (9-slice) | 32 × 32 | `box.contentBackgroundSprite` on a GroupBox |
| Scrollbar states | 16 × 64 | four states stacked: idle, mouseover, pressed, disabled |
| Blank | any | anything else |

To edit an existing PNG: right-click it → **RS3: Edit in Sprite Maker**, or use the button in its editor title bar.

**Tools:** Pencil (P), Eraser (E), Fill (G; Alt+click replaces that colour everywhere), Line (L), Rectangle (R; F toggles filled), Pick colour (I, or right-click), Pan (H, or hold Space). `[` `]` change brush size, M mirrors strokes left/right, # toggles the grid, Ctrl+wheel or +/− zooms, 0 fits. Ctrl+Z / Ctrl+Y undo and redo, Ctrl+S saves. Canvas size…, Flip and Clear are on the toolbar.

**Use as** (right panel) previews the sprite the way the game will draw it, at any size and tint:
- **Plain sprite**: stretched to the component.
- **Tiled**: repeated at its real size (`isTiling = true`).
- **9-slice**: drag the cyan guides (or type the margins). Corners never stretch, edges stretch one way, the middle stretches both ways. This becomes `visualMargins = ui.Margin.new(left, top, right, bottom)`. Per the docs, **`ui.Sprite` ignores margins**: 9-slice works on the sprite data of Buttons, GroupBoxes, Lists and similar.
- **Stacked states**: shows each scrollbar state side by side.

The Lua box under the preview has the matching code; **Copy** or **Insert into editor**. The 9-slice settings are remembered in `.rs3/sprites.json`.

The UI preview draws your real PNGs (stretched, tiled, 9-sliced, flipped, rotated and tinted) and refreshes when you save a sprite. It warns about missing files, images over 1024 × 1024, and margins on `ui.Sprite`.

## Style Studio

Run **RS3: Open Style Studio** (or **Styles…** in the preview).

A stylesheet is a set of integer properties keyed by `ui.StyleValue`, with a parent it inherits everything else from. Components use one through `component.stylesheetID`.

### Built-in gallery
Every built-in stylesheet the docs list, by component, with the recommended one marked. **Copy ID** gives `id.StyleSheet.NAME`; **New style from this** starts a custom style with it as the parent. The look is an approximation of the real art.

### My styles
Each custom style has a Lua name (e.g. `GOLD_BUTTON`), a numeric ID, a parent (built-in or another of your styles) and value overrides. Colour keys (`…rgb`) get a colour picker and alpha keys a slider. **Save styles.lua** writes:

- `.rs3/styles.json`, which the studio edits, and
- `styles.lua`, a module your plugin loads:

```lua
local Styles = require("styles")
myButton.stylesheetID = Styles.GOLD_BUTTON
```

The studio offers to add the `require` to `main.lua`. It never overwrites a `styles.lua` it didn't create (it writes `styles_generated.lua` instead). The UI preview applies custom styles, including inherited values, and the Properties panel shows each component's style chain.

**IDs:** stylesheet IDs are global, and the docs don't reserve a range. Jagex's example uses 10000, so the studio starts there. Pick IDs unlikely to clash with other plugins.

### Discover keys
The docs name only `button.tint.rgb` and `button.tint.alpha`, but the game has more. **Create discovery plugin** writes a small `style_discovery` plugin next to yours. Copy it into the beta client's `dev_plugins` folder, run `prf` then `pon style_discovery` (console commands take the folder name), and paste the console output into the studio. Importing:

- adds every key to the designer's key list,
- shows the values the built-in stylesheets use (so you can see what you inherit and override it),
- writes `.rs3/stylevalues.lua` so `ui.StyleValue.` autocompletes the real keys.

## The `.rs3` folder

`.rs3/` holds editor-only data (sprite settings, style specs, discovered keys). The game never reads it, so leave it out when you upload the plugin.
