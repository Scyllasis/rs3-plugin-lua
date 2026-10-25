---@meta

---@enum LocShapeType
LocShapeType = {
    WALL_STRAIGHT = 0,
    WALL_DIAGONALCORNER = 1,
    WALL_L = 2,
    WALL_SQUARECORNER = 3,
    WALLDECOR_STRAIGHT_NOOFFSET = 4,
    WALLDECOR_STRAIGHT_OFFSET = 5,
    WALLDECOR_DIAGONAL_OFFSET = 6,
    WALLDECOR_DIAGONAL_NOOFFSET = 7,
    WALLDECOR_DIAGONAL_BOTH = 8,
    WALL_DIAGONAL = 9,
    CENTREPIECE_STRAIGHT = 10,
    CENTREPIECE_DIAGONAL = 11,
    ROOF_STRAIGHT = 12,
    ROOF_DIAGONAL_WITH_ROOFEDGE = 13,
    ROOF_DIAGONAL = 14,
    ROOF_L_CONCAVE = 15,
    ROOF_L_CONVEX = 16,
    ROOF_FLAT = 17,
    ROOFEDGE_STRAIGHT = 18,
    ROOFEDGE_DIAGONALCORNER = 19,
    ROOFEDGE_L = 20,
    ROOFEDGE_SQUARECORNER = 21,
    GROUNDDECOR = 22,
    WALL_L_ALT = 23,
    WALLDECOR_DIAGONAL_BOTH_ALT = 24,
}

--- A Loc (scenery object) config. Proxy usertype; no constructor.
--- Look up via `config.Loc.NAME` or `config.Loc.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/loctype.html)
---@class LocType
---@field id integer Read-only.
---@field configName string e.g. "TRAWLER_GANGPLANK". Read-only.
---@field typeName string Always "Loc". Read-only.
---@field name string Read-only.
---@field fastPicking boolean Read-only.
---@field width integer Read-only.
---@field length integer Read-only.
---@field modelOffset Vector3 Read-only.
---@field modelScale Vector3 Read-only.
---@field modelPostOffset Vector3 Read-only.
---@field groundDecorOffset integer Read-only.
---@field hasCustomBounding boolean Read-only.
---@field customBounding AABB? nil if unset. Read-only.
---@field IsActive boolean Read-only. (Capitalised as in the docs.)
---@field isExamineOnly boolean Read-only.
---@field opNames string[] Read-only.
---@field blockWalk boolean Read-only.
---@field quests QuestType[] Read-only.
---@field mapElement MapElementType? nil if unset. Read-only.
---@field useRandomAnimationFrame boolean Read-only.
---@field animations SeqType[] Read-only.
---@field defaultAnimation SeqType? nil if unset. Read-only.
---@field isMultiLoc boolean Read-only.
---@field multiVar VarType Read-only.
---@field locShapeTypes LocShapeType[] Read-only.
---@field params ParamType[] Read-only.
local LocType = {}

--- Cursor shown for an op.
---@param opIndex integer 1 to 6.
---@return CursorType?
function LocType:GetOpCursor(opIndex) end

--- Model IDs for a shape type.
---@param locShapeType LocShapeType
---@return integer[]
function LocType:GetModelIDs(locShapeType) end

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function LocType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function LocType:HasParam(param) end
