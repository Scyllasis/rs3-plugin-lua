---@meta

--- Free-layout container that switches between pages (tabs), each with its own components.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/paged_layer.html)
---@class ui.PagedLayer : ui.ComponentCollection
---@field activePage integer Currently displayed page.
---@field numPages integer Number of pages.
---@field numBuiltinPages integer Read-only.
---@field contentMargin ui.Margin Modifiable contents.
---@field backgroundSprite ui.SpriteData Modifiable contents.
ui.PagedLayer = {}

--- Creates a paged layer under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.PagedLayer
function ui.PagedLayer.new(parent, categoryID, dynamicID) end

---@param pageIndex integer
---@param enabled boolean
function ui.PagedLayer:SetPageEnabled(pageIndex, enabled) end

---@param pageIndex integer
---@return boolean
function ui.PagedLayer:GetPageEnabled(pageIndex) end

---@param pageIndex integer
---@param label string
function ui.PagedLayer:SetPageLabel(pageIndex, label) end

---@param pageIndex integer
---@return string
function ui.PagedLayer:GetPageLabel(pageIndex) end

---@param pageIndex integer
---@param iconSpriteID integer
function ui.PagedLayer:SetPageIcon(pageIndex, iconSpriteID) end

---@param pageIndex integer
---@return integer
function ui.PagedLayer:GetPageIcon(pageIndex) end

--- Creates a header (page switcher) associated with this paged layer, under `parent`. Multiple headers are discouraged.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.PagedLayerHeader
function ui.PagedLayer:AddHeader(parent, categoryID, dynamicID) end

--- Page-switching header tied to a PagedLayer; shows page labels/icons in index order. Created via `PagedLayer:AddHeader`.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/paged_layer.html)
--- unverified: base class not stated in docs; assumed ui.Component.
---@class ui.PagedLayerHeader : ui.Component
---@field target ui.PagedLayer The associated paged layer.
---@field isHorizontal boolean Horizontal or vertical layout.
---@field contentMargin ui.Margin Modifiable contents.
---@field pageHeaderMargin ui.Margin Inner margin of each page element. Modifiable contents.
---@field entryText ui.TextData Modifiable contents.
---@field backgroundSprite ui.SpriteData Modifiable contents.
---@field disabledPageIcon ui.SpriteData Icon for disabled pages. Modifiable contents.
---@field pageHeaderSprite ui.SpriteData Sprite for each page element. Modifiable contents.
