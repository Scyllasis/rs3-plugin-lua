---@meta

--- Linear interpolation between two values. `t` must be in 0..1 for a valid result.
---
--- [Docs](https://developer.runescape.com/rs/math/index.html)
---@param start number Starting value.
---@param final number Final value.
---@param t number Interpolation factor (0..1).
---@return number
---@overload fun(start: Vector2, final: Vector2, t: number): Vector2
---@overload fun(start: Vector3, final: Vector3, t: number): Vector3
---@overload fun(start: Vector4, final: Vector4, t: number): Vector4
---@overload fun(start: Matrix33, final: Matrix33, t: number): Matrix33
function lerp(start, final, t) end

--- Spherical interpolation, generally for rotations. `t` must be in 0..1 for a valid result.
---
--- [Docs](https://developer.runescape.com/rs/math/index.html)
---@param start Vector3 Starting value.
---@param final Vector3 Final value.
---@param t number Interpolation factor (0..1).
---@return Vector3
---@overload fun(start: Quaternion, final: Quaternion, t: number): Quaternion
function slerp(start, final, t) end

--- Limits a value to the given range.
---
--- [Docs](https://developer.runescape.com/rs/math/index.html)
---@param value number Value to clamp.
---@param min number Minimum value returned.
---@param max number Maximum value returned.
---@return number
function clamp(value, min, max) end

--- Returns a random value within the given range.
---
--- [Docs](https://developer.runescape.com/rs/math/index.html)
---@param min number Minimum value returned.
---@param max number Maximum value returned.
---@return number
function random(min, max) end
