---@meta

--- A key/value mapping config (input value -> output value). Proxy usertype; no constructor.
--- Look up via `config.Enum.NAME` or `config.Enum.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/enumtype.html)
---@class EnumType
---@field id integer Read-only.
---@field configName string e.g. "ORDINAL_ENGLISH". Read-only.
---@field typeName string Always "Enum". Read-only.
---@field valueCount integer Read-only.
---@field values any[][] List of `{ input, output }` pairs. Read-only.
---@field inputValueType ValueType Read-only.
---@field outputValueType ValueType Read-only.
local EnumType = {}

--- Output value for an input value.
---@param inputValue any
---@return any
function EnumType:GetOutputValue(inputValue) end

--- Whether any input maps to this output value.
---@param outputValue any
---@return boolean
function EnumType:HasOutputValue(outputValue) end

--- All input values that map to this output value.
---@param outputValue any
---@return any[]
function EnumType:GetInputValues(outputValue) end
