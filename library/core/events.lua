---@meta

--- Entity kinds reported in event payloads.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html)
---@enum EntityType
EntityType = {
    --- Dynamic LocEntity (animates or is a MultiLoc).
    LOCATION = 0,
    NPC = 1,
    PLAYER = 2,
    OBJSTACK = 3,
    --- Static LocEntity (interactable, does not animate).
    COMBINED_LOCATION_SECTION = 12,
}

--- Client states reported by GameStateChanged.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html)
---@enum GameState
GameState = {
    BOOT = 0,
    INIT = 1,
    LOGINSCREEN = 10,
    LOBBY = 20,
    ACCOUNT_CREATE = 23,
    GAME = 30,
    RECONNECTING = 35,
    RECONNECTING_FULL = 36,
    SWITCH_WORLD = 37,
    LOADING = 40,
    --- Returns the name of a GameState value. -- unverified: only used in events.html examples; return type inferred.
    ---@type fun(id: GameState): string
    FromID = nil,
}

--- Event subscription hub. Subscribe with a reference name; reusing a name on the same event overwrites that subscriber.
--- Subscribers run in subscription order; names are per-plugin. Some payloads are writeable and changes pass to later subscribers.
---
--- ```lua
--- Event.NPCEntityAdded.Subscribe("myRefName", function(e) log("An NPC was added!") end)
--- Event.NPCEntityAdded.Unsubscribe("myRefName")
--- ```
---
--- [Docs](https://developer.runescape.com/rs/core/events.html)
---@class EventAPI
Event = {}

--- Payload of the Logic event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#logic)
---@class LogicEvent
---@field logicTick integer How many logic ticks have occurred since the client was started.

--- Fires at the start of each logic update (50 per second).
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#logic)
---@class EventSource.Logic
Event.Logic = {}

--- Subscribes `callback` to Logic under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: LogicEvent)
function Event.Logic.Subscribe(name, callback) end

--- Removes the Logic subscriber with this reference name.
---@param name string
function Event.Logic.Unsubscribe(name) end

--- Fires after each server data packet is processed (about every 600ms).
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#serverlogic)
---@class EventSource.ServerLogic
Event.ServerLogic = {}

--- Subscribes `callback` to ServerLogic under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun()
function Event.ServerLogic.Subscribe(name, callback) end

--- Removes the ServerLogic subscriber with this reference name.
---@param name string
function Event.ServerLogic.Unsubscribe(name) end

--- Payload of the Draw event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#draw)
---@class DrawEvent
---@field timeDeltaSecs number Seconds since the last draw event (delta).

--- Fires at the start of each draw update.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#draw)
---@class EventSource.Draw
Event.Draw = {}

--- Subscribes `callback` to Draw under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: DrawEvent)
function Event.Draw.Subscribe(name, callback) end

--- Removes the Draw subscriber with this reference name.
---@param name string
function Event.Draw.Unsubscribe(name) end

--- Payload of the WindowFocusChanged event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#windowfocuschanged)
---@class WindowFocusChangedEvent
---@field hasFocus boolean Whether the window has focus.

--- Fires when the game window gains or loses focus.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#windowfocuschanged)
---@class EventSource.WindowFocusChanged
Event.WindowFocusChanged = {}

--- Subscribes `callback` to WindowFocusChanged under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: WindowFocusChangedEvent)
function Event.WindowFocusChanged.Subscribe(name, callback) end

--- Removes the WindowFocusChanged subscriber with this reference name.
---@param name string
function Event.WindowFocusChanged.Unsubscribe(name) end

--- Payload of the WindowSizeChanged event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#windowsizechanged)
---@class WindowSizeChangedEvent
---@field oldWidth integer
---@field oldHeight integer
---@field newWidth integer
---@field newHeight integer

--- Fires when the game window size changes.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#windowsizechanged)
---@class EventSource.WindowSizeChanged
Event.WindowSizeChanged = {}

