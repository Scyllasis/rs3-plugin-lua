---@meta

--- 4-dimensional vector used to represent rotations.
---
--- [Docs](https://developer.runescape.com/rs/math/quaternion.html)
---@class Quaternion
Quaternion = {}

--- Builds a quaternion from yaw, pitch and roll (radians).
---@param yaw number
---@param pitch number
---@param roll number
---@return Quaternion
function Quaternion.fromYawPitchRoll(yaw, pitch, roll) end

--- Builds a quaternion from a rotation matrix.
---@param source Matrix33
---@return Quaternion
function Quaternion.fromMatrix(source) end

--- Returns this quaternion rotated by `rotation`. (Docs example spells it `RotateBy`.)
---@param rotation Quaternion
---@return Quaternion
function Quaternion:rotateBy(rotation) end
