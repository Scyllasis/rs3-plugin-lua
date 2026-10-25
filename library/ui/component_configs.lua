---@meta

--- Filter that tests op names against a string.
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.OpNameFilter
---@field filterString string String to match.
---@field exactMatch boolean Require an exact match instead of a substring.
---@field invertFilter boolean Invert the result.
ui.OpNameFilter = {}

--- Creates a filter (default-initialised, or configured).
---@return ui.OpNameFilter
---@overload fun(filterString: string, exactMatch: boolean, invertFilter: boolean): ui.OpNameFilter
function ui.OpNameFilter.new() end

--- Returns whether the string passes the filter.
---@param testString string
---@return boolean
function ui.OpNameFilter:Test(testString) end

--- Op (right-click option) configuration of a component (`component.opConfig`).
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.ComponentOpConfig
---@field pauseText string
---@field opWikiText string
---@field numOpNames integer Read-only.
---@field numOpCursors integer Read-only.
---@field opNames string[] Read-only.
---@field opBaseName string Read-only.
---@field opCursors integer[] Read-only.
---@field targetOpVerb string Read-only.
---@field targetOpCursor integer
local ComponentOpConfig = {}

--- Returns the op name at an index, or "" if missing.
---@param opIndex integer
---@return string
function ComponentOpConfig:GetOpName(opIndex) end

--- Clears op names (not cursors).
function ComponentOpConfig:ClearOpNames() end

--- Returns the op cursor at an index, or -1 if missing.
---@param opIndex integer
---@return integer
function ComponentOpConfig:GetOpCursor(opIndex) end

---@param opIndex integer
---@param cursorID integer
function ComponentOpConfig:SetOpCursor(opIndex, cursorID) end

--- Clears op cursors (not names).
function ComponentOpConfig:ClearOpCursors() end

---@return boolean
function ComponentOpConfig:HasHiddenTests() end

---@param opIndex integer
---@return boolean
function ComponentOpConfig:TestOpIsHidden(opIndex) end

--- Resets name-hidden filters and ID-hidden defaults.
function ComponentOpConfig:ClearHiddenOps() end

---@param opIndex integer
---@param hidden boolean
function ComponentOpConfig:SetOpIDHidden(opIndex, hidden) end

---@param opIndex integer
---@return boolean
function ComponentOpConfig:GetOpIDHidden(opIndex) end

---@param filter ui.OpNameFilter
function ComponentOpConfig:SetOpNameHidden(filter) end

--- Returns the hidden-name filter (always-pass if never set).
---@return ui.OpNameFilter
function ComponentOpConfig:GetOpNameHidden() end

---@return boolean
function ComponentOpConfig:HasHighPriorityTests() end

---@param opIndex integer
---@return boolean
function ComponentOpConfig:TestOpIsHighPriority(opIndex) end

--- Resets name-high-priority filters and ID-high-priority defaults.
function ComponentOpConfig:ClearHighPriorityOps() end

---@param opIndex integer
---@param highPriority boolean
function ComponentOpConfig:SetOpIDHighPriority(opIndex, highPriority) end

---@param opIndex integer
---@return boolean
function ComponentOpConfig:GetOpIDHighPriority(opIndex) end

---@param filter ui.OpNameFilter
function ComponentOpConfig:SetOpNameHighPriority(filter) end

--- Returns the high-priority-name filter (always-fail if never set).
---@return ui.OpNameFilter
function ComponentOpConfig:GetOpNameHighPriority() end

--- Touch swipe configuration (`component.swipeConfig`).
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.ComponentSwipeConfig
---@field directionMask integer Combination of ui.SwipeDirectionBit.
---@field deadZoneHorizontal integer
---@field deadZoneVertical integer
---@field deceleration integer 1..100; 100 = no drift.
---@field stopExponent integer Recommended 8.
local ComponentSwipeConfig = {}

---@param horizontal integer
---@param vertical integer
function ComponentSwipeConfig:SetDeadZone(horizontal, vertical) end

--- Drag configuration (`component.dragConfig`).
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.ComponentDragConfig
---@field draggedComponent ui.Component Component drawn while dragging.
---@field renderBehaviour ui.DragRenderBehaviour
---@field dragDelayTicks integer Delay in logic ticks.
---@field deadZone integer In interface units.

--- Touch pinch configuration (`component.pinchConfig`).
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.ComponentPinchConfig
---@field directionMask integer Combination of direction bits. -- unverified: docs say ui.SwipeDirectionBit; ui.PinchAxisBit may be intended
---@field threshold integer In interface units.

--- Cursor configuration (`component.cursorConfig`). -1 means no cursor.
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.ComponentCursorConfig
---@field mouseOverCursor integer Default -1.
---@field targetValidCursor integer Default -1.
---@field targetInvalidCursor integer Default -1.

--- Legacy params access (`component.paramsConfig`). May be removed in future.
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.ComponentParamsConfig
---@field valid boolean Read-only.
local ComponentParamsConfig = {}

---@param paramID integer
---@return integer|string|nil
function ComponentParamsConfig:Get(paramID) end

---@param paramID integer
---@return boolean
function ComponentParamsConfig:CheckExists(paramID) end

--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.DragRenderBehaviourEnum
---@field TRANSPARENT_OVERLAY ui.DragRenderBehaviour
---@field OPAQUE ui.DragRenderBehaviour
---@field OPAQUE_OVERLAY ui.DragRenderBehaviour
---@field INVISIBLE ui.DragRenderBehaviour
ui.DragRenderBehaviour = {}
---@alias ui.DragRenderBehaviour integer

--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.PlayerOpTypeEnum
---@field NONE ui.PlayerOpType
---@field FRIEND ui.PlayerOpType
---@field GROUP_MEMBER ui.PlayerOpType
---@field GROUP_BANNED ui.PlayerOpType
---@field CLAN_MEMBER ui.PlayerOpType
---@field CLAN_GUEST ui.PlayerOpType
---@field FRIEND_CHAT ui.PlayerOpType
ui.PlayerOpType = {}
---@alias ui.PlayerOpType integer

--- Combinable bitmask.
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.PinchAxisBitEnum
---@field HORIZONTAL ui.PinchAxisBit
---@field VERTICAL ui.PinchAxisBit
ui.PinchAxisBit = {}
---@alias ui.PinchAxisBit integer

--- Combinable bitmask.
---
--- [Docs](https://developer.runescape.com/rs/ui/component_configs.html)
---@class ui.SwipeDirectionBitEnum
---@field LEFT ui.SwipeDirectionBit
---@field RIGHT ui.SwipeDirectionBit
---@field UP ui.SwipeDirectionBit
---@field DOWN ui.SwipeDirectionBit
ui.SwipeDirectionBit = {}
---@alias ui.SwipeDirectionBit integer