--- Subscribes `callback` to WindowSizeChanged under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: WindowSizeChangedEvent)
function Event.WindowSizeChanged.Subscribe(name, callback) end

--- Removes the WindowSizeChanged subscriber with this reference name.
---@param name string
function Event.WindowSizeChanged.Unsubscribe(name) end

--- Payload of the OptionalDependencyChanged event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#optionaldependencychanged)
---@class OptionalDependencyChangedEvent
---@field pluginIdentifier string The dependency plugin.
---@field enabled boolean

--- Fires when an optional dependency plugin is enabled or disabled. Only sent to plugins that registered that dependency.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#optionaldependencychanged)
---@class EventSource.OptionalDependencyChanged
Event.OptionalDependencyChanged = {}

--- Subscribes `callback` to OptionalDependencyChanged under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: OptionalDependencyChangedEvent)
function Event.OptionalDependencyChanged.Subscribe(name, callback) end

--- Removes the OptionalDependencyChanged subscriber with this reference name.
---@param name string
function Event.OptionalDependencyChanged.Unsubscribe(name) end

--- Payload of the OptionalPermissionChanged event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#optionalpermissionchanged)
---@class OptionalPermissionChangedEvent
---@field permissionName string
---@field enabled boolean

--- Fires when an optional permission is granted or revoked.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#optionalpermissionchanged)
---@class EventSource.OptionalPermissionChanged
Event.OptionalPermissionChanged = {}

--- Subscribes `callback` to OptionalPermissionChanged under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: OptionalPermissionChangedEvent)
function Event.OptionalPermissionChanged.Subscribe(name, callback) end

--- Removes the OptionalPermissionChanged subscriber with this reference name.
---@param name string
function Event.OptionalPermissionChanged.Unsubscribe(name) end

--- Payload of the GameStateChanged event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#gamestatechanged)
---@class GameStateChangedEvent
---@field oldState GameState
---@field newState GameState

--- Fires when the client state changes.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#gamestatechanged)
---@class EventSource.GameStateChanged
Event.GameStateChanged = {}

--- Subscribes `callback` to GameStateChanged under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: GameStateChangedEvent)
function Event.GameStateChanged.Subscribe(name, callback) end

--- Removes the GameStateChanged subscriber with this reference name.
---@param name string
function Event.GameStateChanged.Unsubscribe(name) end

--- Payload of the KeyUp event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#keyup)
---@class KeyUpEvent
---@field gameKey GameKey
---@field systemKey SystemKey
---@field modifiers integer Bitfield of held modifier keys, see `ModifierKey`.
---@field timestamp integer Milliseconds.

--- Fires when a key is released.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#keyup)
---@class EventSource.KeyUp
Event.KeyUp = {}

--- Subscribes `callback` to KeyUp under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: KeyUpEvent)
function Event.KeyUp.Subscribe(name, callback) end

--- Removes the KeyUp subscriber with this reference name.
---@param name string
function Event.KeyUp.Unsubscribe(name) end

--- Payload of the KeyDown event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#keydown)
---@class KeyDownEvent
---@field isRepeat boolean True for OS repeats.
---@field gameKey GameKey
---@field systemKey SystemKey
---@field modifiers integer Bitfield of held modifier keys, see `ModifierKey`.
---@field timestamp integer Milliseconds.

--- Fires on first press and on OS key repeats. A KeyTyped event always follows.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#keydown)
---@class EventSource.KeyDown
Event.KeyDown = {}

--- Subscribes `callback` to KeyDown under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: KeyDownEvent)
function Event.KeyDown.Subscribe(name, callback) end

--- Removes the KeyDown subscriber with this reference name.
---@param name string
function Event.KeyDown.Unsubscribe(name) end

