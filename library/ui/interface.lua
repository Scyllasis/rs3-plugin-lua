---@meta

--- A self-contained bundle of components, loaded on demand. Only one top-level interface is loaded at a time.
---
--- [Docs](https://developer.runescape.com/rs/ui/interface.html)
---@class ui.Interface
---@field id integer Unique interface ID.
---@field clientOnly boolean True if managed entirely by the client.
local Interface = {}

--- Returns a component in this interface by static ID (and optionally category + dynamic ID).
--- -- unverified: signature lists a leading `interfaceID`, but the param table and example omit it
---@param staticID integer
---@return ui.Component?
---@overload fun(self: ui.Interface, staticID: integer, categoryID: integer, dynamicID: integer): ui.Component?
function Interface:GetComponent(staticID) end

--- Helper for retrieving loaded interfaces and their components.
---
--- [Docs](https://developer.runescape.com/rs/ui/interface.html)
---@class ui.Interfaces
ui.Interfaces = {}

--- Returns the loaded interface, or nil if missing or not loaded.
---@param interfaceID integer
---@return ui.Interface?
function ui.Interfaces:GetInterface(interfaceID) end

--- Returns a component. `combinedID` is `(interfaceID << 16) | staticID` (see `id.Component`).
---@param combinedID integer
---@return ui.Component?
---@overload fun(self: ui.Interfaces, combinedID: integer, categoryID: integer, dynamicID: integer): ui.Component?
---@overload fun(self: ui.Interfaces, interfaceID: integer, staticID: integer): ui.Component?
---@overload fun(self: ui.Interfaces, interfaceID: integer, staticID: integer, categoryID: integer, dynamicID: integer): ui.Component?
function ui.Interfaces:GetComponent(combinedID) end
