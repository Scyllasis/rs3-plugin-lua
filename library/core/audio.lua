---@meta

--- Audio playback for plugins (built-in sounds or Ogg Vorbis plugin resources).
---
--- [Docs](https://developer.runescape.com/rs/audio/index.html)
---@class audio
audio = {}

--- Sound categories.
---
--- [Docs](https://developer.runescape.com/rs/audio/index.html)
---@enum audio.SoundType
audio.SoundType = {
    INVALID = 255,
    ENTITY = 0,
    LOCATION = 1,
    LOCATION_RANDOM = 2,
    GENERAL_ANIMATION = 3,
    LOCATION_ANIMATION = 4,
    ENTITY_ANIMATION = 5,
    SPOT_ANIMATION = 6,
    SCRIPT = 7,
    SERVER_TRIGGERED = 8,
    --- Cannot be manually stopped.
    MUSIC = 9,
    --- Cannot be manually stopped.
    JINGLE = 10,
    ENTITY_MOVEMENT = 11,
    INTERFACE_ANIMATION = 12,
}

--- Audio buses (mixer channels).
---
--- [Docs](https://developer.runescape.com/rs/audio/index.html)
---@enum audio.AudioBus
audio.AudioBus = {
    MASTER = 0,
    SFX = 1,
    MUSIC = 2,
    MUSIC_LOGIC = 3,
    AMBIENT = 4,
    VOICEOVER = 5,
    SFX_SUB = 6,
    MUSIC_SUB = 7,
    DIALOG_SUB = 8,
    PLAYER_ANIMATION_SUB = 9,
    NPC_ANIMATION_SUB = 10,
    LOCATION_ANIMATION_SUB = 11,
    GENERAL_ANIMATION_SUB = 12,
    LOCATIONS_SUB = 13,
    LOCATION_RANDOM_SUB = 14,
    LOCATION_GENERIC_SUB = 15,
}

--- Spatial emitter shapes.
---
--- [Docs](https://developer.runescape.com/rs/audio/index.html)
---@enum audio.EmitterShape
audio.EmitterShape = {
    --- Spherical volume, with panning.
    SPHERE = 0,
    --- Box volume, with panning.
    BOX = 1,
    --- Spherical volume, no panning.
    SPHERE_NO_PANNING = 2,
    --- Box volume, no panning.
    BOX_NO_PANNING = 3,
    --- Non-spatial.
    NONE = 4,
}

--- A playing (or dormant) sound instance returned by `audio.Play`.
---
--- [Docs](https://developer.runescape.com/rs/audio/index.html)
---@class audio.SoundInstance
---@field isPlaying boolean True if currently playing.
---@field isPaused boolean True if currently paused. -- unverified: type cell malformed in docs
---@field id integer Unique ID for this instance. -- unverified: type not stated
audio.SoundInstance = {}

--- Starts playback, or schedules it after `ticksDelay` logic ticks. Does nothing if expired.
---@param ticksDelay? integer
function audio.SoundInstance:Start(ticksDelay) end

--- Stops playback immediately. Does nothing if expired.
function audio.SoundInstance:Stop() end

--- Pauses playback immediately. Does nothing if already paused or expired.
function audio.SoundInstance:Pause() end

--- Resumes playback immediately. Does nothing if not paused or expired.
function audio.SoundInstance:Resume() end

--- Playback parameters for `audio.Play`. Spatial fields only apply when `emitterShape` is spatial.
---
--- [Docs](https://developer.runescape.com/rs/audio/index.html)
---@class audio.SoundPlaybackParams
---@field type? audio.SoundType Sound category. Default SCRIPT.
---@field numLoops? integer Loop count; 0 = one-shot. Default 0.
---@field volume? number Volume relative to the audio bus. Default 1.0.
---@field audioBus? audio.AudioBus Default SFX.
---@field emitterShape? audio.EmitterShape Spatial audio shape. Default NONE.
---@field minDistance? number Spatial only. Default 0.
---@field maxDistance? number Spatial only. Default 0.
---@field origin? Vector3 Spatial only. Default 0,0,0.
---@field level? integer Spatial only; height level. Default -1.
---@field samplingRate? integer Affects pitch and speed. Default 0 (uses 256).
---@field delayTick? integer Logic ticks before playback. Default 0.

--- Plays a sound. Returns nil if loading failed or the live instance limit was reached.
---@param resource PluginAudioResource|integer A plugin audio resource, or a built-in resource ID.
---@param params? audio.SoundPlaybackParams
---@return audio.SoundInstance?
---@overload fun(builtinResourceID: integer, params?: audio.SoundPlaybackParams): audio.SoundInstance?
function audio.Play(resource, params) end

--- Stops the live instance with this ID. Prefer `SoundInstance:Stop` unless sharing instances between plugins.
---@param soundInstanceID integer
function audio.Stop(soundInstanceID) end

--- Stops all instances using the given resource.
---@param resource PluginAudioResource|integer A plugin audio resource, or a built-in resource ID.
function audio.StopSoundsUsingResource(resource) end