--- Payload of the KeyTyped event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#keytyped)
---@class KeyTypedEvent
---@field char integer Character code; convert with `string.char`.
---@field modifiers integer Bitfield of held modifier keys, see `ModifierKey`.
---@field timestamp integer Milliseconds.

--- Fires with the generated character, always after KeyDown.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#keytyped)
---@class EventSource.KeyTyped
Event.KeyTyped = {}

--- Subscribes `callback` to KeyTyped under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: KeyTypedEvent)
function Event.KeyTyped.Subscribe(name, callback) end

--- Removes the KeyTyped subscriber with this reference name.
---@param name string
function Event.KeyTyped.Unsubscribe(name) end

--- Payload of the VarTransmit event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#vartransmit)
---@class VarTransmitEvent
---@field var VarType The variable config.
---@field oldValue integer|string Previous value; type depends on the variable config.
---@field newValue integer|string New value; type depends on the variable config.

--- Fires when the server transmits a variable update, immediately after it is set. The value may not have changed.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#vartransmit)
---@class EventSource.VarTransmit
Event.VarTransmit = {}

--- Subscribes `callback` to VarTransmit under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: VarTransmitEvent)
function Event.VarTransmit.Subscribe(name, callback) end

--- Removes the VarTransmit subscriber with this reference name.
---@param name string
function Event.VarTransmit.Unsubscribe(name) end

--- Payload of the ChatMessage event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#chatmessage)
---@class ChatMessageEvent
---@field chatMessage string The message. Writeable: edits pass to later subscribers.
---@field senderNameUnfiltered string Unfiltered sender name; empty if no sender.
---@field senderNameFiltered string Filtered display sender name (may be non-unique); empty if no sender.
---@field senderNameSimple string Filtered sender name without pre/post-fixes; empty if no sender.
---@field chatType ChatType The type of chat message.
---@field timestamp integer Seconds since Unix epoch.

--- Fires on server chat messages and local `Chat.AddMessage()` calls. Requires the `chatAccess` permission.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#chatmessage)
---@class EventSource.ChatMessage
Event.ChatMessage = {}

--- Subscribes `callback` to ChatMessage under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: ChatMessageEvent)
function Event.ChatMessage.Subscribe(name, callback) end

--- Removes the ChatMessage subscriber with this reference name.
---@param name string
function Event.ChatMessage.Unsubscribe(name) end

--- Payload of the PlayerEntityAdded event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#playerentityadded)
---@class PlayerEntityAddedEvent
---@field playerEntity PlayerEntity
---@field entityType EntityType Always `EntityType.PLAYER`.

--- Fires when a player enters the world.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#playerentityadded)
---@class EventSource.PlayerEntityAdded
Event.PlayerEntityAdded = {}

--- Subscribes `callback` to PlayerEntityAdded under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: PlayerEntityAddedEvent)
function Event.PlayerEntityAdded.Subscribe(name, callback) end

--- Removes the PlayerEntityAdded subscriber with this reference name.
---@param name string
function Event.PlayerEntityAdded.Unsubscribe(name) end

--- Payload of the PlayerEntityRemoved event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#playerentityremoved)
---@class PlayerEntityRemovedEvent
---@field playerEntity PlayerEntity
---@field entityType EntityType Always `EntityType.PLAYER`.

--- Fires when a player leaves the world.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#playerentityremoved)
---@class EventSource.PlayerEntityRemoved
Event.PlayerEntityRemoved = {}

--- Subscribes `callback` to PlayerEntityRemoved under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: PlayerEntityRemovedEvent)
function Event.PlayerEntityRemoved.Subscribe(name, callback) end

--- Removes the PlayerEntityRemoved subscriber with this reference name.
---@param name string
function Event.PlayerEntityRemoved.Unsubscribe(name) end

--- Payload of the NPCEntityAdded event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#npcentityadded)
---@class NPCEntityAddedEvent
---@field npcEntity NPCEntity
---@field entityType EntityType Always `EntityType.NPC`.

