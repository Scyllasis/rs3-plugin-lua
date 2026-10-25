---@meta

--- Base type for layout components (Layer, Panel, Grid, PagedLayer, PagedCarousel, GroupBox)
--- that can hold child components.
---
--- [Docs](https://developer.runescape.com/rs/ui/component_collection.html)
---@class ui.ComponentCollection : ui.Component
---@field scrollable boolean Whether the component can be scrolled. Read-only.
---@field scrollX number Current horizontal scroll origin. Read-only.
---@field scrollY number Current vertical scroll origin. Read-only.
---@field scrollWidth number Width of the scroll region. Read-only.
---@field scrollHeight number Height of the scroll region. Read-only.
ui.ComponentCollection = {}

--- Calls `callback` for each static child. Return true to stop iterating.
---@param callback fun(component: ui.Component, visible: boolean): boolean
function ui.ComponentCollection:IterateStaticComponents(callback) end

--- Calls `callback` for each dynamic child. Return true to stop iterating.
---@param callback fun(component: ui.Component, visible: boolean): boolean
function ui.ComponentCollection:IterateDynamicComponents(callback) end

--- Returns a child by static ID, or by category + dynamic ID. Nil if missing.
---@param staticID integer
---@return ui.Component?
---@overload fun(self: ui.ComponentCollection, categoryID: integer, dynamicID: integer): ui.Component?
function ui.ComponentCollection:GetChild(staticID) end

--- Deletes a dynamic child. Returns true on success.
---@param categoryID integer
---@param dynamicID integer
---@return boolean
function ui.ComponentCollection:Delete(categoryID, dynamicID) end

--- Deletes all dynamically created children.
function ui.ComponentCollection:DeleteAll() end

--- Sets the scroll region origin.
---@param x integer
---@param y integer
function ui.ComponentCollection:SetScrollPos(x, y) end

--- Sets the scroll region size.
---@param width integer
---@param height integer
function ui.ComponentCollection:SetScrollSize(width, height) end
