---@meta
---@diagnostic disable: duplicate-set-field -- plugins may replace API functions, as rs3preview.lua does

--- UI namespace: create new interfaces and modify existing ones (colours, styles, contents).
--- Colours/tints default to white (`Vector4.new(1.0)` / `0xFFFFFFFF`); alpha defaults to 1.0.
--- Dynamic components are identified by a category ID (0..235) and a dynamic ID
--- (0..4096 when the category ID is 0, otherwise 0..235).
---
--- [Docs](https://developer.runescape.com/rs/ui/index.html)
ui = {}