--- Fires when an NPC enters the world.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#npcentityadded)
---@class EventSource.NPCEntityAdded
Event.NPCEntityAdded = {}

--- Subscribes `callback` to NPCEntityAdded under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: NPCEntityAddedEvent)
function Event.NPCEntityAdded.Subscribe(name, callback) end

--- Removes the NPCEntityAdded subscriber with this reference name.
---@param name string
function Event.NPCEntityAdded.Unsubscribe(name) end

--- Payload of the NPCEntityRemoved event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#npcentityremoved)
---@class NPCEntityRemovedEvent
---@field npcEntity NPCEntity
---@field entityType EntityType Always `EntityType.NPC`.

--- Fires when an NPC leaves the world.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#npcentityremoved)
---@class EventSource.NPCEntityRemoved
Event.NPCEntityRemoved = {}

--- Subscribes `callback` to NPCEntityRemoved under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: NPCEntityRemovedEvent)
function Event.NPCEntityRemoved.Subscribe(name, callback) end

--- Removes the NPCEntityRemoved subscriber with this reference name.
---@param name string
function Event.NPCEntityRemoved.Unsubscribe(name) end

--- Payload of the ObjStackEntityAdded event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#objstackentityadded)
---@class ObjStackEntityAddedEvent
---@field objStackEntity ObjStackEntity
---@field entityType EntityType Always `EntityType.OBJSTACK`.
---@field objType ObjType
---@field count integer
---@field isOwner boolean

--- Fires for the first object in a new stack; later objects arrive via ObjStackEntityChanged.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#objstackentityadded)
---@class EventSource.ObjStackEntityAdded
Event.ObjStackEntityAdded = {}

--- Subscribes `callback` to ObjStackEntityAdded under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: ObjStackEntityAddedEvent)
function Event.ObjStackEntityAdded.Subscribe(name, callback) end

--- Removes the ObjStackEntityAdded subscriber with this reference name.
---@param name string
function Event.ObjStackEntityAdded.Unsubscribe(name) end

--- Payload of the ObjStackEntityRemoved event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#objstackentityremoved)
---@class ObjStackEntityRemovedEvent
---@field objStackEntity ObjStackEntity
---@field entityType EntityType Always `EntityType.OBJSTACK`.
---@field objType ObjType
---@field count integer
---@field isOwner boolean

--- Fires when the last object is picked up or the stack leaves view range.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#objstackentityremoved)
---@class EventSource.ObjStackEntityRemoved
Event.ObjStackEntityRemoved = {}

--- Subscribes `callback` to ObjStackEntityRemoved under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: ObjStackEntityRemovedEvent)
function Event.ObjStackEntityRemoved.Subscribe(name, callback) end

--- Removes the ObjStackEntityRemoved subscriber with this reference name.
---@param name string
function Event.ObjStackEntityRemoved.Unsubscribe(name) end

--- Payload of the ObjStackEntityChanged event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#objstackentitychanged)
---@class ObjStackEntityChangedEvent
---@field objStackEntity ObjStackEntity
---@field entityType EntityType Always `EntityType.OBJSTACK`.
---@field objType ObjType
---@field oldCount integer
---@field newCount integer
---@field isOwner boolean

--- Fires when objects are added to or removed from a stack's tile.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#objstackentitychanged)
---@class EventSource.ObjStackEntityChanged
Event.ObjStackEntityChanged = {}

--- Subscribes `callback` to ObjStackEntityChanged under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: ObjStackEntityChangedEvent)
function Event.ObjStackEntityChanged.Subscribe(name, callback) end

--- Removes the ObjStackEntityChanged subscriber with this reference name.
---@param name string
function Event.ObjStackEntityChanged.Unsubscribe(name) end

--- Payload of the SkillTransmit event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#skilltransmit)
---@class SkillTransmitEvent
---@field skill SkillType
---@field oldXP integer
---@field newXP integer
---@field oldGameplayLevel integer
---@field newGameplayLevel integer

