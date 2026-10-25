---@meta

--- An entry of a ui.List.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/list.html)
---@class ui.ListEntry
---@field text string Entry label.
---@field id integer Read-only.
---@field enabled boolean Read-only.
---@field visible boolean Read-only.
---@field selected boolean Read-only.

--- Choose from a set of options (single or multiple selection), as a list or dropdown. Fires ONSELECTIONCHANGED.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/list.html)
---@class ui.List : ui.Component
---@field numSelectedEntries integer Read-only.
---@field selectedEntries ui.ListEntry[] Read-only.
---@field entryHeight integer
---@field entryIconScale integer Defaults to 100.
---@field dropdownButtonOffset integer
---@field dropdownButtonSize integer
---@field dropdownMaxVisibleEntries integer Non-zero makes the list a dropdown.
---@field isDropdown boolean Read-only.
---@field maxSelected integer Max number of selected entries.
---@field entries ui.ListEntry[] Read-only.
---@field contentMargin ui.Margin Modifiable contents.
---@field headerMargin ui.Margin Modifiable contents.
---@field scrollbar ui.ScrollBar Modifiable contents.
---@field entryText ui.TextData Modifiable contents.
---@field entrySprite ui.SpriteData Modifiable contents.
---@field buttonSprite ui.SpriteData Modifiable contents.
---@field headerSprite ui.SpriteData Modifiable contents.
ui.List = {}

--- Creates a list under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.List
function ui.List.new(parent, categoryID, dynamicID) end

---@param label string
---@param id integer
---@return boolean
function ui.List:Add(label, id) end

--- Replaces all entries from a list of names (auto IDs) or a name -> ID map.
---@param entries string[]
---@param selectedID? integer
---@return boolean
---@overload fun(self: ui.List, entriesMap: table<string, integer>, selectedID?: integer): boolean
function ui.List:SetEntries(entries, selectedID) end

--- Removes all entries.
function ui.List:Clear() end

--- Clears the selection.
function ui.List:UnselectAll() end

---@param id integer
---@param enabled boolean
---@return boolean
function ui.List:SetEntryEnabled(id, enabled) end

---@param id integer
---@param visible boolean
---@return boolean
function ui.List:SetEntryVisible(id, visible) end

---@param id integer
---@param selected boolean
---@param triggerEvents? boolean Defaults to false.
---@return boolean
function ui.List:SetEntrySelected(id, selected, triggerEvents) end

---@param id integer
---@param spriteID integer
---@return boolean
function ui.List:SetEntryIcon(id, spriteID) end

---@param id integer
---@return boolean
function ui.List:GetEntryEnabled(id) end

---@param id integer
---@return boolean
function ui.List:GetEntryVisible(id) end

---@param id integer
---@return boolean
function ui.List:GetEntrySelected(id) end

---@param id integer
---@return boolean
function ui.List:HasEntry(id) end
