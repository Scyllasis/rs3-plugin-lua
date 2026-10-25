---@meta

--- Corner of an AABB. X- Left / X+ Right, Y- Bottom / Y+ Top, Z- Near / Z+ Far.
---
--- [Docs](https://developer.runescape.com/rs/math/aabb.html)
---@enum BoxCornerType
BoxCornerType = { -- unverified: docs list the enum but not its global access path
    LEFT_TOP_NEAR = 0,
    RIGHT_TOP_NEAR = 1,
    LEFT_BOTTOM_NEAR = 2,
    RIGHT_BOTTOM_NEAR = 3,
    LEFT_TOP_FAR = 4,
    RIGHT_TOP_FAR = 5,
    LEFT_BOTTOM_FAR = 6,
    RIGHT_BOTTOM_FAR = 7,
}

--- Axis-aligned bounding box: a 3D region defined by a minimum and maximum corner.
---
--- [Docs](https://developer.runescape.com/rs/math/aabb.html)
---@class AABB
---@field minimum Vector3 Minimum value on each axis.
---@field maximum Vector3 Maximum value on each axis.
---@field dimensions Vector3 Width, height and length.
---@field centre Vector3 Centre position.
---@field minX number Minimum X.
---@field minY number Minimum Y.
---@field minZ number Minimum Z.
---@field maxX number Maximum X.
---@field maxY number Maximum Y.
---@field maxZ number Maximum Z.
---@field width number Width.
---@field height number Height.
---@field length number Length.
---@field radiusMinimum number Radius of a centred sphere that contains the AABB in any orientation.
---@field radiusMinimumSq number Squared `radiusMinimum`.
---@field radiusMaximum number Radius of the largest centred sphere that fits inside the AABB.
---@field radiusMaximumSq number Squared `radiusMaximum`.
AABB = {}

--- Creates an AABB from the minimum and maximum on each axis.
---@param minimum Vector3
---@param maximum Vector3
---@return AABB
function AABB.new(minimum, maximum) end

--- Gets the position of the specified corner.
---@param corner BoxCornerType
---@return Vector3 -- unverified: signature says Boolean, return table and examples say Vector3
function AABB:GetCorner(corner) end

--- Tests whether a position lies within this AABB, or whether another AABB fully encloses this one.
---@param position Vector3|AABB
---@return boolean
function AABB:IsInside(position) end

--- Tests whether a line segment intersects this AABB.
---@param fromPosition Vector3
---@param toPosition Vector3
---@return boolean
---@overload fun(self: AABB, otherAABB: AABB): boolean
function AABB:Intersects(fromPosition, toPosition) end

--- Closest surface position; returns the input if it is inside.
---@param position Vector3
---@return Vector3
function AABB:GetClosestPosition(position) end

--- Furthest surface position from the given position.
---@param position Vector3
---@return Vector3
function AABB:GetFurthestPosition(position) end

--- Shortest distance to the position; 0 if inside.
---@param position Vector3
---@return number
function AABB:GetDistanceToPosition(position) end

--- Moves minimum and maximum by the offset.
---@param offset Vector3
function AABB:Translate(offset) end

--- Scales the AABB about the origin (0,0,0).
---@param scale Vector3
function AABB:Scale(scale) end

--- Scales the AABB about its centre.
---@param scale Vector3
function AABB:ScaleFromCentre(scale) end

--- Expands the AABB to include the position. (Docs heading: "AddPoint".)
---@param position Vector3
function AABB:AddPosition(position) end

--- Expands the AABB to encompass another AABB.
---@param otherAABB AABB
function AABB:AddAABB(otherAABB) end
