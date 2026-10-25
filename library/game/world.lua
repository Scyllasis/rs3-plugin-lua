---@meta

--- Information about the connected game world.
---
--- [Docs](https://developer.runescape.com/rs/game/world.html)
---@class WorldAPI
World = {}

--- Returns whether world data can currently be read.
---@return boolean
function World.IsAvailable() end

--- Returns whether the connected world is a Members' world.
---@return boolean
function World.IsMembers() end

--- Returns ping to the current world, or -1 with no connection. Internally limited to one request per 5 seconds.
---@return integer
function World.GetPing() end

--- Returns logic ticks (50 per second) until server reboot; 0 if unavailable or no reboot is scheduled.
---@return integer
function World.GetRebootTimer() end

--- Returns whether the current world is a region (an Instance in game terms).
---@return boolean
function World.IsRegion() end

--- Returns the bottom-left CoordGrid of the source data for a region coordinate.
--- Nil if not in a region or the coordinate is outside the region bounds.
---@param coord CoordGrid
---@return CoordGrid?
function World.GetRegionSourceForCoordGrid(coord) end

--- Returns the bounds of the loaded world in map squares (64x64 tiles each).
---@return Rect?
function World.GetMapSquareBounds() end

--- Returns the ground height at a position and a success flag. Height is -1 on failure.
---@param level integer Level, 0-3.
---@param x integer X in Fine units (512 per tile).
---@param z integer Z in Fine units (512 per tile).
---@param heightOffsetType? HeightOffsetType
---@return integer height
---@return boolean success
function World.GetGroundHeight(level, x, z, heightOffsetType) end

--- Selective roof removal. Only takes effect when the Remove Roofs graphics setting is "Selectively".
--- Entries are owned by the registering plugin and removed when it unloads.
---
--- [Docs](https://developer.runescape.com/rs/game/world.html)
---@class WorldRemoveRoofAPI
World.RemoveRoof = {}

--- Registers a coordinate, or an inclusive coordinate range, under a name. Reusing a name updates the entry.
---@param name string
---@param coord CoordGrid
---@overload fun(name: string, coordRangeMin: CoordGrid, coordRangeMax: CoordGrid)
function World.RemoveRoof.Add(name, coord) end

--- Removes the entry registered under the given name.
---@param name string
function World.RemoveRoof.Remove(name) end -- unverified: no explicit signature block in docs

--- Removes all Remove Roof entries registered by this plugin.
function World.RemoveRoof.Clear() end

--- Height offset applied by `World.GetGroundHeight`.
---
--- [Docs](https://developer.runescape.com/rs/game/world.html)
---@enum HeightOffsetType
HeightOffsetType = {
    NONE = 0,
    GROUND_DECOR = 1,
    LOCATION = 2,
}
