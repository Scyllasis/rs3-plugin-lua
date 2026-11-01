# Upload checklist

From Jagex's submission docs. **RS3: Check Plugin** covers everything it can see in your files; the rest is on the Mod.io page.

## Your plugin
- [ ] `main.lua` and `plugin.json` sit at the top of the zip (**RS3: Package for Upload** does this).
- [ ] Name: 1-50 characters, ASCII only.
- [ ] Version: digits and full stops only.
- [ ] Every permission in `plugin.json` is one the code uses.
- [ ] Code is commented and easy to follow. Jagex reviews it, and AI-assisted code is fine if you understand it.
- [ ] Docs are clear to a brand-new player.

## Mod.io page
- [ ] Summary: 10-250 characters, ASCII only.
- [ ] Listing image: 16:9, at least 512x288.
- [ ] Description has all four required sections:
  - **Email**: a contact address. It's public, so use a different one from your Mod.io or RuneScape login.
  - **EULA**: a statement that submitting means agreeing to the [Jagex EULA](https://legal.jagex.com/docs/terms/eula).
  - **Permissions**: each permission explained, or a statement that there are none.
  - **Data Protection**: what happens to the data you gather. Read the three cases in the docs and include only yours.
- [ ] If you request permissions, the matching permission tags are set.
- [ ] Required dependencies are also set on Mod.io. Optional ones must not be.
- [ ] Platforms: Windows, Linux, Android, iOS **and** Source are all selected.

## Review tiers
Some features get extra scrutiny and may need changes: combat overlays, enemy timers, navigation and timing tools, anything that requests a permission, and bundled images or sounds. Automating gameplay, predicting mechanics, automatic stand or don't-stand markers and prayer recommendations are prohibited.

Full rules: [plugin guidelines](https://developer.runescape.com/rs/submission/guidelines.html) and the [submission process](https://developer.runescape.com/rs/submission/process.html).
