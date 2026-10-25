---@meta

--- Filter keys for `ObjStackList.Filter`. All tests present must pass.
---@class ObjStackListFilter
---@field name? string Matched against `ObjType.name` of entries (case-insensitive, `?`/`*` wildcards).
---@field coordGrid? CoordGrid Distance test centre.
---@field range? integer Max tile distance; used only with `coordGrid`. Default 0.
---@field config? ObjType Matched against `ObjEntry.config` of entries.
---@field configID? integer Matched against `ObjEntry.configID` of entries.
---@field func? fun(entity: ObjStackEntity): boolean Entities returning true are included.

--- Access to all active ObjStackEntities and search methods.
---
--- [Docs](https://developer.runescape.com/rs/game/list/objstacklist.html)
---@class ObjStackListAPI
ObjStackList = {}

--- Returns all active ObjStackEntities.
---@return ObjStackEntity[]
function ObjStackList.All() end

--- Returns stacks containing an entry whose `ObjType.name` matches (case-insensitive, `?`/`*` wildcards).
---@param name string
---@return ObjStackEntity[]
function ObjStackList.ByName(name) end

--- Returns stacks within `range` tiles of `coordGrid`.
---@param coordGrid CoordGrid Centre of the search.
---@param range integer Max tile distance; 0 for exact coord match.
---@return ObjStackEntity[]
function ObjStackList.ByDistance(coordGrid, range) end

--- Returns stacks containing an entry referencing the ObjType.
---@param objType ObjType
---@return ObjStackEntity[]
function ObjStackList.ByConfig(objType) end

--- Returns stacks containing an entry referencing the ObjType ID.
---@param objTypeID integer
---@return ObjStackEntity[]
function ObjStackList.ByConfigID(objTypeID) end

--- Returns stacks passing all tests in `filterSet`.
---@param filterSet ObjStackListFilter
---@return ObjStackEntity[]
function ObjStackList.Filter(filterSet) end
