-- Development only: copies this plugin's log() lines to its saved data, so "RS3: Open Plugin Data"
-- can show them in VS Code. The client keeps its console to itself, so this is the way out.
-- Added by "RS3: Add Log Capture". Take the require out of main.lua before uploading.

local SAVE_TICKS = 100    -- logic ticks between saves (50 per second)
local CHUNK = 3000        -- characters per saved entry
local MAX_CHUNKS = 200    -- then the oldest entries are replaced

local realLog = log
local waiting = {}
local slot, tick = 0, 0
pcall(function() slot = tonumber(PersistentDB:GetString("rs3log.next")) or 0 end)

local function save()
    if #waiting == 0 then return end
    local text = table.concat(waiting, "\n") .. "\n"
    waiting = {}
    for i = 1, #text, CHUNK do
        pcall(function() PersistentDB:SetString(string.format("rs3log.%06d", slot), text:sub(i, i + CHUNK - 1)) end)
        slot = (slot + 1) % MAX_CHUNKS
    end
    pcall(function() PersistentDB:SetString("rs3log.next", tostring(slot)) end)
end

function log(format, ...)
    realLog(format, ...)
    local text = tostring(format)
    if text:find("{", 1, true) then
        local ok, line = pcall(formatStr, text, ...)
        if ok then text = tostring(line) end
    else
        for i = 1, select("#", ...) do text = text .. " " .. tostring((select(i, ...))) end
    end
    waiting[#waiting + 1] = text
end

Event.Logic.Subscribe("rs3log", function()
    tick = tick + 1
    if tick % SAVE_TICKS == 0 then save() end
end)

log("--- plugin loaded ---")
save()
