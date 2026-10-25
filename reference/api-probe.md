# RS3 API Probe

The extension's definitions come from the official docs, which have gaps and typos. The probe is a small dev plugin that checks them against the real client and tells VS Code what it found.

## What it checks
- Every documented global, function, event, enum value and API-table field (about 1,000 names): does it exist, and is it the documented type?
- The members of 32 object types (every `ui.*` component, PlayerEntity, vectors, Pos/Size/Margin, TextData/SpriteData, StyleSheet), checked on real instances, including each property's default value.
- Members and globals the client has that the docs don't mention.
- Enum values the docs leave out (for example `ui.AlignMode`), and any that differ from the docs.
- The full `id.StyleSheet` and `id.Font` name lists, and how many `id.Component` names exist.
- `ui.StyleValue` keys and the values built-in stylesheets use.
- The real size of your plugin's ribbon window and settings window (open both icons once while it runs).

It is read-only. It looks names up and creates one hidden component of each UI type, then destroys them. It does not touch items, click, or automate anything. Use it on the beta only, and don't submit it.

## Running it
1. **RS3: Create API Probe Plugin** (beaker icon on the RS3 sidebar). It writes `rs3_api_probe/` next to your plugin and starts listening on `127.0.0.1:47321`.
2. Load that folder in the beta client (copy it into `dev_plugins`, or point `plugins_setpath` at its parent). In the console (the commands take the **folder name**, as `plugins_list` shows it):
   ```
   prf
   pon rs3_api_probe
   ppr rs3_api_probe
   ppe rs3_api_probe httpAccess
   prl rs3_api_probe
   ```
3. A window in-game shows progress (a few seconds). When it says **Sent to VS Code**, a notification appears. Open the report.
4. Click the probe's ribbon icon and settings icon once each; the sizes arrive a moment later.
5. Turn it off with `poff rs3_api_probe`.

**Unsafe calls it skips.** `StyleSheet:GetValue` crashes the beta client for property keys of 2^31 and above, and some `ui.StyleValue` entries are that large. The probe lists those keys but never reads them; the report's notes name them.

**If HTTP doesn't get through** (the window says it printed lines instead): run the `ppr` and `ppe` lines again, then `prl`. If that still fails, copy the console lines starting `RS3P|` (about 80) and run **RS3: Import Probe Output**. It reads the clipboard or the active editor, and tells you if any lines are missing.

## The report
**RS3: Show Last Probe Report** opens it again. From the report you can:
- **Use the measured window sizes** in the UI preview.
- **Add undocumented names to autocomplete**: writes `.rs3/probe-additions.lua` in your plugin folders (types unknown, so they're `any`).
- **Import the ui.StyleValue keys** into the Style Studio and autocomplete.
- **Copy a summary to send to Claude**, so the definitions can be fixed in the next version of the extension.
