-- RS3 UI Preview runtime: a mock RuneScape client for running plugin code outside the game.
-- Records every ui.* component a plugin creates (type, layout, properties, hooks, source line)
-- so the preview panel can draw it. Anything not simulated becomes a harmless "stub" value.
-- Host-provided globals: __rs3_cfg, __rs3_readFile, __rs3_enums, __rs3_globals, __rs3_uiTypes, __rs3_nested

local cfg = __rs3_cfg
local readFile = __rs3_readFile

local S = {
  comps = {}, count = 0, logs = {}, subs = {}, subOrder = {},
  roots = {}, captured = {}, warnings = {}, scene = "game", gameRoot = nil, db = {},
}
__rs3_state = S

---------------------------------------------------------------- helpers
local function userFrame(start)
  for lvl = start or 3, 60 do
    local info = debug.getinfo(lvl, "Sl")
    if not info then break end
    if info.source:sub(1, 1) == "@" then return info.source:sub(2), info.currentline end
  end
  return nil, nil
end

local function addLog(kind, msg, file, line)
  if not file then file, line = userFrame(4) end
  if #S.logs < 500 then S.logs[#S.logs + 1] = { kind = kind, msg = msg, file = file, line = line } end
end
__rs3_addLog = addLog

local function warnOnce(key, msg, file, line)
  if S.warnings[key] then return end
  S.warnings[key] = true
  addLog("warn", msg, file, line)
end

---------------------------------------------------------------- stubs
local NAME = {}
local stubMT = {}
local function stub(name) return setmetatable({ [NAME] = name }, stubMT) end
local function isStub(v) return getmetatable(v) == stubMT end
local function stubName(v) return rawget(v, NAME) end
stubMT.__index = function(t, k)
  if type(k) == "number" then return nil end
  local s = stub(rawget(t, NAME) .. "." .. tostring(k))
  rawset(t, k, s)
  return s
end
stubMT.__call = function(t, ...) return stub(rawget(t, NAME) .. "()") end
stubMT.__tostring = function(t) return rawget(t, NAME) end
stubMT.__concat = function(a, b) return tostring(a) .. tostring(b) end
stubMT.__len = function() return 0 end
stubMT.__lt = function() return false end
stubMT.__le = function() return false end
stubMT.__unm = function() return 0 end
stubMT.__pairs = function() return function() return nil end, nil, nil end
for _, op in ipairs({ "__add", "__sub", "__mul", "__div", "__mod", "__pow", "__idiv", "__band", "__bor", "__bxor", "__shl", "__shr" }) do
  stubMT[op] = function() return 0 end
end
stubMT.__name = "rs3-preview-stub"
__rs3_stub = stub

---------------------------------------------------------------- tiny JSON encoder
local function jsonStr(s)
  return '"' .. s:gsub('[%c"\\]', function(c)
    local m = { ['"'] = '\\"', ['\\'] = '\\\\', ['\n'] = '\\n', ['\r'] = '\\r', ['\t'] = '\\t' }
    return m[c] or string.format("\\u%04x", c:byte())
  end) .. '"'
