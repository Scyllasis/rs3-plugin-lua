---@meta

--- Filter keys for `PlayerList.Filter`. All tests present must pass.
---@class PlayerListFilter
---@field uid? integer A valid entity UID.
---@field name? string Matched against `PlayerEntity.displayName` (case-insensitive, `?`/`*` wildcards).
---@field coordGrid? CoordGrid Distance test origin.
---@field range? integer Max tile distance; ignored without `coordGrid`. Default 0.
---@field func? fun(entity: PlayerEntity): boolean Entities returning true are included.

--- Access to all active PlayerEntities and search methods.
---
--- [Docs](https://developer.runescape.com/rs/game/list/playerlist.html)
---@class PlayerListAPI
PlayerList = {}

--- Returns the PlayerEntity of the logged-in player character.
---@return PlayerEntity
function PlayerList.Self() end

--- Returns all active PlayerEntities.
---@return PlayerEntity[]
function PlayerList.All() end

--- Returns the PlayerEntity with the matching UID (as an array).
---@param uid integer A valid UID.
---@return PlayerEntity[]
function PlayerList.ByUID(uid) end

--- Returns PlayerEntities whose display name matches (case-insensitive, `?`/`*` wildcards).
---@param name string Matched against `PlayerEntity.displayName`.
---@return PlayerEntity[]
function PlayerList.ByName(name) end

--- Returns PlayerEntities within `range` tiles of `coordGrid`.
---@param coordGrid CoordGrid Centre of the search.
---@param range integer Max tile distance; 0 for exact coord matches.
---@return PlayerEntity[]
function PlayerList.ByDistance(coordGrid, range) end

--- Returns PlayerEntities passing all tests in `filterSet`.
---@param filterSet PlayerListFilter
---@return PlayerEntity[]
function PlayerList.Filter(filterSet) end
