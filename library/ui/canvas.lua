---@meta

--- Decorative component for immediate-style drawing of lines, shapes, sprites and text.
--- Colour overloads accept hex RGBA (integer) or Vector4.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/canvas.html)
---@class ui.Canvas : ui.Component
---@field numElements integer Number of drawable elements.
ui.Canvas = {}

--- Creates a new Canvas in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Canvas
function ui.Canvas.new(parent, categoryID, dynamicID) end

---@param x integer
---@param y integer
---@param endX integer
---@param endY integer
---@param thickness number In interface units.
---@param colour integer|Vector4 Hex RGBA or Vector4.
function ui.Canvas:AddLine(x, y, endX, endY, thickness, colour) end

---@param x integer
---@param y integer
---@param width integer
---@param height integer
---@param thickness number
---@param colour integer|Vector4
function ui.Canvas:AddOutline(x, y, width, height, thickness, colour) end

---@param x integer
---@param y integer
---@param width integer
---@param height integer
---@param colour integer|Vector4
function ui.Canvas:AddRectangle(x, y, width, height, colour) end

--- Horizontal gradient: start colour on the left, end colour on the right.
---@param x integer
---@param y integer
---@param width integer
---@param height integer
---@param startColour integer|Vector4
---@param endColour integer|Vector4
function ui.Canvas:AddGradientH(x, y, width, height, startColour, endColour) end

--- Vertical gradient: start colour on top, end colour at the bottom.
---@param x integer
---@param y integer
---@param width integer
---@param height integer
---@param startColour integer|Vector4
---@param endColour integer|Vector4
function ui.Canvas:AddGradientV(x, y, width, height, startColour, endColour) end

---@param p0X integer
---@param p0Y integer
---@param p1X integer
---@param p1Y integer
---@param p2X integer
---@param p2Y integer
---@param colour integer|Vector4
function ui.Canvas:AddTriangle(p0X, p0Y, p1X, p1Y, p2X, p2Y, colour) end

--- Draws a sprite; `uvs` selects a spritesheet region.
---@param x integer
---@param y integer
---@param width integer
---@param height integer
---@param spriteID integer
---@param colourRGBA integer
---@overload fun(self: ui.Canvas, x: integer, y: integer, width: integer, height: integer, spriteID: integer, uvs: Rect, colourRGBA: integer)
---@overload fun(self: ui.Canvas, x: integer, y: integer, width: integer, height: integer, spriteID: integer, uvs: Rect, spriteConfig: ui.SpriteDataConfig)
function ui.Canvas:AddSprite(x, y, width, height, spriteID, colourRGBA) end

--- Draws text, optionally inside an area.
---@param x integer
---@param y integer
---@param text string
---@param fontID integer
---@param colour integer|Vector4
---@overload fun(self: ui.Canvas, x: integer, y: integer, text: string, textConfig: ui.TextDataConfig)
---@overload fun(self: ui.Canvas, x: integer, y: integer, areaWidth: integer, areaHeight: integer, text: string, textConfig: ui.TextDataConfig)
function ui.Canvas:AddText(x, y, text, fontID, colour) end

--- Removes all drawable elements.
function ui.Canvas:Clear() end

--- Removes the most recently added element.
function ui.Canvas:Undo() end
