---@meta

---@enum PreAnimMove
PreAnimMove = {
    DELAY_MOVE = 0,
    DELAY_ANIMATION = 1,
    MOVE_MERGE = 2,
    ABORT_ANIMATION = 3,
    DEFAULT = 4,
}

---@enum PostAnimMove
PostAnimMove = {
    DELAY_MOVE = 0,
    ABORT_ANIMATION = 1,
    MOVE_MERGE = 2,
    DEFAULT = 3,
}

---@enum AnimationDuplicateBehaviour
AnimationDuplicateBehaviour = {
    CONTINUE = 0,
    RESET = 1,
    LOOP_RESET = 2,
}

--- An animation sequence config. Proxy usertype; no constructor.
--- Look up via `config.Seq.NAME` or `config.Seq.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/seqtype.html)
---@class SeqType
---@field id integer Read-only.
---@field configName string e.g. "ARDRAGON_DRAGON_BASIC_ICE_ATTACK". Read-only.
---@field typeName string Always "Seq". Read-only.
---@field preAnimMove PreAnimMove Read-only.
---@field postAnimMove PostAnimMove Read-only.
---@field length integer Read-only.
---@field loop integer Read-only.
---@field priority integer Read-only.
---@field replaceHeldLeft ObjType Read-only.
---@field replaceHeldRight ObjType Read-only.
---@field maxLoop integer Read-only.
---@field animDuplicateBehaviour AnimationDuplicateBehaviour Read-only.
local SeqType = {}

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function SeqType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function SeqType:HasParam(param) end
