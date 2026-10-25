---@meta

--- Collection of ui.Model components rendered through switchable cameras.
--- Only ui.Model children are allowed.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/modelgroup.html)
---@class ui.ModelGroup : ui.ComponentCollection
---@field activeCameraID integer Index of the active camera. Read-only.
---@field activeCamera ui.ModelCamera? Copy of the active camera. Read-only.
ui.ModelGroup = {}

--- Creates a new ModelGroup in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.ModelGroup
function ui.ModelGroup.new(parent, categoryID, dynamicID) end

--- Adds a camera (default or a copy of `camera`); returns its index.
---@param camera? ui.ModelCamera
---@return integer
function ui.ModelGroup:AddCamera(camera) end

---@param cameraIndex integer
function ui.ModelGroup:DeleteCamera(cameraIndex) end

--- Returns true if the camera exists and the transition started.
---@param cameraIndex integer
---@param transition ui.ModelCameraTransition
---@param transitionMaskSpriteID integer
---@param transitionDurationMs integer
---@return boolean
function ui.ModelGroup:SwitchCamera(cameraIndex, transition, transitionMaskSpriteID, transitionDurationMs) end

---@param cameraIndex integer
---@return boolean
function ui.ModelGroup:IsValidCameraID(cameraIndex) end

--- Returns a copy of a camera, or nil.
---@param cameraIndex integer -- unverified: in the docs param table but not in the signature
---@return ui.ModelCamera?
function ui.ModelGroup:GetCamera(cameraIndex) end

--- Camera used by a ui.ModelGroup.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/modelgroup.html)
---@class ui.ModelCamera
---@field clearColour Vector4 Background colour.
---@field useLookAt boolean Use the position-to-lookAt direction.
---@field transitionRatio number 0 (started) to 1 (finished). Read-only.
---@field transitionType ui.ModelCameraTransition Read-only.
---@field transitionMaskSprite integer Sprite ID. Read-only.
---@field isTransitionInProgress boolean Read-only.
---@field isTransitionComplete boolean Read-only.
---@field sortModelsUsingComponentOrder boolean Render per-model in component order vs single batch.
---@field fov number Degrees. Read-only.
---@field position Vector3 Read-only.
---@field lookAt Vector3 Read-only.
---@field yawPitchRoll Vector3 Radians. Read-only.
---@field nearPlane number Read-only.
---@field farPlane number Read-only.
ui.ModelCamera = {}

--- -- unverified: constructor not documented, but used in the docs example
---@return ui.ModelCamera
function ui.ModelCamera.new() end

--- Intended to be managed by model group components.
---@param transition ui.ModelCameraTransition
---@param maskSpriteID integer
---@param durationMs integer
function ui.ModelCamera:StartTransition(transition, maskSpriteID, durationMs) end

function ui.ModelCamera:ClearTransition() end

---@param fov number Default 90.0.
---@param durationMs integer
function ui.ModelCamera:SetFOV(fov, durationMs) end

---@param position Vector3
---@param durationMs integer
function ui.ModelCamera:SetPosition(position, durationMs) end

---@param target Vector3
---@param durationMs integer
function ui.ModelCamera:SetLookAt(target, durationMs) end

---@param yawPitchRoll Vector3 Radians.
---@param durationMs integer
function ui.ModelCamera:SetYawPitchRoll(yawPitchRoll, durationMs) end

--- `far` must be larger than `near`.
---@param near number
---@param far number
function ui.ModelCamera:SetClipPlanes(near, far) end

--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/modelgroup.html)
---@class ui.ModelCameraTransitionEnum
---@field NONE ui.ModelCameraTransition Immediate.
---@field FADE ui.ModelCameraTransition Source fades out.
---@field CROSSFADE ui.ModelCameraTransition Source fades out as target fades in.
ui.ModelCameraTransition = {}
---@alias ui.ModelCameraTransition integer
