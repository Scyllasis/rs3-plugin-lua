---@meta

--- Placement of a paged carousel's previous/next buttons.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/paged_carousel.html)
---@class ui.CarouselButtonDisplayModeEnum
---@field SIDES ui.CarouselButtonDisplayMode Buttons on the left and right sides.
ui.CarouselButtonDisplayMode = {}
---@alias ui.CarouselButtonDisplayMode integer

--- Paged layer with built-in page-switch controls and partially visible, scaled inactive pages with transitions.
---
--- [Docs](https://developer.runescape.com/rs/ui/layout_components/paged_carousel.html)
---@class ui.PagedCarousel : ui.PagedLayer
---@field isSinglePageDisplay boolean Read-only.
---@field numFullyVisiblePages integer Read-only.
---@field isSwitchingPages boolean Read-only.
---@field pageSpacing integer Spacing between displayed pages (interface units).
---@field inactivePageVisibility number How much of neighbouring pages is visible, each side.
---@field inactivePageScale number Height of inactive pages relative to the focused page. Default 1.0.
---@field inactivePageReceiveInput boolean Whether inactive pages can be interacted with.
---@field inactivePageFadeRegionSize integer Width of edge gradient fade; 0 disables.
---@field buttonWidth integer
---@field buttonHeight integer
---@field buttonDisplayMode ui.CarouselButtonDisplayMode
---@field buttonSprite ui.SpriteData Modifiable contents.
---@field pageBackgroundSprite ui.SpriteData Modifiable contents.
---@field pageContentMargin ui.Margin Modifiable contents.
ui.PagedCarousel = {}

--- Creates a paged carousel under `parent`. Fails if the category/dynamic ID pair already exists on the parent.
---@param parent ui.ComponentCollection|ui.Component|nil
---@param categoryID? integer Defaults to the parent's category ID.
---@param dynamicID? integer Defaults to auto-incrementing from the parent's dynamic ID.
---@return ui.PagedCarousel
function ui.PagedCarousel.new(parent, categoryID, dynamicID) end
