---@meta

--- 3x3 matrix for a 3D rotation and/or scale.
---
--- [Docs](https://developer.runescape.com/rs/math/matrix.html)
---@class Matrix33
Matrix33 = {}

--- Builds a rotation matrix around the Y axis.
---@param rotationAmount number Rotation in radians.
---@return Matrix33
function Matrix33.rotationY(rotationAmount) end

--- Builds a rotation matrix from a quaternion.
---@param rotation Quaternion
---@return Matrix33
function Matrix33.fromQuaternion(rotation) end
