---@meta

--- A database row; columns hold zero or more values. Missing values fall back to the parent DBTable defaults.
--- Proxy usertype; no constructor. Look up via `config.DBRow.NAME` or `config.DBRow.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/dbrowtype.html)
---@class DBRowType
---@field id integer Read-only.
---@field configName string e.g. "INVENT_PERK_LOOTING". Read-only.
---@field typeName string Always "DBRow". Read-only.
---@field columnCount integer Number of columns. Read-only.
---@field ownerDBTable DBTableType Parent table config. Read-only.
local DBRowType = {}

--- Number of values in the column.
---@param columnIndex integer 1-indexed column.
---@return integer
function DBRowType:GetColumnValueCount(columnIndex) end

--- ValueType of each value in the column.
---@param columnIndex integer 1-indexed column.
---@return ValueType[]
function DBRowType:GetColumnValueTypes(columnIndex) end

--- The column's values; may be empty or contain nil. Use `GetColumnValueTypes` for their types.
---@param columnIndex integer 1-indexed column.
---@return any[]
function DBRowType:GetColumnValues(columnIndex) end
