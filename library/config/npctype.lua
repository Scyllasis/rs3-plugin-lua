---@meta

--- An NPC config (static data such as name and size). Proxy usertype; no constructor.
--- Look up via `config.NPC.NAME` or `config.NPC.FromID(id)`.
--- ```lua
--- local dog = config.NPC.DOG_STRAY
--- print(dog.name, dog.gridSize)
--- ```
---
--- [Docs](https://developer.runescape.com/rs/game/config/npctype.html)
---@class NPCType
---@field id integer Read-only.
---@field configName string e.g. "RAT". Read-only.
---@field typeName string Always "NPC". Read-only. -- unverified: value not quoted
---@field name string Read-only.
---@field attackOpPriority boolean Read-only.
---@field visibleCombatLevel integer Read-only.
---@field castsShadows boolean Read-only.
---@field overlayHeight integer Read-only.
---@field walkSmoothing boolean Read-only.
---@field isExamineOnly boolean Read-only.
---@field attackOpIndex integer Read-only.
---@field examineOpIndex integer Read-only.
---@field firstUniqueOpIndex integer Read-only.
---@field opNames string[] Read-only.
---@field bas BaseAnimSetType? nil if unset. Read-only.
---@field fastPicking boolean Read-only.
---@field roughBounding integer Read-only.
---@field resize Vector3 Read-only.
---@field gridSize integer Read-only.
---@field turnSpeed integer Read-only.
---@field wanderRange integer Read-only.
---@field maxRange integer Read-only.
---@field isActive boolean Read-only.
---@field isFamiliar boolean Read-only.
---@field isAlwaysOnTop boolean Read-only.
---@field isAlwaysOnBottom boolean Read-only.
---@field priorityOffset integer Read-only.
---@field isOnMiniMap boolean Read-only.
---@field mapElement MapElementType? nil if unset. Read-only.
---@field quests QuestType[] Read-only.
---@field isMultiNPC boolean Read-only.
---@field multiVar VarType Read-only.
---@field hasCustomBounding boolean Read-only.
---@field customBounding AABB? nil if unset. Read-only.
---@field hasBackgroundSound boolean Read-only.
---@field backgroundSoundReady integer Read-only.
---@field backgroundSoundCrawl integer Read-only.
---@field backgroundSoundWalk integer Read-only.
---@field backgroundSoundRun integer Read-only.
---@field backgroundSoundRange integer Read-only.
---@field backgroundSoundDropoffRange integer Read-only.
---@field backgroundSoundVolume integer Read-only.
---@field params ParamType[] Read-only.
local NPCType = {}

--- Cursor shown for an op.
---@param opIndex integer
---@return CursorType?
function NPCType:GetOpCursor(opIndex) end

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function NPCType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function NPCType:HasParam(param) end
