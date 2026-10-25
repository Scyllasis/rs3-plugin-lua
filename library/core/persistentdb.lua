---@meta

---@alias PersistentDBValue boolean|integer|number|string|table

--- Entry types stored in the PersistentDB.
---
--- [Docs](https://developer.runescape.com/rs/core/persistentdb.html)
---@enum PersistentDBType
PersistentDBType = {
    --- True/false entry.
    BOOL = 0,
    --- Integer entry.
    INT = 1,
    --- Floating point entry.
    FLOAT = 2,
    --- Text entry.
    STRING = 3,
    --- Lua table serialized to and from storage.
    STRUCTURED_DATA = 4,
}

--- Per-plugin persistent key/value storage. Shared by all characters on the device (include the
--- character name or tracking ID in the key for per-character data). Beta and live clients do not share entries.
---
--- ```lua
--- local n = PersistentDB:GetInt("count") or 0
--- PersistentDB:SetInt("count", n + 1)
--- ```
---
--- [Docs](https://developer.runescape.com/rs/core/persistentdb.html)
---@class PersistentDBAPI
PersistentDB = {}

--- Returns the stored value (type as saved), or nil if the key does not exist.
---@param key string
---@return PersistentDBValue?
function PersistentDB:Get(key) end

--- Returns the value, or nil if missing or not a Bool.
---@param key string
---@return boolean?
function PersistentDB:GetBool(key) end

--- Returns the value, or nil if missing or not an Int.
---@param key string
---@return integer?
function PersistentDB:GetInt(key) end

--- Returns the value, or nil if missing or not a Float.
---@param key string
---@return number?
function PersistentDB:GetFloat(key) end

--- Returns the value, or nil if missing or not a String.
---@param key string
---@return string?
function PersistentDB:GetString(key) end

--- Returns the table, or nil if missing or not structured data.
---@param key string
---@return table?
function PersistentDB:GetStructuredData(key) end

--- Saves a value under a key (overwrites any existing entry). May not distinguish Int from Float; prefer the typed setters.
---@param key string
---@param value PersistentDBValue
---@return boolean success
function PersistentDB:Set(key, value) end

---@param key string
---@param value boolean
---@return boolean success
function PersistentDB:SetBool(key, value) end

---@param key string
---@param value integer
---@return boolean success
function PersistentDB:SetInt(key, value) end

---@param key string
---@param value number
---@return boolean success
function PersistentDB:SetFloat(key, value) end

---@param key string
---@param value string
---@return boolean success
function PersistentDB:SetString(key, value) end

--- Saves a Lua table; fields of unsupported types are ignored.
---@param key string
---@param value table
---@return boolean success
function PersistentDB:SetStructuredData(key, value) end

--- True if the key exists for the current plugin.
---@param key string
---@return boolean
function PersistentDB:CheckExists(key) end

--- True only if the key exists with the given type.
---@param key string
---@param type PersistentDBType
---@return boolean
function PersistentDB:CheckExistsTyped(key, type) end

--- Calls `callback` once per entry of this plugin. Return true from the callback to stop, false to continue.
---@param callback fun(key: string, value: PersistentDBValue): boolean
---@return integer count Number of entries iterated.
function PersistentDB:IterateEntries(callback) end

--- Removes the entry for the key.
---@param key string
---@return boolean success
function PersistentDB:Delete(key) end

--- Removes all of this plugin's entries. Prompt the user first.
---@return boolean success
function PersistentDB:Clear() end
