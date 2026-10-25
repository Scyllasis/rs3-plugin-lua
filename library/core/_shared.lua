---@meta

-- Small glue definitions that join the per-page files together.

--- Engine-level client state. Only `game.options` is documented.
---
--- [Docs](https://developer.runescape.com/rs/core/clientoptions.html)
---@class GameGlobal
---@field options ClientOptions Engine-level client options, e.g. `game.options.Bloom`.
game = {}

--- Header text settings of a ui.GroupBox. -- unverified: not documented separately; assumed to behave like ui.TextData.
---@alias ui.LabelData ui.TextData
