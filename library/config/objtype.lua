---@meta

---@enum ObjStackType
ObjStackType = {
    SOMETIMES = 0,
    ALWAYS = 1,
    NEVER = 2,
}

--- An item (Obj) config. Proxy usertype; no constructor.
--- Look up via `config.Obj.NAME` or `config.Obj.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/objtype.html)
---@class ObjType
---@field id integer Read-only.
---@field configName string Read-only.
---@field typeName string Always "Obj". Read-only. -- unverified: value not quoted
---@field name string Read-only.
---@field isMembers boolean Read-only.
---@field category integer Read-only.
---@field teamID integer Read-only.
---@field cost integer Read-only.
---@field stackType ObjStackType Read-only.
---@field isStockmarket boolean Read-only.
---@field stockmarketBuyLimit integer Read-only.
---@field isTradeable boolean Read-only.
---@field quests QuestType[] Read-only.
---@field groundOpNames string[] Read-only.
---@field interfaceOpNames string[] Read-only.
---@field stackCountAltObjs { [1]: integer, [2]: ObjType }[] Pairs of `{ count, obj }`. Read-only.
---@field params ParamType[] Read-only.
local ObjType = {}

--- Cursor for a ground op.
---@param opIndex integer
---@return CursorType?
function ObjType:GetGroundOpCursor(opIndex) end

--- Cursor for an interface op.
---@param opIndex integer
---@return CursorType?
function ObjType:GetInterfaceOpCursor(opIndex) end

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function ObjType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function ObjType:HasParam(param) end
