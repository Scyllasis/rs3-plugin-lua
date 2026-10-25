---@meta

-- PrettyUI 1.2.0 (plugin hub ID 6398181), a UI library plugin by J3. Docs: https://prettyui.j3.gg/
-- Editor definitions only: they are loaded when plugin.json lists "prettyui" as a dependency.
-- None of PrettyUI's code is included; the client loads the real library from the plugin hub.

--- PrettyUI: native-looking windows, panels, buttons, fields, graphs and more.
---
--- Declare it in plugin.json: `"requiredDependencies": { "prettyui": 6398181 }`. The client loads
--- PrettyUI first and passes its table to your plugin as the global `prettyui`.
---
--- [Docs](https://prettyui.j3.gg/#installation)
---@class prettyui
---@field version string Library version, e.g. "1.2.0".
---@field AchievementPopup prettyui.AchievementPopupModule
---@field AnchoredTooltip prettyui.AnchoredTooltipModule
---@field BarChart prettyui.BarChartModule
---@field BigSpinner prettyui.SpinnerModule Alias for Spinner.
---@field BuffBar prettyui.BuffBarModule
---@field CheckboxButton prettyui.CheckboxButtonModule
---@field CollapseButton prettyui.CollapseButtonModule
---@field ColourPicker prettyui.ColourPickerModule
---@field ComboBox prettyui.ComboBoxModule
---@field Confirm prettyui.ConfirmModule
---@field Dialog prettyui.DialogModule
---@field Divider prettyui.DividerModule
---@field FancyButton prettyui.FancyButtonModule
---@field Histogram prettyui.HistogramModule
---@field ItemGrid prettyui.ItemGridModule
---@field ItemSlot prettyui.ItemSlotModule
---@field KeybindField prettyui.KeybindFieldModule
---@field List prettyui.ListModule
---@field MiniMenu prettyui.MiniMenuModule
---@field Panel prettyui.PanelModule
---@field RadioButton prettyui.RadioButtonModule
---@field RibbonBar prettyui.RibbonBarModule Deprecated: use `"hasRibbonIcon": true` and `Event.ContentLayerReady`.
---@field RibbonButton prettyui.RibbonButtonModule
---@field Scrollbar prettyui.SimpleViewModule Deprecated alias for SimpleView.
---@field SimpleButton prettyui.SimpleButtonModule
---@field SimpleView prettyui.SimpleViewModule
---@field Slider prettyui.SliderModule
---@field Spinner prettyui.SpinnerModule
---@field Sprite prettyui.SpriteModule
---@field SpriteButton prettyui.SpriteButtonModule
---@field Sprites table<string, integer> Sprite IDs PrettyUI draws with (WINDOW_BACKGROUND, CLOSE, ...).
---@field Tabs prettyui.TabsModule
---@field Text prettyui.TextModule
---@field TextField prettyui.TextFieldModule
---@field TimeGraph prettyui.TimeGraphModule
---@field Tooltip prettyui.TooltipModule
---@field Window prettyui.WindowModule
prettyui = {}

-- ---------------------------------------------------------------- shared options

--- A tooltip: plain text, or options.
---@alias prettyui.TooltipValue string|prettyui.TooltipOptions

---@class prettyui.TooltipOptions
---@field text string
---@field maxWidth? number
---@field width? number
---@field height? number
---@field parent? ui.Component Overlay parent.

--- Flow and layout options every `Add…` helper accepts.
---
--- [Docs](https://prettyui.j3.gg/#shared-options)
---@class prettyui.FlowOptions
---@field inline? boolean Join the current row instead of starting below it.
---@field offsetY? number Vertical offset when joining a row with `inline = true`.
---@field marginTop? number Overrides the normal vertical spacing.
---@field marginBottom? number Overrides the normal vertical spacing.
---@field columnGap? number Space after this component before the next inline one.
---@field absolute? boolean Opt out of automatic flow.
---@field x? number Position offset (interface units).
---@field y? number Position offset. Setting it opts out of automatic flow.
---@field xAnchor? number Parent-relative position anchor.
---@field yAnchor? number Parent-relative position anchor.
---@field width? number
---@field height? number
---@field size? number
---@field widthAnchor? number Parent-relative size anchor.
---@field heightAnchor? number Parent-relative size anchor.
---@field tooltip? prettyui.TooltipValue Not supported by KeybindField.
---@field rowBackground? boolean false leaves this flow row unpainted.
---@field rowBackgroundGroup? any Consecutive rows with the same value share one background.

--- Scroll and row-background options shared by windows, panels, tabs and simple views.
---@class prettyui.ScrollOptions
---@field scrollable? boolean Vertical scrolling (default true). The scrollbar only shows on overflow.
---@field scrollStep? number Interface units per wheel step (default 32).
---@field contentHeight? number Initial height for raw content; Add… content is measured automatically.
---@field rowBackgroundColours? integer[] Alternating row colours (RGBA), like native settings panels.
---@field rowBackgroundColors? integer[] Same as rowBackgroundColours.
---@field rowBackgroundEdgeToEdge? boolean Extend row backgrounds to the content edges (default false).

-- ---------------------------------------------------------------- content hosts

--- Anything with PrettyUI flow layout: Window, SimpleView, Panel and tab pages.
---
--- [Docs](https://prettyui.j3.gg/#layout-and-scale)
---@class prettyui.ContentHost
---@field content ui.Layer Layer to use as the parent for your own components.
---@field viewport ui.Layer Clipped layer that owns `content`.
---@field scrollbarVisible boolean True while content overflows and scrolling is on.
---@field scrollY number Current scroll position.
---@field contentHeight number Measured content height.
---@field contentWidth number Measured content width.
local ContentHost = {}

--- Appends body text (Museo Sans). Returns the native text: change `.content` to update it.
---@param value string|prettyui.TextOptions
---@return ui.Text
function ContentHost:AddText(value) end

--- Appends a title (Cinzel) with section spacing.
---@param value string|prettyui.TextOptions
---@return ui.Text
function ContentHost:AddTitle(value) end

---@param options? prettyui.DividerOptions
---@return prettyui.Divider
function ContentHost:AddDivider(options) end

---@param options? prettyui.PanelOptions
---@return prettyui.Panel
function ContentHost:AddPanel(options) end

---@param tabs prettyui.TabEntry[]
---@param options? prettyui.TabsOptions
---@return prettyui.Tabs
function ContentHost:AddTabs(tabs, options) end

---@param text string
---@param options? prettyui.CollapseButtonOptions
---@return prettyui.CollapseButton
function ContentHost:AddCollapseButton(text, options) end

---@param content string|integer Text, or a sprite ID for an icon button.
---@param action? fun(button: prettyui.SimpleButton, active: boolean)
---@param options? prettyui.SimpleButtonOptions
---@return prettyui.SimpleButton
function ContentHost:AddSimpleButton(content, action, options) end

---@param text string
---@param action? fun(button: prettyui.FancyButton)
---@param options? prettyui.FancyButtonOptions
---@return prettyui.FancyButton
function ContentHost:AddFancyButton(text, action, options) end

---@param spriteName prettyui.SpriteButtonName
---@param action? fun(button: prettyui.SpriteButton, enabled: boolean)
---@param options? prettyui.SpriteButtonOptions
---@return prettyui.SpriteButton
function ContentHost:AddSpriteButton(spriteName, action, options) end

---@param spriteID integer
---@param action? fun(button: prettyui.RibbonButton)
---@param options? prettyui.FlowOptions
---@return prettyui.RibbonButton
function ContentHost:AddRibbonButton(spriteID, action, options) end

---@param options? prettyui.TextFieldOptions
---@return prettyui.TextField
function ContentHost:AddTextField(options) end

---@param options? prettyui.ComboBoxOptions
---@return prettyui.ComboBox
function ContentHost:AddComboBox(options) end

---@param options? prettyui.ListOptions
---@return prettyui.List
function ContentHost:AddList(options) end

---@param choices (any|prettyui.Choice)[]
---@param options? prettyui.RadioButtonOptions
---@return prettyui.RadioButton
function ContentHost:AddRadioButton(choices, options) end

---@param choices (any|prettyui.Choice)[]
---@param options? prettyui.CheckboxButtonOptions
---@return prettyui.CheckboxButton
function ContentHost:AddCheckboxButton(choices, options) end

---@param options? prettyui.SliderOptions
---@return prettyui.Slider
function ContentHost:AddSlider(options) end

---@param options? prettyui.ColourPickerOptions
---@return prettyui.ColourPicker
function ContentHost:AddColourPicker(options) end

---@param object ObjType? nil for an empty slot.
---@param options? prettyui.ItemSlotOptions
---@return prettyui.ItemSlot
function ContentHost:AddItemSlot(object, options) end

---@param objects table<integer, ObjType|prettyui.ItemGridEntry> Sparse, row-major.
---@param options? prettyui.ItemGridOptions
---@return prettyui.ItemGrid
function ContentHost:AddItemGrid(objects, options) end

---@param options? prettyui.SpinnerOptions
---@return prettyui.Spinner
function ContentHost:AddSpinner(options) end

--- Alias for AddSpinner.
---@param options? prettyui.SpinnerOptions
---@return prettyui.Spinner
function ContentHost:AddBigSpinner(options) end

---@param sprite integer|PluginResource A sprite ID, or an image from `Plugin.resources`.
---@param options? prettyui.SpriteOptions
---@return prettyui.Sprite
function ContentHost:AddSprite(sprite, options) end

---@param options? prettyui.KeybindFieldOptions
---@return prettyui.KeybindField
function ContentHost:AddKeybindField(options) end

---@param options prettyui.TimeGraphOptions
---@return prettyui.TimeGraph
function ContentHost:AddTimeGraph(options) end

---@param options? prettyui.BarChartOptions
---@return prettyui.BarChart
function ContentHost:AddBarChart(options) end

---@param options? prettyui.HistogramOptions
---@return prettyui.Histogram
function ContentHost:AddHistogram(options) end

--- Enables or disables scrolling. Disabling scrolls back to the top.
---@param value boolean
function ContentHost:SetScrollable(value) end

---@param y number Clamped absolute position.
function ContentHost:SetScrollPosition(y) end

---@param delta number
function ContentHost:ScrollBy(delta) end

--- Scrolls to a direct child returned by an Add… method.
---@param child any
---@param topOffset? number Default 12.
function ContentHost:ScrollToChild(child, topOffset) end

--- Updates overflow detection for raw content not added through Add… helpers.
---@param height number
function ContentHost:SetContentHeight(height) end

--- Rebuilds row backgrounds after adding, removing or moving rows.
function ContentHost:RefreshRowBackgrounds() end

-- ---------------------------------------------------------------- Window

---@class prettyui.WindowOptions : prettyui.ScrollOptions
---@field title? string Omit for the plain top border (and no title-bar dragging).
---@field x? number
---@field y? number
---@field xAnchor? number Use 0.5 with negative half-width x to centre.
---@field yAnchor? number
---@field width? number Default 480.
---@field height? number Default 340.
---@field resizable? boolean Resize from edges and corners (default false).
---@field minWidth? number Default 220.
---@field minHeight? number Default 140.
---@field maxWidth? number
---@field maxHeight? number
---@field onClose? fun(window: prettyui.Window)
---@field destroyOnClose? boolean Destroy instead of hide on close.

--- [Docs](https://prettyui.j3.gg/#window-api)
---@class prettyui.WindowModule
prettyui.Window = {}

--- Creates a window. Titled windows can be dragged by the title bar.
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.WindowOptions
---@return prettyui.Window
function prettyui.Window.new(parent, options) end

--- [Docs](https://prettyui.j3.gg/#window-api)
---@class prettyui.Window : prettyui.ContentHost
---@field root ui.Layer
---@field background ui.Sprite Tiled background sprite (e.g. set .alpha).
---@field title string?
local Window = {}

---@param width number
---@param height number
function Window:SetSize(width, height) end

---@param title string
function Window:SetTitle(title) end

--- Shows and raises the window.
function Window:Show() end

--- Hides its tooltips, calls onClose, then hides (or destroys) the window.
function Window:Close() end

function Window:Destroy() end

-- ---------------------------------------------------------------- SimpleView

---@class prettyui.SimpleViewOptions : prettyui.ScrollOptions
---@field x? number
---@field y? number
---@field width? number
---@field height? number

--- [Docs](https://prettyui.j3.gg/#scrolling-api)
---@class prettyui.SimpleViewModule
prettyui.SimpleView = {}

--- Flow layout and scrolling without a window frame. Use it on `event.component` in
--- `Event.SettingsLayerReady` / `Event.ContentLayerReady`.
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.SimpleViewOptions
---@return prettyui.SimpleView
function prettyui.SimpleView.new(parent, options) end

---@class prettyui.SimpleView : prettyui.ContentHost
local SimpleView = {}

---@param width number
---@param height number
function SimpleView:SetSize(width, height) end

--- Destroys children, tooltips and the view. Destroy the view, not its parent.
function SimpleView:Destroy() end

-- ---------------------------------------------------------------- Text

---@class prettyui.TextOptions : prettyui.FlowOptions
---@field text string
---@field colour? integer RGBA.
---@field font? integer An `id.Font` value.
---@field shadowed? boolean false removes the default shadow.
---@field maxLines? integer

--- [Docs](https://prettyui.j3.gg/#text-api)
---@class prettyui.TextModule
prettyui.Text = {}

--- Body text at an explicit layout (Museo Sans).
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options prettyui.TextOptions
---@return ui.Text
function prettyui.Text.new(parent, options) end

--- Title text at an explicit layout (Cinzel).
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options prettyui.TextOptions
---@return ui.Text
function prettyui.Text.title(parent, options) end

-- ---------------------------------------------------------------- Panel

---@class prettyui.PanelOptions : prettyui.FlowOptions, prettyui.ScrollOptions
---@field popout? boolean Show pop-out/dock buttons (default false).
---@field poppedOut? boolean Start popped out.
---@field popoutX? number
---@field popoutY? number
---@field popoutWidth? number
---@field popoutHeight? number
---@field popoutBackgroundAlpha? number 0..1.
---@field popoutClickthrough? boolean
---@field backgroundAlpha? number 0..1, for standalone overlays.
---@field onPopoutChange? fun(panel: prettyui.Panel, poppedOut: boolean)
---@field resizable? boolean
---@field minWidth? number Default 9.
---@field minHeight? number Default 9.
---@field maxWidth? number
---@field maxHeight? number

--- [Docs](https://prettyui.j3.gg/#panel-api)
---@class prettyui.PanelModule
prettyui.Panel = {}

--- Standalone panel. Hold Alt and drag anywhere on it to move it.
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.PanelOptions
---@return prettyui.Panel
function prettyui.Panel.new(parent, options) end

---@class prettyui.Panel : prettyui.ContentHost
---@field overlayContent ui.Layer Raw content layer for the pop-out surface.
local Panel = {}

---@param value boolean
function Panel:SetPoppedOut(value) end
function Panel:TogglePopout() end
---@param value boolean
function Panel:SetPopoutClickthrough(value) end
---@param alpha number 0..1.
function Panel:SetPopoutBackgroundAlpha(alpha) end
---@param width number
---@param height number
function Panel:SetSize(width, height) end
---@param value prettyui.TooltipValue?
function Panel:SetTooltip(value) end
function Panel:Destroy() end

-- ---------------------------------------------------------------- Divider

---@class prettyui.DividerOptions : prettyui.FlowOptions

---@class prettyui.DividerModule
prettyui.Divider = {}

--- [Docs](https://prettyui.j3.gg/#divider-api)
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.DividerOptions
---@return prettyui.Divider
function prettyui.Divider.new(parent, options) end

---@class prettyui.Divider
local Divider = {}
function Divider:Destroy() end

-- ---------------------------------------------------------------- Tabs

---@class prettyui.TabEntry
---@field text? string Text tab label.
---@field kind? "text"|"icon"
---@field icon? integer Sprite ID for an icon tab.
---@field tooltip? prettyui.TooltipValue
---@field disabled? boolean
---@field value? any
---@field scrollable? boolean Per-page override.
---@field contentHeight? number Per-page override.
---@field rowBackgroundColours? integer[] Per-page override.

---@class prettyui.TabsOptions : prettyui.FlowOptions, prettyui.ScrollOptions
---@field activeIndex? integer Default 1.
---@field onChange? fun(group: prettyui.Tabs, index: integer, value: any, page: prettyui.TabPage)
---@field tabGap? number
---@field tabInset? number

--- [Docs](https://prettyui.j3.gg/#tabs-api)
---@class prettyui.TabsModule
prettyui.Tabs = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param tabs prettyui.TabEntry[]
---@param options? prettyui.TabsOptions
---@return prettyui.Tabs
function prettyui.Tabs.new(parent, tabs, options) end

---@class prettyui.Tabs
local Tabs = {}

---@param index integer
---@return prettyui.TabPage
function Tabs:GetPage(index) end
---@param index integer
---@param notify? boolean Also call onChange.
function Tabs:SetActive(index, notify) end
---@return integer
function Tabs:GetActiveIndex() end
---@param index integer
---@return prettyui.TabEntry
function Tabs:GetTab(index) end
---@param index integer
---@param disabled boolean
function Tabs:SetDisabled(index, disabled) end
---@param index integer
---@param value prettyui.TooltipValue?
function Tabs:SetTabTooltip(index, value) end
---@param value boolean
function Tabs:SetScrollable(value) end
function Tabs:Destroy() end

--- One tab's content: the standard Add… helpers, including AddPanel and nested AddTabs.
---@class prettyui.TabPage : prettyui.ContentHost

-- ---------------------------------------------------------------- CollapseButton

---@class prettyui.CollapseButtonOptions : prettyui.FlowOptions
---@field expanded? boolean
---@field resizeParent? boolean Fit the host's height as the section opens and closes.
---@field disabled? boolean
---@field indent? number
---@field onToggle? fun(section: prettyui.CollapseButton, expanded: boolean)
---@field colour? integer
---@field disabledColour? integer
---@field hoverCursor? CursorType|integer
---@field shadowed? boolean

--- [Docs](https://prettyui.j3.gg/#collapse-button-api)
---@class prettyui.CollapseButtonModule
prettyui.CollapseButton = {}

--- Prefer the host's AddCollapseButton so the section can reflow and resize its host.
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param text string
---@param options? prettyui.CollapseButtonOptions
---@return prettyui.CollapseButton
function prettyui.CollapseButton.new(parent, text, options) end

---@class prettyui.CollapseButton
---@field expanded boolean Read-only; use SetExpanded.
---@field text string
---@field root ui.Layer
local CollapseButton = {}

---@param value string|prettyui.TextOptions
---@return ui.Text
function CollapseButton:AddText(value) end
---@param content string|integer
---@param action? fun(button: prettyui.SimpleButton, active: boolean)
---@param options? prettyui.SimpleButtonOptions
---@return prettyui.SimpleButton
function CollapseButton:AddSimpleButton(content, action, options) end
---@param text string
---@param action? fun(button: prettyui.FancyButton)
---@param options? prettyui.FancyButtonOptions
---@return prettyui.FancyButton
function CollapseButton:AddFancyButton(text, action, options) end
---@param options? prettyui.SliderOptions
---@return prettyui.Slider
function CollapseButton:AddSlider(options) end
---@param options? prettyui.TextFieldOptions
---@return prettyui.TextField
function CollapseButton:AddTextField(options) end
---@param options? prettyui.KeybindFieldOptions
---@return prettyui.KeybindField
function CollapseButton:AddKeybindField(options) end
---@param options? prettyui.ComboBoxOptions
---@return prettyui.ComboBox
function CollapseButton:AddComboBox(options) end
---@param options? prettyui.ListOptions
---@return prettyui.List
function CollapseButton:AddList(options) end
---@param expanded boolean
function CollapseButton:SetExpanded(expanded) end
function CollapseButton:Toggle() end
---@param disabled boolean
function CollapseButton:SetDisabled(disabled) end
---@param text string
function CollapseButton:SetText(text) end
---@param cursor CursorType|integer
function CollapseButton:SetHoverCursor(cursor) end
---@param value prettyui.TooltipValue?
function CollapseButton:SetTooltip(value) end
function CollapseButton:Destroy() end

-- ---------------------------------------------------------------- buttons

---@class prettyui.SimpleButtonOptions : prettyui.FlowOptions
---@field toggleable? boolean Keep the active state after a click.
---@field disabled? boolean
---@field iconSize? number
---@field iconWidth? number
---@field iconHeight? number
---@field colour? integer
---@field disabledColour? integer
---@field hoverCursor? CursorType|integer

--- [Docs](https://prettyui.j3.gg/#simple-button-api)
---@class prettyui.SimpleButtonModule
prettyui.SimpleButton = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param content string|integer Text, or a sprite ID for an icon button.
---@param action? fun(button: prettyui.SimpleButton, active: boolean)
---@param options? prettyui.SimpleButtonOptions
---@return prettyui.SimpleButton
function prettyui.SimpleButton.new(parent, content, action, options) end

---@class prettyui.SimpleButton
local SimpleButton = {}
---@param active boolean
function SimpleButton:SetActive(active) end
---@param disabled boolean
function SimpleButton:SetDisabled(disabled) end
---@param cursor CursorType|integer
function SimpleButton:SetHoverCursor(cursor) end
---@param value prettyui.TooltipValue?
function SimpleButton:SetTooltip(value) end
function SimpleButton:Destroy() end

---@alias prettyui.FancyButtonVariant "positive"|"neutral"|"negative"

---@class prettyui.FancyButtonOptions : prettyui.FlowOptions
---@field variant? prettyui.FancyButtonVariant Default "neutral".
---@field colour? integer
---@field disabledColour? integer
---@field disabled? boolean
---@field hoverCursor? CursorType|integer

--- [Docs](https://prettyui.j3.gg/#fancy-button-api)
---@class prettyui.FancyButtonModule
prettyui.FancyButton = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param text string
---@param action? fun(button: prettyui.FancyButton)
---@param options? prettyui.FancyButtonOptions
---@return prettyui.FancyButton
function prettyui.FancyButton.new(parent, text, action, options) end

---@class prettyui.FancyButton
local FancyButton = {}
---@param variant prettyui.FancyButtonVariant
function FancyButton:SetVariant(variant) end
---@param disabled boolean
function FancyButton:SetDisabled(disabled) end
---@param text string
function FancyButton:SetText(text) end
---@param cursor CursorType|integer
function FancyButton:SetHoverCursor(cursor) end
---@param value prettyui.TooltipValue?
function FancyButton:SetTooltip(value) end
function FancyButton:Destroy() end

---@alias prettyui.SpriteButtonName
---| "MENU"
---| "FILTER"
---| "INFO"
---| "SETTINGS"
---| "PAUSE"
---| "STOP"
---| "PLAY"
---| "UNDO"
---| "REFRESH"
---| "BACK"
---| "PIN"
---| "ERASER"
---| "CROSS"
---| "AUDIO"
---| "PENCIL"
---| "EYE"
---| "HIDE"
---| "STAR"
---| "LIST_LAYOUT"
---| "GRID_LAYOUT"
---| "CAPE"
---| "SHIELD"
---| "BODY"
---| "AMULET"
---| "LEGS"
---| "BOOT"
---| "OUTFIT"
---| "HAND"
---| "KEEPSAKE"
---| "PYRAMID"
---| "SPECIAL"
---| "PLUS"
---| "GRAPH"
---| "IMPORT"
---| "EXPORT"
---| "LADDER_UP"
---| "LADDER_DOWN"
---| "ARROW_UP"
---| "ARROW_RIGHT"
---| "ARROW_LEFT"
---| "ARROW_DOWN"
---| "SEARCH"
---| "CHAT"
---| "DIAMOND"
---| "SWAP"
---| "BROADCAST"
---| "LOCK"
---| "TRASH"

---@class prettyui.SpriteButtonOptions : prettyui.FlowOptions
---@field toggleable? boolean Each click flips the enabled state and passes it to the action.
---@field disabled? boolean
---@field hoverCursor? CursorType|integer

--- [Docs](https://prettyui.j3.gg/#sprite-button-api)
---@class prettyui.SpriteButtonModule
prettyui.SpriteButton = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param spriteName prettyui.SpriteButtonName
---@param action? fun(button: prettyui.SpriteButton, enabled: boolean)
---@param options? prettyui.SpriteButtonOptions
---@return prettyui.SpriteButton
function prettyui.SpriteButton.new(parent, spriteName, action, options) end

---@class prettyui.SpriteButton
local SpriteButton = {}
---@param disabled boolean
function SpriteButton:SetDisabled(disabled) end
---@param name prettyui.SpriteButtonName
function SpriteButton:SetSprite(name) end
---@param cursor CursorType|integer
function SpriteButton:SetHoverCursor(cursor) end
---@param value prettyui.TooltipValue?
function SpriteButton:SetTooltip(value) end
function SpriteButton:Destroy() end

---@class prettyui.RibbonButtonModule
prettyui.RibbonButton = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param spriteID integer
---@param action? fun(button: prettyui.RibbonButton)
---@param options? prettyui.FlowOptions
---@return prettyui.RibbonButton
function prettyui.RibbonButton.new(parent, spriteID, action, options) end

---@class prettyui.RibbonButton
local RibbonButton = {}
---@param spriteID integer
function RibbonButton:SetIcon(spriteID) end
---@param active boolean
function RibbonButton:SetActive(active) end
---@param value prettyui.TooltipValue?
function RibbonButton:SetTooltip(value) end
function RibbonButton:Destroy() end

-- ---------------------------------------------------------------- fields

---@class prettyui.TextFieldOptions : prettyui.FlowOptions
---@field text? string
---@field placeholder? string
---@field visibility? any Native input visibility.
---@field filterMode? any Native input filter.
---@field maxLength? integer Default 9999.
---@field inputMode? any
---@field disabled? boolean
---@field onChange? fun(field: prettyui.TextField, reason: any, text: string)
---@field onSubmit? fun(field: prettyui.TextField, text: string)

--- [Docs](https://prettyui.j3.gg/#field-controls-api)
---@class prettyui.TextFieldModule
prettyui.TextField = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.TextFieldOptions
---@return prettyui.TextField
function prettyui.TextField.new(parent, options) end

---@class prettyui.TextField
local TextField = {}
---@return string
function TextField:GetText() end
---@param text string
---@param notify? boolean
function TextField:SetText(text, notify) end
---@param text string
function TextField:SetPlaceholder(text) end
---@param disabled boolean
function TextField:SetDisabled(disabled) end
---@param value prettyui.TooltipValue?
function TextField:SetTooltip(value) end
function TextField:Destroy() end

--- A combo box or list entry. IDs must be unique.
---@class prettyui.Entry
---@field label string
---@field id any
---@field selected? boolean
---@field disabled? boolean
---@field visible? boolean
---@field icon? integer Sprite ID.
---@field backgroundColour? integer List only.
---@field hoverColour? integer List only.
---@field selectedColour? integer List only.
---@field textColour? integer List only.
---@field disabledTextColour? integer List only.

---@class prettyui.ComboBoxOptions : prettyui.FlowOptions
---@field entries? (string|prettyui.Entry)[]
---@field selectedID? any
---@field disabled? boolean
---@field onChange? fun(combo: prettyui.ComboBox, id: any, label: string, eventType: any)

--- [Docs](https://prettyui.j3.gg/#field-controls-api)
---@class prettyui.ComboBoxModule
prettyui.ComboBox = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.ComboBoxOptions
---@return prettyui.ComboBox
function prettyui.ComboBox.new(parent, options) end

---@class prettyui.ComboBox
local ComboBox = {}
---@param label string
---@param id any
function ComboBox:Add(label, id) end
---@param id any
function ComboBox:Remove(id) end
function ComboBox:Clear() end
---@param entries (string|prettyui.Entry)[]
---@param selectedID? any
function ComboBox:SetEntries(entries, selectedID) end
---@param id any
---@param notify? boolean
function ComboBox:Select(id, notify) end
---@return any
function ComboBox:GetSelectedID() end
---@return string?
function ComboBox:GetSelectedLabel() end
---@param disabled boolean
function ComboBox:SetDisabled(disabled) end
---@param value prettyui.TooltipValue?
function ComboBox:SetTooltip(value) end
function ComboBox:Destroy() end

---@class prettyui.ListOptions : prettyui.FlowOptions
---@field entries? (string|prettyui.Entry)[]
---@field maxSelected? integer
---@field disabled? boolean
---@field onChange? fun(list: prettyui.List, id: any, selected: boolean, eventType: any)

--- [Docs](https://prettyui.j3.gg/#field-controls-api)
---@class prettyui.ListModule
prettyui.List = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.ListOptions
---@return prettyui.List
function prettyui.List.new(parent, options) end

---@class prettyui.List
local List = {}
---@param label string
---@param id any
function List:Add(label, id) end
function List:Clear() end
---@param entries (string|prettyui.Entry)[]
function List:SetEntries(entries) end
---@param id any
---@param selected boolean
---@param notify? boolean
function List:SetSelected(id, selected, notify) end
function List:UnselectAll() end
---@param id any
---@param enabled boolean
function List:SetEntryEnabled(id, enabled) end
---@param id any
---@param visible boolean
function List:SetEntryVisible(id, visible) end
---@param id any
---@param spriteID integer?
function List:SetEntryIcon(id, spriteID) end
---@return prettyui.Entry[]
function List:GetSelectedEntries() end
---@param y number
function List:SetScrollPosition(y) end
---@param width number
---@param height number
---@param widthAnchor? number
---@param heightAnchor? number
function List:SetSize(width, height, widthAnchor, heightAnchor) end
---@param disabled boolean
function List:SetDisabled(disabled) end
---@param value prettyui.TooltipValue?
function List:SetTooltip(value) end
function List:Destroy() end

-- ---------------------------------------------------------------- radio / checkbox

---@class prettyui.Choice
---@field text? string
---@field label? string
---@field value any
---@field selected? boolean
---@field disabled? boolean
---@field tooltip? prettyui.TooltipValue

---@class prettyui.RadioButtonOptions : prettyui.FlowOptions
---@field selectedValue? any
---@field disabled? boolean
---@field onChange? fun(group: prettyui.RadioButton, value: any)

---@class prettyui.CheckboxButtonOptions : prettyui.FlowOptions
---@field selectedValues? any[]|table<any, boolean>
---@field disabled? boolean
---@field onChange? fun(group: prettyui.CheckboxButton, values: any[], changedValue: any, selected: boolean)

--- [Docs](https://prettyui.j3.gg/#selection-button-api)
---@class prettyui.RadioButtonModule
prettyui.RadioButton = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param choices (any|prettyui.Choice)[]
---@param options? prettyui.RadioButtonOptions
---@return prettyui.RadioButton
function prettyui.RadioButton.new(parent, choices, options) end

--- [Docs](https://prettyui.j3.gg/#selection-button-api)
---@class prettyui.CheckboxButtonModule
prettyui.CheckboxButton = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param choices (any|prettyui.Choice)[]
---@param options? prettyui.CheckboxButtonOptions
---@return prettyui.CheckboxButton
function prettyui.CheckboxButton.new(parent, choices, options) end

---@class prettyui.SelectionGroup
local SelectionGroup = {}
---@param value any
---@return boolean
function SelectionGroup:IsSelected(value) end
---@param disabled boolean
function SelectionGroup:SetDisabled(disabled) end
---@param value any
---@param tooltip prettyui.TooltipValue?
function SelectionGroup:SetOptionTooltip(value, tooltip) end
function SelectionGroup:Destroy() end

---@class prettyui.RadioButton : prettyui.SelectionGroup
local RadioButton = {}
---@return any
function RadioButton:GetSelectedValue() end
---@param value any nil clears it.
function RadioButton:SetSelectedValue(value) end

---@class prettyui.CheckboxButton : prettyui.SelectionGroup
local CheckboxButton = {}
---@return any[] values In choice order.
function CheckboxButton:GetSelectedValues() end
---@param value any
---@param selected boolean
function CheckboxButton:SetSelected(value, selected) end

-- ---------------------------------------------------------------- slider / colour picker

---@class prettyui.SliderOptions : prettyui.FlowOptions
---@field min? number Default 0.
---@field max? number Default 100.
---@field value? number Default min.
---@field step? number Default 1.
---@field buttonGap? number Default 4.
---@field disabled? boolean
---@field onChange? fun(slider: prettyui.Slider, value: number)

--- [Docs](https://prettyui.j3.gg/#slider-api)
---@class prettyui.SliderModule
prettyui.Slider = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.SliderOptions
---@return prettyui.Slider
function prettyui.Slider.new(parent, options) end

---@class prettyui.Slider
local Slider = {}
---@return number
function Slider:GetValue() end
--- Clamps and snaps. Pass false to skip onChange.
---@param value number
---@param notify? boolean
function Slider:SetValue(value, notify) end
---@param disabled boolean
function Slider:SetDisabled(disabled) end
function Slider:Destroy() end

---@class prettyui.ColourPickerOptions : prettyui.FlowOptions
---@field value? integer RGBA.
---@field alphaSlider? boolean Also pick opacity (the AA byte).
---@field buttonSize? number Default 24.
---@field disabled? boolean
---@field windowTitle? string
---@field title? string Same as windowTitle.
---@field windowWidth? number Default and minimum 220.
---@field windowHeight? number Default and minimum 312 (348 with alphaSlider).
---@field windowParent? ui.Component
---@field overlayParent? ui.Component Same as windowParent.
---@field windowX? number
---@field windowY? number
---@field pickerX? number
---@field pickerY? number
---@field acceptText? string
---@field acceptWidth? number
---@field acceptVariant? prettyui.FancyButtonVariant
---@field onChange? fun(picker: prettyui.ColourPicker, colour: integer)

--- [Docs](https://prettyui.j3.gg/#colour-picker-api)
---@class prettyui.ColourPickerModule
prettyui.ColourPicker = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.ColourPickerOptions
---@return prettyui.ColourPicker
function prettyui.ColourPicker.new(parent, options) end

---@class prettyui.ColourPicker
local ColourPicker = {}
---@return integer
function ColourPicker:GetValue() end
---@return integer
function ColourPicker:GetColour() end
---@param colour integer
---@param notify? boolean
function ColourPicker:SetValue(colour, notify) end
---@param colour integer
---@param notify? boolean
function ColourPicker:SetColour(colour, notify) end
---@return boolean opened false while disabled.
function ColourPicker:Open() end
--- Closes without committing the provisional colour.
function ColourPicker:Close() end
---@param disabled boolean
function ColourPicker:SetDisabled(disabled) end
---@param value prettyui.TooltipValue?
function ColourPicker:SetTooltip(value) end
function ColourPicker:Destroy() end

-- ---------------------------------------------------------------- tooltips

--- [Docs](https://prettyui.j3.gg/#tooltip-api)
---@class prettyui.TooltipModule
prettyui.Tooltip = {}

--- Attaches a hover tooltip to any component.
---@param target ui.Component
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param value prettyui.TooltipValue
---@return prettyui.Tooltip
function prettyui.Tooltip.attach(target, parent, value) end

---@class prettyui.Tooltip
local Tooltip = {}
function Tooltip:Show() end
function Tooltip:Hide() end
---@param text string
---@return boolean ok false after Destroy.
function Tooltip:SetText(text) end
function Tooltip:Destroy() end

---@class prettyui.AnchoredTooltipOptions
---@field text? string
---@field buildContent? fun(tooltip: prettyui.AnchoredTooltip, content: ui.Layer): any Return value becomes `contentResult`.
---@field width? number
---@field height? number
---@field contentWidth? number
---@field contentHeight? number
---@field padding? number
---@field paddingX? number
---@field paddingY? number
---@field heightAboveGround? number
---@field offsetX? number
---@field offsetY? number
---@field backgroundColour? integer
---@field backgroundAlpha? number
---@field npc? NPCEntity For `show`.
---@field loc? CoordGrid|CoordFine For `show`.
---@field position? Vector3 For `show`.
---@field anchor? fun(): Vector2 For `show`: returns a screen position.

--- Examine-style tooltip that follows an NPC, location or screen anchor.
---
--- [Docs](https://prettyui.j3.gg/#anchored-tooltip-api)
---@class prettyui.AnchoredTooltipModule
prettyui.AnchoredTooltip = {}

--- Follows a live NPC and destroys itself when the NPC becomes invalid.
---@param npc NPCEntity
---@param options? prettyui.AnchoredTooltipOptions
---@return prettyui.AnchoredTooltip
function prettyui.AnchoredTooltip.forNPC(npc, options) end

---@param loc CoordGrid|CoordFine
---@param options? prettyui.AnchoredTooltipOptions
---@return prettyui.AnchoredTooltip
function prettyui.AnchoredTooltip.forLoc(loc, options) end

---@param options prettyui.AnchoredTooltipOptions Set npc, loc, position or anchor.
---@return prettyui.AnchoredTooltip
function prettyui.AnchoredTooltip.show(options) end

---@param parent ui.Component Explicit overlay parent.
---@param options? prettyui.AnchoredTooltipOptions
---@return prettyui.AnchoredTooltip
function prettyui.AnchoredTooltip.new(parent, options) end

---@class prettyui.AnchoredTooltip
---@field content ui.Layer
---@field contentResult any What buildContent returned.
local AnchoredTooltip = {}
---@param text string
function AnchoredTooltip:SetText(text) end
function AnchoredTooltip:Update() end
function AnchoredTooltip:Show() end
function AnchoredTooltip:Hide() end
function AnchoredTooltip:Destroy() end

-- ---------------------------------------------------------------- items

---@class prettyui.ItemSlotOptions : prettyui.FlowOptions
---@field quantity? integer Shown when above one.
---@field disabled? boolean
---@field itemInset? number Default 4.
---@field outlineWidth? number
---@field shadowRGBA? integer
---@field quantityMode? any A `ui.ObjectQuantityDisplayMode` value.

--- [Docs](https://prettyui.j3.gg/#item-slot-api)
---@class prettyui.ItemSlotModule
prettyui.ItemSlot = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param object ObjType? nil for an empty slot.
---@param options? prettyui.ItemSlotOptions
---@return prettyui.ItemSlot
function prettyui.ItemSlot.new(parent, object, options) end

---@class prettyui.ItemSlot
local ItemSlot = {}
---@param object ObjType?
---@param quantity? integer
function ItemSlot:SetObject(object, quantity) end
---@param quantity integer?
function ItemSlot:SetQuantity(quantity) end
--- Visual only.
---@param disabled boolean
function ItemSlot:SetDisabled(disabled) end
---@param value prettyui.TooltipValue?
function ItemSlot:SetTooltip(value) end
function ItemSlot:Destroy() end

---@class prettyui.ItemGridEntry
---@field object ObjType
---@field quantity? integer
---@field tooltip? prettyui.TooltipValue

---@class prettyui.ItemGridOptions : prettyui.FlowOptions
---@field columns? integer Default 1.
---@field rows? integer Default 1.
---@field slotGap? number Default 2.
---@field quantityMode? any
---@field dragDrop? boolean
---@field onDrop? fun(grid: prettyui.ItemGrid, from: integer, to: integer, moved: any, displaced: any)
---@field tooltip? boolean|prettyui.TooltipValue|fun(object: ObjType, index: integer, row: integer, column: integer): prettyui.TooltipValue? true shows item names.

--- [Docs](https://prettyui.j3.gg/#item-grid-api)
---@class prettyui.ItemGridModule
prettyui.ItemGrid = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param objects table<integer, ObjType|prettyui.ItemGridEntry> Sparse, row-major.
---@param options? prettyui.ItemGridOptions
---@return prettyui.ItemGrid
function prettyui.ItemGrid.new(parent, objects, options) end

---@class prettyui.ItemGrid
local ItemGrid = {}
---@param index integer Row-major.
---@return prettyui.ItemSlot
function ItemGrid:GetSlot(index) end
---@param index integer
---@param object ObjType?
---@param tooltip? prettyui.TooltipValue
---@param quantity? integer
function ItemGrid:SetObject(index, object, tooltip, quantity) end
---@param column integer
---@param row integer
---@param object ObjType?
---@param tooltip? prettyui.TooltipValue
---@param quantity? integer
function ItemGrid:SetObjectAt(column, row, object, tooltip, quantity) end
---@param objects table<integer, ObjType|prettyui.ItemGridEntry>
function ItemGrid:SetObjects(objects) end
---@param value any
function ItemGrid:SetTooltip(value) end
---@param source integer
---@param destination integer
---@param notify? boolean
function ItemGrid:MoveObject(source, destination, notify) end
---@param enabled boolean
function ItemGrid:SetDragDropEnabled(enabled) end
function ItemGrid:Destroy() end

-- ---------------------------------------------------------------- spinner / sprite

---@class prettyui.SpinnerOptions : prettyui.FlowOptions
---@field rotation? number Degrees.
---@field degreesPerLogicUpdate? number Default 6.
---@field autoPlay? boolean false starts paused.

--- [Docs](https://prettyui.j3.gg/#spinner-api)
---@class prettyui.SpinnerModule
prettyui.Spinner = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.SpinnerOptions
---@return prettyui.Spinner
function prettyui.Spinner.new(parent, options) end

---@class prettyui.Spinner
local Spinner = {}
---@param degrees number
function Spinner:SetRotation(degrees) end
---@param degrees number Negative spins the other way.
function Spinner:SetDegreesPerLogicUpdate(degrees) end
function Spinner:Start() end
function Spinner:Stop() end
function Spinner:Reset() end
function Spinner:Destroy() end

---@class prettyui.SpriteOptions : prettyui.FlowOptions
---@field colour? integer RGBA tint (default white).
---@field color? integer
---@field alpha? number

--- [Docs](https://prettyui.j3.gg/#sprite-api)
---@class prettyui.SpriteModule
prettyui.Sprite = {}

--- Standalone image (not flow-managed): call Destroy when done.
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param sprite integer|PluginResource A sprite ID or a loaded `Plugin.resources` image, not a file name.
---@param options? prettyui.SpriteOptions
---@return prettyui.Sprite
function prettyui.Sprite.new(parent, sprite, options) end

---@param options? prettyui.SpriteOptions
---@return number width
---@return number height
function prettyui.Sprite.getSize(options) end

---@class prettyui.Sprite
local Sprite = {}
---@param sprite integer|PluginResource
function Sprite:SetSprite(sprite) end
---@param value prettyui.TooltipValue?
function Sprite:SetTooltip(value) end
function Sprite:Destroy() end

-- ---------------------------------------------------------------- popups

---@class prettyui.AchievementPopupOptions
---@field title? string
---@field text? string
---@field item? ObjType
---@field quantity? integer
---@field sound? boolean false for no sound.
---@field soundID? integer
---@field parent? ui.Component
---@field x? number
---@field y? number
---@field xAnchor? number
---@field yAnchor? number

--- [Docs](https://prettyui.j3.gg/#achievement-popup-api)
---@class prettyui.AchievementPopupModule
prettyui.AchievementPopup = {}

--- Top-centred popup that fades after four seconds. nil while the game area is unavailable.
---@param options prettyui.AchievementPopupOptions
---@return prettyui.AchievementPopup?
function prettyui.AchievementPopup.show(options) end

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options prettyui.AchievementPopupOptions
---@return prettyui.AchievementPopup?
function prettyui.AchievementPopup.new(parent, options) end

---@class prettyui.AchievementPopup
local AchievementPopup = {}
function AchievementPopup:Destroy() end

---@class prettyui.DialogAction
---@field label string
---@field variant? prettyui.FancyButtonVariant
---@field disabled? boolean
---@field tooltip? prettyui.TooltipValue
---@field onClick? fun(): boolean? Return true to close.

---@class prettyui.DialogOptions
---@field title? string
---@field width? number Default 328.
---@field height? number Default 150.
---@field modal? boolean Default true.
---@field content? fun(window: prettyui.Window)
---@field actions? prettyui.DialogAction[]
---@field onDismiss? fun()

--- [Docs](https://prettyui.j3.gg/#dialog-api)
---@class prettyui.DialogModule
prettyui.Dialog = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.DialogOptions
---@return prettyui.Dialog
function prettyui.Dialog.new(parent, options) end

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@return integer
function prettyui.Dialog.depth(parent) end

--- Destroys all dialogs for the parent without callbacks.
---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
function prettyui.Dialog.dismissAll(parent) end

---@class prettyui.Dialog
---@field window prettyui.Window
local Dialog = {}
function Dialog:Destroy() end

---@class prettyui.ConfirmOptions
---@field title? string Default "CONFIRM".
---@field body? string
---@field width? number
---@field height? number
---@field modal? boolean
---@field cancelLabel? string Default "CANCEL".
---@field confirmLabel? string Default "CONFIRM".
---@field confirmVariant? prettyui.FancyButtonVariant Default "positive".
---@field onConfirm? fun(): boolean? Return false to keep it open.
---@field onCancel? fun(): boolean? Return false to keep it open.

--- [Docs](https://prettyui.j3.gg/#confirm-api)
---@class prettyui.ConfirmModule
prettyui.Confirm = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.ConfirmOptions
---@return prettyui.Dialog
function prettyui.Confirm.new(parent, options) end

-- ---------------------------------------------------------------- buff bars

---@class prettyui.BuffOptions
---@field objId? integer|ObjType Item artwork (wins over spriteID).
---@field spriteID? integer
---@field label? string
---@field labelRgba? integer
---@field font? integer Default id.Font.NOTOSANS_BOLD_12.
---@field backgroundRgba? integer
---@field borderRgba? integer Buffs only.
---@field tooltip? prettyui.TooltipValue
---@field visible? boolean
---@field duration? number Seconds.

--- Custom entries on the native buff and debuff bars.
---
--- [Docs](https://prettyui.j3.gg/#buff-bar-api)
---@class prettyui.BuffBarModule
prettyui.BuffBar = {}

---@param options prettyui.BuffOptions
---@return prettyui.BuffHandle?
function prettyui.BuffBar.addBuff(options) end
---@param options prettyui.BuffOptions
---@return prettyui.BuffHandle?
function prettyui.BuffBar.addDebuff(options) end
---@param handle prettyui.BuffHandle
---@return boolean
function prettyui.BuffBar.removeBuff(handle) end
---@param handle prettyui.BuffHandle
---@return boolean
function prettyui.BuffBar.removeDebuff(handle) end

---@class prettyui.BuffHandle
local BuffHandle = {}
---@param text string
---@param rgba? integer
---@return boolean
function BuffHandle:SetLabel(text, rgba) end
---@param objId integer|ObjType|nil
function BuffHandle:SetObject(objId) end
---@param spriteID integer?
function BuffHandle:SetSprite(spriteID) end
---@param value prettyui.TooltipValue?
---@return boolean
function BuffHandle:SetTooltip(value) end
---@param visible boolean
---@return boolean
function BuffHandle:SetVisible(visible) end

-- ---------------------------------------------------------------- graphs

---@class prettyui.GraphBase
local GraphBase = {}
function GraphBase:Reset() end
---@param width number
---@param height number
function GraphBase:SetSize(width, height) end
---@param visible boolean
function GraphBase:SetVisible(visible) end
function GraphBase:Destroy() end

---@class prettyui.TimeGraphBus
---@field Update { Publish: fun(update: { metric: string, value: number }): boolean, string?, Subscribe: fun(callback: function), Unsubscribe: fun(callback: function) }

---@class prettyui.TimeGraphOptions : prettyui.FlowOptions
---@field metric { id: string, label?: string, spriteID?: integer, rgba?: integer }
---@field interval? number Seconds per bucket (5).
---@field capacity? integer Buckets kept (60).
---@field zoom? number
---@field zoomable? boolean
---@field onZoom? fun(graph: prettyui.TimeGraph, zoom: number)
---@field bus? prettyui.TimeGraphBus

--- [Docs](https://prettyui.j3.gg/#graphs)
---@class prettyui.TimeGraphModule
prettyui.TimeGraph = {}

---@return prettyui.TimeGraphBus
function prettyui.TimeGraph.CreateEventBus() end

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options prettyui.TimeGraphOptions
---@return prettyui.TimeGraph
function prettyui.TimeGraph.new(parent, options) end

---@class prettyui.TimeGraph : prettyui.GraphBase
---@field bus prettyui.TimeGraphBus
local TimeGraph = {}
---@param zoom number
---@param notify? boolean
function TimeGraph:SetZoom(zoom, notify) end
---@return number
function TimeGraph:GetZoom() end
function TimeGraph:ZoomIn() end
function TimeGraph:ZoomOut() end
---@return table snapshot { metric, interval, capacity, total, elapsedSeconds, buckets }
function TimeGraph:GetSnapshot() end

---@class prettyui.BarChartRow
---@field id any
---@field label string
---@field value number
---@field rgba? integer

---@class prettyui.BarChartOptions : prettyui.FlowOptions
---@field label? string
---@field data? prettyui.BarChartRow[]
---@field orientation? "horizontal"|"vertical"
---@field rgba? integer

---@class prettyui.BarChartModule
prettyui.BarChart = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.BarChartOptions
---@return prettyui.BarChart
function prettyui.BarChart.new(parent, options) end

---@class prettyui.BarChart : prettyui.GraphBase
local BarChart = {}
---@param rows prettyui.BarChartRow[]
function BarChart:SetData(rows) end
---@return table snapshot { label, data }
function BarChart:GetSnapshot() end

---@class prettyui.HistogramOptions : prettyui.FlowOptions
---@field label? string
---@field rgba? integer
---@field samples? number[]
---@field binWidth? number Default 5.
---@field origin? number Default 0.

---@class prettyui.HistogramModule
prettyui.Histogram = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.HistogramOptions
---@return prettyui.Histogram
function prettyui.Histogram.new(parent, options) end

---@class prettyui.Histogram : prettyui.GraphBase
local Histogram = {}
---@param samples number[]
function Histogram:SetSamples(samples) end
---@param bins { lower: number, upper: number, count: integer }[]
function Histogram:SetBins(bins) end
---@return table snapshot { label, binWidth, origin, sampleCount, bins }
function Histogram:GetSnapshot() end

-- ---------------------------------------------------------------- keybind field

---@class prettyui.KeybindFieldOptions : prettyui.FlowOptions
---@field value? GameKey[] Up to two distinct keys. Default {} (unbound).
---@field defaultValue? GameKey[] Offered as "Reset to default"; does not set the value.
---@field disabled? boolean
---@field onChange? fun(field: prettyui.KeybindField, value: GameKey[])

--- [Docs](https://prettyui.j3.gg/#keybind-field-api)
---@class prettyui.KeybindFieldModule
prettyui.KeybindField = {}

---@param parent ui.Component|nil Usually event.component or a ui.Interfaces:GetComponent(...) result.
---@param options? prettyui.KeybindFieldOptions
---@return prettyui.KeybindField
function prettyui.KeybindField.new(parent, options) end

--- True while every key in a non-empty binding is held.
---@param value GameKey[]
---@return boolean
function prettyui.KeybindField.IsDown(value) end

---@return boolean
function prettyui.KeybindField.IsCapturing() end

--- Display label, e.g. "Ctrl + Shift".
---@param value GameKey[]
---@return string
function prettyui.KeybindField.FormatValue(value) end

---@class prettyui.KeybindField
local KeybindField = {}
---@return GameKey[]
function KeybindField:GetValue() end
---@param value GameKey[]
---@param notify? boolean
function KeybindField:SetValue(value, notify) end
function KeybindField:StartListening() end
function KeybindField:CancelListening() end
---@return boolean
function KeybindField:IsListening() end
---@param disabled boolean
function KeybindField:SetDisabled(disabled) end
function KeybindField:Destroy() end

-- ---------------------------------------------------------------- MiniMenu

---@class prettyui.SubmenuChild
---@field label string
---@field action function
---@field arguments? any[]
---@field args? any[]

---@class prettyui.SubmenuOptions
---@field title? string Default "Choose Option".
---@field parentAction? function
---@field arrow? boolean Default true.
---@field position? "top"|"bottom"|integer Default "bottom".

--- [Docs](https://prettyui.j3.gg/#minimenu-submenu-api)
---@class prettyui.MiniMenuModule
prettyui.MiniMenu = {}

--- Adds a parent entry whose children open in a submenu. Only inside `Event.MiniMenuReady`.
---@param miniMenu MiniMenuAPI The event's `miniMenu`.
---@param label string
---@param children prettyui.SubmenuChild[]
---@param options? prettyui.SubmenuOptions
---@return MiniMenuEntry
function prettyui.MiniMenu.AddSubmenu(miniMenu, label, children, options) end

-- ---------------------------------------------------------------- RibbonBar (deprecated)

---@class prettyui.RibbonBarModule
prettyui.RibbonBar = {}

---@deprecated Use `"hasRibbonIcon": true` and `Event.ContentLayerReady`.
---@param options { id: string, label?: string, icon?: integer, object?: ObjType, tooltip?: prettyui.TooltipValue, active?: boolean, disabled?: boolean, onClick?: function }
---@return table handle
function prettyui.RibbonBar.Register(options) end

---@deprecated
---@param identifier string
function prettyui.RibbonBar.Unregister(identifier) end
