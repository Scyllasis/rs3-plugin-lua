# Changelog

## 0.7.0 — 2026-10-25
### Added
- **PrettyUI support.** List `"prettyui": 6398181` under `requiredDependencies` (or `optionalDependencies`) and the `prettyui` global gets completions, hover docs, signature help and type checking for every component, option table and callback. Definitions load and unload as plugin.json changes, `.luarc.json` setups included, and **RS3: Check Setup** reports when they are missing. Only editor definitions are shipped, written from the public PrettyUI docs.
- **RS3: New Plugin…** asks for a plain RS3 API plugin or one with PrettyUI.
- API Explorer and **RS3: Search API…** include PrettyUI, linking each entry to its section of the PrettyUI docs.
- plugin.json validation accepts plugin hub IDs as dependency values (`"prettyui": 6398181`, the documented form) and suggests PrettyUI.
- **UI preview draws PrettyUI.** A **PrettyUI** switch in the toolbar runs PrettyUI from the copy the game client already downloaded and draws its components; off is the base view. It is on automatically when plugin.json depends on PrettyUI. Components point at the plugin line that created them, and errors inside PrettyUI are reported at the calling line. Built-in game sprites are drawn as themed approximations by name.
- UI preview: `id.*` values are integers (stand-ins mapped back to names), `config.Obj.X.id` is an integer, combo box entry maps are listed, and windows with more than 200 components are no longer cut off.

### Changed
- **Cheats and console commands** are a searchable list: pick one, fill in its arguments, and it is copied for the client console (**RS3: Copy a Cheat or Console Command…**). The full reference is a button away.
- **Item export is quicker**: the plugin goes straight into the client's `dev_plugins` folder when found (`rs3lua.devPluginsFolder` to set it), the receiver starts, and the console commands are already on the clipboard. Pasted console output is imported with **RS3: Import Item Export Output**. Setting `rs3lua.probe.port` is now `rs3lua.itemExport.port`.
- Definitions: notes about client crashes found on the beta (`StyleSheet:GetValue` keys of 2^31+, `ui.Grid.cellHeight`, `HTTPRequest.new` paths) are kept.

### Removed
- The API probe (create probe plugin, probe receiver, import probe output, probe report) and the Style Studio's key discovery. They were testing tools for building this extension.

## 0.6.1 — 2026-10-23
- **Fix: the API probe could crash the client.** It destroyed two components twice (TextData/SpriteData were the same objects as Text/Sprite) and created/destroyed every component type in one frame. The probe now runs in two phases: names first (nothing created; results sent immediately), then objects one per tick, each destroyed exactly once. Component types more likely to misbehave when created bare are off by default (`INCLUDE_RISKY`). Crash breadcrumbs: if a run takes the client down, the next run reports the step and skips it (`RESET_SKIPS` to retry).

## 0.6.0 — 2026-10-23
- **Find Item** (Ctrl+Alt+I): search item names, insert `id.Obj.NAME` or the ID. Sources: the RS Wiki's public item data (released items only) and an item export plugin that sends only your own backpack/worn/bank items. Exported items get `id.Obj.` autocomplete and hover names.

## 0.5.0 — 2026-10-23
- **RS3 API Probe**: generates a read-only beta plugin that checks ~1,000 documented names and the members of 32 object types against the real client; finds undocumented members/globals, undocumented enum values, id.StyleSheet/id.Font names, ui.StyleValue keys and the real ribbon/settings window sizes. Results arrive over local HTTP (or pasted console lines); the report can update the preview's window sizes, add undocumented names to autocomplete, import style keys, and copy a summary for fixing the definitions.

## 0.4.1 — 2026-10-23
- Fix: completions could fall back to plain words because the RS3 definitions never reached the Lua language server. They are now enabled whenever a Lua file in a plugin folder is opened (not just at startup), single files get an offer to use user settings, existing `Lua.workspace.library` entries are kept, and old-version paths are replaced.
- New **RS3 API** status bar item and **RS3: Check Setup** command: detects a missing/disabled Lua extension, non-Lua language mode, `.luarc.json` overriding the library, wrong runtime and competing Lua extensions, with one-click fixes.

## 0.4.0 — 2026-10-23
- **Sprite Maker**: pixel editor for `resources/*.png` with tools, RS palette, templates, 9-slice guides, stretch/tile/9-slice/states/tint preview and Lua snippets. Settings remembered in `.rs3/sprites.json`.
- **Style Studio**: built-in stylesheet gallery, custom stylesheet designer generating `styles.lua`, and `ui.StyleValue` key discovery (dev-client script, import, autocomplete).
- UI Preview: draws plugin PNGs (stretch, tile, 9-slice, flip, rotation, tint) and custom stylesheets (inheritance, tint); style chain in Properties; warnings for missing/oversized images and margins on ui.Sprite. Sprites… / Styles… buttons.
- `ui.StyleValue` typed with the documented keys.

## 0.3.0 — 2026-10-23
- UI Preview: **In game / Window only** view switch (V). Window only shows just the selected window, cropped and zoomed to fit, without the client or other plugin UI.

## 0.2.0 — 2026-10-23
- UI Preview: runs plugin Lua (5.4, WebAssembly) against a simulated client and draws components on a mock RS screen. Window picker (startup, ribbon window, settings, `---@preview` pop-ups), click-to-inspect with source sync, cursor highlighting, running hooks and events, resolutions/UI scale, bounds view, invisible-UI warnings in the Problems panel, optional `rs3preview.lua` test data.

## 0.1.0 — 2026-10-23
- First version: type definitions for the full RuneScape Client API (Core, Events, Game, Config, Entities, Lists, Math, UI), API Explorer, API search, docs links, snippets, plugin.json validation, New Plugin scaffold, cheat/console reference.