--- Fires when a skill changes.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#skilltransmit)
---@class EventSource.SkillTransmit
Event.SkillTransmit = {}

--- Subscribes `callback` to SkillTransmit under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: SkillTransmitEvent)
function Event.SkillTransmit.Subscribe(name, callback) end

--- Removes the SkillTransmit subscriber with this reference name.
---@param name string
function Event.SkillTransmit.Unsubscribe(name) end

--- Payload of the RunEnergyTransmit event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#runenergytransmit)
---@class RunEnergyTransmitEvent
---@field oldRunEnergy integer
---@field newRunEnergy integer

--- Fires when run energy changes.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#runenergytransmit)
---@class EventSource.RunEnergyTransmit
Event.RunEnergyTransmit = {}

--- Subscribes `callback` to RunEnergyTransmit under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: RunEnergyTransmitEvent)
function Event.RunEnergyTransmit.Subscribe(name, callback) end

--- Removes the RunEnergyTransmit subscriber with this reference name.
---@param name string
function Event.RunEnergyTransmit.Unsubscribe(name) end

--- Payload of the RunWeightTransmit event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#runweighttransmit)
---@class RunWeightTransmitEvent
---@field oldRunWeight integer
---@field newRunWeight integer

--- Fires when run weight changes.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#runweighttransmit)
---@class EventSource.RunWeightTransmit
Event.RunWeightTransmit = {}

--- Subscribes `callback` to RunWeightTransmit under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: RunWeightTransmitEvent)
function Event.RunWeightTransmit.Subscribe(name, callback) end

--- Removes the RunWeightTransmit subscriber with this reference name.
---@param name string
function Event.RunWeightTransmit.Unsubscribe(name) end

--- Payload of the MiniMenuOpened event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuopened)
---@class MiniMenuOpenedEvent
---@field miniMenu MiniMenuAPI

--- Fires when the MiniMenu opens. Entries are readable but not editable.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuopened)
---@class EventSource.MiniMenuOpened
Event.MiniMenuOpened = {}

--- Subscribes `callback` to MiniMenuOpened under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: MiniMenuOpenedEvent)
function Event.MiniMenuOpened.Subscribe(name, callback) end

--- Removes the MiniMenuOpened subscriber with this reference name.
---@param name string
function Event.MiniMenuOpened.Unsubscribe(name) end

--- Payload of the MiniMenuClosed event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuclosed)
---@class MiniMenuClosedEvent
---@field miniMenu MiniMenuAPI

--- Fires when the MiniMenu closes, whether or not an entry was selected. Entries are readable but not editable.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuclosed)
---@class EventSource.MiniMenuClosed
Event.MiniMenuClosed = {}

--- Subscribes `callback` to MiniMenuClosed under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: MiniMenuClosedEvent)
function Event.MiniMenuClosed.Subscribe(name, callback) end

--- Removes the MiniMenuClosed subscriber with this reference name.
---@param name string
function Event.MiniMenuClosed.Unsubscribe(name) end

--- Payload of the MiniMenuReady event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuready)
---@class MiniMenuReadyEvent
---@field miniMenu MiniMenuAPI The current MiniMenu. Writeable using `Swap()`.

--- Fires after all entries for the tick are added. Entries can be reordered with `miniMenu:Swap()`.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuready)
---@class EventSource.MiniMenuReady
Event.MiniMenuReady = {}

--- Subscribes `callback` to MiniMenuReady under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: MiniMenuReadyEvent)
function Event.MiniMenuReady.Subscribe(name, callback) end

--- Removes the MiniMenuReady subscriber with this reference name.
---@param name string
function Event.MiniMenuReady.Unsubscribe(name) end

--- Payload of the MiniMenuEntryAdded event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuentryadded)
---@class MiniMenuEntryAddedEvent
---@field entry MiniMenuEntry

