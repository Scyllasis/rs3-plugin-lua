---@meta

--- Horizontal alignment of a group box header.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/group_box.html)
---@class ui.GroupBoxHeaderAlignModeEnum
---@field LEFT ui.GroupBoxHeaderAlignMode
---@field CENTRE ui.GroupBoxHeaderAlignMode
---@field RIGHT ui.GroupBoxHeaderAlignMode
ui.GroupBoxHeaderAlignMode = {}
---@alias ui.GroupBoxHeaderAlignMode integer

--- Free-layout container (like a Layer) with a background sprite and optional header sprite + label.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/group_box.html)
-- found in-game (beta 951.1): the header width is stored in one byte; SetHeaderLayout widths over 255
-- wrap around (633 -> 121, 460 -> 204, 600 -> 88). The default is 200.
---@class ui.GroupBox : ui.ComponentCollection
---@field headerWidth integer 0-255; larger values wrap around.
---@field headerHeight integer
---@field headerOffsetX integer
---@field headerOffsetY integer
---@field headerAlignment ui.GroupBoxHeaderAlignMode
---@field headerText ui.LabelData Modifiable contents.
---@field contentBackgroundSprite ui.SpriteData Modifiable contents.
---@field headerBackgroundSprite ui.SpriteData Modifiable contents.
---@field contentMargin ui.Margin Modifiable contents.
ui.GroupBox = {}

--- Creates a group box under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.GroupBox
function ui.GroupBox.new(parent, categoryID, dynamicID) end

---@param width integer
---@param height integer
---@param offsetX integer
---@param offsetY integer
---@param alignment ui.GroupBoxHeaderAlignMode
function ui.GroupBox:SetHeaderLayout(width, height, offsetX, offsetY, alignment) end
