---@meta

--- Decorative component that renders a 3D model (plain model, NPC/player, chathead, object).
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/model.html)
---@class ui.Model : ui.Component
---@field npcCustomisation ui.NPCCustomisation Get returns a copy; set replaces settings.
---@field environment ui.ModelEnvironment Get returns a copy; set replaces settings.
---@field modelType ui.ModelType Read-only.
---@field modelID1 integer Read-only.
---@field modelID2 integer Only used with PLAYER_HEAD_NOWORN. Read-only.
---@field animID integer Animation ID.
---@field rotation Vector3 Rotation in radians.
---@field viewDistance integer Camera distance to origin.
---@field worldOffset Vector3 Offset in world units.
---@field screenOffset Vector3 Offset in interface units.
---@field modelWidth integer Used for scaling.
---@field modelHeight integer Used for scaling.
---@field orthographic boolean
---@field disableZWrite boolean
---@field associatedObjectID integer
---@field associatedObjectQuantity integer Selects the stackable object variant.
---@field usePlayerModelRecolour boolean Only for PLAYER_* model types.
ui.Model = {}

--- Creates a new Model in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Model
function ui.Model.new(parent, categoryID, dynamicID) end

--- Sets the model. For player types, an ID of -1 means the local player.
---@param type ui.ModelType
---@param modelID integer
---@param secondaryModelID? integer Only used with PLAYER_HEAD_NOWORN.
function ui.Model:SetModel(type, modelID, secondaryModelID) end

---@param ambient number
---@param contrast number
---@param antiContrast number
---@param sunRGB Vector3
---@param sunDirection Vector3
---@param envMapID integer -1 for none.
function ui.Model:SetLighting(ambient, contrast, antiContrast, sunRGB, sunDirection, envMapID) end

--- Transforms the model, interpolating over `durationMs`.
---@param position Vector3
---@param rotationYawPitchRoll Vector3
---@param scale Vector3
---@param durationMs integer
function ui.Model:SetTransform(position, rotationYawPitchRoll, scale, durationMs) end

---@param slot integer
---@param sourceColourHSL integer
---@param replacementColourHSL integer
function ui.Model:SetRecolour(slot, sourceColourHSL, replacementColourHSL) end

---@param slot integer
---@param sourceMaterialID integer
---@param replacementMaterialID integer
function ui.Model:SetRematerial(slot, sourceMaterialID, replacementMaterialID) end

---@param objectID integer
---@param quantity? integer
function ui.Model:SetAssociatedObject(objectID, quantity) end

---@param logicTick integer
function ui.Model:RestartAnimation(logicTick) end

--- Restores the default ui.ModelEnvironment settings.
function ui.Model:ResetEnvironment() end

--- Lighting/tonemapping environment; one instance can be shared by many models.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/model.html)
---@class ui.ModelEnvironment
---@field ambient number Default 2.0.
---@field contrast number Default 2.5.
---@field anticontrast number Unused (legacy). Default 0.
---@field sunRGB Vector3 Default (1, 1, 1).
---@field sunDirection Vector3 Default (-0.7, 0.14, -0.7).
---@field shadowBias number Default -0.0135 desktop, -0.0225 mobile.
---@field envMapID integer -1 means no environment mapping. Default -1.
---@field exposureKey number Default 1.0.
---@field minAutoExposure number Default 0.0.
---@field maxAutoExposure number Default 1.0.
---@field bloomScale number Default 1.0.
ui.ModelEnvironment = {}

---@return ui.ModelEnvironment
function ui.ModelEnvironment.new() end

--- NPC/player model customisation (body: up to 12 model slots, head: up to 5).
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/model.html)
---@class ui.NPCCustomisation
---@field isPlayerClone boolean Read-only.
---@field modelList integer[] Read-only.
---@field modelScaleList number[] Read-only.
---@field modelRotationList Vector3[] Read-only.
---@field modelTranslationList Vector3[] Read-only.
---@field modelRecolourList table<integer, integer[]> Pairs at [slot*2], [slot*2+1]. Read-only.
---@field modelRematerialList table<integer, integer[]> Read-only.
---@field recolourDest integer[] Read-only.
---@field rematerialDest integer[] Read-only.
---@field playerIdkColour integer[] Read-only.
ui.NPCCustomisation = {}

---@param customisingBody boolean
---@return ui.NPCCustomisation
---@overload fun(npcID: integer, customisingBody: boolean): ui.NPCCustomisation
function ui.NPCCustomisation.new(customisingBody) end

--- Scale/translation/rotation only apply to body customisations.
---@param modelSlot integer
---@param modelID integer
---@param scale? number Default 1.0.
---@param translation? Vector3 Default (0, 0, 0).
---@param rotationYawPitchRoll? Vector3 Default (0, 0, 0).
function ui.NPCCustomisation:SetModelSlot(modelSlot, modelID, scale, translation, rotationYawPitchRoll) end

---@param modelSlot integer
---@param rematerialSlot integer Max 16.
---@param sourceMaterialID integer
---@param replacementMaterialID integer
function ui.NPCCustomisation:SetModelSlotRematerial(modelSlot, rematerialSlot, sourceMaterialID, replacementMaterialID) end

---@param modelSlot integer
---@param recolourSlot integer Max 16.
---@param sourceColourHSL integer
---@param replacementColourHSL integer
function ui.NPCCustomisation:SetModelSlotRecolour(modelSlot, recolourSlot, sourceColourHSL, replacementColourHSL) end

--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/model.html)
---@class ui.ModelTypeEnum
---@field NONE ui.ModelType No/invalid model.
---@field MODEL ui.ModelType Plain model.
---@field NPC_HEAD ui.ModelType NPC chathead.
---@field PLAYER_HEAD ui.ModelType Player chathead.
---@field OBJECT ui.ModelType Object model.
---@field PLAYER_MODEL ui.ModelType
---@field NPC_MODEL ui.ModelType
---@field PLAYER_HEAD_NOWORN ui.ModelType Player chathead with no items equipped.
---@field INV_MANWEAR_MODEL ui.ModelType
---@field INV_WOMANWEAR_MODEL ui.ModelType
ui.ModelType = {}
---@alias ui.ModelType integer
