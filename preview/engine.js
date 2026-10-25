// Runs a plugin's Lua against the mock client (runtime.lua) using Lua 5.4 compiled to WebAssembly.
// Pure Node: no VS Code APIs, so it can be tested on its own.
'use strict';
const fs = require('fs');
const path = require('path');

let factoryPromise = null;
function getFactory() {
  if (!factoryPromise) {
    const { LuaFactory } = require('../vendor/wasmoon');
    factoryPromise = Promise.resolve(new LuaFactory());
  }
  return factoryPromise;
}

const RUNTIME = fs.readFileSync(path.join(__dirname, 'runtime.lua'), 'utf8');

// ---- data derived once from api-index.json
let apiData = null;
function loadApiData(indexPath) {
  if (apiData) return apiData;
  const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const enums = {};
  const globals = new Set();
  const uiTypes = new Set();
  const nested = {};
  for (const e of idx.entries) {
    if (e.kind === 'enumMember' && /^= -?\d+$/.test(e.detail || '')) {
      (enums[e.parent] = enums[e.parent] || {})[e.name] = parseInt(e.detail.slice(2), 10);
    }
    if (!/[.:]/.test(e.full) && !e.typeOnly && ['class', 'global', 'enum'].includes(e.kind)) globals.add(e.full);
    let m;
    if (e.kind === 'function' && (m = e.full.match(/^ui\.(\w+)\.new$/)) && /\(parent/.test(e.signature || '')) uiTypes.add(m[1]);
    if (e.kind === 'field' && /^ui\./.test(e.parent || '') &&
        /^ui\.(TextData|SpriteData|Margin|ScrollBar|LabelData|Component\w*Config)\b/.test(e.detail || '')) nested[e.name] = true;
  }
  for (const g of ['id', 'var', 'config', 'game', 'audio']) globals.add(g);
  apiData = { enums, globals: [...globals].sort(), uiTypes: [...uiTypes].sort(), nested };
  return apiData;
}

function toLua(v) {
  if (v === null || v === undefined) return 'nil';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
  if (typeof v === 'string') return JSON.stringify(v).replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => '\\u{' + h + '}');
  if (Array.isArray(v)) return '{' + v.map(toLua).join(',') + '}';
  return '{' + Object.entries(v).map(([k, x]) =>
    (/^[A-Za-z_]\w*$/.test(k) ? k : '[' + JSON.stringify(k) + ']') + '=' + toLua(x)).join(',') + '}';
}

// ---- @preview annotations
const PREVIEW_RE = /^\s*---?\s*@preview\b\s*(.*)$/;
function findPreviews(files) {
  const out = [];
  for (const [file, text] of Object.entries(files)) {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(PREVIEW_RE);
      if (!m) continue;
      for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
        const l = lines[j].trim();
        if (!l || l.startsWith('--')) continue;
        const f = l.match(/^local\s+function\s+([A-Za-z_]\w*)/) || l.match(/^function\s+([A-Za-z_][\w.:]*)/) ||
                  l.match(/^local\s+([A-Za-z_]\w*)\s*=\s*function\b/) || l.match(/^([A-Za-z_][\w.]*)\s*=\s*function\b/);
        if (f) out.push({ title: m[1].trim() || f[1], name: f[1].replace(':', '.'), file, line: j + 1 });
        break;
      }
    }
  }
  return out;
}

/**
 * A live session: one Lua state with the plugin loaded and one scene run.
 * opts: { indexPath, readFile(rel)->string|null, cfg:{screenW,screenH,...}, scene:{id,kind,...} }
 */
class Session {
  static async create(opts) {
    const s = new Session();
    await s._init(opts);
    return s;
  }
  async _init({ indexPath, readFile, cfg, scene }) {
    const api = loadApiData(indexPath);
    const factory = await getFactory();
    this.lua = await factory.createEngine({ injectObjects: false, enableProxy: false, traceAllocations: false });
    const g = this.lua.global;
    g.set('__rs3_readFile', (p) => {
      try { const r = readFile(String(p)); return r == null ? undefined : r; } catch { return undefined; }
    });
    const prelude = [
      '__rs3_cfg = ' + toLua(cfg),
      '__rs3_enums = ' + toLua(api.enums),
      '__rs3_globals = ' + toLua(api.globals),
      '__rs3_uiTypes = ' + toLua(api.uiTypes),
      '__rs3_nested = ' + toLua(api.nested),
    ].join('\n');
    await this.lua.doString(prelude);
    await this._run(RUNTIME, '=rs3runtime');
    await this.lua.doString('__rs3_runFile("rs3preview.lua", true)');
    await this.lua.doString('__rs3_gameRoot(); __rs3_runFile("main.lua")');
    if (scene && scene.kind !== 'game') await this.lua.doString('__rs3_runScene(' + toLua(scene) + ')');
  }
  async _run(src, name) {
    // load with a chunk name so runtime errors point at the right place
    this.lua.global.set('__rs3_src', src);
    await this.lua.doString(`local f, e = load(__rs3_src, ${JSON.stringify(name)}); __rs3_src = nil; if not f then error(e) end; f()`);
  }
  async dump() {
    const json = await this.lua.doString('return __rs3_dump()');
    const d = JSON.parse(json);
    // Lua can't tell an empty array from an empty object
    const arr = v => Array.isArray(v) ? v : [];
    d.comps = arr(d.comps); d.roots = arr(d.roots); d.logs = arr(d.logs); d.subs = arr(d.subs);
    for (const c of d.comps) {
      c.children = arr(c.children); c.hooks = arr(c.hooks);
      if (!c.props || Array.isArray(c.props)) c.props = {};
      if (!c.calls || Array.isArray(c.calls)) c.calls = {};
    }
    return d;
  }
  async fireHook(id, hook) {
    await this.lua.doString(`__rs3_fireHook(${Number(id) | 0}, ${toLua(String(hook))})`);
  }
  async fireEvent(name) {
    await this.lua.doString(`__rs3_fireEvent(${toLua(String(name))})`);
  }
  close() {
    try { this.lua.global.close(); } catch { /* already closed */ }
  }
}

module.exports = { Session, findPreviews, loadApiData };
