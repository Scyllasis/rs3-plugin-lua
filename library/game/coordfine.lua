---@meta

--- A world coordinate in Fine units (512 per tile). All properties are read-only.
---
--- [Docs](https://developer.runescape.com/rs/game/coordfine.html)
---@class CoordFine
---@field level integer Level, 0-3. Read-only.
---@field x number X position in Fine units. Read-only.
---@field y number Y position in Fine units. Read-only.
---@field z number Z position in Fine units. Read-only.
---@field position Vector3 World position in Fine units. Read-only.
---@field mapSquareX integer Map square X (Grid units), 0-199. Read-only.
---@field mapSquareZ integer Map square Z (Grid units), 0-199. Read-only.
---@field localX integer Local tile X within the map square, 0-63. Read-only.
---@field localZ integer Local tile Z within the map square, 0-63. Read-only.
CoordFine = {}

--- Creates a CoordFine. Overloads: `(level, x, z)` (Y = 0), `(level, x, y, z)`, `(level, position)`,
--- `(coordGrid, fromCentre)`, or `(coordFine)` (copy).
---@param level integer Level, 0-3.
---@param x number X in Fine units.
---@param z number Z in Fine units.
---@return CoordFine
---@overload fun(level: integer, x: number, y: number, z: number): CoordFine
---@overload fun(level: integer, position: Vector3): CoordFine
---@overload fun(coordGrid: CoordGrid, fromCentre: boolean): CoordFine
---@overload fun(coordFine: CoordFine): CoordFine
function CoordFine.new(level, x, z) end

--- Converts a CoordGrid to a CoordFine.
---@param coordGrid CoordGrid
---@param fromCentre boolean `true` for the tile centre, `false` for its bottom-left corner.
---@return CoordFine
function CoordFine.FromCoordGrid(coordGrid, fromCentre) end

--- Converts to a CoordGrid. Copies level, converts X/Z to Grid units, discards Y.
---@return CoordGrid
function CoordFine:ToCoordGrid() end
