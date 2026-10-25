---@meta

--- Conversions between screen positions and world coordinates.
---
--- [Docs](https://developer.runescape.com/rs/game/screenconvert.html)
---@class ScreenConvertAPI
ScreenConvert = {}

--- Converts a screen position to the tile under it. Without `level` the active player's level is used (else 0-3).
--- Returns nil if the world/player is unavailable or no tile is under the position.
---@param position Vector2
---@param level? integer Level, 0-3.
---@return CoordGrid?
---@overload fun(x: integer, y: integer, level?: integer): CoordGrid?
function ScreenConvert.ScreenToCoordGrid(position, level) end

--- Converts a screen position to a Fine coordinate. Without `level` the active player's level is used (else 0-3).
--- Returns nil if the world/player is unavailable or no tile is under the position.
---@param position Vector2
---@param level? integer Level, 0-3.
---@return CoordFine?
---@overload fun(x: integer, y: integer, level?: integer): CoordFine?
function ScreenConvert.ScreenToCoordFine(position, level) end

--- Converts a tile (measured from its centre) to a screen position.
---@param coordGrid CoordGrid
---@param heightAboveGround integer Extra vertical offset in Fine units.
---@return Vector2?
function ScreenConvert.CoordGridToScreen(coordGrid, heightAboveGround) end

--- Converts a CoordFine to a screen position. Y is ignored; ground height is looked up from X/Z.
---@param coordFine CoordFine
---@param heightAboveGround integer Extra vertical offset in Fine units.
---@return Vector2?
function ScreenConvert.CoordFineToScreen(coordFine, heightAboveGround) end

--- Converts a world position in Fine units to a screen position. Skips the ground height lookup (faster).
---@param vec3 Vector3
---@return Vector2?
function ScreenConvert.Vector3ToScreen(vec3) end
