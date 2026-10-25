// RS3 API Probe: pure helpers (no VS Code APIs) for generating the probe plugin and reading its results.
'use strict';
const fs = require('fs');
const path = require('path');

function toLua(v, ind = '') {
  if (v === null || v === undefined) return 'nil';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.every(x => typeof x !== 'object' || x === null || (Array.isArray(x) && x.every(y => typeof y !== 'object')))) return '{' + v.map(x => toLua(x)).join(',') + '}';
    return '{\n' + v.map(x => ind + '  ' + toLua(x, ind + '  ')).join(',\n') + '\n' + ind + '}';
  }
  return '{\n' + Object.entries(v).map(([k, x]) => ind + '  ' + (/^[A-Za-z_]\w*$/.test(k) ? k : '[' + JSON.stringify(k) + ']') + ' = ' + toLua(x, ind + '  ')).join(',\n') + '\n' + ind + '}';
}

const ROOT_EXTRA = ['ui', 'id', 'var', 'config', 'game', 'audio'];
const SAMPLE_CLASSES = ['PlayerEntity', 'Vector2', 'Vector3', 'Vector4', 'ui.Pos', 'ui.Size', 'ui.Margin', 'ui.TextData', 'ui.SpriteData', 'ui.StyleSheet'];

/** Everything the probe should look for, derived from api-index.json. */
function buildExpected(index, styleSheets) {
  const byFull = new Map(index.entries.map(e => [e.full, e]));
  const rootOf = full => full.split(/[.:]/)[0];
  const isRooted = full => {
    const r = rootOf(full);
    if (r === 'ui') return true; // ui.* tables are real globals under ui
    const e = byFull.get(r);
    return !!e && e.typeOnly !== true;
  };
  const isSingleton = e => e && e.typeOnly !== true && e.className && e.className !== e.full;
  const statics = [];
  const seen = new Set();
  const add = (p, k) => { if (!seen.has(p)) { seen.add(p); statics.push([p, k]); } };
  const members = {};
  for (const e of index.entries) {
    if (e.kind === 'alias') continue;
    const parent = e.parent ? byFull.get(e.parent) : null;
    if (['class', 'global', 'enum', 'event'].includes(e.kind) && e.typeOnly !== true && isRooted(e.full)) add(e.full, 't');
    else if (e.kind === 'function' && !e.full.includes(':') && isRooted(e.full) && (!parent || parent.typeOnly !== true)) add(e.full, 'f');
    else if (e.kind === 'method' && parent && isSingleton(parent)) add(e.full.replace(':', '.'), 'f');
    else if (e.kind === 'enumMember' && isRooted(e.full)) {
      if (/^= -?\d+$/.test(e.detail || '')) { if (!seen.has(e.full)) { seen.add(e.full); statics.push([e.full, 'n', +e.detail.slice(2)]); } }
      else add(e.full, 'v');
    }
    else if (e.kind === 'field' && parent && parent.typeOnly !== true && isRooted(e.full) &&
      (isSingleton(parent) || parent.kind === 'enum' || /Enum$/.test(parent.className || ''))) add(e.full, 'v');
    if (e.parent && parent && parent.typeOnly !== true && isRooted(e.parent)) (members[e.parent] = members[e.parent] || []).push(e.name);
  }
  // instance members (with inheritance) for classes the probe can make a sample of
  const ownMembers = full => index.entries.filter(x => x.parent === full && (x.kind === 'field' || x.kind === 'method')).map(x => [x.name, x.kind === 'method' ? 'f' : 'v']);
  const parentsOf = full => {
    const e = byFull.get(full);
    const d = e && e.detail && e.detail.startsWith(': ') ? e.detail.slice(2) : '';
    return d ? d.split(',').map(s => s.trim()).filter(Boolean) : [];
  };
  const allMembers = (full, seenCls = new Set()) => {
    if (seenCls.has(full)) return [];
    seenCls.add(full);
    const out = new Map(ownMembers(full).map(m => [m[0], m]));
    for (const p of parentsOf(full)) for (const m of allMembers(p, seenCls)) if (!out.has(m[0])) out.set(m[0], m);
    return [...out.values()];
  };
  const uiTypes = [];
  for (const e of index.entries) {
    const m = e.kind === 'function' && e.full.match(/^ui\.(\w+)\.new$/);
    if (m && /\(parent/.test(e.signature || '')) uiTypes.push(m[1]);
  }
  const instances = {};
  for (const cls of [...uiTypes.map(t => 'ui.' + t), ...SAMPLE_CLASSES]) {
    const mem = allMembers(cls);
    if (mem.length) instances[cls] = mem;
  }
  const globals = new Set(ROOT_EXTRA);
  // every documented top-level name (type-only names simply never appear in _G)
  for (const e of index.entries) if (!/[.:]/.test(e.full)) globals.add(e.full);
  return { statics, instances, members, globals: [...globals].sort(), uiTypes: uiTypes.sort(), styleSheets };
}

function generateProbe(index, version, styleSheets) {
  const tpl = fs.readFileSync(path.join(__dirname, 'template.lua'), 'utf8');
  const expected = buildExpected(index, styleSheets);
  return {
    lua: tpl.replace(/\{\{VERSION\}\}/g, version).replace('{{EXPECTED}}', toLua(expected)),
    expected
  };
}

/**
 * Beta console commands that load a generated dev plugin with HTTP access. The client names
 * plugins by folder (plugins_list shows "rs3_api_probe"), not by the manifest "name".
 */
function consoleCommands(folder) {
  return ['prf', `pon ${folder}`, `ppr ${folder}`, `ppe ${folder} httpAccess`, `prl ${folder}`];
}

/** Reassemble RS3P|run|tag|i/n|chunk lines from pasted console text. */
function parseConsole(text) {
  const groups = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const at = line.indexOf('RS3P|');
    if (at < 0) continue;
    const rest = line.slice(at + 5);
    const m = rest.match(/^(\d+)\|(\w+)\|(\d+)\/(\d+)\|(.*)$/);
    if (!m) continue;
    const key = m[1] + '|' + m[2];
    const g = groups.get(key) || { run: m[1], tag: m[2], n: +m[4], parts: new Map() };
    g.parts.set(+m[3], m[5].replace(/\s+$/, ''));
    groups.set(key, g);
  }
  const results = [], problems = [];
  for (const g of groups.values()) {
    const missing = [];
    for (let i = 1; i <= g.n; i++) if (!g.parts.has(i)) missing.push(i);
    if (missing.length) { problems.push(`Run ${g.run} (${g.tag}) is missing ${missing.length} of ${g.n} lines (${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '…' : ''}).`); continue; }
    const json = Array.from({ length: g.n }, (_, i) => g.parts.get(i + 1)).join('');
    try { results.push(JSON.parse(json)); } catch (e) { problems.push(`Run ${g.run} (${g.tag}) could not be read: ${e.message}`); }
  }
  return { results, problems };
}