--- Fires when a MiniMenu entry is added.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuentryadded)
---@class EventSource.MiniMenuEntryAdded
Event.MiniMenuEntryAdded = {}

--- Subscribes `callback` to MiniMenuEntryAdded under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: MiniMenuEntryAddedEvent)
function Event.MiniMenuEntryAdded.Subscribe(name, callback) end

--- Removes the MiniMenuEntryAdded subscriber with this reference name.
---@param name string
function Event.MiniMenuEntryAdded.Unsubscribe(name) end

--- Payload of the MiniMenuEntrySelected event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuentryselected)
---@class MiniMenuEntrySelectedEvent
---@field entry MiniMenuEntry

--- Fires when a MiniMenu entry is selected.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#minimenuentryselected)
---@class EventSource.MiniMenuEntrySelected
Event.MiniMenuEntrySelected = {}

--- Subscribes `callback` to MiniMenuEntrySelected under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: MiniMenuEntrySelectedEvent)
function Event.MiniMenuEntrySelected.Subscribe(name, callback) end

--- Removes the MiniMenuEntrySelected subscriber with this reference name.
---@param name string
function Event.MiniMenuEntrySelected.Unsubscribe(name) end

--- Payload of the LocAdded event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#locadded)
---@class LocAddedEvent
---@field config LocType The location config.
---@field shapeType LocShapeType
---@field rotationType RotationType The 90-degree rotation type.
---@field coordGrid CoordGrid Coordinate the location is added to.
---@field overrideTransform boolean Whether an overriding transform should be applied.
---@field transformTranslate Vector3 Overriding translation.
---@field transformRotation Vector3 Overriding rotation.
---@field transformScale Vector3 Overriding scale.

--- Fires when the server adds a location, or replaces one with matching shapeType and coordGrid (an unset custom transform is inherited). Not fired for MultiLoc variable changes.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#locadded)
---@class EventSource.LocAdded
Event.LocAdded = {}

--- Subscribes `callback` to LocAdded under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: LocAddedEvent)
function Event.LocAdded.Subscribe(name, callback) end

--- Removes the LocAdded subscriber with this reference name.
---@param name string
function Event.LocAdded.Unsubscribe(name) end

--- Payload of the LocRemoved event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#locremoved)
---@class LocRemovedEvent
---@field shapeType LocShapeType
---@field rotationType RotationType
---@field coordGrid CoordGrid

--- Fires when the server removes a location matching shapeType and coordGrid. No config is provided.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#locremoved)
---@class EventSource.LocRemoved
Event.LocRemoved = {}

--- Subscribes `callback` to LocRemoved under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: LocRemovedEvent)
function Event.LocRemoved.Subscribe(name, callback) end

--- Removes the LocRemoved subscriber with this reference name.
---@param name string
function Event.LocRemoved.Unsubscribe(name) end

--- Payload of the LocCustomised event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#loccustomised)
---@class LocCustomisedEvent
---@field config LocType
---@field shapeType LocShapeType
---@field rotationType RotationType
---@field coordGrid CoordGrid
---@field customModels integer[]
---@field customColours integer[] 16-bit HSL colours.
---@field customMaterials integer[]

--- Fires when the server applies appearance customisation to a location (existing custom transform is kept).
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#loccustomised)
---@class EventSource.LocCustomised
Event.LocCustomised = {}

--- Subscribes `callback` to LocCustomised under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: LocCustomisedEvent)
function Event.LocCustomised.Subscribe(name, callback) end

--- Removes the LocCustomised subscriber with this reference name.
---@param name string
function Event.LocCustomised.Unsubscribe(name) end

--- Payload of the LocAnimation event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#locanimation)
---@class LocAnimationEvent
---@field shapeType LocShapeType
---@field rotationType RotationType
---@field coordGrid CoordGrid
---@field animation SeqType? nil when stopping.
---@field animationDelay integer Delay in logic ticks.

