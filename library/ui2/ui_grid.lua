---@meta

--- Divides an area into same-size cells, one child per cell, placed left to right, top to bottom.
---
--- **Call `SetColumnRows` before reading `cellHeight`**: on a new grid it crashes the client.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/grid.html)
-- found by probe: reading cellHeight on a freshly created grid (no SetColumnRows yet) crashes the beta
-- client 951.1 with an integer divide by zero. cellWidth is not tested yet and is probably the same.
---@class ui.Grid : ui.ComponentCollection
---@field cellWidth integer Read-only. Probably crashes the client on a grid with no columns/rows yet (untested).
---@field cellHeight integer Read-only. Crashes the client if read before `SetColumnRows` (divide by zero).
---@field columns integer Read-only.
---@field rows integer Read-only.
---@field hasFixedCellSizes boolean Read-only.
---@field spacing integer Spacing between cells.
ui.Grid = {}

--- Creates a grid under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.Grid
function ui.Grid.new(parent, categoryID, dynamicID) end

---@param columns integer
---@param rows integer
function ui.Grid:SetColumnRows(columns, rows) end

---@param width integer
---@param height integer
function ui.Grid:SetCellSize(width, height) end
