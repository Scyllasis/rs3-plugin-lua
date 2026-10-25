---@meta

--- Why a cutscene finished playing on a cutscene layer.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/cutscene_layer.html)
---@class ui.CutscenePlaybackEndReasonEnum
---@field FINISHED ui.CutscenePlaybackEndReason Finished normally.
---@field CANCELLED ui.CutscenePlaybackEndReason Cancelled by the user.
---@field INTERRUPTED ui.CutscenePlaybackEndReason Interrupted by another cutscene.
---@field INTERFACE_CLOSED ui.CutscenePlaybackEndReason The containing interface was closed.
ui.CutscenePlaybackEndReason = {}
---@alias ui.CutscenePlaybackEndReason integer

--- Layer used for 2D cutscene playback. Cutscenes aren't exposed to plugins; existing ones can be used as regular layers.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/cutscene_layer.html)
---@class ui.CutsceneLayer : ui.Layer
ui.CutsceneLayer = {}
