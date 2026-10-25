---@meta

--- Arranges children in a line (vertical or horizontal), resizing them to fill the panel.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/panel.html)
---@class ui.Panel : ui.ComponentCollection
---@field isVertical boolean Top-to-bottom if true, left-to-right otherwise.
---@field spacing integer Spacing between children.
ui.Panel = {}

--- Creates a panel under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Panel
function ui.Panel.new(parent, categoryID, dynamicID) end
