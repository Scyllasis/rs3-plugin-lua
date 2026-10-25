---@meta

--- A position: pixel offset plus parent- and self-relative percentages.
--- Resolved = offset + parentPc * parentSize + selfPc * selfSize.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.Pos
---@field x integer Offset on the X axis.
---@field y integer Offset on the Y axis.
---@field xParentPc number Percentage (0..1) of the parent's width.
---@field yParentPc number Percentage (0..1) of the parent's height.
---@field xSelfPc number Percentage (0..1) of the component's own width.
---@field ySelfPc number Percentage (0..1) of the component's own height.
ui.Pos = {}

--- Creates a new position object.
---@return ui.Pos
---@overload fun(other: ui.Pos): ui.Pos
---@overload fun(x: integer, y: integer): ui.Pos
---@overload fun(x: integer, y: integer, xParentPc: number, yParentPc: number): ui.Pos
---@overload fun(x: integer, y: integer, xParentPc: number, yParentPc: number, xSelfPc: number, ySelfPc: number): ui.Pos
function ui.Pos.new() end

--- A size: pixel offset plus parent-relative percentages.
--- Resolved = offset + parentPc * parentSize.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.Size
---@field width integer Width offset.
---@field height integer Height offset.
---@field widthParentPc number Percentage (0..1) of the parent's width.
---@field heightParentPc number Percentage (0..1) of the parent's height.
ui.Size = {}

