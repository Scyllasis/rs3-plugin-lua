---@meta

--- A world coordinate in Grid units (tiles). All properties are read-only.
--- Packed format: `(level << 28) | (x << 14) | z`.
---
--- [Docs](https://developer.runescape.com/rs/game/coordgrid.html)
---@class CoordGrid
---@field level integer Level, 0-3. Read-only.
---@field x integer World tile X, 0-12799. Read-only.
---@field z integer World tile Z, 0-12799. Read-only.
---@field mapSquareX integer Map square X, 0-199. Read-only.
---@field mapSquareZ integer Map square Z, 0-199. Read-only.
---@field localX integer Local tile X within the map square, 0-63. Read-only.
---@field localZ integer Local tile Z within the map square, 0-63. Read-only.
CoordGrid = {}

--- Creates a CoordGrid. Overloads: `(bitPacked)`, `(level, mapSquareX, mapSquareZ)` (local tile 32,32),
--- `(level, mapSquareX, mapSquareZ, localTileX, localTileZ)`, `(level, position)` (Fine units, Y discarded),
--- `(coordFine)`, or `(coordGrid)` (copy).
---@param bitPacked integer
---@return CoordGrid
---@overload fun(level: integer, mapSquareX: integer, mapSquareZ: integer): CoordGrid
---@overload fun(level: integer, mapSquareX: integer, mapSquareZ: integer, localTileX: integer, localTileZ: integer): CoordGrid
---@overload fun(level: integer, position: Vector3): CoordGrid
---@overload fun(coordFine: CoordFine): CoordGrid
---@overload fun(coordGrid: CoordGrid): CoordGrid
function CoordGrid.new(bitPacked) end

--- Converts a CoordFine to a CoordGrid.
---@param coordFine CoordFine
---@return CoordGrid
function CoordGrid.FromCoordFine(coordFine) end

--- Returns the bit-packed integer form of this coordinate.
---@return integer
function CoordGrid:ToPacked() end

--- Converts to a CoordFine.
---@param fromCentre boolean `true` for the tile centre, `false` for its bottom-left corner.
---@return CoordFine
function CoordGrid:ToCoordFine(fromCentre) end
