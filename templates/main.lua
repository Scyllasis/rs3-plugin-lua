-- {{name}}
-- Type `Event.`, `Player.`, `ui.` etc. for completions; hover any API name for docs.
-- Click the preview icon in the editor title bar to see this UI on a simulated RS screen.

log("{{name}} loaded")

local game_window = ui.Interfaces:GetComponent(id.Component.TOPLEVEL_V2__PLUGIN_BUILD_LAYER_TOP)

-- Session XP tracker: count XP gained per skill since the plugin was enabled.
local gained = {}

Event.SkillTransmit.Subscribe("{{slug}}-xp", function(e)
    local delta = e.newXP - e.oldXP
    if delta > 0 then
        gained[e.skill] = (gained[e.skill] or 0) + delta
    end
end)

-- The window opened from the ribbon icon ("hasRibbonIcon": true in plugin.json).
Event.ContentLayerReady.Subscribe("{{slug}}-ui", function(e)
    local label = ui.Text.new(e.component)
    label.font = id.Font.MUSEO_SANS_15PT_REGULAR
    label:SetPos(12, 12)
    label:SetSize(-24, 24, 1.0, 0)
    label.content = formatStr("Attack level: {}", Player.GetLevelGameplay(SkillType.ATTACK))
end)

-- A pop-up. The ---@preview tag adds it to the preview's Window menu.
---@preview Example pop-up
local function showPopup()
    local box = ui.GroupBox.new(game_window)
    box.stylesheetID = id.StyleSheet.DEFAULT
    box.headerText.content = "{{name}}"
    box:SetSize(300, 140)
    box:SetPos(0, 0, 0.5, 0.5, -0.5, -0.5)

    local close = ui.Button.new(box)
    close.stylesheetID = id.StyleSheet.BUTTON_DEFAULT
    close.label = "Close"
    close:SetSize(100, 32)
    close:SetPos(0, -12, 0.5, 1.0, -0.5, -1.0)
    close:Subscribe(ui.Hook.ONBUTTONPRESSED, function() box:Destroy() end)
end

function PluginShutdown()
    PersistentDB:SetStructuredData("{{slug}}-gained", gained)
end
