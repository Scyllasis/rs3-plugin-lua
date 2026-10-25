---@meta

--- A database table definition: column types and default values for its DBRows. Proxy usertype; no constructor.
--- Look up via `config.DBTable.NAME` or `config.DBTable.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/dbtabletype.html)
---@class DBTableType
---@field id integer Read-only.
---@field configName string e.g. "INVENT_PERK_TABLE". Read-only.
---@field typeName string Always "DBTable". Read-only.
---@field columnCount integer Number of columns. Read-only.
local DBTableType = {}

---@param columnIndex integer 1-indexed column.
---@return integer
function DBTableType:GetColumnValueCount(columnIndex) end

---@param columnIndex integer 1-indexed column.
---@return ValueType[]
function DBTableType:GetColumnValueTypes(columnIndex) end

---@param columnIndex integer 1-indexed column.
---@return boolean
function DBTableType:GetColumnHasDefaultValues(columnIndex) end

---@param columnIndex integer 1-indexed column.
---@return any[]
function DBTableType:GetColumnDefaultValues(columnIndex) end
