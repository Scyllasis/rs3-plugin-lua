---@meta

--- A stack of objects (ground items) on a tile. No constructor; obtain via `ObjStackList`.
--- Check `isValid` before reading properties.
---
--- [Docs](https://developer.runescape.com/rs/game/entity/objstackentity.html)
---@class ObjStackEntity
---@field isValid boolean Whether the entity still exists. Dispose of it when invalid. Read-only.
---@field position Vector3 World position. Read-only.
---@field coordGrid CoordGrid Tile the stack is on. Read-only.
---@field aabb AABB Current bounding box. Read-only.
---@field stackSize integer Number of ObjEntries in the stack. Read-only.
local ObjStackEntity = {}

--- Returns the entry at a 1-based index, or nil if none exists.
---@param index integer 1-based entry index.
---@return ObjEntry?
function ObjStackEntity:GetEntry(index) end

--- True if any entry references the given ObjType.
---@param objType ObjType
---@return boolean
function ObjStackEntity:HasObj(objType) end

--- True if any entry references the given ObjType ID.
---@param objTypeID integer
---@return boolean
function ObjStackEntity:HasObjID(objTypeID) end

--- One entry in an ObjStackEntity. No constructor.
---
--- [Docs](https://developer.runescape.com/rs/game/entity/objstackentity.html)
---@class ObjEntry
---@field config ObjType Config describing this entry. Read-only.
---@field configID integer Config ID describing this entry. Read-only.
---@field count integer How many of the object are in this entry (always 1 if not stackable). Read-only.