/** Turn a probe report (plus optional layers payload) into findings. */
function analyze(report, layers, index) {
  const byFull = new Map(index.entries.map(e => [e.full, e]));
  const f = { counts: report.counts, missing: report.missing || [], wrongType: report.wrongType || {}, errors: report.errors || {},
    instanceProblems: {}, undocumented: {}, undocumentedGlobals: report.extraGlobals || {}, enums: {}, defaults: {},
    layers: layers || null, screen: report.meta && report.meta.screen, styles: report.styles || { keys: {}, sheets: {} },
    ids: report.ids || {}, notes: report.notes || [] };
  // enum values the docs don't give
  for (const [p, v] of Object.entries(report.values || {})) {
    if (typeof v !== 'number') continue;
    const e = byFull.get(p);
    const parent = e && e.parent && byFull.get(e.parent);
    if (!e || !parent) continue;
    const documented = e.kind === 'enumMember' && /^= -?\d+$/.test(e.detail || '');
    const enumLike = parent.kind === 'enum' || /Enum$/.test(parent.className || '');
    if (enumLike) (f.enums[parent.full] = f.enums[parent.full] || {})[e.name] = { value: v, documented, docValue: documented ? +e.detail.slice(2) : undefined };
  }
  for (const [cls, res] of Object.entries(report.instances || {})) {
    const bad = [], defaults = {};
    for (const [name, r] of Object.entries(res.members || {})) {
      if (r.bad) bad.push({ name, type: r.t, err: r.err });
      if (r.v !== undefined) defaults[name] = r.v;
    }
    if (bad.length) f.instanceProblems[cls] = bad;
    if (Object.keys(defaults).length) f.defaults[cls] = defaults;
    if (res.extra && res.extra.length) f.undocumented[cls] = res.extra;
  }
  for (const [g, extra] of Object.entries(report.extra || {})) f.undocumented[g] = (f.undocumented[g] || []).concat(extra);
  return f;
}