--- Creates a new size object. (Docs type the copy overload's `other` as Pos; assumed Size.)
---@return ui.Size
---@overload fun(other: ui.Size): ui.Size
---@overload fun(width: integer, height: integer): ui.Size
---@overload fun(width: integer, height: integer, widthParentPc: number, heightParentPc: number): ui.Size
function ui.Size.new() end

--- Shareable text drawing settings (TextData without `content`). Apply with `SetConfig`.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.TextDataConfig
---@field font integer Font ID.
---@field lineSpacing integer Line spacing; 0 uses the font's spacing.
---@field alignHorizontal ui.AlignMode Horizontal alignment.
---@field alignVertical ui.AlignMode Vertical alignment.
---@field maxLines integer Maximum lines; 0 means unlimited.
---@field alpha number Opacity, 0..1.
---@field colour Vector4 Text colour.
---@field rgba integer Text colour as hex RGBA.
---@field shadowColour Vector4 Shadow colour.
---@field shadowRGBA integer Shadow colour as hex RGBA.
---@field isShadowed boolean Whether the text has a shadow. Default false.

--- A text element: drawing properties plus content.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
-- found in-game (beta 951.1): "\n" in content is drawn as a box glyph, not a line break; "<br>" breaks the line.
---@class ui.TextData : ui.TextDataConfig
---@field content string The text to draw. Use `<br>` for a line break; `\n` shows as a box.
local TextData = {}

--- Sets the alignment (both axes, or horizontal and vertical separately).
---@param alignment ui.AlignMode
---@overload fun(self: ui.TextData, horizontalAlignment: ui.AlignMode, verticalAlignment: ui.AlignMode)
function TextData:AlignTo(alignment) end

--- Applies all properties of a config.
---@param config ui.TextDataConfig
function TextData:SetConfig(config) end

--- Returns a copy of the config properties (excludes `content`).
---@return ui.TextDataConfig
function TextData:GetConfigCopy() end

--- Shareable sprite drawing settings (SpriteData without `sprite`, `spriteID`, `runtimeSprite`).
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.SpriteDataConfig
---@field visualMargins ui.Margin Margins for segmenting the sprite (up to 3x3). Contents modifiable.
---@field outlineWidth integer Outline thickness.
---@field rotationRadians number Rotation in radians.
---@field rotationDegrees number Rotation in degrees.
---@field alpha number Opacity, 0..1.
---@field colour Vector4 Tint colour.
---@field rgba integer Tint colour as hex RGBA.
---@field shadowColour Vector4 Shadow colour.
---@field shadowRGBA integer Shadow colour as hex RGBA.
---@field isFlippedHorizontally boolean Mirrored horizontally.
---@field isFlippedVertical boolean Mirrored vertically.
---@field isTiling boolean Tile the sprite instead of stretching.

--- A sprite element: drawing properties plus a sprite resource. Can be tiled or segmented (up to 3x3).
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.SpriteData : ui.SpriteDataConfig
---@field sprite integer|RuntimeSprite Sprite to draw. -- unverified: docs type it Int but describe it as a RuntimeSprite
---@field spriteID integer Built-in sprite ID.
---@field runtimeSprite RuntimeSprite? Current runtime sprite, or nil.
local SpriteData = {}

--- Applies all properties of a config.
---@param config ui.SpriteDataConfig
function SpriteData:SetConfig(config) end

--- Returns a copy of the config properties.
---@return ui.SpriteDataConfig
function SpriteData:GetConfigCopy() end

--- Opaque runtime-generated sprite (e.g. a plugin resource). No members documented.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class RuntimeSprite

--- Distances from the sides of a region.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.Margin
---@field left integer
---@field top integer
---@field right integer
---@field bottom integer
ui.Margin = {}

--- Creates a new margin.
---@return ui.Margin
---@overload fun(allSides: integer): ui.Margin
---@overload fun(left: integer, top: integer, right: integer, bottom: integer): ui.Margin
function ui.Margin.new() end

--- Scrolling controls for a component. Custom sprites must stack the states
--- idle, mouseover, pressed, disabled vertically.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.ScrollBar
---@field size integer Scrollbar thickness.
---@field visible boolean Default true.
---@field autohide boolean Hide when not needed. Default true.
---@field buttonLength integer Button length; 0 removes the buttons.
---@field backgroundSprite ui.SpriteData Contents modifiable.
---@field buttonSprite ui.SpriteData Contents modifiable.
---@field handleSprite ui.SpriteData Contents modifiable.

--- Component types (value of `component.type`).
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.ComponentTypeEnum
---@field LINE ui.ComponentType
---@field RECTANGLE ui.ComponentType
---@field LABEL ui.ComponentType
---@field SPRITE ui.ComponentType
---@field MODEL ui.ComponentType
---@field MODEL_GROUP ui.ComponentType
---@field RADIAL_PROGRESS_OVERLAY ui.ComponentType
---@field CUTSCENE_LAYER ui.ComponentType
---@field CANVAS ui.ComponentType
---@field BUTTON ui.ComponentType
---@field CHECK ui.ComponentType
---@field LIST ui.ComponentType
---@field INPUTFIELD ui.ComponentType
---@field SLIDER ui.ComponentType
---@field COMBO ui.ComponentType
---@field PAGED_LAYER_HEADER ui.ComponentType
---@field CAROUSEL ui.ComponentType
---@field PAGED_CAROUSEL ui.ComponentType
---@field RADIO_GROUP ui.ComponentType
---@field LAYER ui.ComponentType
---@field PANEL ui.ComponentType
---@field GRID ui.ComponentType
---@field PAGED_LAYER ui.ComponentType
---@field GROUP_BOX ui.ComponentType
ui.ComponentType = {}
---@alias ui.ComponentType integer

--- Alignment modes for text and sprites.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.AlignModeEnum
---@field TOPLEFT ui.AlignMode
---@field CENTRE ui.AlignMode
---@field BOTTOMRIGHT ui.AlignMode
---@field JUSTIFY ui.AlignMode
ui.AlignMode = {}
---@alias ui.AlignMode integer

--- How a component scales to its target aspect ratio.
---
--- [Docs](https://developer.runescape.com/rs/ui/common_types.html)
---@class ui.AspectRatioModeEnum
---@field NO_SCALING ui.AspectRatioMode
---@field SCALE_WIDTH ui.AspectRatioMode
---@field SCALE_HEIGHT ui.AspectRatioMode
ui.AspectRatioMode = {}
---@alias ui.AspectRatioMode integer
