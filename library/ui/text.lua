---@meta

--- Decorative component that draws a text string. Associating an object draws its name instead.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/text.html)
---@class ui.Text : ui.Component, ui.TextData
---@field associatedObjectID integer Object ID, or -1 if none.
---@field associatedObjectQuantity integer
ui.Text = {}

--- Creates a new Text in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Text
function ui.Text.new(parent, categoryID, dynamicID) end

--- Associates an object; its name is drawn instead of `content`.
---@param objectID integer
---@param quantity? integer
function ui.Text:SetAssociatedObject(objectID, quantity) end

--- Sets the alignment (both axes, or horizontal and vertical separately).
---@param alignment ui.AlignMode
---@overload fun(self: ui.Text, horizontalAlignment: ui.AlignMode, verticalAlignment: ui.AlignMode)
function ui.Text:AlignTo(alignment) end

---@param config ui.TextDataConfig
function ui.Text:SetConfig(config) end

--- Returns a copy of the config (excludes `content`).
---@return ui.TextDataConfig
function ui.Text:GetConfigCopy() end
