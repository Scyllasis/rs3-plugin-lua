---@meta

--- When a button triggers its press action.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/button.html)
---@class ui.TriggerModeEnum
---@field ONPRESS_FINISH ui.TriggerMode Fires after the press animation completes.
---@field ONPRESS ui.TriggerMode Fires immediately on click/tap.
---@field ONRELEASE ui.TriggerMode Fires when the click/tap is released.
---@field REPEAT ui.TriggerMode Like ONPRESS, then repeats while held.
ui.TriggerMode = {}
---@alias ui.TriggerMode integer

--- The simplest interactive component: triggers an action when clicked, optionally as a toggle.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/button.html)
---@class ui.Button : ui.Component
---@field label string Label text. Alias for `text.content`.
---@field isToggled boolean Current toggle state; always false for non-toggle buttons.
---@field canToggle boolean Whether the button can be toggled.
---@field mode ui.TriggerMode When the press action fires.
---@field associatedObjectID integer Linked object ID, or -1 if none.
---@field associatedObjectQuantity integer Quantity of the linked object.
---@field showAssociatedObjectText boolean Whether the label is replaced by the object's text.
---@field showAssociatedObjectSprite boolean Whether the object's sprite is drawn over the button sprite.
---@field contentMargin ui.Margin Region the label is drawn in. Modifiable contents.
---@field text ui.TextData Label text parameters. Modifiable contents.
---@field sprite ui.SpriteData Sprite parameters. Modifiable contents.
ui.Button = {}

--- Creates a button under `parent`. Fails if the category/dynamic ID pair already exists on the parent. Caller must set layout and visuals.
---@param parent ui.ComponentCollection|ui.Component|nil Parent to create the button in.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Button
function ui.Button.new(parent, categoryID, dynamicID) end

--- Links an object (and optional quantity) to the button so it displays the object's name/quantity.
---@param objectID integer
---@param quantity? integer
function ui.Button:SetAssociatedObject(objectID, quantity) end
