---@meta

--- A stylesheet: integer property values keyed by `ui.StyleValue` keys, inheriting from a parent.
--- Index with `sheet[property]` to get (nil if missing) or set a value.
---
--- [Docs](https://developer.runescape.com/rs/ui/stylesheets.html)
---@class ui.StyleSheet
---@field id integer Stylesheet ID.
---@field parent ui.StyleSheet Parent stylesheet (assignable).
---@field parentID integer Parent's ID, or -1.
---@field [integer] integer?
local StyleSheet = {}

--- Returns the value from this sheet or its parents, or nil.
---
--- **Crashes the client for keys of 2^31 and above** (beta client 951.1). Some numbers under
--- `ui.StyleValue` are that large, so don't pass every number found there.
-- found by probe: GetValue with the 11 ui.StyleValue numbers in 0..2^31-1 works on BUTTON_DEFAULT;
-- with all 17 the client crashes with an access violation (a signed 32-bit index out of range).
-- Indexing (sheet[key]), SetValue and HasValue with such keys are not tested yet.
---@param property integer Preferably a `ui.StyleValue` key; must be in 0..2^31-1.
---@return integer?
function StyleSheet:GetValue(property) end

--- Sets a value. Existing users only update when the stylesheet is reassigned.
---@param property integer
---@param value integer
function StyleSheet:SetValue(property, value) end

--- Checks this sheet and its parents for the property.
---@param property integer
---@return boolean
function StyleSheet:HasValue(property) end

--- All stylesheets by ID. `ui.StyleSheets[id]` returns the sheet, creating it if missing.
---
--- [Docs](https://developer.runescape.com/rs/ui/stylesheets.html)
---@class ui.StyleSheets
---@field [integer] ui.StyleSheet
ui.StyleSheets = {}

--- Returns the stylesheet, or nil if missing.
---@param styleSheetID integer
---@return ui.StyleSheet?
function ui.StyleSheets:Find(styleSheetID) end

--- Returns whether a stylesheet with this ID exists.
---@param styleSheetID integer
---@return boolean
function ui.StyleSheets:Contains(styleSheetID) end

--- Style property keys, used to index a stylesheet: `sheet[ui.StyleValue.button.tint.rgb] = 0xFF0000`.
--- The docs only name `button.tint.rgb` and `button.tint.alpha`. Run the Style Studio's
--- "Discover keys" script in the dev client to add the rest to autocomplete.
---
--- [Docs](https://developer.runescape.com/rs/ui/stylesheets.html)
---@class ui.StyleValueKeys
---@field button ui.StyleValueKeys.button
---@field [string] any

---@class ui.StyleValueKeys.button
---@field tint ui.StyleValueKeys.button.tint

---@class ui.StyleValueKeys.button.tint
---@field rgb integer Button tint colour, e.g. 0xFF0000.
---@field alpha integer Button tint alpha (the docs' example uses 100).

---@type ui.StyleValueKeys
---@diagnostic disable-next-line: missing-fields
ui.StyleValue = {}
