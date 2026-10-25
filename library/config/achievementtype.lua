---@meta

---@enum AchievementProgressType
AchievementProgressType = {
    READY = 0,
    LOCKED = -1,
    COMPLETE = -2,
    GRACE = -3,
    DEPRECATED = -4,
}

---@enum AchievementDescriptionType
AchievementDescriptionType = {
    DEFAULT = 0,
    IRONMAN = 1,
    GROUP_IRONMAN_SIZE_2 = 2,
    GROUP_IRONMAN_SIZE_3 = 3,
    GROUP_IRONMAN_SIZE_4 = 4,
    GROUP_IRONMAN_SIZE_5 = 5,
}

---@enum AchievementHiddenType
AchievementHiddenType = {
    --- Never hidden.
    NEVER = 0,
    --- Hidden while prerequisites are incomplete.
    IF_LOCKED = 1,
    --- Hidden until requirements are complete.
    UNTIL_COMPLETE = 2,
}

--- Skill levels are summed and compared with `totalLevels`.
---@class AchievementTestSkill
---@field group integer Read-only.
---@field description string Read-only.
---@field isComplete boolean Read-only.
---@field skillTypes SkillType[] Read-only.
---@field totalLevels integer Read-only.

---@class AchievementTestQuest
---@field group integer Read-only.
---@field description string Read-only.
---@field isComplete boolean Read-only.
---@field quest QuestType Read-only.

---@class AchievementTestAchievement
---@field group integer Read-only.
---@field description string Read-only.
---@field isComplete boolean Read-only.
---@field achievement AchievementType Read-only.

--- Var values summed, must meet or exceed `totalValue`.
---@class AchievementTestVarTotal
---@field group integer Read-only.
---@field description string Read-only.
---@field isComplete boolean Read-only.
---@field vars VarType[] Read-only.
---@field totalValue integer Read-only.

---@class AchievementTestVarTestBit
---@field group integer Read-only.
---@field description string Read-only.
---@field isComplete boolean Read-only.
---@field var VarType Read-only.
---@field bitIndex integer 0-indexed bit. Read-only.
---@field bitValue integer Usually 1. Read-only.

--- Tests grouped by kind (used by `prereqs` and requirements).
---@class AchievementTestSet
---@field skills AchievementTestSkill[]
---@field quests AchievementTestQuest[]
---@field achievements AchievementTestAchievement[]
---@field varTotals AchievementTestVarTotal[]
---@field varTestBits AchievementTestVarTestBit[]

---@class AchievementDescription
---@field type AchievementDescriptionType
---@field text string

--- An in-game achievement config. Read-only Proxy usertype (safe to copy/store in scripts, not in persistent storage); no constructor.
--- Look up via `config.Achievement.NAME` or `config.Achievement.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/achievementtype.html)
---@class AchievementType
---@field id integer Read-only.
---@field configName string e.g. "CHEEVO_GODWARS_SOULSTONES". Read-only.
---@field typeName string Always "Achievement". Read-only.
---@field name string Read-only.
---@field reward string Multiple rewards delimited by "<br>". Read-only.
---@field isMembers boolean Read-only.
---@field category integer -1 if unset. Read-only.
---@field subCategory integer -1 if unset. Read-only.
---@field spriteID integer -1 if unset. Read-only.
---@field runeScore integer 0 if unset. Read-only.
---@field hiddenType AchievementHiddenType Read-only.
---@field graceExpiryRunedate integer -1 if unset. Read-only.
---@field hasRequirementDescriptions boolean Read-only.
---@field totalPrereqCount integer Read-only.
---@field totalRequirementCount integer Read-only.
---@field dbRowConfig DBRowType? nil if unset. Read-only.
---@field tallyTarget integer -1 if unset. Read-only.
---@field tallyProgress integer -1 if unset. Read-only.
---@field descriptions AchievementDescription[] Read-only.
---@field prereqs AchievementTestSet Controls presentation. Read-only.
---@field achievements AchievementTestSet Requirements (control completion); the docs list this row as `achievements`. Read-only. -- unverified: name may be `requirements`
---@field progress integer See AchievementProgressType; positive = partial progress, max 10000. Read-only.
---@field prereqsComplete boolean Read-only.
---@field prereqGroupCount integer Read-only.
---@field completionCountForPrereqGroups integer Read-only.
---@field requirementGroupCount integer Read-only.
---@field completionCountForRequirementGroups integer Read-only.
local AchievementType = {}

--- Whether a prerequisite group is complete.
---@param group integer 0-indexed group.
---@return boolean
function AchievementType:GetPrereqGroupComplete(group) end

--- Number of prerequisites in the group that must be completed.
---@param group integer 0-indexed group.
---@return integer -- unverified: signature says Boolean, returns table says Integer
function AchievementType:GetSubItemCompletionCountForPrereqGroup(group) end

--- Number of requirements in the group that must be completed.
---@param group integer 0-indexed group.
---@return integer -- unverified: signature says Boolean, returns table says Integer
function AchievementType:GetSubItemCompletionCountForRequirementGroup(group) end
