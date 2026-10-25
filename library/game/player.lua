---@meta

--- The local player character: availability, skills, energy, weight, combat level.
---
--- [Docs](https://developer.runescape.com/rs/game/player.html)
---@class PlayerAPI
Player = {}

--- Returns whether a player character is logged in and present in a game world.
---@return boolean
function Player.IsAvailable() end

--- Returns a unique 64-bit tracking value. Requires the `trackingAccess` permission.
--- Sent on login, so may be unavailable for several seconds; nil if unavailable or permission missing.
---@return integer?
function Player.GetTrackingID() end

--- Returns the current skill level including bonuses and penalties.
---@param skill SkillType The skill to query.
---@return integer
function Player.GetLevelGameplay(skill) end

--- Returns the skill level based on XP, limited by Free/Members world caps.
---@param skill SkillType The skill to query.
---@return integer
function Player.GetLevelCapped(skill) end

--- Returns the skill level based on XP, without world caps.
---@param skill SkillType The skill to query.
---@return integer
function Player.GetLevelUncapped(skill) end

--- Returns current XP, limited by Free/Members world caps.
---@param skill SkillType The skill to query.
---@return integer
function Player.GetXPCapped(skill) end

--- Returns current XP, without world caps.
---@param skill SkillType The skill to query.
---@return integer
function Player.GetXPUncapped(skill) end

--- Returns run energy as a percentage.
---@return integer
function Player.GetRunEnergy() end

--- Returns the character's weight in kilograms.
---@return integer
function Player.GetWeight() end

--- Returns the current combat level.
---@return integer
function Player.GetCombatLevel() end

--- Returns the PlayerEntity for the logged-in character. Equivalent to `PlayerList.Self()`.
---@return PlayerEntity
function Player.GetEntity() end

--- Skill identifiers.
---
--- [Docs](https://developer.runescape.com/rs/game/player.html)
---@enum SkillType
SkillType = {
    ATTACK = 0,
    DEFENCE = 1,
    STRENGTH = 2,
    HITPOINTS = 3,
    RANGED = 4,
    PRAYER = 5,
    MAGIC = 6,
    COOKING = 7,
    WOODCUTTING = 8,
    FLETCHING = 9,
    FISHING = 10,
    FIREMAKING = 11,
    CRAFTING = 12,
    SMITHING = 13,
    MINING = 14,
    HERBLORE = 15,
    AGILITY = 16,
    THIEVING = 17,
    SLAYER = 18,
    FARMING = 19,
    RUNECRAFTING = 20,
    HUNTER = 21,
    CONSTRUCTION = 22,
    SUMMONING = 23,
    DUNGEONEERING = 24,
    DIVINATION = 25,
    INVENTION = 26,
    ARCHAEOLOGY = 27,
    NECROMANCY = 28,
    --- Returns the name of a SkillType value (used in the events docs examples). -- unverified: return type inferred.
    ---@type fun(id: SkillType): string
    FromID = nil,
}
