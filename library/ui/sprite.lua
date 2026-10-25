---@meta

--- Decorative component that draws an image. Associating an object draws its model instead.
--- Segmented sprites are not supported (`visualMargins` is ignored).
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/sprite.html)
---@class ui.Sprite : ui.Component, ui.SpriteData
---@field associatedObjectID integer Object ID, or -1 if none.
---@field associatedObjectQuantity integer
---@field associatedObjectQuantityMode ui.ObjectQuantityDisplayMode When to show the quantity label.
ui.Sprite = {}

--- Creates a new Sprite in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Sprite
function ui.Sprite.new(parent, categoryID, dynamicID) end

--- Associates an object; its model is drawn instead of the sprite.
---@param objectID integer
---@param quantity? integer
function ui.Sprite:SetAssociatedObject(objectID, quantity) end

--- Sets the alignment (both axes, or horizontal and vertical separately).
---@param alignment ui.AlignMode
---@overload fun(self: ui.Sprite, horizontalAlignment: ui.AlignMode, verticalAlignment: ui.AlignMode)
function ui.Sprite:AlignTo(alignment) end

---@param config ui.SpriteDataConfig
function ui.Sprite:SetConfig(config) end

---@return ui.SpriteDataConfig
function ui.Sprite:GetConfigCopy() end

--- When to show the quantity indicator for an associated object.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/sprite.html)
---@class ui.ObjectQuantityDisplayModeEnum
---@field NEVER ui.ObjectQuantityDisplayMode
---@field ALWAYS ui.ObjectQuantityDisplayMode
---@field MULTIPLE ui.ObjectQuantityDisplayMode Only if the stack has more than one.
ui.ObjectQuantityDisplayMode = {}
---@alias ui.ObjectQuantityDisplayMode integer
