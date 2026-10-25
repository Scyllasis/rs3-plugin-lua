---@meta

--- Holds a series of entries (text labels or icon sprites) and shows one at a time, switched with left/right buttons.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/carousel.html)
---@class ui.Carousel : ui.Component
---@field selectedID integer ID of the selected entry, or -1 if none. Read-only.
---@field buttonWidth integer Button width in interface units.
---@field buttonHeight integer Button height in interface units.
---@field buttonOffset integer Button offset from the edge in interface units.
---@field contentMargin ui.Margin Offsets for the inner content area. Modifiable contents.
---@field entryText ui.TextData Text properties for entry labels. Modifiable contents.
---@field buttonSprite ui.SpriteData Sprite properties for the buttons. Modifiable contents.
---@field backgroundSprite ui.SpriteData Sprite properties for the background. Modifiable contents.
ui.Carousel = {}

--- Creates a carousel under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Carousel
function ui.Carousel.new(parent, categoryID, dynamicID) end

--- Adds an entry with a text label or an icon sprite. Returns false if the ID already exists.
---@param id integer
---@param label string
---@return boolean
---@overload fun(self: ui.Carousel, id: integer, iconSpriteID: integer): boolean
function ui.Carousel:Add(id, label) end

--- Removes all entries.
function ui.Carousel:Clear() end

---@param id integer
---@return boolean
function ui.Carousel:HasEntry(id) end

---@param id integer
---@param enabled boolean
---@return boolean
function ui.Carousel:SetEntryEnabled(id, enabled) end

---@param id integer
---@return boolean
function ui.Carousel:GetEntryEnabled(id) end

--- Selects the entry with the given ID. -- unverified: docs show this signature as `ui.ComboField:Select` on the Carousel page.
---@param id integer
---@param triggerEvents? boolean Whether to fire selection events. Defaults to false.
---@return boolean
function ui.Carousel:Select(id, triggerEvents) end
