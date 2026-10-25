---@meta

--- Filter keys for `LocList.Filter`. All tests present must pass.
---@class LocListFilter
---@field name? string Matched against `LocEntity.displayName` (case-insensitive, `?`/`*` wildcards).
---@field coordGrid? CoordGrid Distance test origin.
---@field range? integer Max tile distance; used only with `coordGrid`. Default 0.
---@field sameLevel? boolean Only same level as `coordGrid`; used only with `coordGrid`. Default false.
---@field config? LocType Matched against `LocEntity.config`.
---@field configID? integer Matched against `LocEntity.configID`.
---@field parentConfig? LocType Matched against `LocEntity.parentConfig`.
---@field parentConfigID? integer Matched against `LocEntity.parentConfigID`.
---@field func? fun(entity: LocEntity): boolean Entities returning true are included.

--- Access to all active LocEntities (animated, interactable or server/var-changeable locs) and search methods.
--- These can return many results; prefer `ByDistance` or `Filter` with `coordGrid` and `range`.
---
--- [Docs](https://developer.runescape.com/rs/game/list/loclist.html)
---@class LocListAPI
LocList = {}

--- Returns all active LocEntities.
---@return LocEntity[]
function LocList.All() end

--- Returns LocEntities whose display name matches (case-insensitive, `?`/`*` wildcards).
---@param name string Matched against `LocEntity.displayName`.
---@return LocEntity[]
function LocList.ByName(name) end

--- Returns LocEntities within `range` tiles of `coordGrid`.
---@param coordGrid CoordGrid Centre of the search.
---@param range integer Max tile distance; 0 tests only the exact coord.
---@param sameLevel boolean true = only the same level as `coordGrid`.
---@return LocEntity[]
function LocList.ByDistance(coordGrid, range, sameLevel) end

--- Returns LocEntities using the config (falls back to `parentConfig` when `config` is invalid).
---@param locType LocType
---@return LocEntity[]
function LocList.ByConfig(locType) end

--- Returns LocEntities matching the config ID (falls back to `parentConfigID` when `config` is invalid).
---@param locTypeID integer
---@return LocEntity[]
function LocList.ByConfigID(locTypeID) end

--- Returns LocEntities whose `parentConfig` matches. Only `parentConfig` is tested.
---@param locType LocType
---@return LocEntity[]
function LocList.ByParentConfig(locType) end

--- Returns LocEntities whose `parentConfigID` matches. Only `parentConfigID` is tested.
---@param locTypeID integer
---@return LocEntity[]
function LocList.ByParentConfigID(locTypeID) end

--- Returns LocEntities passing all tests in `filterSet`.
---@param filterSet LocListFilter
---@return LocEntity[]
function LocList.Filter(filterSet) end
