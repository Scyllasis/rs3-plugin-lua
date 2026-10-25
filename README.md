# RS3 Plugin API (Lua)

Autocomplete and docs for writing RuneScape 3 Plugin Hub plugins in VS Code.

## What you get
- **Completions** for every documented global, function, method, property, event and enum: type `Event.`, `Player.`, `ui.`, `SkillType.`, `e.` inside an event handler, and so on.
- **Hover docs and signature help** with a link to the matching page on developer.runescape.com.
- **Type checking**: typos like `Player.GetLevelGamplay` or `e.nope` on an event payload are underlined.
- **API Explorer** (RS3 icon in the activity bar): browse everything by area, hover for docs, click the inline buttons to insert at cursor or open the docs page.
- **RS3: Search API…** (`Ctrl+Shift+P`): fuzzy-search all ~2,700 API members; Enter inserts it.
- **RS3: Open Docs for Symbol Under Cursor** (also in the editor right-click menu).
- **RS3: New Plugin…** scaffolds `plugin.json` + `main.lua`, plain or with PrettyUI.
- **Library plugins**: list PrettyUI as a dependency and `prettyui.` gets completions, hover docs and type checking too (below).
- **plugin.json validation** and completion (keys, permission names, URL format).
- **Snippets**: `rs3event`, `rs3xp`, `rs3inv`, `rs3db`, `rs3shutdown`, `rs3log`, `rs3level`, `rs3var`, `rs3cmd`.
- **RS3: Copy a Cheat or Console Command…**: search the beta cheats and plugin console commands, fill in the arguments, and paste the result into the client console.
- **RS3: Open UI Preview**: live preview of your plugin's UI (below).

## UI Preview
Click the preview icon in the editor title bar (or run **RS3: Open UI Preview**) to see your plugin's UI on a simulated RuneScape screen, updated as you type.
- **In game / Window only** (press V): see your UI on the simulated screen, or just the window you're building, zoomed to fit.
- **Window picker:** switch between the startup game window, the ribbon plugin window, the settings window, and any pop-up function you tag with `---@preview Title`.
- **Click to inspect:** see each component's screen rect, layout formula and properties, and jump to the line that created it. Your editor cursor highlights the matching components.
- **Interact:** double-click buttons to run their real hooks; fire your subscribed events.
- **Drag to move:** drag a component (or nudge it with the arrow keys) and the numbers in your `SetPos` / `x =` / `y =` are updated for you. Ctrl+Z undoes it.
- **Zoom and pan:** Ctrl+wheel, − / +, 0 to fit; middle-drag or Space+drag to pan.
- **One window at a time:** every window your plugin draws gets its own entry in the Window menu.
- **Resolutions and UI scale** to check anchoring; **Bounds** to see invisible containers.
- **Warnings** for UI that would be invisible in-game (no size, no font, no stylesheet), also in the Problems panel.
- Optional `rs3preview.lua` for preview-only test data. See **?** in the preview for details.

## Sprite Maker & Style Studio
- **Sprite Maker** (**RS3: New Sprite…**): pixel editor for PNGs in `resources/`, with RS palette, templates (icon, 9-slice button and panel frame, scrollbar states), draggable 9-slice guides, stretch/tile/9-slice/tint preview, and the Lua to use it.
- **Style Studio** (**RS3: Open Style Studio**): gallery of the built-in stylesheets, a designer for custom stylesheets (parent + overrides, colour pickers, live preview) that generates `styles.lua`.
- The UI preview draws your PNGs and custom stylesheets.

Details: `reference/sprites-and-styles.md` in the extension, or the **?** in the preview.

## PrettyUI and other library plugins
Some plugins are libraries that other plugins build on. [PrettyUI](https://prettyui.j3.gg/) (by J3, plugin hub ID 6398181) gives you native-looking windows, panels, tabs, buttons, fields, item slots and graphs with automatic layout.

Add it to `plugin.json` (typing in `requiredDependencies` offers it):

```json
"requiredDependencies": { "prettyui": 6398181 }
```

Save, and the extension loads PrettyUI's definitions for that workspace: `prettyui.Window.new(...)`, `view:AddText(...)`, option tables and callbacks all complete and type-check, and hovers link to the matching section of the PrettyUI docs. Remove the dependency and they unload again. **RS3: New Plugin…** → **With PrettyUI** starts a plugin that already uses it. The API Explorer lists it under **PrettyUI (library plugin)**.

The extension ships only editor definitions written from PrettyUI's public docs. None of PrettyUI's code is included: the game client downloads the real library from the plugin hub. The UI preview has a **PrettyUI** switch: on, it runs PrettyUI from the copy your game client already downloaded and draws it; off, it shows the base view. It turns on by itself for plugins that depend on PrettyUI.

## How it works
Completions, hover and diagnostics come from the **Lua** extension by sumneko (lua-language-server), which is installed automatically as a dependency. This extension ships LuaLS annotation files for the RS3 API and adds them to `Lua.workspace.library` (and sets `Lua.runtime.version` to Lua 5.4) in any workspace that contains a `plugin.json`. For other folders run **RS3: Enable Plugin API for This Workspace**. Change this with the `rs3lua.autoEnable` setting.

## Find Item (Ctrl+Alt+I)
**RS3: Find Item…**: type part of an item name, press Enter, and it inserts `id.Obj.PRAYER_POTION_4` (or `2434 --[[ Prayer potion (4) ]]` when the config name isn't known) at your cursor. The row buttons insert the number, copy the ID, or open the wiki page.

The list comes from two rule-safe sources, kept on this computer:
- **RS Wiki** (**RS3: Update Item List from the RS Wiki**): every released item's name and ID, from the wiki's public data.
- **Your items** (**RS3: Create Item Export Plugin**): a tiny beta plugin that sends only what's in your backpack, worn equipment and bank, with the exact config names the game uses. It goes straight into the client's `dev_plugins` folder when it can find it (or set `rs3lua.devPluginsFolder`), and the console commands to load it are copied for you: paste them in the client console and open your bank once. No HTTP permission? It prints `RS3X|` lines instead; copy them and run **RS3: Import Item Export Output**. Exported items also get `id.Obj.` autocomplete and hover names.

## Troubleshooting: suggestions are just words from the file
That means the Lua language server isn't using the RS3 definitions. Look at the **RS3 API** item in the status bar (bottom right, on any Lua file):
- **$(check) RS3 API**: definitions are loaded.
- **$(warning) RS3 API off**: click it (or run **RS3: Check Setup**) to see why and fix it in one click.

It detects:
- the Lua extension (sumneko.lua) missing or disabled,
- the file not in Lua mode,
- a file opened on its own instead of its plugin folder,
- a `.luarc.json` with its own `workspace.library` (it replaces VS Code's settings),
- an old extension version's path,
- a runtime other than Lua 5.4,
- other Lua extensions competing for completions,
- a library plugin in `plugin.json` whose definitions aren't loaded.

The definitions now switch on automatically whenever you open a Lua file in a folder with `plugin.json`, and your own `Lua.workspace.library` entries are kept.

## Accuracy
Definitions were generated from the official API pages on 23 Oct 2026. Where the docs were unclear or inconsistent, the definition carries a `-- unverified:` comment (open it with Go to Definition). If something the game accepts is flagged, or the reverse, check the docs page and fix the file in the extension's `library/` folder.
