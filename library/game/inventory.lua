---@meta

--- Access to the player's inventories (backpack, bank, equipment, ...).
---
--- [Docs](https://developer.runescape.com/rs/game/inventory.html)
---@class InventoryAPI
Inventory = {}

--- Returns the Inv for the given InvType config or inventory ID.
---@param config InvType
---@return Inv
---@overload fun(id: integer): Inv
function Inventory.Find(config) end

--- An inventory proxy. Safe to copy and store, but not usable with persistent storage.
--- The server can remove an inventory at any time; check `isValid` before reading.
---
--- [Docs](https://developer.runescape.com/rs/game/inventory.html)
---@class Inv
---@field id integer Unique inventory ID.
---@field config InvType Config used to construct the inventory.
---@field isValid boolean Whether the inventory still exists.
---@field slotCount integer Total number of slots.
---@field usedSlotCount integer Number of non-empty slots.
---@field freeSlotCount integer Number of empty slots.
local Inv = {}

--- Returns a snapshot of the slot at a 1-indexed position, or nil on failure.
---@param index integer 1-indexed slot.
---@return InvSlot?
function Inv:GetSlot(index) end

--- Returns snapshots of all slots, or nil on failure.
---@return InvSlot[]?
function Inv:GetSlots() end

--- Counts objects matching the given ObjType or ObjType ID.
---@param objType ObjType
---@return integer
---@overload fun(self: Inv, id: integer): integer
function Inv:GetTotal(objType) end

--- Counts objects in the given category.
---@param category integer
---@return integer
function Inv:GetCategoryTotal(category) end

--- A snapshot of one inventory slot.
---
--- [Docs](https://developer.runescape.com/rs/game/inventory.html)
---@class InvSlot
---@field obj ObjType The object in the slot.
---@field count integer Number of objects in the slot.
