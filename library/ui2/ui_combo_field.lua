---@meta

--- An entry of a ComboField.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/combo_field.html)
---@class ui.ComboEntry
---@field text string Entry label.
---@field id integer Entry ID. Read-only.
---@field selectable boolean Whether the entry can be selected. Read-only.

--- Lets users choose from options, filtering them by typed text. Fires a selection-changed event.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/combo_field.html)
---@class ui.ComboField : ui.Component
---@field hasSelection boolean Whether something is selected. Read-only.
---@field selectedID integer Selected entry ID, or -1 if none. Read-only.
---@field selectedLabel string Selected entry label. Read-only.
---@field entryHeight integer Height of each entry.
---@field dropdownMaxVisibleEntries integer Max entries visible in the dropdown.
---@field entries ui.ComboEntry[] Entries. Read-only.
---@field numEntries integer Number of entries. Read-only.
---@field mouseoverForegroundColour Vector4
---@field mouseoverForegroundRGBA integer Hex-encoded RGBA.
---@field mouseoverBackgroundColour Vector4
---@field mouseoverBackgroundRGBA integer Hex-encoded RGBA.
---@field selectedForegroundColour Vector4
---@field selectedForegroundRGBA integer Hex-encoded RGBA.
---@field selectedBackgroundColour Vector4
---@field selectedBackgroundRGBA integer Hex-encoded RGBA.
---@field disabledForegroundColour Vector4
---@field disabledForegroundRGBA integer Hex-encoded RGBA.
---@field caretColour Vector4
---@field caretRGBA integer Hex-encoded RGBA.
---@field errorCaretColour Vector4
---@field errorCaretRGBA integer Hex-encoded RGBA.
---@field selectionHighlightColour Vector4
---@field selectionHighlightRGBA integer Hex-encoded RGBA.
---@field contentMargin ui.Margin Modifiable contents.
---@field headerMargin ui.Margin Modifiable contents.
---@field entryText ui.TextData Modifiable contents.
---@field entrySprite ui.SpriteData Modifiable contents.
---@field buttonSprite ui.SpriteData Modifiable contents.
---@field headerSprite ui.SpriteData Modifiable contents.
---@field scrollbar ui.ScrollBar Modifiable contents.
ui.ComboField = {}

--- Creates a combofield under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.ComboField
function ui.ComboField.new(parent, categoryID, dynamicID) end

--- Adds a labelled entry. Fails if the ID is already in use.
---@param label string
---@param id integer
---@return boolean
function ui.ComboField:Add(label, id) end

---@param id integer
---@return boolean
function ui.ComboField:Remove(id) end

--- Removes all entries.
function ui.ComboField:Clear() end

--- Clears the current selection.
function ui.ComboField:UnselectAll() end

--- Selects an entry by ID. Returns whether an entry with that ID exists.
---@param id integer
---@param triggerEvents? boolean Defaults to false.
---@return boolean
function ui.ComboField:Select(id, triggerEvents) end

---@param id integer
---@return boolean
function ui.ComboField:HasEntry(id) end

--- Replaces all entries from a list of names (auto IDs) or a name -> ID map.
---@param entries string[]
---@param selectedID? integer
---@return boolean
---@overload fun(self: ui.ComboField, entriesMap: table<string, integer>, selectedID?: integer): boolean
function ui.ComboField:SetEntries(entries, selectedID) end
