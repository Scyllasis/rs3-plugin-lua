---@meta

--- A set of options shown as toggleable buttons, with configurable min/max selection counts. Fires ONSELECTIONCHANGED.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/radio_group.html)
---@class ui.RadioGroup : ui.Component
---@field numSelected integer Read-only.
---@field selectedValues integer[] Read-only.
---@field selectedLabels string[] Read-only.
---@field entryMargin ui.Margin Modifiable contents.
---@field labelsText ui.TextData Modifiable contents.
---@field buttonSprite ui.SpriteData Modifiable contents.
ui.RadioGroup = {}

--- Creates a radio group under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.RadioGroup
function ui.RadioGroup.new(parent, categoryID, dynamicID) end

--- Adds an option. Returns false if the ID already exists.
---@param id integer
---@param label string
---@return boolean
function ui.RadioGroup:Add(id, label) end

---@param id integer
---@return boolean
function ui.RadioGroup:Remove(id) end

---@param id integer
---@return boolean
function ui.RadioGroup:HasEntry(id) end

--- Replaces all options from a name -> ID map. IDs must be unique.
---@param entries table<string, integer>
---@return boolean
function ui.RadioGroup:SetEntries(entries) end

--- ID of the selected entry at `selectionIndex`, or -1 if there are too few selections.
---@param selectionIndex integer
---@return integer
function ui.RadioGroup:GetSelectedValue(selectionIndex) end

--- Label of the selected entry at `selectionIndex`, or "" if there are too few selections.
---@param selectionIndex integer
---@return string
function ui.RadioGroup:GetSelectedLabel(selectionIndex) end

---@param id integer
---@return boolean
function ui.RadioGroup:GetOptionEnabled(id) end

---@param id integer
---@param enabled boolean
---@return boolean
function ui.RadioGroup:SetOptionEnabled(id, enabled) end

--- Whether an option is selected. -- unverified: docs signature shows `GetOptionEnabled` under this heading.
---@param id integer
---@return boolean
function ui.RadioGroup:GetOptionSelected(id) end

--- Sets an option's selected state; no change if it would violate selection limits.
---@param id integer
---@param selected boolean -- unverified: param table shows `Bool?` defaulting to false.
---@param triggerEvents? boolean
---@return boolean
function ui.RadioGroup:SetOptionSelected(id, selected, triggerEvents) end

--- Sets layout. buttonSize 0 gives toggle buttons; otherwise it's the checkbox size.
---@param numColumns integer
---@param spacing integer
---@param buttonSize integer
---@param buttonLabelSpacing integer
function ui.RadioGroup:SetVisualParams(numColumns, spacing, buttonSize, buttonLabelSpacing) end

--- Returns false unless min <= max.
---@param minSelectedEntries integer
---@param maxSelectedEntries integer
---@return boolean
function ui.RadioGroup:SetSelectionLimits(minSelectedEntries, maxSelectedEntries) end
