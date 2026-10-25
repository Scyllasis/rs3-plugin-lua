---@meta

--- A rectangle: X/Y (left/top edges) plus width and height.
---
--- [Docs](https://developer.runescape.com/rs/math/rect.html)
---@class Rect
---@field x number X position (left edge).
---@field y number Y position (top edge).
---@field width number Width.
---@field height number Height.
---@field left number Left edge; equals `x`.
---@field top number Top edge; equals `y`.
---@field right number Right edge; `x + width`.
---@field bottom number Bottom edge; `y + height`.
---@field centreX number Centre X; `x + width / 2`.
---@field centreY number Centre Y; `y + height / 2`.
Rect = {}

--- Creates a rectangle; with no arguments all elements are 0.
---@param x number
---@param y number
---@param width number
---@param height number
---@return Rect
---@overload fun(): Rect
function Rect.new(x, y, width, height) end

--- Moves X and Y by the offsets.
---@param offsetX number
---@param offsetY number
function Rect:Translate(offsetX, offsetY) end

--- Expands each edge (subtracts from X/Y, adds twice to width/height).
---@param horizontal number
---@param vertical number
function Rect:Grow(horizontal, vertical) end

--- Reduces each edge (adds to X/Y, subtracts twice from width/height).
---@param horizontal number
---@param vertical number
function Rect:Shrink(horizontal, vertical) end

--- Scales all elements about 0,0.
---@param scale number
function Rect:Scale(scale) end

--- Whether a point lies within this rect.
---@param x number
---@param y number
---@return boolean
---@overload fun(self: Rect, rect: Rect): boolean Whether `rect` lies entirely within this rect.
function Rect:Contains(x, y) end

--- Whether the other rect intersects this one.
---@param rect Rect
---@return boolean
function Rect:Intersects(rect) end

--- The overlapping area, or nil if no overlap.
---@param rect Rect
---@return Rect?
function Rect:GetIntersection(rect) end

--- Smallest rect encompassing both rects.
---@param rect Rect
---@return Rect
---@overload fun(self: Rect, x: number, y: number): Rect Smallest rect encompassing this rect and the point.
function Rect:GetUnion(rect) end
