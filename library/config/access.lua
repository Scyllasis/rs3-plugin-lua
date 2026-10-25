---@meta

-- Access tables for config types: `config.*`, `id.*`, `var.*`.
-- Sources: https://developer.runescape.com/rs/tutorial/3info.html and each config page.

--- Event payload type for an inventory's config (see core/events). Same as `InvType`.
---@alias InvTypeProxy InvType

-- Type names the docs use interchangeably with the page type names.
---@alias Achievement AchievementType
---@alias Cursor CursorType
---@alias DBRow DBRowType
---@alias DBTable DBTableType
---@alias Font FontType
---@alias Obj ObjType
---@alias VarPlayer VarType
---@alias BasAnimSetType BaseAnimSetType

-- Per-type lookup tables: index by config name (`config.NPC.RAT`, `config.NPC["RAT"]`) or by ID with `FromID`.

---@class AchievementConfigTable
---@field [string] AchievementType
---@field FromID fun(id: integer): AchievementType

---@class BaseAnimSetConfigTable
---@field [string] BaseAnimSetType
---@field FromID fun(id: integer): BaseAnimSetType

---@class CursorConfigTable
---@field [string] CursorType
---@field FromID fun(id: integer): CursorType

---@class DBRowConfigTable
---@field [string] DBRowType
---@field FromID fun(id: integer): DBRowType

---@class DBTableConfigTable
---@field [string] DBTableType
---@field FromID fun(id: integer): DBTableType

---@class EnumConfigTable
---@field [string] EnumType
---@field FromID fun(id: integer): EnumType

---@class FontConfigTable
---@field [string] FontType
---@field FromID fun(id: integer): FontType

---@class HeadbarConfigTable
---@field [string] HeadbarType
---@field FromID fun(id: integer): HeadbarType

---@class HitmarkConfigTable
---@field [string] HitmarkType
---@field FromID fun(id: integer): HitmarkType

---@class InvConfigTable
---@field [string] InvType
---@field FromID fun(id: integer): InvType

---@class LocConfigTable
---@field [string] LocType
---@field FromID fun(id: integer): LocType

---@class MapElementConfigTable
---@field [string] MapElementType
---@field FromID fun(id: integer): MapElementType

---@class NPCConfigTable
---@field [string] NPCType
---@field FromID fun(id: integer): NPCType

---@class ObjConfigTable
---@field [string] ObjType
---@field FromID fun(id: integer): ObjType

---@class ParamConfigTable
---@field [string] ParamType
---@field FromID fun(id: integer): ParamType

---@class QuestConfigTable
---@field [string] QuestType
---@field FromID fun(id: integer): QuestType

---@class SeqConfigTable
---@field [string] SeqType
---@field FromID fun(id: integer): SeqType

---@class SpotAnimConfigTable
---@field [string] SpotAnimType
---@field FromID fun(id: integer): SpotAnimType

---@class StructConfigTable
---@field [string] StructType
---@field FromID fun(id: integer): StructType

--- Static game content (configs), looked up by name or ID.
--- Use the `pan <Type>` console command to copy a type's config names to the clipboard.
--- ```lua
--- local dog = config.NPC.DOG_STRAY
--- local cfg = config.Obj.FromID(456)
--- ```
---
--- [Docs](https://developer.runescape.com/rs/tutorial/3info.html)
---@class ConfigAPI
---@field Achievement AchievementConfigTable AchievementType configs.
---@field BaseAnimSet BaseAnimSetConfigTable BaseAnimSetType configs.
---@field Cursor CursorConfigTable CursorType configs.
---@field DBRow DBRowConfigTable DBRowType configs.
---@field DBTable DBTableConfigTable DBTableType configs.
---@field Enum EnumConfigTable EnumType configs.
---@field Font FontConfigTable FontType configs.
---@field Headbar HeadbarConfigTable HeadbarType configs.
---@field Hitmark HitmarkConfigTable HitmarkType configs.
---@field Inv InvConfigTable InvType configs.
---@field Loc LocConfigTable LocType configs.
---@field MapElement MapElementConfigTable MapElementType configs.
---@field NPC NPCConfigTable NPCType configs.
---@field Obj ObjConfigTable ObjType configs.
---@field Param ParamConfigTable ParamType configs.
---@field Quest QuestConfigTable QuestType configs.
---@field Seq SeqConfigTable SeqType configs.
---@field SpotAnim SpotAnimConfigTable SpotAnimType configs.
---@field Struct StructConfigTable StructType configs.
config = {}

--- A namespace of generated ID constants, e.g. `id.NPC.HANS`, `id.VarPlayer.FRIEND_SORT_MODE`.
--- `FromID` maps an ID back to its name (shown in the docs as `id.Sprite.FromID(spriteID)`).
---@class IdNamespace
---@field [string] integer
---@field FromID fun(id: integer): string -- unverified: return type inferred from example ("discover the sprite name")

--- Generated ID constants for every config type, by config name.
--- ```lua
--- local cfg = config.Seq.FromID(id.Seq.ARDRAGON_DRAGON_BASIC_ICE_ATTACK)
--- local spriteName = id.Sprite.FromID(cursorCfg.spriteID)
--- ```
---
--- [Docs](https://developer.runescape.com/rs/game/config/vartype.html)
---@class IdAPI
---@field Achievement IdNamespace
---@field BaseAnimSet IdNamespace -- unverified: not shown in docs examples
---@field Cursor IdNamespace
---@field DBRow IdNamespace -- unverified: not shown in docs examples
---@field DBTable IdNamespace -- unverified: not shown in docs examples
---@field Enum IdNamespace
---@field Font IdNamespace -- unverified: not shown in docs examples
---@field Headbar IdNamespace
---@field Hitmark IdNamespace -- unverified: not shown in docs examples
---@field Inv IdNamespace
---@field Loc IdNamespace -- unverified: not shown in docs examples
---@field MapElement IdNamespace
---@field Material IdNamespace
---@field Model IdNamespace
---@field NPC IdNamespace
---@field Obj IdNamespace -- unverified: not shown in docs examples
---@field Param IdNamespace
---@field Quest IdNamespace -- unverified: not shown in docs examples
---@field Seq IdNamespace
---@field SpotAnim IdNamespace
---@field Sprite IdNamespace
---@field Struct IdNamespace -- unverified: not shown in docs examples
---@field VarClient IdNamespace -- unverified: not shown in docs examples
---@field VarPlayer IdNamespace
---@field [string] IdNamespace
id = {}

--- One variable domain: index by variable name, or look up by ID.
--- VarBit IDs are negative.
---@class VarDomainTable
---@field [string] VarType
---@field FromID fun(id: integer): VarType

--- Player and client variables (VarTypes), grouped by domain.
--- VarClients hold client-side data (e.g. combat stats, UI layout); VarPlayers hold server-side data (e.g. quest completion).
--- Use `pan VarPlayer` / `pan VarClient` to browse names.
--- ```lua
--- local mode = var.VarPlayer.FRIEND_SORT_MODE.value
--- local t = var.VarClient.TOOLTIP_TIME.value
--- ```
---
--- [Docs](https://developer.runescape.com/rs/game/config/vartype.html)
---@class VarAPI
---@field VarClient VarDomainTable Client-side variables.
---@field VarPlayer VarDomainTable Server-side player variables.
---@field VarPlayerGroup VarDomainTable Currently unavailable.
---@field VarClan VarDomainTable Currently unavailable.
---@field VarClanSettings VarDomainTable Currently unavailable.
---@field VarNPC VarDomainTable Documented as TODO.
---@field VarObj VarDomainTable Documented as TODO.
var = {}
