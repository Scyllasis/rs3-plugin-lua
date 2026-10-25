---@meta

--- Read-only access to the game world camera.
---
--- [Docs](https://developer.runescape.com/rs/game/camera.html)
---@class CameraAPI
Camera = {}

--- Returns whether camera information can currently be read.
---@return boolean
function Camera.IsAvailable() end

--- Returns the camera's current position in Fine units. Returns a zero vector if the camera is unavailable.
---@return Vector3
function Camera.GetPosition() end

--- Returns the camera's current focus position in Fine units (normally the player character's waist).
--- Returns a zero vector if the camera is unavailable.
---@return Vector3
function Camera.GetFocusPosition() end
