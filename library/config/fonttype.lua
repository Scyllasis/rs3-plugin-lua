---@meta

--- A game font, with text measuring/splitting helpers. Proxy usertype; no constructor.
--- Look up via `config.Font.NAME` or `config.Font.FromID(id)`.
---
--- [Docs](https://developer.runescape.com/rs/game/config/fonttype.html)
---@class FontType
---@field id integer Read-only.
---@field configName string e.g. "MUSEO_SANS_15PT_REGULAR". Read-only.
---@field typeName string Always "Font". Read-only.
---@field baseline integer Read-only.
---@field upperCaseAscent integer Read-only.
---@field lowerCaseAscent integer Read-only.
---@field maxAscent integer Read-only.
---@field maxDescent integer Read-only.
local FontType = {}

--- Width of a single line of text.
---@param text string
---@param ignoreTags? boolean
---@return integer
function FontType:GetStringWidth(text, ignoreTags) end

--- Width of text wrapped to `wrapWidth`.
---@param text string
---@param wrapWidth integer
---@param ignoreTags? boolean
---@param noWordWrapping? boolean
---@param noTrimEdges? boolean
---@return integer
function FontType:GetStringWidthMultiline(text, wrapWidth, ignoreTags, noWordWrapping, noTrimEdges) end

--- Number of lines when wrapped to `wrapWidth`.
---@param text string
---@param wrapWidth integer
---@param ignoreTags? boolean
---@param noWordWrapping? boolean
---@param noTrimEdges? boolean
---@return integer
function FontType:GetStringLineCount(text, wrapWidth, ignoreTags, noWordWrapping, noTrimEdges) end

--- Height and line count when wrapped to `wrapWidth`.
---@param text string
---@param wrapWidth integer
---@param lineSpacing integer
---@param ignoreTags? boolean
---@param noWordWrapping? boolean
---@param noTrimEdges? boolean
---@return integer height
---@return integer lineCount
function FontType:GetStringHeightAndLineCount(text, wrapWidth, lineSpacing, ignoreTags, noWordWrapping, noTrimEdges) end

--- Splits text into wrapped lines.
---@param text string
---@param wrapWidth integer
---@param ignoreTags? boolean
---@param noWordWrapping? boolean
---@param noTrimEdges? boolean
---@return string[]
function FontType:SplitString(text, wrapWidth, ignoreTags, noWordWrapping, noTrimEdges) end

--- One line of the wrapped text.
---@param text string
---@param lineIndex integer
---@param wrapWidth integer
---@param ignoreTags? boolean
---@param noWordWrapping? boolean
---@param noTrimEdges? boolean
---@return string
function FontType:GetSplitStringLine(text, lineIndex, wrapWidth, ignoreTags, noWordWrapping, noTrimEdges) end