end
local encode
local RECK = {}
local VECK = {}
local POSK = {}
encode = function(v, depth, seen)
  depth = depth or 0
  local t = type(v)
  if t == "nil" then return "null"
  elseif t == "boolean" then return v and "true" or "false"
  elseif t == "number" then
    if v ~= v or v == math.huge or v == -math.huge then return "null" end
    return math.type(v) == "integer" and tostring(v) or string.format("%.6g", v)
  elseif t == "string" then return jsonStr(v)
  elseif t == "function" then return '"<function>"'
  elseif t == "table" then
    if isStub(v) then return jsonStr(stubName(v)) end
    local rec = rawget(v, RECK)
    if rec then return '{"$comp":' .. rec.id .. '}' end
    if depth > 6 then return '"…"' end
    seen = seen or {}
    if seen[v] then return '"<cycle>"' end
    seen[v] = true
    local n = #v
    local out = {}
    if n > 0 then
      for i = 1, math.min(n, 200) do out[#out + 1] = encode(v[i], depth + 1, seen) end
      seen[v] = nil
      return "[" .. table.concat(out, ",") .. "]"
    end
    for k, val in next, v do
      if type(k) == "string" and k:sub(1, 2) ~= "__" then
        out[#out + 1] = jsonStr(k) .. ":" .. encode(val, depth + 1, seen)
      end
    end
    seen[v] = nil
    return "{" .. table.concat(out, ",") .. "}"
  end
  return jsonStr(tostring(v))
end

---------------------------------------------------------------- core globals
function log(...)
  local parts = {}
  for i = 1, select("#", ...) do parts[#parts + 1] = tostring((select(i, ...))) end
  addLog("log", table.concat(parts, " "))
end
function print(...)
  local parts = {}
  for i = 1, select("#", ...) do parts[#parts + 1] = tostring((select(i, ...))) end
  addLog("print", table.concat(parts, "\t"))
end
function formatStr(fmt, ...)
  local args = table.pack(...)
  local auto = 0
  local s = tostring(fmt):gsub("{{", "\1"):gsub("}}", "\2")
  s = s:gsub("{(%d*):?([^}]*)}", function(idx, opt)
    local i
    if idx == "" then i = auto; auto = auto + 1 else i = tonumber(idx) end
    local v = args[i + 1]
    if type(v) == "boolean" then return v and "True" or "False" end
    if type(v) == "number" then
      local prec = opt:match("%.(%d+)f")
      if prec then return string.format("%." .. prec .. "f", v) end
      return tostring(v)
    end
    return tostring(v)
  end)
  s = s:gsub("\1", "{"):gsub("\2", "}")
  return s
end
function ExecuteConsoleCommand(cmd) addLog("cmd", "console: " .. tostring(cmd)) end

-- Event: records subscribers per event name
local function eventSource(name)
  return {
    Subscribe = function(ref, fn)
      local file, line = userFrame(3)
      local e = S.subs[name]
      if not e then e = { refs = {}, order = {} }; S.subs[name] = e; S.subOrder[#S.subOrder + 1] = name end
      if not e.refs[ref] then e.order[#e.order + 1] = ref end
      e.refs[ref] = { fn = fn, file = file, line = line }
    end,
    Unsubscribe = function(ref)
      local e = S.subs[name]
      if e then e.refs[ref] = nil end
    end,
  }
end
Event = setmetatable({}, { __index = function(t, name)
  local src = eventSource(name)
  rawset(t, name, src)
  return src
end })

-- PersistentDB: in-memory
do
  local db = S.db
  local function g(_, k) return db[k] end
  PersistentDB = {
    Get = g, GetBool = g, GetInt = g, GetFloat = g, GetString = g, GetStructuredData = g,
    Set = function(_, k, v) db[k] = v; return true end,
    SetBool = function(_, k, v) db[k] = v; return true end,
    SetInt = function(_, k, v) db[k] = v; return true end,
    SetFloat = function(_, k, v) db[k] = v; return true end,
    SetString = function(_, k, v) db[k] = v; return true end,
    SetStructuredData = function(_, k, v) db[k] = v; return true end,
    CheckExists = function(_, k) return db[k] ~= nil end,
    CheckExistsTyped = function(_, k) return db[k] ~= nil end,
    IterateEntries = function(_, cb) for k, v in pairs(db) do cb(k, v) end end,
    Delete = function(_, k) db[k] = nil; return true end,
    Clear = function() for k in pairs(db) do db[k] = nil end end,
  }
end

Plugin = setmetatable({
  HasPermission = function() return true end,
  urls = stub("Plugin.urls"),
  resources = stub("Plugin.resources"),
}, { __index = function(_, k) return stub("Plugin." .. k) end })

---------------------------------------------------------------- vectors
local ALIAS = { r = "x", g = "y", b = "z", a = "w" }
local function makeVec(n, name)
  local keys = { "x", "y", "z", "w" }
  local mt = {}
  local function new(...)
    local a = { ... }
    local v = { [VECK] = n }
    if #a == 0 then for i = 1, n do v[keys[i]] = 0 end
    elseif #a == 1 and type(a[1]) == "number" then for i = 1, n do v[keys[i]] = a[1] end
    elseif #a == 2 and type(a[1]) == "table" and type(a[2]) == "table" then
      v.x, v.y, v.z, v.w = a[1].x, a[1].y, a[2].x, a[2].y
    else for i = 1, n do v[keys[i]] = tonumber(a[i]) or 0 end end
    return setmetatable(v, mt)
  end
  mt.__index = function(t, k)
    local al = ALIAS[k]
    if al then return rawget(t, al) end
    return nil
  end
  mt.__newindex = function(t, k, val) rawset(t, ALIAS[k] or k, val) end
  local function op(f) return function(a, b)
    local r = {}
    for i = 1, n do
      local k = keys[i]
      local av = type(a) == "table" and a[k] or a
      local bv = type(b) == "table" and b[k] or b
      r[i] = f(av or 0, bv or 0)
    end
    return new(table.unpack(r))
  end end
  mt.__add = op(function(x, y) return x + y end)
  mt.__sub = op(function(x, y) return x - y end)
  mt.__mul = op(function(x, y) return x * y end)
  mt.__div = op(function(x, y) return y ~= 0 and x / y or 0 end)
  mt.__tostring = function(t)
    local p = {}
    for i = 1, n do p[i] = tostring(t[keys[i]]) end
    return name .. "(" .. table.concat(p, ", ") .. ")"
  end
  return setmetatable({ new = new }, { __index = function(_, k) return stub(name .. "." .. k) end })
end
Vector2 = makeVec(2, "Vector2")
Vector3 = makeVec(3, "Vector3")
Vector4 = makeVec(4, "Vector4")

---------------------------------------------------------------- enums from the API definitions
for name, members in pairs(__rs3_enums) do
  local tbl, rev = {}, {}
  for k, v in pairs(members) do tbl[k] = v; rev[v] = k end
  tbl.FromID = function(v) return rev[v] or tostring(v) end
  local path = {}
  for part in name:gmatch("[^.]+") do path[#path + 1] = part end
  setmetatable(tbl, { __index = function(_, k) return stub(name .. "." .. k) end })
  if #path == 1 then _G[name] = tbl else __rs3_pendingEnums = __rs3_pendingEnums or {}; __rs3_pendingEnums[name] = tbl end
end

---------------------------------------------------------------- UI components
local compMT = {}
local M = {} -- component methods

local function recOf(v)
  return type(v) == "table" and rawget(v, RECK) or nil
end

local function newRoot(kind, title, x, y, w, h)
  S.count = S.count + 1
  local rec = {
    id = S.count, type = "Root", kind = kind, title = title, root = true, children = {}, props = {}, hooks = {}, calls = {},
    rx = x, ry = y, rw = w, rh = h, scene = S.scene,
  }
  S.comps[rec.id] = rec
  rec.obj = setmetatable({ [RECK] = rec }, compMT)
  S.roots[#S.roots + 1] = rec.id
  return rec
end

local function gameRoot()
  if not S.gameRoot then
    S.gameRoot = newRoot("game", "Game window (plugin build layer)", 0, 0, cfg.screenW, cfg.screenH)
    S.gameRoot.scene = "game"
  end
  return S.gameRoot
end
__rs3_gameRoot = gameRoot

local nestedTable
nestedTable = function(owner, key)
  local t = {}
  if type(key) == "string" and key:match("[Mm]argins?$") then
    t.left, t.top, t.right, t.bottom = 0, 0, 0, 0
  end
  return setmetatable(t, { __index = function(tt, k)
    if type(k) == "string" and k:match("[Mm]argins?$") then
      local m = nestedTable(owner, k)
      rawset(tt, k, m)
      return m
    end
    if k == "AlignTo" then
      return function(self, h, v) rawset(self, "alignHorizontal", h); rawset(self, "alignVertical", v or h) end
    elseif k == "SetConfig" then
      return function(self, other) if type(other) == "table" then for kk, vv in next, other do if type(kk) == "string" then rawset(self, kk, vv) end end end end
    elseif k == "GetConfigCopy" then
      return function(self) local c = {}; for kk, vv in next, self do c[kk] = vv end; return c end
    elseif type(k) == "string" and k:match("^%u") then
      return function(self, ...) rawset(self, "__call_" .. k, { ... }) end
    end
    return nil
  end })
end

local function newComp(typ, parent, categoryID, dynamicID)
  local prec = recOf(parent)
  local file, line = userFrame(3)
  if not prec then
    prec = gameRoot()
    if parent == nil then
      warnOnce("nilparent:" .. tostring(file) .. ":" .. tostring(line),
        "ui." .. typ .. ".new got a nil parent; the preview placed it on the game window.", file, line)
    end
  end
  S.count = S.count + 1
  local rec = {
    id = S.count, type = typ, parent = prec.id, children = {}, props = {}, hooks = {}, calls = {},
    pos = { x = 0, y = 0, px = 0, py = 0, sx = 0, sy = 0 }, size = { w = 0, h = 0, pw = 0, ph = 0 },
    posSet = false, sizeSet = false, file = file, line = line, scene = S.scene,
    categoryID = categoryID, dynamicID = dynamicID,
  }
  S.comps[rec.id] = rec
  table.insert(prec.children, rec.id)
  rec.obj = setmetatable({ [RECK] = rec }, compMT)
  return rec.obj
end

-- layout: offset + parent% * parentSize + self% * ownSize; Panel stacks its children
local resolve
resolve = function(rec)
  if rec.root then return rec.rx, rec.ry, rec.rw, rec.rh end
  local parent = S.comps[rec.parent]
  local px, py, pw, ph = resolve(parent)
  local cm = parent.props and parent.props.contentMargin
  if type(cm) == "table" and not isStub(cm) then
    local l, t, r, b = tonumber(cm.left) or 0, tonumber(cm.top) or 0, tonumber(cm.right) or 0, tonumber(cm.bottom) or 0
    px, py, pw, ph = px + l, py + t, pw - l - r, ph - t - b
  end
  local w = rec.size.w + rec.size.pw * pw
  local h = rec.size.h + rec.size.ph * ph
  local x = px + rec.pos.x + rec.pos.px * pw + rec.pos.sx * w
  local y = py + rec.pos.y + rec.pos.py * ph + rec.pos.sy * h
  if parent.type == "Panel" then
    local vertical = parent.props.isVertical
    if vertical == nil then vertical = true end
    local spacing = tonumber(parent.props.spacing) or 0
    local offset = 0
    for _, cid in ipairs(parent.children) do
      if cid == rec.id then break end
      local c = S.comps[cid]
      if c and not c.destroyed and not c.props.hidden then
        local cw = c.size.w + c.size.pw * pw
        local chh = c.size.h + c.size.ph * ph
        offset = offset + (vertical and chh or cw) + spacing
      end
    end
    if vertical then y = py + offset + rec.pos.y else x = px + offset + rec.pos.x end
  end
  return x, y, w, h
end
__rs3_resolve = resolve

M.SetX = function(self, x, pp, sp) local r = recOf(self); r.pos.x, r.pos.px, r.pos.sx = x or 0, pp or 0, sp or 0; r.posSet = true end
M.SetY = function(self, y, pp, sp) local r = recOf(self); r.pos.y, r.pos.py, r.pos.sy = y or 0, pp or 0, sp or 0; r.posSet = true end
M.SetPos = function(self, x, y, ppx, ppy, spx, spy)
  local r = recOf(self)
  r.pos = { x = x or 0, y = y or 0, px = ppx or 0, py = ppy or 0, sx = spx or 0, sy = spy or 0 }
  r.posSet = true
end
M.SetWidth = function(self, w, pp) local r = recOf(self); r.size.w, r.size.pw = w or 0, pp or 0; r.sizeSet = true end
M.SetHeight = function(self, h, pp) local r = recOf(self); r.size.h, r.size.ph = h or 0, pp or 0; r.sizeSet = true end
M.SetSize = function(self, w, h, ppw, pph)
  local r = recOf(self)
  r.size = { w = w or 0, h = h or 0, pw = ppw or 0, ph = pph or 0 }
  r.sizeSet = true
end
M.Destroy = function(self)
  local r = recOf(self)
  local function kill(rr)
    rr.destroyed = true
    for _, c in ipairs(rr.children) do kill(S.comps[c]) end
  end
  kill(r)
  local p = S.comps[r.parent]
  if p then for i, c in ipairs(p.children) do if c == r.id then table.remove(p.children, i) break end end end
end
local function reorder(self, front)
  local r = recOf(self)
  local p = S.comps[r.parent]
  if not p then return end
  for i, c in ipairs(p.children) do if c == r.id then table.remove(p.children, i) break end end
  if front then table.insert(p.children, r.id) else table.insert(p.children, 1, r.id) end
end
M.MoveToFront = function(self) reorder(self, true) end
M.MoveToBack = function(self) reorder(self, false) end
M.Subscribe = function(self, hook, fn)
  local r = recOf(self)
  local file, line = userFrame(3)
  r.hooks[tostring(hook)] = { fn = fn, file = file, line = line }
end
M.Unsubscribe = function(self, hook) recOf(self).hooks[tostring(hook)] = nil end
M.AlignTo = function(self, h, v) local r = recOf(self); r.props.alignHorizontal = h; r.props.alignVertical = v or h end
M.SetHeaderLayout = function(self, w, h, ox, oy, align)
  local p = recOf(self).props
  p.headerWidth, p.headerHeight, p.headerOffsetX, p.headerOffsetY, p.headerAlignment = w, h, ox, oy, align
end
M.Setup = function(self, ...) recOf(self).calls.Setup = { ... } end
M.SetValue = function(self, v) recOf(self).props.value = v end
M.SetEntries = function(self, entries) recOf(self).props.entries = entries end
M.SetAssociatedObject = function(self, id, qty) local p = recOf(self).props; p.associatedObjectID = id; p.associatedObjectQuantity = qty end

local READONLY = { x = 1, y = 2, width = 3, height = 4 }
compMT.__index = function(self, k)
  local rec = rawget(self, RECK)
  if M[k] then return M[k] end
  if READONLY[k] and not (k == "width" and rec.type == "Line" and rec.props.width ~= nil) then
    local x, y, w, h = resolve(rec)
    return ({ x, y, w, h })[READONLY[k]]
  end
  if k == "parent" then local p = S.comps[rec.parent]; return p and p.obj end
  if k == "type" then return stub("ui.ComponentType." .. rec.type:upper()) end
  if k == "position" then return { x = rec.pos.x, y = rec.pos.y } end
  if k == "size" then return { x = rec.size.w, y = rec.size.h } end
  if k == "visible" or k == "visibleGlobal" then return not rec.props.hidden end
  local v = rec.props[k]
  if v ~= nil then return v end
  if __rs3_nested[k] then
    local t = nestedTable(rec, k)
    rec.props[k] = t
    return t
  end
  if (k == "label" or k == "content" or k == "emptyText") then return "" end
  if type(k) == "string" and k:match("^%u") then
    if k:match("^Get") or k:match("^Is") or k:match("^Has") then
      return function(s, ...) return stub("ui." .. rec.type .. ":" .. k .. "()") end
    end
    return function(s, ...) rec.calls[k] = { ... } end
  end
  return nil
end
compMT.__newindex = function(self, k, v)
  local rec = rawget(self, RECK)
  if k == "position" and type(v) == "table" then
    rec.pos = { x = v.x or 0, y = v.y or 0, px = v.px or 0, py = v.py or 0, sx = v.sx or 0, sy = v.sy or 0 }
    rec.posSet = true
    return
  end
  if k == "size" and type(v) == "table" then
    rec.size = { w = v.x or v.w or 0, h = v.y or v.h or 0, pw = v.pw or 0, ph = v.ph or 0 }
    rec.sizeSet = true
    return
  end
  if k == "label" and (rec.type == "Button" or rec.type == "Check") then
    local t = rec.props.text
    if type(t) ~= "table" then t = nestedTable(rec, "text"); rec.props.text = t end
    rawset(t, "content", v)
  end
  rec.props[k] = v
end
compMT.__tostring = function(self) return "ui." .. rawget(self, RECK).type end
compMT.__eq = function(a, b) return rawget(a, RECK) == rawget(b, RECK) end

ui = setmetatable({}, { __index = function(t, k) return stub("ui." .. k) end })
for _, typ in ipairs(__rs3_uiTypes) do
  ui[typ] = setmetatable({ new = function(parent, c, d) return newComp(typ, parent, c, d) end },
    { __index = function(_, k) return stub("ui." .. typ .. "." .. k) end })
end
ui.Pos = { new = function(x, y, px, py, sx, sy)
  if type(x) == "table" then return { x = x.x, y = x.y, px = x.px, py = x.py, sx = x.sx, sy = x.sy } end
  return { x = x or 0, y = y or 0, px = px or 0, py = py or 0, sx = sx or 0, sy = sy or 0 }
end }
ui.Size = { new = function(w, h, pw, ph)
  if type(w) == "table" then return { x = w.x, y = w.y, pw = w.pw, ph = w.ph } end
  return { x = w or 0, y = h or 0, pw = pw or 0, ph = ph or 0 }
end }
ui.Margin = { new = function(l, t, r, b)
  if type(l) == "table" then return { left = l.left, top = l.top, right = l.right, bottom = l.bottom } end
  return { left = l or 0, top = t or l or 0, right = r or l or 0, bottom = b or t or l or 0 }
end }
-- Stylesheets: real records so custom sheets (and their parents/values) reach the preview
local SHEETK = {}
local sheets, sheetOrder = {}, {}
local function sheetKey(id)
  if isStub(id) then return stubName(id) end
  if type(id) == "table" and rawget(id, SHEETK) then return rawget(id, SHEETK).key end
  return tostring(id)
end
local function propName(k)
  if isStub(k) then return (stubName(k):gsub("^ui%.StyleValue%.", "")) end
  return tostring(k)
end
local sheetMT = {}
local getSheet
getSheet = function(id)
  local key = sheetKey(id)
  local sh = sheets[key]
  if not sh then
    local file, line = userFrame(3)
    sh = setmetatable({ [SHEETK] = { key = key, values = {}, parent = nil, file = file, line = line } }, sheetMT)
    sheets[key] = sh
    sheetOrder[#sheetOrder + 1] = key
  end
  return sh
end
local function sheetLookup(d, name)
  local seen = {}
  while d and not seen[d] do
    seen[d] = true
    if d.values[name] ~= nil then return d.values[name] end
    d = d.parent and sheets[d.parent] and rawget(sheets[d.parent], SHEETK)
  end
  return nil
end
local SHEET_METHODS = {
  GetValue = function(self, k) return sheetLookup(rawget(self, SHEETK), propName(k)) end,
  SetValue = function(self, k, v) rawget(self, SHEETK).values[propName(k)] = v end,
  HasValue = function(self, k) return sheetLookup(rawget(self, SHEETK), propName(k)) ~= nil end,
}
sheetMT.__index = function(self, k)
  local d = rawget(self, SHEETK)
  if SHEET_METHODS[k] then return SHEET_METHODS[k] end
  if k == "id" then return tonumber(d.key) or stub(d.key) end
  if k == "parent" then return d.parent and sheets[d.parent] or nil end
  if k == "parentID" then return d.parent and (tonumber(d.parent) or stub(d.parent)) or -1 end
  return sheetLookup(d, propName(k))
end
sheetMT.__newindex = function(self, k, v)
  local d = rawget(self, SHEETK)
  if k == "parent" then
    d.parent = v ~= nil and sheetKey(v) or nil
    if d.parent then getSheet(v) end
    return
  end
  d.values[propName(k)] = v
end
sheetMT.__tostring = function(self) return "ui.StyleSheet(" .. rawget(self, SHEETK).key .. ")" end
ui.StyleSheets = setmetatable({
  Find = function(_, id) return sheets[sheetKey(id)] end,
  Contains = function(_, id) return sheets[sheetKey(id)] ~= nil end,
}, { __index = function(_, id) return getSheet(id) end })
function __rs3_sheets()
  local out = {}
  for _, key in ipairs(sheetOrder) do
    local d = rawget(sheets[key], SHEETK)
    out[key] = { parent = d.parent, values = d.values, file = d.file, line = d.line }
  end
  return out
end

ui.Interfaces = setmetatable({
  GetComponent = function(self, id)
    local root = gameRoot()
    local name = tostring(id)
    if not name:find("PLUGIN_BUILD_LAYER") then
      local file, line = userFrame(3)
      warnOnce("iface:" .. name, "ui.Interfaces:GetComponent(" .. name .. ") is drawn as the full game window in the preview; the real interface may be smaller.", file, line)
    end
    return root.obj
  end,
}, { __index = function(_, k) return function() return stub("ui.Interfaces:" .. k .. "()") end end })
for name, tbl in pairs(__rs3_pendingEnums or {}) do
  local first, rest = name:match("^([^.]+)%.(.+)$")
  if first == "ui" then rawset(ui, rest, tbl) end
end

-- remaining API globals become stubs (Player, Inventory, id, var, config, …)
for _, name in ipairs(__rs3_globals) do
  if rawget(_G, name) == nil then _G[name] = stub(name) end
end

---------------------------------------------------------------- running plugin code
local LIMIT = cfg.instructionLimit or 20000000
local ticks = 0
local function hook(ev)
  if ev == "count" then
    ticks = ticks + 1000
    if ticks > LIMIT then error("stopped: plugin code ran too long (possible infinite loop)", 2) end
  elseif ev == "return" then
    local info = debug.getinfo(2, "Sf")
    if info and info.what == "main" and info.source:sub(1, 1) == "@" then
      local file = info.source:sub(2)
      local cap = S.captured[file] or {}
      S.captured[file] = cap
      local i = 1
      while true do
        local n, v = debug.getlocal(2, i)
        if not n then break end
        if n:sub(1, 1) ~= "(" then cap[n] = v end
        i = i + 1
      end
    end
  end
end

local function guarded(fn, ...)
  ticks = 0
  debug.sethook(hook, "r", 1000)
  local res = table.pack(xpcall(fn, function(err)
    local file, line = userFrame(2)
    local msg = tostring(err)
    local f2, l2 = msg:match("^([^:]+%.lua):(%d+):")
    if f2 then file, line = f2, tonumber(l2) end
    addLog("error", msg, file, line)
    return err
  end, ...))
  debug.sethook()
  return table.unpack(res, 1, res.n)
end
__rs3_guarded = guarded

local loaded = {}
local function loadUser(path)
  local src = readFile(path)
  if not src then return nil, "file not found: " .. path end
  return load(src, "@" .. path, "t", _ENV)
end
function require(mod)
  if package.loaded[mod] ~= nil then return package.loaded[mod] end
  if loaded[mod] ~= nil then return loaded[mod] end
  local path = mod:gsub("%.", "/") .. ".lua"
  local fn, err = loadUser(path)
  if not fn then
    local init = mod:gsub("%.", "/") .. "/init.lua"
    fn = loadUser(init)
    if not fn then error("module '" .. mod .. "' not found (" .. tostring(err) .. ")", 2) end
  end
  local r = fn(mod)
  if r == nil then r = true end
  loaded[mod] = r
  return r
end

function __rs3_runFile(path, optional)
  local fn, err = loadUser(path)
  if not fn then
    if optional and tostring(err):find("not found") then return true end
    local f, l = tostring(err):match("^([^:]+%.lua):(%d+):")
    addLog("error", tostring(err), f or path, tonumber(l))
    return false
  end
  local ok = guarded(fn)
  return ok
end

-- previews: find a function by "name" or "Tbl.name" among a file's captured top-level locals or globals
local function findFn(file, name)
  local parts = {}
  for p in name:gmatch("[^.:]+") do parts[#parts + 1] = p end
  local cur = (S.captured[file] or {})[parts[1]]
  if cur == nil then cur = rawget(_G, parts[1]) end
  for i = 2, #parts do
    if type(cur) ~= "table" then return nil end
    cur = cur[parts[i]]
  end
  return type(cur) == "function" and cur or nil
end

local function fireLayer(eventName, kind, title, rect)
  local e = S.subs[eventName]
  local root = newRoot(kind, title, rect[1], rect[2], rect[3], rect[4])
  if not e then return root end
  for _, ref in ipairs(e.order) do
    local s = e.refs[ref]
    if s then guarded(s.fn, { component = root.obj }) end
  end
  return root
end

local payloadMT = { __index = function(t, k) return stub("event." .. tostring(k)) end }

function __rs3_runScene(scene)
  S.scene = scene.id
  if scene.kind == "content" then
    fireLayer("ContentLayerReady", "content", "Plugin window (ribbon icon)", scene.rect)
  elseif scene.kind == "settings" then
    fireLayer("SettingsLayerReady", "settings", "Plugin settings", scene.rect)
  elseif scene.kind == "fn" then
    local fn = findFn(scene.file, scene.name)
    if not fn then
      addLog("error", "Preview function '" .. scene.name .. "' was not found. It must be a top-level local, a global, or a field of one.", scene.file, scene.line)
      return
    end
    local nparams = debug.getinfo(fn, "u").nparams
    if nparams > 0 then guarded(fn, gameRoot().obj) else guarded(fn) end
  end
end

function __rs3_fireHook(id, hookName)
  local rec = S.comps[id]
  if not rec then return end
  if rec.type == "Check" then rec.props.value = not rec.props.value end
  local h = rec.hooks[hookName]
  if h then guarded(h.fn, rec.obj) end
end

function __rs3_fireEvent(name)
  local e = S.subs[name]
  if not e then return end
  for _, ref in ipairs(e.order) do
    local s = e.refs[ref]
    if s then guarded(s.fn, setmetatable({}, payloadMT)) end
  end
end

---------------------------------------------------------------- export
function __rs3_dump()
  local comps = {}
  for id, rec in pairs(S.comps) do
    if not rec.destroyed then
      local x, y, w, h = resolve(rec)
      local hooks = {}
      for k, v in pairs(rec.hooks) do hooks[#hooks + 1] = { name = k, file = v.file, line = v.line } end
      comps[#comps + 1] = {
        id = id, type = rec.type, kind = rec.kind, title = rec.title, root = rec.root or false,
        parent = rec.parent, children = rec.children, x = x, y = y, w = w, h = h,
        posSet = rec.posSet, sizeSet = rec.sizeSet, pos = rec.pos, size = rec.size,
        props = rec.props, calls = rec.calls, hooks = hooks, file = rec.file, line = rec.line, scene = rec.scene,
      }
    end
  end
  table.sort(comps, function(a, b) return a.id < b.id end)
  local subs = {}
  for _, name in ipairs(S.subOrder) do
    local e = S.subs[name]
    local first
    for _, ref in ipairs(e.order) do if e.refs[ref] then first = e.refs[ref]; break end end
    if first then subs[#subs + 1] = { name = name, file = first.file, line = first.line } end
  end
  local okEncode, json = pcall(encode, { comps = comps, roots = S.roots, logs = S.logs, subs = subs, sheets = __rs3_sheets() })
  if not okEncode then return '{"comps":[],"roots":[],"logs":[{"kind":"error","msg":' .. jsonStr("preview export failed: " .. tostring(json)) .. '}],"subs":[]}' end
  return json
end
