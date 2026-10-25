---@meta

--- The most basic layout component; children can be positioned anywhere on it.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/layer.html)
---@class ui.Layer : ui.ComponentCollection
ui.Layer = {}

--- Creates a layer under `parent`. Fails if the category/dynamic ID pair already exists on the parent. Caller must set layout and visuals.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Layer
function ui.Layer.new(parent, categoryID, dynamicID) end
