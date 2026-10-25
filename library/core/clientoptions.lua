---@meta

--- An engine-level client option (graphics, audio, accessibility...). Does not cover the in-game gameplay settings interface.
---
--- [Docs](https://developer.runescape.com/rs/core/clientoptions.html)
---@class ClientOption
---@field hasLabels boolean Whether the option's values have text labels. Read-only.
---@field isToggle boolean Whether the option is an on/off toggle rather than a range. Read-only.
---@field isModifiable boolean Whether the option can currently be changed (some depend on others). Read-only.
---@field setting integer The current value of the option. Read/write.
---@field min integer The lowest valid value. Read-only.
---@field max integer The highest valid value. Read-only.
---@field minMaxRange integer[] The lowest and highest valid values as a pair `(Int, Int)`. Read-only. -- unverified: docs type is `(Int, Int)`
local ClientOption = {}

--- Applies a setting to the option.
---@param setting integer The value to apply.
---@return boolean success
function ClientOption:Set(setting) end

--- Checks whether a value is valid for this option without changing it.
---@param setting integer The value to test.
---@return boolean
function ClientOption:CheckIsValidSetting(setting) end

--- Returns the display label for a value, or nil if invalid / unlabelled. Labels are always English.
---@param setting integer The value to look up.
---@return string?
function ClientOption:GetLabel(setting) end

--- Engine-level client options, accessed as `game.options.<OptionName>`.
---
--- [Docs](https://developer.runescape.com/rs/core/clientoptions.html)
---@class ClientOptions
---@field AmbientOcclusion ClientOption Graphics.
---@field AnimationQuality ClientOption Graphics.
---@field AnisotropicFiltering ClientOption Graphics.
---@field AntialiasingMode ClientOption Graphics.
---@field AntialiasingQuality ClientOption Graphics.
---@field Bloom ClientOption Graphics.
---@field CanopyCutout ClientOption Graphics.
---@field CustomPlayerModelCount ClientOption Graphics.
---@field DOF ClientOption Graphics.
---@field DrawDistance ClientOption Graphics.
---@field EntityHighlights ClientOption Graphics.
---@field GameRenderScale ClientOption Graphics.
---@field GroundBlending ClientOption Graphics.
---@field GroundDecor ClientOption Graphics.
---@field LightingQuality ClientOption Graphics.
---@field ParticleQuality ClientOption Graphics.
---@field Reflections ClientOption Graphics.
---@field ShadowQuality ClientOption Graphics.
---@field Shadows ClientOption Graphics.
---@field SmoothClipFade ClientOption Graphics.
---@field Texturing ClientOption Graphics.
---@field MaxBackgroundFps ClientOption Graphics.
---@field MaxForegroundFps ClientOption Graphics.
---@field VolumetricLighting ClientOption Graphics.
---@field VSync ClientOption Graphics.
---@field VolumeBackgroundEffects ClientOption Audio.
---@field VolumeLoginMusic ClientOption Audio.
---@field VolumeMainEffects ClientOption Audio.
---@field VolumeMainMusic ClientOption Audio.
---@field VolumeMaster ClientOption Audio.
---@field VolumeSpeech ClientOption Audio.
---@field RemoveRoof ClientOption Gameplay.
---@field CursorScale ClientOption Accessibility.
---@field CutsceneSubtitles ClientOption Accessibility.
---@field Language ClientOption Accessibility.
---@field InterfaceScale ClientOption Accessibility.
---@field Brightness ClientOption Other.
---@field ConsoleKey ClientOption Other.
---@field CustomCursors ClientOption Other.
---@field DeviceCapOverrides ClientOption Other.
---@field Diagnostics ClientOption Other.
---@field RichPresence ClientOption Other.
---@field HapticFeedback ClientOption Other.

-- NOTE: the `game` table is owned by another file. The merger should add
-- `---@field options ClientOptions` to the `game` class (do not reassign `game` here).
