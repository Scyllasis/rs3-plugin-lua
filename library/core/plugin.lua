---@meta
---@diagnostic disable: duplicate-set-field -- plugins may replace API functions, as rs3preview.lua does

--- Permissions a plugin may request in plugin.json (`requiredPermissions` / `optionalPermissions`).
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginPermissionsEnum
---@field httpAccess PluginPermissions Enables HTTP functionality (base URLs from the manifest).
---@field chatAccess PluginPermissions Enables Chat functionality.
---@field trackingAccess PluginPermissions Enables Tracking ID functionality.
PluginPermissions = {}
-- unverified: enum member values not documented
---@alias PluginPermissions any

--- Results of loading a plugin resource.
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginResourceLoadResultEnum
---@field success PluginResourceLoadResult Resource loaded successfully.
---@field errorFilesystem PluginResourceLoadResult Could not read the resource from disk.
---@field errorDecode PluginResourceLoadResult Could not decode the resource (possibly unsupported format).
---@field errorExceedsLimits PluginResourceLoadResult Resource exceeds size limits.
---@field errorConstruction PluginResourceLoadResult Loading succeeded but construction failed (e.g. during shutdown).
PluginResourceLoadResult = {}
-- unverified: enum member values not documented
---@alias PluginResourceLoadResult any

--- A base URL declared in plugin.json `urls`, used with `HTTPRequest.new`.
---
--- [Docs](https://developer.runescape.com/rs/core/http.html)
---@class PluginURL
-- unverified: opaque type, not documented beyond its use in HTTPRequest.new

--- A custom file from the plugin's `resources` folder. Stays loaded until its plugin unloads and all references are freed, or it is unloaded manually.
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginResource
---@field path string Disk path to the resource. Read-only.
---@field loaded boolean Whether the data is loaded and ready to use. Read-only.
---@field inUse boolean Whether the resource is currently referenced anywhere. Read-only.
local PluginResource = {}

--- Attempts to load the resource so it is ready to use.
---@return PluginResourceLoadResult
function PluginResource:Load() end

--- Attempts to unload the resource's data. Memory is freed only once all references are released.
function PluginResource:Unload() end

--- A PNG image resource (max 1024x1024), usable by sprites.
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginImageResource : PluginResource

--- An Ogg Vorbis audio resource, usable with `audio.Play`.
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginAudioResource : PluginResource

--- A file or folder under `resources`. The game gives a PNG or OGG its own type; these definitions can't tell
--- which is which from the name, so one entry works anywhere an image, a sound or a folder is expected.
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginResourceEntry : PluginImageResource, PluginAudioResource
---@field [string] PluginResourceEntry A file or subfolder inside this folder.

--- Properties and resources of the current plugin.
---
--- [Docs](https://developer.runescape.com/rs/core/plugin.html)
---@class PluginAPI
---@field urls table<string, PluginURL> URLs from plugin.json `urls`, e.g. `Plugin.urls.wiki`.
---@field resources table<string, PluginResourceEntry> Files in the `resources` folder keyed by filename (no extension); subfolders become sub-tables, e.g. `Plugin.resources.images.menu.background`.
Plugin = {}

--- Whether the user granted the permission to this plugin. Use for optional permissions.
---@param permission PluginPermissions The permission to check.
---@return boolean
function Plugin.HasPermission(permission) end
