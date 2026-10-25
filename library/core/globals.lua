---@meta

-- Bare global functions from Core (core/index.html), String Utils (core/string.html)
-- and the tutorials. `print` is the standard Lua builtin (the client prints to the
-- Lua console, tables in table notation) and is not redeclared here.

--- Outputs a message to the Lua console, prefixed with the plugin's name (e.g. `MyPlugin: hello world`).
---
--- [Docs](https://developer.runescape.com/rs/core/index.html)
---@param format any Format/first value. -- unverified: listed in the signature as `format : String` but not documented in the parameter table.
---@param ... any Values to log.
function log(format, ...) end

--- Runs the given string as an in-game console command (`help` lists available commands).
--- Not available on mobile platforms.
---
--- ```lua
--- ExecuteConsoleCommand("!tele 0,6,10,30,34")
--- ```
---
--- [Docs](https://developer.runescape.com/rs/core/index.html)
---@param command string The command and any required arguments.
function ExecuteConsoleCommand(command) end

--- Creates a string from a fmtlib-style format string. `{}` inserts the next argument,
--- `{0}` selects by zero-based index, `{<options>}` adds type-specific options.
--- Only elementary types (numbers, strings, booleans, nil) are supported; other types format as their type name.
---
--- ```lua
--- formatStr("{1} is {0}? {2}", "Loud", "George", true) -- George is Loud? True
--- ```
---
--- [Docs](https://developer.runescape.com/rs/core/string.html)
---@param format string The desired output format.
---@param ... any Values to format.
---@return string
function formatStr(format, ...) end

--- Optional global function defined by the plugin; the client calls it when the plugin shuts down
--- (e.g. to save state with `PersistentDB`). Must be global, not `local`.
---
--- [Docs](https://developer.runescape.com/rs/tutorial/5database.html)
function PluginShutdown() end -- unverified: only shown in tutorial 5, no API reference entry.
