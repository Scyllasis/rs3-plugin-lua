-- {{name}}
-- Uses PrettyUI (plugin.json: "requiredDependencies": { "prettyui": 6398181 }), available as the global `prettyui`.
-- Type `prettyui.` or `view:Add` for completions; hover any name for docs. PrettyUI docs: https://prettyui.j3.gg/

log("{{name}} loaded")

local showHints = PersistentDB:GetBool("{{slug}}-showHints") ~= false
local clicks = 0
local contentView, settingsView

-- The window opened from the ribbon icon ("hasRibbonIcon": true in plugin.json).
Event.ContentLayerReady.Subscribe("{{slug}}-content", function(event)
    if contentView then contentView:Destroy() end
    local parent = event.component
    contentView = prettyui.SimpleView.new(parent, { width = parent.width, height = parent.height })

    contentView:AddTitle("{{name}}")
    contentView:AddText(formatStr("Attack level: {}", Player.GetLevelGameplay(SkillType.ATTACK)))
    local count = contentView:AddText("Clicks: 0")
    contentView:AddFancyButton("Count a click", function()
        clicks = clicks + 1
        count.content = "Clicks: " .. tostring(clicks)
    end, { variant = "positive" })
    if showHints then
        contentView:AddText({ text = "Turn this hint off in the plugin settings.", colour = 0xAFA27FFF, marginTop = 12 })
    end
end)

-- The settings window ("hasSettingsIcon": true in plugin.json).
Event.SettingsLayerReady.Subscribe("{{slug}}-settings", function(event)
    if settingsView then settingsView:Destroy() end
    local parent = event.component
    settingsView = prettyui.SimpleView.new(parent, { width = parent.width, height = parent.height })

    settingsView:AddTitle("{{name}} settings")
    settingsView:AddCheckboxButton({
        { text = "Show hints", value = "showHints", selected = showHints },
    }, {
        onChange = function(_, _, _, selected)
            showHints = selected
            PersistentDB:SetBool("{{slug}}-showHints", selected)
        end,
    })
end)

function PluginShutdown()
    Event.ContentLayerReady.Unsubscribe("{{slug}}-content")
    Event.SettingsLayerReady.Unsubscribe("{{slug}}-settings")
    if contentView then contentView:Destroy() end
    if settingsView then settingsView:Destroy() end
end
