---@meta

--- Decorative overlay showing radial progress, masked by a sprite.
--- Fires ui.Hook.ONSELECTIONCHANGED(curValue, progressPc) on progress.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/radial_progress_overlay.html)
---@class ui.RadialProgressOverlay : ui.Component
---@field curValue number Current value, between initialValue and endValue.
---@field initialValue number Set via Start. Read-only.
---@field endValue number Set via Start. Read-only.
---@field progress number 0..1. Read-only.
---@field maskSprite ui.SpriteData Transparency mask. Contents modifiable.
ui.RadialProgressOverlay = {}

--- Creates a new RadialProgressOverlay in `parent`. Caller must set layout and visuals afterwards.
--- Fails if the category/dynamic ID pair is already used on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil Collection to create the component in (docs type: ui.ComponentCollection). Widened so `ui.Interfaces:GetComponent(...)` results can be passed directly.
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.RadialProgressOverlay
function ui.RadialProgressOverlay.new(parent, categoryID, dynamicID) end

--- Starts progress. With AUTOMATIC, values are times in seconds.
---@param initialValue number
---@param endValue number
---@param flags? integer Sum of ui.RadialProgressOverlayFlag values. -- unverified: docs example omits it
function ui.RadialProgressOverlay:Start(initialValue, endValue, flags) end

--- Flags for `Start`; combine with `+`.
---
--- [Docs](https://developer.runescape.com/rs/ui/decorative_components/radial_progress_overlay.html)
---@class ui.RadialProgressOverlayFlagEnum
---@field AUTOMATIC ui.RadialProgressOverlayFlag Progress advances over time.
---@field REVERSE ui.RadialProgressOverlayFlag Starts filled and depletes.
---@field FLIP_HORIZONTAL ui.RadialProgressOverlayFlag
---@field FLIP_VERTICAL ui.RadialProgressOverlayFlag
ui.RadialProgressOverlayFlag = {}
---@alias ui.RadialProgressOverlayFlag integer
