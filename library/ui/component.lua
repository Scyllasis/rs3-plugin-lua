---@meta

--- Base type for all UI components (decorative, interactive and layout).
---
--- [Docs](https://developer.runescape.com/rs/ui/component.html)
---@class ui.Component
---@field position ui.Pos Gets or sets the position.
---@field size ui.Size Gets or sets the size.
---@field isSafeAreaRelative boolean Position relative to the screen's safe area.
---@field x integer Resolved X position. Read-only.
---@field y integer Resolved Y position. Read-only.
---@field width integer Resolved width. Read-only.
---@field height integer Resolved height. Read-only.
---@field xyLocal Vector2 Position relative to the parent. Read-only.
---@field xyGlobal Vector2 Position relative to the screen. Read-only.
---@field alpha number Opacity, 0..1.
---@field rgb integer Colour as hex RGB.
---@field rgba integer Colour as hex RGBA.
---@field colour Vector4 Colour/tint.
---@field hidden boolean Whether this component is hidden.
---@field visible boolean Whether this component is visible. Read-only.
---@field visibleGlobal boolean Whether this component and all its parents are visible. Read-only.
---@field stylesheetID integer Stylesheet used by this component (see `id.StyleSheet`).
---@field aspectRatioProportion number Read-only.
---@field aspectRatioWidth integer Read-only.
---@field aspectRatioHeight integer Read-only.
---@field aspectRatioMode ui.AspectRatioMode Read-only.
-- found in-game (beta 951.1): decorative components (Rectangle, Text, GroupBox) get no mouse hooks
-- until `enabled = true`; a click on a click-through component also reaches the game world; a fully
-- transparent Rectangle (alpha 0x01) gets no mouse input, a faint one (alpha 0x18) does.
---@field enabled boolean Whether the component accepts interaction. Decorative components need `true` to get mouse hooks.
---@field clickthrough boolean Whether clicks pass through to components beneath (they also reach the game).
---@field isMouseOver boolean Read-only.
---@field isClicked boolean Read-only.
---@field opConfig ui.ComponentOpConfig Op (right-click option) settings.
---@field dragConfig ui.ComponentDragConfig Drag settings.
---@field swipeConfig ui.ComponentSwipeConfig Touch swipe settings.
---@field pinchConfig ui.ComponentPinchConfig Touch pinch settings.
---@field cursorConfig ui.ComponentCursorConfig Cursor settings.
---@field paramsConfig ui.ComponentParamsConfig Legacy params access.
---@field type ui.ComponentType Component type. Read-only.
---@field parent ui.Component? Direct parent. Read-only.
---@field parentStatic ui.Component? Nearest static parent. Read-only.
---@field parentInterface ui.Interface Owning interface. Read-only.
---@field interfaceID integer Read-only.
---@field staticID integer Read-only.
---@field categoryID integer Read-only.
---@field dynamicID integer Read-only.
---@field isRestricted boolean Whether `FlagRestricted` was called. -- unverified: type not documented
ui.Component = {}

--- Sets the X position: offset plus optional parent/self width percentages.
---@param x integer
---@param parentPercentageX? number
---@param selfPercentageX? number
function ui.Component:SetX(x, parentPercentageX, selfPercentageX) end

--- Sets the Y position: offset plus optional parent/self height percentages.
---@param y integer
---@param parentPercentageY? number
---@param selfPercentageY? number
function ui.Component:SetY(y, parentPercentageY, selfPercentageY) end

--- Sets both position axes. Preferred over SetX + SetY.
---@param x integer
---@param y integer
---@param parentPercentageX? number
---@param parentPercentageY? number
---@param selfPercentageX? number
---@param selfPercentageY? number
function ui.Component:SetPos(x, y, parentPercentageX, parentPercentageY, selfPercentageX, selfPercentageY) end

--- Sets the width: offset plus optional parent width percentage.
---@param x integer
---@param parentPercentageX? number
function ui.Component:SetWidth(x, parentPercentageX) end

--- Sets the height: offset plus optional parent height percentage.
---@param y integer
---@param parentPercentageY? number
function ui.Component:SetHeight(y, parentPercentageY) end

--- Sets both dimensions. Preferred over SetWidth + SetHeight.
---@param x integer
---@param y integer
---@param parentPercentageX? number
---@param parentPercentageY? number
function ui.Component:SetSize(x, y, parentPercentageX, parentPercentageY) end

--- Sets a target aspect ratio and how it is applied. Invalid ratios are replaced with 1.
---@param widthRatio integer
---@param heightRatio integer
---@param mode ui.AspectRatioMode
function ui.Component:SetAspectRatio(widthRatio, heightRatio, mode) end

--- Destroys this component and everything attached to it. Cannot destroy other plugins' components.
function ui.Component:Destroy() end

--- Draws this component in front of its siblings.
function ui.Component:MoveToFront() end

--- Draws this component behind its siblings.
function ui.Component:MoveToBack() end

--- Forces a layout update (normally automatic).
function ui.Component:UpdateLayout() end

--- Irreversibly flags this component as restricted (InputField/Label content reads return "").
--- Only the creating plugin can do this. -- unverified: no signature documented
function ui.Component:FlagRestricted() end

--- Subscribes a callback to an event hook. The callback receives `self` first, then hook-specific
--- arguments (see ui.Hook). Return false to stop later listeners. Same hook + id replaces the callback.
---@param hook ui.Hook
---@param callback fun(self: ui.Component, ...: any): boolean?
---@overload fun(self: ui.Component, hook: ui.Hook, id: string, callback: fun(self: ui.Component, ...: any): boolean?)
function ui.Component:Subscribe(hook, callback) end

--- Removes a listener for a hook (optionally the one with the given id).
---@param hook ui.Hook
---@param id? string
function ui.Component:Unsubscribe(hook, id) end

--- Removes all of this plugin's listeners for a hook.
---@param hook ui.Hook
function ui.Component:UnsubscribeAll(hook) end

--- Event hooks for `Component:Subscribe`. Callback args after `self`:
--- - ONBUTTONPRESSED(currentValue: integer, previousValue: integer)
--- - ONCONTENTCHANGED(reason: ui.InputFieldActionResult, newContents: string)
--- - ONSELECTIONCHANGED(entryID: integer, selectedStatus: integer) for Carousel/PagedLayer/Slider;
---   (entryID: integer, selectionEventType: ui.SelectionChangeEvent) for ComboField/List/RadioGroup;
---   (curValue: number, progressPc: number) for RadialProgressOverlay
--- - ONCUTSCENEFINISHED(reason: ui.CutscenePlaybackEndReason)
--- - ONCLICK/ONCLICKREPEAT/ONRELEASE/ONHOLD/ONMOUSEOVER/ONMOUSEREPEAT/ONMOUSELEAVE(x: integer, y: integer)
---   ONHOLD repeats while the button is held; x/y are the mouse inside the component in interface units.
--- - ONDRAG(dragStartX, dragStartY); ONDRAGCOMPLETE(dragDestination: ui.Component, dragEndX, dragEndY)
---   Not sent to plugin components, even with a dragConfig set (beta 951.1); use ONHOLD to drag.
-- found in-game: Mouse.GetX/GetY are screen pixels, not interface units (125% Windows scaling gave
-- 1.25 px per unit while ClientOptions InterfaceScale said 100).
--- - ONSCROLLWHEEL(scrollWheelYDelta); ONKEY(keyCode, keyChar)
--- - ONSWIPEVERTICAL/ONSWIPEHORIZONTAL(swipeCurrentX, swipeCurrentY); ONPINCH*(direction: -1|1)
--- - ONGAMEPADBUTTON(buttonID, buttonValue); ONGAMEPADBUTTONHELD(buttonID); ONGAMEPADAXIS(axisID, axisValue); ONGAMEPADTRIGGER(triggerID, triggerValue)
--- - ONOP(opID: integer, opBaseName: string); ONOPT(target: ui.Component)
--- - All others: no extra arguments.
---
--- [Docs](https://developer.runescape.com/rs/ui/component.html)
---@class ui.HookEnum
---@field ONBUTTONPRESSED ui.Hook Button or Check interaction.
---@field ONCONTENTCHANGED ui.Hook InputField contents may have changed.
---@field ONSELECTIONCHANGED ui.Hook Selection or radial progress changed.
---@field ONCUTSCENEFINISHED ui.Hook CutsceneLayer cutscene finished.
---@field ONCLICK ui.Hook
---@field ONCLICKREPEAT ui.Hook
---@field ONRELEASE ui.Hook
---@field ONHOLD ui.Hook
---@field ONMOUSEOVER ui.Hook
---@field ONMOUSEREPEAT ui.Hook
---@field ONMOUSELEAVE ui.Hook
---@field ONDRAG ui.Hook
---@field ONDRAGCOMPLETE ui.Hook
---@field ONSCROLLWHEEL ui.Hook
---@field ONKEY ui.Hook
---@field ONSWIPEVERTICAL ui.Hook Touch only.
---@field ONSWIPEHORIZONTAL ui.Hook Touch only.
---@field ONSWIPECOMPLETE ui.Hook Touch only.
---@field ONPINCHHORIZONTAL ui.Hook Touch only.
---@field ONPINCHVERTICAL ui.Hook Touch only.
---@field ONPINCHCOMPLETE ui.Hook Touch only.
---@field ONGAMEPADBUTTON ui.Hook Experimental.
---@field ONGAMEPADBUTTONHELD ui.Hook Experimental.
---@field ONGAMEPADAXIS ui.Hook Experimental.
---@field ONGAMEPADTRIGGER ui.Hook Experimental.
---@field ONOP ui.Hook Op selected on this component.
---@field ONOPT ui.Hook Targeted op used on this component.
---@field ONTARGETENTER ui.Hook
---@field ONTARGETLEAVE ui.Hook
---@field ONVARPTRANSMIT ui.Hook
---@field ONINVTRANSMIT ui.Hook
---@field ONSTATTRANSMIT ui.Hook
---@field ONVARCTRANSMIT ui.Hook
---@field ONVARCSTRTRANSMIT ui.Hook
---@field ONVARCLANTRANSMIT ui.Hook
---@field ONCHATTRANSMIT ui.Hook
---@field ONFRIENDTRANSMIT ui.Hook
---@field ONCLANTRANSMIT ui.Hook
---@field ONCLANSETTINGSTRANSMIT ui.Hook
---@field ONCLANCHANNELTRANSMIT ui.Hook
---@field ONRELATIONSHIPSETTRANSMIT ui.Hook
---@field ONMISCTRANSMIT ui.Hook
---@field ONSTOCKTRANSMIT ui.Hook
---@field ONPLAYERGROUPTRANSMIT ui.Hook
---@field ONPLAYERGROUPVARPTRANSMIT ui.Hook
---@field ONCAMERAUPDATETRANSMIT ui.Hook
---@field ONTIMER ui.Hook Once per logic tick (PluginLogic preferred).
---@field ONDIALOGABORT ui.Hook
---@field ONSUBCHANGE ui.Hook
---@field ONCAMFINISHED ui.Hook
---@field ONRESIZE ui.Hook
ui.Hook = {}
---@alias ui.Hook integer

--- Source of a selection change (ComboField, List, RadioGroup).
---
--- [Docs](https://developer.runescape.com/rs/ui/component.html)
---@class ui.SelectionChangeEventEnum
---@field DESELECTED ui.SelectionChangeEvent
---@field SELECTED ui.SelectionChangeEvent
---@field ERROR_MAX_SELECTED ui.SelectionChangeEvent
---@field ERROR_NOT_SELECTABLE ui.SelectionChangeEvent
ui.SelectionChangeEvent = {}
---@alias ui.SelectionChangeEvent integer
