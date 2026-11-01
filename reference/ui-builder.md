# UI Builder

Draw a window, and the Lua is written for you. Open it with **RS3: Open UI Builder**.

## PrettyUI or Plain
The switch at the top left chooses how the design is built, and you can flip it at any time. Parts keep their place and settings, and it can be undone.
- **PrettyUI:** real PrettyUI components, in a window that moves, closes and resizes for you. Adds Divider, Spinner, Colour picker, Keybind and Item slot. Needs PrettyUI in `plugin.json`; the Builder offers to add it.
- **Plain:** the client's own parts in a GroupBox window, with no library. Parts that only PrettyUI has stay in the design but are left out of the code, with a note under **Problems**.

PrettyUI fixes some sizes: fancy buttons are 27 tall, sliders 23, checkbox and radio rows 22, dividers 60. The canvas shows those, so in PrettyUI mode their height can't be dragged. Text, rectangles, lines, group boxes and the like are the same parts in both modes.

## Building
- **Add a part:** drag it from Parts onto the window, or focus it and press Enter.
- **Move:** drag it. It snaps to the grid and lines up with nearby edges and centres; pink lines show what it's lining up with. Hold Alt to turn that off for one drag, Shift to keep to one direction.
- **Resize:** drag a handle. Drag the gold corner to resize the window itself.
- **Nest:** drag a part onto a Group box or Layer to put it inside, or out again to remove it. It stays where it is on screen.
- **Select several:** drag across the empty window, or Shift-click.
- **Reorder:** drag a row in **In this window** to change what's in front, or onto a Group box or Layer to put it inside. The top row is at the front.
- **Line up:** the toolbar buttons line up a selection. With one part selected, they line it up with its parent.

## Pins
Pins keep a part in place when the window changes size. **Right** keeps its distance from the right edge, **Centre** stays centred, and **Stretch** grows with the window; its Width then means "this much bigger than the window", so -32 leaves a 16 margin each side.

## Using it in your plugin
Everything saves as you work, to `.rs3/ui/<name>.json` (the design) and `<name>.lua` (the code). Don't edit the Lua: it's rewritten on every change. Your own code goes in the handlers you pass in, so it's never overwritten:

```lua
local settings = require("settings")
local parts = settings.create(root, {
    onSaveButton = function(button) log("saved") end,
})
parts.title.content = "Changed from code"
```

The **Use it** tab has this ready to paste, with your handler names. Commit `.rs3/ui/`, since it's what the code is made from.

## Window or layer?
- **Window:** a titled window. In Plain mode it stays where it's put, because moving it is code you'd write yourself.
- **Layer:** just the parts, for the ribbon or settings window. Pass `event.component` to `create()`.

## Not in the palette
Parts the client lays out itself, or that need data from your code, don't suit dragging: Grid, Panel, PagedLayer, Canvas and Model, plus PrettyUI's Tabs, CollapseButton and graphs. Add those in your own code, inside a Layer from the design.

## Built in
The generated code follows what was found in the real client, which the docs don't all say: `<br>` line breaks instead of `\n`, group box header widths kept to 255, a backdrop so clicks on a plain window don't reach the game, and a workaround for `ComboField:Select`. Turn on **Block clicks to the game** for text and images that shouldn't pass clicks through.

## What's checked
Every change runs the code in the UI Preview's simulated client, and anything that fails is under **Problems**. That catches mistakes, but it isn't the real game: the canvas is a close drawing, not the client's own art, and sizes come from your design rather than from the client. Use **Preview**, then **RS3: Deploy to Game**, to see the real thing.

## Keys
Ctrl+Z undo, Ctrl+Y redo, Ctrl+C/X/V copy, cut and paste, Ctrl+D duplicate, Ctrl+A select all, Del delete, arrows nudge (Shift for 10), `]` and `[` move up and down the stack (Shift for all the way), Ctrl+wheel zoom, Ctrl+S save now, Esc cancel.
