---@meta

--- Data type of a var/param/enum/db column value.
---@enum ValueType
ValueType = {
    UNSUPPORTED = -1,
    ACHIEVEMENT = 131,
    AREA = 16,
    BASEANIMSET = 44,
    BOOLEAN = 1,
    CATEGORY = 41,
    CHAR = 42,
    CHATCAT = 29,
    CHATPHRASE = 24,
    COMPONENT = 9,
    COORDGRID = 22,
    CURSOR = 5,
    CUTSCENE2D = 138,
    DBTABLE = 129,
    DBROW = 74,
    ENUM = 26,
    FONT = 25,
    HITMARK = 62,
    IDKIT = 10,
    INTEGER = 0,
    INV = 39,
    LOC = 30,
    LONG = 110,
    MAPELEMENT = 59,
    MATERIAL = 102,
    MODEL = 31,
    NPC = 32,
    NPC_UID = 38,
    OBJ = 33,
    OVERLAYINTERFACE = 99,
    PLAYER_UID = 34,
    QUEST = 3,
    SEQ = 6,
    SPOTANIM = 37,
    SKILL = 17,
    SPRITE = 23,
    STRING = 36,
    STRUCT = 73,
    SYNTH = 14,
    VAR_INT = 209,
    VORBIS = 57,
}

--- A variable (VarPlayer, VarClient, ...) or VarBit. Proxy usertype; no constructor.
--- Look up via `var.VarPlayer.NAME` or `var.VarPlayer.FromID(id)`. VarBit IDs are negative; VarBit values are unsigned.
--- ```lua
--- local sortMode = var.VarPlayer.FRIEND_SORT_MODE.value
--- ```
---
--- [Docs](https://developer.runescape.com/rs/game/config/vartype.html)
---@class VarType
---@field id integer Read-only.
---@field configName string e.g. "FRIEND_SORT_MODE". Read-only.
---@field typeName string Domain: "VarClient", "VarPlayer", "VarPlayerGroup", "VarClan", "VarClanSettings", "VarNPC" or "VarObj". Read-only.
---@field value any Current value; type given by `valueType`. Read-only.
---@field valueType ValueType Read-only.
---@field isVarBit boolean Read-only.
---@field baseVar VarType? Base var if this is a VarBit, else nil. Read-only.
---@field varBitMask integer? Bits used if this is a VarBit, else nil. Read-only.
