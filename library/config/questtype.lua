---@meta

-- NOTE: The docs name both the config usertype and the quest-category enum `QuestType`.
-- The class keeps the name `QuestType`; the enum table is declared as `QuestTypeEnum`
-- (members typed `QuestKind`) so they do not collide. -- unverified: global name of the enum table

---@alias QuestKind integer

--- Quest category enum (docs: `QuestType` enumeration).
---@class QuestTypeEnum
---@field NORMAL QuestKind 0
---@field SEASONAL QuestKind 1
---@field TUTORIAL QuestKind 2

---@enum QuestDifficulty
QuestDifficulty = {
    NOVICE = 0,
    INTERMEDIATE = 1,
    EXPERIENCED = 2,
    MASTER = 3,
    GRANDMASTER = 4,
    MULTIDIFFICULTY = 5,
}

---@class MasterQuestVarPlayer
---@field varPlayer VarType Read-only.
---@field startState integer Read-only.
---@field endState integer Read-only.

---@class QuestPreReqSkill
---@field skillType SkillType Read-only.
---@field minimumLevel integer Read-only.

--- A quest config. Proxy usertype; no constructor.
--- Look up via `config.Quest.NAME` or `config.Quest.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/questtype.html)
---@class QuestType
---@field id integer Read-only.
---@field configName string e.g. "COOK_QUEST". Read-only.
---@field typeName string Always "Quest". Read-only. -- unverified: value not quoted
---@field deprecated boolean Read-only.
---@field name string Read-only.
---@field sortName string Read-only.
---@field isMembers boolean Read-only.
---@field questPoints integer Read-only.
---@field type QuestKind Quest category (QuestType enum: NORMAL/SEASONAL/TUTORIAL). Read-only.
---@field difficulty QuestDifficulty Read-only.
---@field iconID integer Read-only.
---@field startCoordGrids CoordGrid[] Read-only.
---@field viaCoordGrid CoordGrid Read-only.
---@field preReqQuestPoints integer Read-only.
---@field preReqQuests QuestType[] Read-only.
---@field preReqSkills QuestPreReqSkill[] Read-only.
---@field completedPreReqQuestPoints boolean Read-only.
---@field completedPreReqQuests boolean[] Read-only.
---@field completedPreReqSkills boolean[] Read-only.
---@field canStartQuest boolean Read-only.
---@field hasStartedQuest boolean Read-only.
---@field hasFinishedQuest boolean Read-only.
---@field masterQuestVars MasterQuestVarPlayer[] Read-only.
---@field params ParamType[] Read-only.
local QuestType = {}

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function QuestType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function QuestType:HasParam(param) end
