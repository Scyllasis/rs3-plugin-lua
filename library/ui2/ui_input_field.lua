---@meta

--- Which keys an input field handles.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/input_field.html)
---@class ui.InputFieldKeyHandlingModeEnum
---@field DEFAULT ui.InputFieldKeyHandlingMode Handles all inputs.
---@field CHAT ui.InputFieldKeyHandlingMode Ignores arrow keys.
ui.InputFieldKeyHandlingMode = {}
---@alias ui.InputFieldKeyHandlingMode integer

--- Character filter for an input field.
---@class ui.InputFieldFilterModeEnum
---@field NONE ui.InputFieldFilterMode
---@field ALPHANUMERIC ui.InputFieldFilterMode No symbols.
---@field NUMERIC ui.InputFieldFilterMode
---@field QUANTITY ui.InputFieldFilterMode Numbers plus quantity suffixes (K, M, ...).
---@field NUMBERS_AS_TEXT ui.InputFieldFilterMode
ui.InputFieldFilterMode = {}
---@alias ui.InputFieldFilterMode integer

--- Result of an input field action.
---@class ui.InputFieldActionResultEnum
---@field NONE ui.InputFieldActionResult
---@field ERROR ui.InputFieldActionResult
---@field CONTENT_CHANGE ui.InputFieldActionResult
---@field SUBMIT ui.InputFieldActionResult Enter key.
---@field SUBMIT_ON_ESCAPE ui.InputFieldActionResult Esc key; potential submit, context dependent.
---@field SUBMIT_ON_FOCUS_LOSS ui.InputFieldActionResult Potential submit, context dependent.
ui.InputFieldActionResult = {}
---@alias ui.InputFieldActionResult integer

--- How text content is displayed (masking).
---@class ui.TextContentVisibilityModeEnum
---@field VISIBLE ui.TextContentVisibilityMode
---@field SHOW_LAST ui.TextContentVisibilityMode Masks all but the last character.
---@field HIDDEN ui.TextContentVisibilityMode Masks everything.
ui.TextContentVisibilityMode = {}
---@alias ui.TextContentVisibilityMode integer

--- Text entry component; supports input, filter and visibility modes (chat, PINs, passwords).
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/input_field.html)
---@class ui.InputField : ui.Component
---@field content string Current text.
---@field contentQuantity integer? Content parsed as a quantity. Read-only.
---@field visibility ui.TextContentVisibilityMode
---@field filterMode ui.InputFieldFilterMode
---@field maxLength integer Read-only. Set via `Setup`.
---@field inputMode ui.InputFieldKeyHandlingMode
---@field emptyText string Placeholder text shown when empty.
---@field caretColour Vector4
---@field caretRGBA integer Hex-encoded RGBA.
---@field errorCaretColour Vector4
---@field errorCaretRGBA integer Hex-encoded RGBA.
---@field selectionHighlightColour Vector4
---@field selectionHighlightRGBA integer Hex-encoded RGBA.
---@field emptyTextColour Vector4
---@field emptyTextRGBA integer Hex-encoded RGBA.
---@field contentMargin ui.Margin Modifiable contents.
---@field text ui.TextData Modifiable contents.
---@field containerSprite ui.SpriteData Modifiable contents.
---@field scrollbar ui.ScrollBar Modifiable contents.
ui.InputField = {}

--- Creates an input field under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.InputField
function ui.InputField.new(parent, categoryID, dynamicID) end

--- Sets visibility, filter and max length. Non-VISIBLE marks the field restricted; restricted fields can't be Setup again.
---@param visibility ui.TextContentVisibilityMode
---@param filter ui.InputFieldFilterMode
---@param maxLength integer
function ui.InputField:Setup(visibility, filter, maxLength) end
