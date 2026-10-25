---@meta

--- A struct config: a bag of param values. Proxy usertype; no constructor.
--- Look up via `config.Struct.NAME` or `config.Struct.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/structtype.html)
---@class StructType
---@field id integer Read-only.
---@field configName string e.g. "BOSS_INSTANCE_STALKER_BOSS". Read-only.
---@field typeName string Always "Struct". Read-only.
---@field params ParamType[] Read-only.
---@field paramValues any Used in the docs example but not in the properties table. -- unverified
local StructType = {}

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function StructType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function StructType:HasParam(param) end
