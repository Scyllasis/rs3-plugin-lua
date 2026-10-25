---@meta

--- Filter keys for `NPCList.Filter`. All tests present must pass.
---@class NPCListFilter
---@field uid? integer Matches a UID.
---@field name? string Matched against `NPCEntity.displayName` (case-insensitive, `?`/`*` wildcards).
---@field coordGrid? CoordGrid Distance test centre.
---@field range? integer Max tile distance; ignored without `coordGrid`. Default 0.
---@field config? NPCType Matched against `NPCEntity.config`.
---@field configID? integer Matched against `NPCEntity.configID`.
---@field parentConfig? NPCType Matched against `NPCEntity.parentConfig`.
---@field parentConfigID? integer Matched against `NPCEntity.parentConfigID`.
---@field func? fun(entity: NPCEntity): boolean Entities returning true are included.

--- Access to all active NPCEntities and search methods.
---
--- [Docs](https://developer.runescape.com/rs/game/list/npclist.html)
---@class NPCListAPI
NPCList = {}

--- Returns all active NPCEntities.
---@return NPCEntity[]
function NPCList.All() end

--- Returns the NPCEntity with the matching UID (as an array).
---@param uid integer A valid UID.
---@return NPCEntity[]
function NPCList.ByUID(uid) end

--- Returns NPCEntities whose display name matches (case-insensitive, `?`/`*` wildcards).
---@param name string Matched against `NPCEntity.displayName`.
---@return NPCEntity[]
function NPCList.ByName(name) end

--- Returns NPCEntities within `range` tiles of `coordGrid`.
---@param coordGrid CoordGrid Centre of the search.
---@param range integer Max tile distance; 0 for exact coord matches.
---@return NPCEntity[]
function NPCList.ByDistance(coordGrid, range) end

--- Returns NPCEntities using the config (falls back to `parentConfig` when `config` is invalid).
---@param npcType NPCType
---@return NPCEntity[]
function NPCList.ByConfig(npcType) end

--- Returns NPCEntities matching the config ID (falls back to `parentConfigID` when config is invalid).
---@param npcTypeID integer
---@return NPCEntity[]
function NPCList.ByConfigID(npcTypeID) end

--- Returns NPCEntities whose `parentConfig` matches. `config` is not tested.
---@param npcType NPCType
---@return NPCEntity[]
function NPCList.ByParentConfig(npcType) end

--- Returns NPCEntities whose `parentConfigID` matches. `configID` is not tested.
---@param npcTypeID integer
---@return NPCEntity[]
function NPCList.ByParentConfigID(npcTypeID) end

--- Returns NPCEntities passing all tests in `filterSet`.
---@param filterSet NPCListFilter
---@return NPCEntity[]
function NPCList.Filter(filterSet) end