--- Fires when the server starts an animation on a location. No config is provided.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#locanimation)
---@class EventSource.LocAnimation
Event.LocAnimation = {}

--- Subscribes `callback` to LocAnimation under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: LocAnimationEvent)
function Event.LocAnimation.Subscribe(name, callback) end

--- Removes the LocAnimation subscriber with this reference name.
---@param name string
function Event.LocAnimation.Unsubscribe(name) end

--- Payload of the InventoryAdded event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#inventoryadded)
---@class InventoryAddedEvent
---@field inv InvTypeProxy

--- Fires after the server populates an inventory.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#inventoryadded)
---@class EventSource.InventoryAdded
Event.InventoryAdded = {}

--- Subscribes `callback` to InventoryAdded under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: InventoryAddedEvent)
function Event.InventoryAdded.Subscribe(name, callback) end

--- Removes the InventoryAdded subscriber with this reference name.
---@param name string
function Event.InventoryAdded.Unsubscribe(name) end

--- Payload of the InventoryUpdated event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#inventoryupdated)
---@class InventoryUpdatedEvent
---@field inv InvTypeProxy
---@field slotsUpdated integer[] Slots that changed.

--- Fires when the server updates an inventory.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#inventoryupdated)
---@class EventSource.InventoryUpdated
Event.InventoryUpdated = {}

--- Subscribes `callback` to InventoryUpdated under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: InventoryUpdatedEvent)
function Event.InventoryUpdated.Subscribe(name, callback) end

--- Removes the InventoryUpdated subscriber with this reference name.
---@param name string
function Event.InventoryUpdated.Unsubscribe(name) end

--- Payload of the InventoryRemoved event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#inventoryremoved)
---@class InventoryRemovedEvent
---@field inv InvTypeProxy

--- Fires when the server stops sending an inventory; it is then unavailable to the client and API.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#inventoryremoved)
---@class EventSource.InventoryRemoved
Event.InventoryRemoved = {}

--- Subscribes `callback` to InventoryRemoved under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: InventoryRemovedEvent)
function Event.InventoryRemoved.Subscribe(name, callback) end

--- Removes the InventoryRemoved subscriber with this reference name.
---@param name string
function Event.InventoryRemoved.Unsubscribe(name) end

--- Payload of the GrandExchangeOfferUpdated event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#grandexchangeofferupdated)
---@class GrandExchangeOfferUpdatedEvent
---@field slot integer 1-indexed offer slot.
---@field listing GrandExchangeOffer

--- Fires when one of the player's Grand Exchange offers updates.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#grandexchangeofferupdated)
---@class EventSource.GrandExchangeOfferUpdated
Event.GrandExchangeOfferUpdated = {}

--- Subscribes `callback` to GrandExchangeOfferUpdated under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: GrandExchangeOfferUpdatedEvent)
function Event.GrandExchangeOfferUpdated.Subscribe(name, callback) end

--- Removes the GrandExchangeOfferUpdated subscriber with this reference name.
---@param name string
function Event.GrandExchangeOfferUpdated.Unsubscribe(name) end

--- Payload of the WorldCreated event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#worldcreated)
---@class WorldCreatedEvent
---@field mapSquareMinX integer
---@field mapSquareMinZ integer
---@field mapSquareMaxX integer
---@field mapSquareMaxZ integer

--- Fires when the player moves to a new world area.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#worldcreated)
---@class EventSource.WorldCreated
Event.WorldCreated = {}

--- Subscribes `callback` to WorldCreated under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: WorldCreatedEvent)
function Event.WorldCreated.Subscribe(name, callback) end

--- Removes the WorldCreated subscriber with this reference name.
---@param name string
function Event.WorldCreated.Unsubscribe(name) end

--- Fires when the current world area updates, usually from movement.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#worldupdated)
---@class EventSource.WorldUpdated
Event.WorldUpdated = {}

