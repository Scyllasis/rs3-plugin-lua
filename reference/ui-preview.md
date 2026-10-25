# RS3 UI Preview

Open it with the preview icon in the editor title bar (on any `.lua` file or `plugin.json`), or **RS3: Open UI Preview** from the command palette.

The preview runs your plugin's real Lua (Lua 5.4) against a simulated client, records every `ui.*` component it creates, and draws them on a mock RuneScape screen. It re-runs as you type.

## Choosing a window

The **Window** menu lists every screen your plugin can show:

| Entry | When it appears | What runs |
|---|---|---|
| Startup: game window | always | `main.lua` top to bottom. Components on `ui.Interfaces:GetComponent(id.Component.TOPLEVEL_V2__PLUGIN_BUILD_LAYER_TOP)` are drawn over the whole screen. |
| Plugin window (ribbon icon) | you subscribe to `Event.ContentLayerReady` | your handler, with an empty window as `e.component` |
| Plugin settings | you subscribe to `Event.SettingsLayerReady` | your handler, with an empty window as `e.component` |
| Pop-up: *your title* | you tag a function with `---@preview` | that function |

### Adding your own pop-ups

Put `---@preview Title` on the line above any function that builds UI:

```lua
---@preview Clean-up confirmation
local function showConfirm()
  local p = ui.GroupBox.new(game_window)
  ...
end
```

The function must be **top-level** in its file (a top-level `local function`, a global, or a field of a top-level table such as `M.showConfirm`). If it takes a parameter, the preview passes the game window as the first argument. The annotation is a plain comment, so the game ignores it.

## In game vs Window only

The switch next to the Window menu (or press **V**) changes the view:

- **In game**: your UI on the full simulated screen, at the chosen resolution, with the mock client behind it. Use it to check where things sit and how they anchor.
- **Window only**: just the window picked in the Window menu, cropped to its edges and zoomed to fit (up to 200%). The client and any other UI your plugin draws are hidden, and the component tree lists only that window. Use it to work on the window's own layout.

Selection, editor sync, Interact and Bounds work the same in both views.

## Working with the preview

- **Click** a component to select it. The sidebar shows its screen rect, the layout formula that produced it (offset + parent % + self %), every property you set, and its hooks. With **Sync editor** on, the line that created it is revealed.
- **Move your cursor** in the editor: components created on that line get a purple outline.
- **Double-click** a button (or click with **Interact** on) to run its hook for real, e.g. `ONBUTTONPRESSED`. If the hook changes text or opens a pop-up, the preview updates. Use **Re-run** to reset.
- **Fire event…** runs your handler for any event you subscribe to (e.g. `SkillTransmit`). Payload fields are placeholder values.
- **Bounds** outlines every component, including invisible layout containers. A red dot marks components with no size.
- **Resolution** and **UI scale** change the screen size in interface units (pixels ÷ scale), so you can check anchoring on small and ultrawide screens.

## Warnings

The preview flags things that make UI invisible in-game (also shown in the Problems panel):
- no size set (`SetSize`)
- `ui.Text` without `.font`
- `ui.GroupBox` / `ui.Button` without `.stylesheetID`
- a `nil` parent passed to `.new`
- a component completely outside its parent

## Test data

Game data (levels, inventories, vars) isn't available outside the client, so API calls return placeholder values that print as their own name, e.g. `Player.GetLevelGameplay()`. To control them, add an optional **`rs3preview.lua`** next to `main.lua`. It runs before `main.lua`, only in the preview:

```lua
-- rs3preview.lua: preview-only test data (don't ship this file)
Player.GetLevelGameplay = function(skill) return 85 end
Player.GetName = function() return "Sam" end
```

`PersistentDB` works in memory, `log`/`print` go to the Output pane, and `formatStr` is implemented.

## PrettyUI
The **PrettyUI** switch in the toolbar decides whether the preview runs PrettyUI:

- **On**: PrettyUI runs from the copy your game client already downloaded (`%ProgramData%\Jagex\RuneScape-BETA\plugins\6398181`), so its windows, panels, buttons and fields are drawn like any other UI. Clicking a PrettyUI component selects it and jumps to *your* line that created it.
- **Off**: the base view. PrettyUI calls do nothing, so only native `ui.*` components are drawn.

It is on automatically when plugin.json lists PrettyUI as a dependency and off when it doesn't. Flip it to override that for the current plugin. If the client hasn't downloaded PrettyUI yet the switch is greyed out: enable any plugin that uses it in the client once.

PrettyUI draws with the game's own sprites, which the preview doesn't have, so frames, title bars, buttons, scrollbars and slots are drawn as approximations (hover one to see the sprite name).

## Custom art and styles

PNGs you assign from `Plugin.resources` are drawn for real, including 9-slice `visualMargins`, tiling, flips, rotation and tint, and custom stylesheets (`ui.StyleSheets[id]`, parents, tint values) are applied. Make them with the **Sprites…** and **Styles…** buttons. See *Sprite Maker & Style Studio* for details.

## What is approximate

- **Look:** RS stylesheets, fonts and sprites are drawn with a generic RS-style theme, not the real assets. Sizes and positions are exact per the documented layout rules. Colours, alpha, fonts sizes (from the font name), alignment and `Panel` stacking are approximated.
- **Window sizes:** the docs don't state the size of the ribbon and settings windows. Set them in Settings (`rs3lua.preview.contentWindowSize`, `rs3lua.preview.settingsWindowSize`) to match what you see in-game.
- **Other interfaces:** `ui.Interfaces:GetComponent` for anything except the plugin build layer is drawn as the full game window.
- **Mock client:** the ribbon, minimap, chat and action bar are placeholders for orientation only; your real layout will differ.
- Plugin code runs with a 20-million-instruction limit per step, so an infinite loop stops with an error instead of hanging VS Code.
