---@meta

--- Decorative line spanning the component's bounds (diagonal if both dimensions > 1).
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/line.html)
---@class ui.Line : ui.Component
---@field invert boolean Invert diagonal lines vertically. Default false.
---@field width integer Line thickness in interface units. Default 1. Overrides the read-only ui.Component.width.
ui.Line = {}

--- Creates a new Line in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Line
function ui.Line.new(parent, categoryID, dynamicID) end
