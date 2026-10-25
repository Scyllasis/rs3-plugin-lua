---@meta

--- Shared base for Vector2, Vector3 and Vector4 (2, 3 or 4 float values).
---
--- [Docs](https://developer.runescape.com/rs/math/vector.html)
---@class Vector
---@field isNormal boolean True if the vector has unit length. Read-only.
---@field length number Length of the vector. Read-only.
---@field lengthSq number Squared length (faster than `length`). Read-only.
---@field invLength number `1.0 / length`. Read-only.
local Vector = {}

--- Returns a vector with the absolute value of each element.
---@generic T : Vector
---@param self T
---@return T
function Vector:Abs() end

--- Returns a vector with each element rounded up.
---@generic T : Vector
---@param self T
---@return T
function Vector:Ceil() end

--- Returns a vector with each element rounded down.
---@generic T : Vector
---@param self T
---@return T
function Vector:Floor() end

--- Dot product of two vectors.
---@param other Vector
---@return number
function Vector:Dot(other) end

--- Element-wise maximum of two vectors.
---@generic T : Vector
---@param self T
---@param other T
---@return T
function Vector:Max(other) end

--- Element-wise minimum of two vectors.
---@generic T : Vector
---@param self T
---@param other T
---@return T
function Vector:Min(other) end

--- Without arguments: normalises in place (no-op if all elements are 0).
--- With `fallback`: returns a normalised copy, or `fallback` if all elements are 0.
---@generic T : Vector
---@param self T
---@param fallback? T
---@return T? # Only returned when `fallback` is given.
function Vector:Normalise(fallback) end

--- 2-element float vector.
---
--- [Docs](https://developer.runescape.com/rs/math/vector.html)
---@class Vector2 : Vector
---@field x number First element.
---@field y number Second element.
---@field u number Alias for `x`.
---@field v number Alias for `y`.
---@operator add(Vector2): Vector2 -- unverified: operators only shown in examples
Vector2 = {}

--- Creates a Vector2: no args = all 0, one arg = all set to `v`, two args = x, y.
---@param x number
---@param y number
---@return Vector2
---@overload fun(): Vector2
---@overload fun(v: number): Vector2
function Vector2.new(x, y) end

--- 3-element float vector.
---
--- [Docs](https://developer.runescape.com/rs/math/vector.html)
---@class Vector3 : Vector
---@field x number First element.
---@field y number Second element.
---@field z number Third element.
---@field r number Alias for `x`.
---@field g number Alias for `y`.
---@field b number Alias for `z`.
Vector3 = {}

--- Creates a Vector3: no args = all 0, one arg = all set to `v`, three args = x, y, z.
---@param x number
---@param y number
---@param z number
---@return Vector3
---@overload fun(): Vector3
---@overload fun(v: number): Vector3
function Vector3.new(x, y, z) end

--- Cross product of two 3D vectors.
---@param other Vector3
---@return Vector3
function Vector3:Cross(other) end

--- Reflects this vector along `normal`. Both should be normalised first.
---@param normal Vector3
---@return Vector3
function Vector3:Reflect(normal) end

--- Returns this vector rotated by a Quaternion.
---@param rotation Quaternion
---@return Vector3
function Vector3:Rotate(rotation) end

--- 4-element float vector.
---
--- [Docs](https://developer.runescape.com/rs/math/vector.html)
---@class Vector4 : Vector
---@field x number First element.
---@field y number Second element.
---@field z number Third element.
---@field w number Fourth element.
---@field r number Alias for `x`.
---@field g number Alias for `y`.
---@field b number Alias for `z`.
---@field a number Alias for `w`.
---@field xyz Vector3 x, y, z as a Vector3. Read-only.
---@field rgb Vector3 Alias for `xyz`. Read-only.
---@field xy Vector2 x, y as a Vector2. Read-only.
---@field zw Vector2 z, w as a Vector2. Read-only.
---@operator mul(Vector4): Vector4 -- unverified: element-wise multiply only shown in examples
Vector4 = {}

--- Creates a Vector4: no args = all 0, one arg = all `v`, four args = x, y, z, w, or two Vector2s (xy, zw).
---@param x number
---@param y number
---@param z number
---@param w number
---@return Vector4
---@overload fun(): Vector4
---@overload fun(v: number): Vector4
---@overload fun(xy: Vector2, zw: Vector2): Vector4
function Vector4.new(x, y, z, w) end
