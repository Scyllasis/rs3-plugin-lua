# RS3 Plugin API (Lua)

Autocomplete and docs for writing RuneScape 3 Plugin Hub plugins in VS Code.

## What you get
- **Completions** for every documented global, function, method, property, event and enum: type `Event.`, `Player.`, `ui.`, `SkillType.`, `e.` inside an event handler, and so on.
- **Hover docs and signature help** with a link to the matching page on developer.runescape.com.
- **Type checking**: typos like `Player.GetLevelGamplay` or `e.nope` on an event payload are underlined.
- **API Explorer** (RS3 icon in the activity bar): browse everything by area, hover for docs, click the inline buttons to insert at cursor or open the docs page.
- **RS3: Search API…** (`Ctrl+Shift+P`): fuzzy-search all ~2,700 API members; Enter inserts it.
- **RS3: Open Docs for Symbol Under Cursor** (also in the editor right-click menu).
- **RS3: New Plugin…** scaffolds `plugin.json` + `main.lua`.
- **plugin.json validation** and completion (keys, permission names, URL format).
- **Snippets**: `rs3event`, `rs3xp`, `rs3inv`, `rs3db`, `rs3shutdown`, `rs3log`, `rs3level`, `rs3var`, `rs3cmd`.
- **RS3: Show Developer Cheats & Console Commands**: quick reference for beta-world testing.
- **RS3: Open UI Preview**: live preview of your plugin's UI (below).

## UI Preview
Click the preview icon in the editor title bar (or run **RS3: Open UI Preview**) to see your plugin's UI on a simulated RuneScape screen, updated as you type.
- **In game / Window only** (press V): see your UI on the simulated screen, or just the window you're building, zoomed to fit.
- **Window picker:** switch between the startup game window, the ribbon plugin window, the settings window, and any pop-up function you tag with `---@preview Title`.
- **Click to inspect:** see each component's screen rect, layout formula and properties, and jump to the line that created it. Your editor cursor highlights the matching components.
- **Interact:** double-click buttons to run their real hooks; fire your subscribed events.
- **Resolutions and UI scale** to check anchoring; **Bounds** to see invisible containers.
- **Warnings** for UI that would be invisible in-game (no size, no font, no stylesheet), also in the Problems panel.
- Optional `rs3preview.lua` for preview-only test data. See **?** in the preview for details.

## Sprite Maker & Style Studio
- **Sprite Maker** (**RS3: New Sprite…**): pixel editor for PNGs in `resources/`, with RS palette, templates (icon, 9-slice button and panel frame, scrollbar states), draggable 9-slice guides, stretch/tile/9-slice/tint preview, and the Lua to use it.
- **Style Studio** (**RS3: Open Style Studio**): gallery of the built-in stylesheets, a designer for custom stylesheets (parent + overrides, colour pickers, live preview) that generates `styles.lua`, and a discovery script that pulls the real `ui.StyleValue` keys from the dev client into the designer and autocomplete.
- The UI preview draws your PNGs and custom stylesheets.

Details: `reference/sprites-and-styles.md` in the extension, or the **?** in the preview.

## How it works
Completions, hover and diagnostics come from the **Lua** extension by sumneko (lua-language-server), which is installed automatically as a dependency. This extension ships LuaLS annotation files for the RS3 API and adds them to `Lua.workspace.library` (and sets `Lua.runtime.version` to Lua 5.4) in any workspace that contains a `plugin.json`. For other folders run **RS3: Enable Plugin API for This Workspace**. Change this with the `rs3lua.autoEnable` setting.

## Find Item (Ctrl+Alt+I)
**RS3: Find Item…**: type part of an item name, press Enter, and it inserts `id.Obj.PRAYER_POTION_4` (or `2434 --[[ Prayer potion (4) ]]` when the config name isn't known) at your cursor. The row buttons insert the number, copy the ID, or open the wiki page.

The list comes from two rule-safe sources, kept on this computer:
- **RS Wiki** (**RS3: Update Item List from the RS Wiki**): every released item's name and ID, from the wiki's public data.
- **Your items** (**RS3: Create Item Export Plugin**): a tiny beta plugin that sends only what's in your backpack, worn equipment and bank, with the exact config names the game uses. Open your bank once while it's enabled. These also get `id.Obj.` autocomplete and hover names.

## API Probe (test against the real client)
**RS3: Create API Probe Plugin** writes a read-only dev plugin that checks every definition against the beta client and sends the results back to VS Code. It reports:
- missing or wrongly-typed names
- undocumented members
- enum values the docs leave out
- id.StyleSheet / id.Font names and style keys
- the real ribbon and settings window sizes

You can apply the findings in one click. See `reference/api-probe.md`.

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
- other Lua extensions competing for completions.

The definitions now switch on automatically whenever you open a Lua file in a folder with `plugin.json`, and your own `Lua.workspace.library` entries are kept.

## Accuracy
Definitions were generated from the official API pages on 23 Oct 2026. Where the docs were unclear or inconsistent, the definition carries a `-- unverified:` comment (open it with Go to Definition). If something the game accepts is flagged, or the reverse, check the docs page and fix the file in the extension's `library/` folder.
