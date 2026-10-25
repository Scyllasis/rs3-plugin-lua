---@meta

--- Mouse polling. Positions are relative to the top-left of the game window and only update while the mouse is inside it.
---
--- [Docs](https://developer.runescape.com/rs/core/mouse.html)
---@class MouseAPI
Mouse = {}

--- Whether mouse data can be polled on this platform (false on mobile).
---@return boolean
function Mouse.IsAvailable() end

--- Current mouse X and Y position, or nil on mobile.
---@return Vector2?
function Mouse.GetPosition() end

--- Current mouse X position, or nil on mobile.
---@return integer?
function Mouse.GetX() end

--- Current mouse Y position, or nil on mobile.
---@return integer?
function Mouse.GetY() end