--- Subscribes `callback` to WorldUpdated under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun()
function Event.WorldUpdated.Subscribe(name, callback) end

--- Removes the WorldUpdated subscriber with this reference name.
---@param name string
function Event.WorldUpdated.Unsubscribe(name) end

--- Payload of the RegionCreated event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#regioncreated)
---@class RegionCreatedEvent
---@field mapSquareMinX integer
---@field mapSquareMinZ integer
---@field mapSquareMaxX integer
---@field mapSquareMaxZ integer
---@field regionGridCorner CoordGrid Bottom-left corner.
---@field regionGridWidth integer Grid units.
---@field regionGridLength integer Grid units.

--- Fires when the player moves into a new region (instance).
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#regioncreated)
---@class EventSource.RegionCreated
Event.RegionCreated = {}

--- Subscribes `callback` to RegionCreated under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: RegionCreatedEvent)
function Event.RegionCreated.Subscribe(name, callback) end

--- Removes the RegionCreated subscriber with this reference name.
---@param name string
function Event.RegionCreated.Unsubscribe(name) end

--- Fires when the current region updates, e.g. new zones are added.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#regionupdated)
---@class EventSource.RegionUpdated
Event.RegionUpdated = {}

--- Subscribes `callback` to RegionUpdated under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun()
function Event.RegionUpdated.Subscribe(name, callback) end

--- Removes the RegionUpdated subscriber with this reference name.
---@param name string
function Event.RegionUpdated.Unsubscribe(name) end

--- Payload of the SettingsLayerReady event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#settingslayerready)
---@class SettingsLayerReadyEvent
---@field component ui.Component The empty root component.

--- Fires when the plugin's settings layer is shown (cleared first). Requires `"hasSettingsIcon": true` in the manifest.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#settingslayerready)
---@class EventSource.SettingsLayerReady
Event.SettingsLayerReady = {}

--- Subscribes `callback` to SettingsLayerReady under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: SettingsLayerReadyEvent)
function Event.SettingsLayerReady.Subscribe(name, callback) end

--- Removes the SettingsLayerReady subscriber with this reference name.
---@param name string
function Event.SettingsLayerReady.Unsubscribe(name) end

--- Payload of the ContentLayerReady event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#contentlayerready)
---@class ContentLayerReadyEvent
---@field component ui.Component The empty root component.

--- Fires when the plugin's content layer is shown (cleared first). Requires `"hasRibbonIcon": true` in the manifest.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#contentlayerready)
---@class EventSource.ContentLayerReady
Event.ContentLayerReady = {}

--- Subscribes `callback` to ContentLayerReady under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: ContentLayerReadyEvent)
function Event.ContentLayerReady.Subscribe(name, callback) end

--- Removes the ContentLayerReady subscriber with this reference name.
---@param name string
function Event.ContentLayerReady.Unsubscribe(name) end

--- Payload of the EntityDraw event.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#entitydraw)
---@class EntityDrawEvent
---@field entityType EntityType Selects which entity field is set.
---@field npcEntity NPCEntity? Set when entityType is NPC.
---@field playerEntity PlayerEntity? Set when entityType is PLAYER.
---@field objStackEntity ObjStackEntity? Set when entityType is OBJSTACK.

--- Fires before an entity draws. The callback must return a boolean: false skips drawing, true continues.
---
--- [Docs](https://developer.runescape.com/rs/core/events.html#entitydraw)
---@class EventSource.EntityDraw
Event.EntityDraw = {}

--- Subscribes `callback` to EntityDraw under a reference name.
---@param name string Reference name, used to unsubscribe.
---@param callback fun(event: EntityDrawEvent): boolean
function Event.EntityDraw.Subscribe(name, callback) end

--- Removes the EntityDraw subscriber with this reference name.
---@param name string
function Event.EntityDraw.Unsubscribe(name) end
