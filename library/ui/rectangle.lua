---@meta

--- Decorative rectangle, filled or outlined.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/rectangle.html)
---@class ui.Rectangle : ui.Component
---@field fill boolean Solid block if true, outline if false. Default false.
---@field outlineThickness integer Positive draws inward, negative outward. Default 1.
ui.Rectangle = {}

--- Creates a new Rectangle in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Rectangle
function ui.Rectangle.new(parent, categoryID, dynamicID) end
