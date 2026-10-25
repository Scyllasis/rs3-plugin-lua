---@meta

---@enum MapElementHorizontalAlign
MapElementHorizontalAlign = {
    LEFT = 0,
    CENTRE = 1,
    RIGHT = 2,
}

---@enum MapElementVerticalAlign
MapElementVerticalAlign = {
    TOP = 0,
    CENTRE = 1,
    BOTTOM = 2,
}

---@enum MapElementTextSize
MapElementTextSize = {
    SMALL = 0,
    MEDIUM = 1,
    LARGE = 2,
}

--- A map element (map/minimap icon and label) config. Proxy usertype; no constructor.
--- Look up via `config.MapElement.NAME` or `config.MapElement.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/mapelementtype.html)
---@class MapElementType
---@field id integer Read-only.
---@field configName string e.g. "DINO_GAME_ICON_1". Read-only.
---@field typeName string Always "MapElement". Read-only. -- unverified: value not quoted
---@field listable boolean Read-only.
---@field spriteID integer Read-only. (Docs list this twice; second entry describes the sprite when flashing.)
---@field spriteMouseOverID integer Read-only.
---@field text string Read-only.
---@field textColour Vector4 Read-only.
---@field textRGBA integer Read-only.
---@field textMouseOverColour Vector4 Read-only.
---@field textMouseOverRGBA integer Read-only.
---@field textSize MapElementTextSize Read-only.
---@field textOffsetX integer Read-only.
---@field textOffsetZ integer Read-only.
---@field textBGFillColour Vector4 Read-only.
---@field textBGFillRGBA integer Read-only.
---@field textBGOutlineColour Vector4 Read-only.
---@field textBGOutlineRGBA integer Read-only.
---@field showOnMiniMap boolean Read-only. (Docs list this twice; second entry says "displayed on the world map".)
---@field category integer Read-only.
---@field subjectText string Read-only.
---@field minimapIconScale integer Read-only.
---@field alignHorizontal MapElementHorizontalAlign Read-only.
---@field alignVertical MapElementVerticalAlign Read-only.
---@field isMultiMapElement boolean Read-only.
local MapElementType = {}

--- Value of a param, or `param.defaultValue` if not set.
---@param param ParamType
---@return any
function MapElementType:GetParamValue(param) end

---@param param ParamType
---@return boolean
function MapElementType:HasParam(param) end
