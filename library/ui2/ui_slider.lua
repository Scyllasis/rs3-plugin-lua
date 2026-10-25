---@meta

--- Pick a value from a range via a draggable thumb on a track; supports named entries.
---
--- [Docs](https://developer.runescape.com/rs/ui/interactive_components/slider.html)
---@class ui.Slider : ui.Component
---@field value integer Current value. Setting it triggers value hooks; use `SetValue` to skip them.
---@field valueLabel string Name of the selected entry, or "" if no names were set.
---@field minValue integer Read-only.
---@field maxValue integer Read-only.
---@field numValues integer Read-only. Accounts for min, max and rate.
---@field scale integer Read-only. Divisor used when displaying the value.
---@field rate integer Transition rate; also sets how often track notches appear.
---@field labelsText ui.TextData Modifiable contents.
---@field thumbSprite ui.SpriteData Modifiable contents.
---@field trackSprite ui.SpriteData Modifiable contents.
---@field notchSprite ui.SpriteData Modifiable contents.
ui.Slider = {}

--- Creates a slider under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Slider
function ui.Slider.new(parent, categoryID, dynamicID) end

--- Configures the range. Returns true if valid and ready.
---@param max integer
---@param curValue integer
---@return boolean
---@overload fun(self: ui.Slider, min: integer, max: integer, curValue: integer, valueDisplayDivisor: integer, incrementRate: integer): boolean
---@overload fun(self: ui.Slider, entries: string[], selectedValue?: integer): boolean
---@overload fun(self: ui.Slider, entriesMap: table<string, integer>, selectedValue?: integer): boolean
function ui.Slider:Setup(max, curValue) end

--- Sets the value. Returns false if it can't be represented.
---@param value integer
---@param triggerEvents? boolean Fire ONSELECTIONCHANGED. Defaults to false.
---@return boolean
function ui.Slider:SetValue(value, triggerEvents) end