function markdown(f, run, when) {
  const L = [];
  const c = f.counts || {};
  const total = (c.ok || 0) + (c.missing || 0) + (c.wrongType || 0) + (c.error || 0);
  L.push(`# RS3 API Probe report`, '', `Run ${run} · ${when}`, '');
  L.push(`**${total}** names checked against the real client: **${c.ok}** found, **${c.missing}** missing, **${c.wrongType}** wrong type, **${c.error}** errors.`, '');
  const sec = (title, lines) => { if (lines.length) L.push(`## ${title}`, '', ...lines, ''); };
  sec('In the definitions but not in the client', f.missing.slice(0, 400).map(p => `- \`${p}\``));
  sec('Different type than documented', Object.entries(f.wrongType).map(([p, t]) => `- \`${p}\` is a **${t}**`));
  sec('Errors while checking', Object.entries(f.errors).slice(0, 100).map(([p, e]) => `- \`${p}\`: ${e}`));
  sec('Instance members that did not resolve', Object.entries(f.instanceProblems).map(([cls, bad]) =>
    `- **${cls}**: ` + bad.map(b => `\`${b.name}\` (${b.type}${b.err ? ': ' + String(b.err).slice(0, 60) : ''})`).join(', ')));
  if (Object.keys(f.instanceProblems).length) L.push('_A `nil` field can also be a property that is simply unset on a fresh component._', '');
  sec('Found in the client but not in the docs', Object.entries(f.undocumented).map(([cls, names]) => `- **${cls}**: ${names.slice(0, 80).map(n => '`' + n + '`').join(', ')}${names.length > 80 ? ' …' : ''}`));
  sec('Globals not in the docs', Object.entries(f.undocumentedGlobals).map(([k, t]) => `- \`${k}\` (${t})`));
  const enumLines = [];
  for (const [en, vals] of Object.entries(f.enums)) {
    const undoc = Object.entries(vals).filter(([, x]) => !x.documented);
    const diff = Object.entries(vals).filter(([, x]) => x.documented && x.docValue !== x.value);
    if (undoc.length) enumLines.push(`- **${en}**: ` + undoc.map(([k, x]) => `${k} = ${x.value}`).join(', '));
    if (diff.length) enumLines.push(`- **${en}** values differ from the docs: ` + diff.map(([k, x]) => `${k} is ${x.value} (docs ${x.docValue})`).join(', '));
  }
  sec('Enum values (undocumented or different)', enumLines);
  if (f.layers || f.screen) {
    const lines = [];
    if (f.screen) lines.push(`- Plugin build layer (game window): ${f.screen.w} × ${f.screen.h}`);
    if (f.layers && f.layers.ribbon) lines.push(`- Ribbon plugin window: **${f.layers.ribbon.w} × ${f.layers.ribbon.h}** at ${f.layers.ribbon.x}, ${f.layers.ribbon.y}`);
    if (f.layers && f.layers.settings) lines.push(`- Settings window: **${f.layers.settings.w} × ${f.layers.settings.h}** at ${f.layers.settings.x}, ${f.layers.settings.y}`);
    if (!f.layers) lines.push('- Ribbon/settings windows not measured yet: open both icons while the probe is enabled.');
    sec('Window sizes', lines);
  }
  sec('Default values of a new component', Object.entries(f.defaults).filter(([cls]) => cls.startsWith('ui.')).slice(0, 40).map(([cls, d]) =>
    `- **${cls}**: ` + Object.entries(d).slice(0, 18).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')));
  const sk = Object.keys(f.styles.keys || {}).length, ss = Object.keys(f.styles.sheets || {}).length;
  sec('Stylesheets', [`- ${sk} ui.StyleValue keys, values for ${ss} built-in stylesheets.`,
    ...(f.ids.StyleSheet ? [`- id.StyleSheet has ${Object.keys(f.ids.StyleSheet).length} names.`] : []),
    ...(f.ids.Font ? [`- id.Font has ${Object.keys(f.ids.Font).length} names: ` + Object.keys(f.ids.Font).slice(0, 40).map(n => '`' + n + '`').join(', ') + (Object.keys(f.ids.Font).length > 40 ? ' …' : '')] : [])]);
  sec('Probe notes', f.notes.slice(0, 60).map(n => '- ' + n));
  return L.join('\n');
}

/** Compact text to paste to Claude so the library can be fixed upstream. */
function summaryForClaude(f, version) {
  const out = [`RS3 API Probe results (extension definitions v${version})`, JSON.stringify(f.counts)];
  if (f.missing.length) out.push('MISSING: ' + f.missing.join(', '));
  if (Object.keys(f.wrongType).length) out.push('WRONG TYPE: ' + Object.entries(f.wrongType).map(([p, t]) => `${p}=${t}`).join(', '));
  for (const [cls, bad] of Object.entries(f.instanceProblems)) out.push(`INSTANCE ${cls}: ` + bad.map(b => `${b.name}=${b.type}`).join(', '));
  for (const [cls, names] of Object.entries(f.undocumented)) out.push(`UNDOCUMENTED ${cls}: ` + names.join(', '));
  if (Object.keys(f.undocumentedGlobals).length) out.push('UNDOCUMENTED GLOBALS: ' + Object.entries(f.undocumentedGlobals).map(([k, t]) => `${k}(${t})`).join(', '));
  for (const [en, vals] of Object.entries(f.enums)) {
    const x = Object.entries(vals).filter(([, v]) => !v.documented || v.docValue !== v.value);
    if (x.length) out.push(`ENUM ${en}: ` + x.map(([k, v]) => `${k}=${v.value}`).join(', '));
  }
  if (f.layers) out.push('LAYERS: ' + JSON.stringify(f.layers));
  if (f.ids.StyleSheet) out.push('id.StyleSheet: ' + Object.keys(f.ids.StyleSheet).join(', '));
  if (f.ids.Font) out.push('id.Font: ' + Object.keys(f.ids.Font).join(', '));
  if (f.notes.length) out.push('NOTES: ' + f.notes.join(' | '));
  return out.join('\n');
}

/** LuaLS annotations for members the probe found that the docs don't mention. */
function additionsLua(f, index) {
  const byFull = new Map(index.entries.map(e => [e.full, e]));
  const L = ['---@meta', '-- Members found in the RuneScape client by the RS3 API Probe but missing from the official docs.', '-- Types are unknown (any). Editor-only file; you do not need to ship it.', ''];
  for (const [owner, names] of Object.entries(f.undocumented)) {
    const e = byFull.get(owner);
    const cls = (e && e.className) || owner;
    const ok = names.filter(n => /^[A-Za-z_]\w*$/.test(n));
    if (!ok.length) continue;
    L.push(`---@class ${cls}`);
    for (const n of ok) L.push(`---@field ${n} any Found by the RS3 API Probe; not in the docs.`);
    L.push('');
  }
  for (const [g, t] of Object.entries(f.undocumentedGlobals)) {
    if (!/^[A-Za-z_]\w*$/.test(g)) continue;
    L.push(t === 'function' ? `--- Found by the RS3 API Probe; not in the docs.\nfunction ${g}(...) end` : `--- Found by the RS3 API Probe; not in the docs.\n---@type any\n${g} = nil`, '');
  }
  return L.join('\n');
}

/** Enum values for the preview runtime: { "ui.AlignMode": { CENTRE: 4, … } } */
function enumValues(f) {
  const out = {};
  for (const [en, vals] of Object.entries(f.enums)) for (const [k, v] of Object.entries(vals)) (out[en] = out[en] || {})[k] = v.value;
  return out;
}

module.exports = { buildExpected, generateProbe, consoleCommands, parseConsole, analyze, markdown, summaryForClaude, additionsLua, enumValues, toLua };
