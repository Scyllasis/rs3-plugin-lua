---@meta

--- How a check's label and button are positioned.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/check.html)
---@class ui.CheckAlignModeEnum
---@field INLINE ui.CheckAlignMode Label on the left, button after it.
---@field INLINE_INVERTED ui.CheckAlignMode Label on the right, button before it.
---@field LEFT ui.CheckAlignMode Label on the left, button before it.
---@field RIGHT ui.CheckAlignMode Label on the right, button after it.
ui.CheckAlignMode = {}
---@alias ui.CheckAlignMode integer

--- A toggle split into a label and a toggleable button (checkbox).
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/check.html)
---@class ui.Check : ui.Component
---@field label string Label text. Alias for `text.content`.
---@field value boolean Whether the check is currently ticked.
---@field alignment ui.CheckAlignMode Label/button positioning. Defaults to LEFT.
---@field buttonSize integer Button size in interface units (max 255). 0/unset uses the component's height.
---@field text ui.TextData Label parameters. Modifiable contents.
---@field sprite ui.SpriteData Sprite parameters. Modifiable contents.
ui.Check = {}

--- Creates a check under `parent`. Fails if the category/dynamic ID pair already exists on the parent. Caller must set layout and visuals.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Check
function ui.Check.new(parent, categoryID, dynamicID) end
