// Builds api-index.json (used by the API Explorer / search / docs lookup)
// by parsing the LuaLS annotation files in ../library.
'use strict';
const fs = require('fs');
const path = require('path');

const LIB = path.join(__dirname, '..', 'library');
const OUT = path.join(__dirname, '..', 'api-index.json');
const DOCS_BASE = 'https://developer.runescape.com/rs/';

const GROUPS = [
  { id: 'globals', label: 'Globals', icon: 'globe', docs: 'getting-started.html' },
  { id: 'events', label: 'Events', icon: 'zap', docs: 'core/events.html' },
  { id: 'core', label: 'Core', icon: 'gear', docs: 'core/index.html' },
  { id: 'game', label: 'Game', icon: 'game', docs: 'game/index.html' },
  { id: 'entity', label: 'Entities & Lists', icon: 'person', docs: 'game/index.html' },
  { id: 'config', label: 'Config types', icon: 'database', docs: 'game/index.html' },
  { id: 'math', label: 'Math', icon: 'symbol-numeric', docs: 'math/index.html' },
  { id: 'ui', label: 'UI', icon: 'layout', docs: 'ui/index.html' },
  { id: 'other', label: 'Other', icon: 'question' }
];
const DIR_GROUP = { core: 'core', game: 'game', config: 'config', entity: 'entity', math: 'math', ui: 'ui', ui2: 'ui' };
const FLATTEN = new Set(['ui']); // pure namespaces: show their children directly

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith('.lua') ? [path.join(dir, d.name)] : []);
}

const entries = new Map(); // full -> entry
const classToGlobal = new Map();
const classDocs = new Map();
let currentFileDocs;

function relDocs(u) { return u ? u.replace(DOCS_BASE, '') : undefined; }
function cleanDoc(lines) {
  return lines.join('\n').replace(/\[Docs\]\([^)]*\)/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
function add(e) {
  if (!e.docs && currentFileDocs) e.docs = currentFileDocs;
  const prev = entries.get(e.full);
  if (prev) { // merge: keep the richer one
    for (const k of Object.keys(e)) if (e[k] && !prev[k]) prev[k] = e[k];
    if (e.kind !== 'class' && prev.kind === 'class' && e.kind === 'global') {}
    return prev;
  }
  entries.set(e.full, e);
  return e;
}

for (const file of walk(LIB)) {
  const rel = path.relative(LIB, file).split(path.sep);
  const fileGroup = DIR_GROUP[rel[0]] || 'other';
  const raw = fs.readFileSync(file, 'utf8');
  const fdm = raw.match(/\[Docs\]\((https?:[^)#]+)/);
  currentFileDocs = fdm ? relDocs(fdm[1]) : undefined;
  const src = raw.split(/\r?\n/);
  let block = { doc: [], params: [], returns: [], fields: [], cls: null, enumName: null, alias: null, docsUrl: null };
  let inEnum = null;
  const reset = () => { block = { doc: [], params: [], returns: [], fields: [], cls: null, enumName: null, alias: null, docsUrl: null }; };

  for (let i = 0; i < src.length; i++) {
    const line = src[i];
    const t = line.trim();

    if (inEnum) {
      if (/^}/.test(t)) { inEnum = null; continue; }
      const m = t.match(/^\[?["']?([A-Za-z_][\w]*)["']?\]?\s*=\s*([^,]+?),?\s*(?:--+\s*(.*))?$/);
      if (m) add({ full: inEnum.full + '.' + m[1], name: m[1], kind: 'enumMember', parent: inEnum.full,
        group: inEnum.group, detail: '= ' + m[2].trim(), doc: m[3] || '', docs: inEnum.docs, snippet: inEnum.full + '.' + m[1] });
      continue;
    }

    if (t.startsWith('---')) {
      const a = t.replace(/^---\s?/, '');
      let m;
      if (t === '---@meta' || t.startsWith('---@meta ')) continue;
      if ((m = a.match(/^@class\s+([\w.]+)(?:\s*:\s*([\w.,\s]+))?/))) { block.cls = { name: m[1], parent: m[2] && m[2].trim() }; continue; }
      if ((m = a.match(/^@field\s+([\w]+)(\??)\s+(.+?)(?:\s{1,}(?=[A-Z(]|[a-z]{2,}\s)(.*))?$/))) {
        // split "type rest-of-description" — type ends at first space not inside <>/()/{}
        const restAll = a.replace(/^@field\s+[\w]+\??\s+/, '');
        let depth = 0, cut = restAll.length;
        for (let k = 0; k < restAll.length; k++) {
          const c = restAll[k];
          if ('<({['.includes(c)) depth++;
          else if ('>)}]'.includes(c)) depth--;
          else if (c === ' ' && depth === 0 && !/[|,:]/.test(restAll[k - 1] || '') && !/[|,]/.test(restAll[k + 1] || '')) { cut = k; break; }
        }
        block.fields.push({ name: m[1], optional: !!m[2], type: restAll.slice(0, cut), desc: restAll.slice(cut).trim() });
        continue;
      }
      if ((m = a.match(/^@param\s+([\w.]+)(\??)\s+(\S+)\s*(.*)$/))) { block.params.push({ name: m[1], optional: !!m[2], type: m[3], desc: m[4] }); continue; }
      if ((m = a.match(/^@return\s+(\S+)\s*(.*)$/))) { block.returns.push(m[1]); continue; }
      if ((m = a.match(/^@enum\s+([\w.]+)/))) { block.enumName = m[1]; continue; }
      if ((m = a.match(/^@alias\s+([\w.]+)\s+(.*)$/))) {
        add({ full: m[1], name: m[1], kind: 'alias', group: fileGroup, detail: m[2], doc: cleanDoc(block.doc), snippet: m[1], typeOnly: true });
        continue;
      }
      if (a.startsWith('@')) continue; // other annotations
      const dm = a.match(/\[Docs\]\(([^)]+)\)/);
      if (dm) block.docsUrl = dm[1];
      block.doc.push(a);
      continue;
    }

    if (t === '' || t.startsWith('--')) {
      if (t === '' && (block.cls || block.fields.length) && !block.consumed) {
        // annotation-only class (no table assignment)
        emitClass(null);
      }
      if (t === '') reset();
      continue;
    }

    // ---- code line
    let m;
    if ((m = t.match(/^(?:local\s+)?([\w.]+)\s*=\s*(\{)?/)) && !t.startsWith('function')) {
      const target = m[1];
      if (block.enumName) {
        const full = target;
        const ent = add({ full, name: full.split('.').pop(), kind: 'enum', group: groupFor(full, fileGroup), doc: cleanDoc(block.doc), docs: relDocs(block.docsUrl), snippet: full, parent: parentOf(full) });
        if (!/}\s*$/.test(t)) inEnum = ent;
        reset();
        continue;
      }
      emitClass(target.startsWith('local') ? null : target, t.startsWith('local'));
      reset();
      continue;
    }
    if ((m = t.match(/^function\s+([\w.]+)([.:])([\w]+)\s*\(([^)]*)\)/))) {
      const owner = m[1], sep = m[2], name = m[3];
      const ownerFull = classToGlobal.get(owner) || owner;
      const params = block.params.filter(p => p.name !== 'self');
      const sig = `function ${ownerFull}${sep}${name}(${params.map(p => p.name + (p.optional ? '?' : '') + ': ' + p.type).join(', ')})` +
        (block.returns.length ? ': ' + block.returns.join(', ') : '');
      const isEvent = /^Event\./.test(ownerFull);
      const full = ownerFull + sep + name;
      const req = params.filter(p => !p.optional && p.name !== '...');
      const call = `${name}(${req.map((p, i) => '${' + (i + 1) + ':' + p.name + '}').join(', ')})`;
      add({
        full, name, kind: sep === ':' ? 'method' : 'function', parent: ownerFull, group: groupFor(ownerFull, fileGroup, isEvent),
        detail: `(${params.map(p => p.name + (p.optional ? '?' : '')).join(', ')})` + (block.returns.length ? ' → ' + block.returns.join(', ') : ''),
        signature: sig, doc: cleanDoc(block.doc) + paramDoc(params), docs: relDocs(block.docsUrl) || inheritDocs(ownerFull),
        snippet: sep === ':' ? call : `${ownerFull}.${call}`
      });
      ensureParent(ownerFull, fileGroup);
      reset();
      continue;
    }
    if ((m = t.match(/^function\s+([\w]+)\s*\(([^)]*)\)/))) { // bare global function
      const name = m[1];
      const params = block.params;
      const req = params.filter(p => !p.optional && p.name !== '...');
      add({
        full: name, name, kind: 'function', group: 'globals',
        detail: `(${params.map(p => p.name + (p.optional ? '?' : '')).join(', ')})` + (block.returns.length ? ' → ' + block.returns.join(', ') : ''),
        signature: `function ${name}(${params.map(p => p.name + (p.optional ? '?' : '') + ': ' + p.type).join(', ')})` + (block.returns.length ? ': ' + block.returns.join(', ') : ''),
        doc: cleanDoc(block.doc) + paramDoc(params), docs: relDocs(block.docsUrl) || 'getting-started.html',
        snippet: `${name}(${req.map((p, i) => '${' + (i + 1) + ':' + p.name + '}').join(', ')})`
      });
      reset();
      continue;
    }
    reset();
  }

  function emitClass(globalName, isLocal) {
    block.consumed = true;
    const cls = block.cls;
    const full = (!isLocal && globalName) || (cls && cls.name);
    if (!full) return;
    if (cls && globalName && !isLocal) classToGlobal.set(cls.name, globalName);
    if (cls && isLocal && globalName) classToGlobal.set(globalName, cls.name);
    const docs = relDocs(block.docsUrl);
    if (cls) classDocs.set(cls.name, docs);
    const isEvent = /^Event\./.test(full) || (cls && /Event$/.test(cls.name) && fileGroup === 'core' && /events/.test(file));
    const kind = /^Event\./.test(full) ? 'event' : (cls ? 'class' : 'global');
    add({
      full, name: full.split('.').pop(), kind, parent: parentOf(full), group: groupFor(full, fileGroup, isEvent),
      detail: cls && cls.parent ? ': ' + cls.parent : (cls && globalName && cls.name !== globalName ? cls.name : ''),
      signature: cls ? `---@class ${cls.name}${cls.parent ? ' : ' + cls.parent : ''}` : full,
      doc: cleanDoc(block.doc), docs, snippet: full, className: cls && cls.name, typeOnly: !globalName || isLocal
    });
    for (const f of block.fields) {
      add({ full: full + '.' + f.name, name: f.name, kind: 'field', parent: full, group: groupFor(full, fileGroup, isEvent),
        detail: f.type + (f.optional ? '?' : ''), signature: `${f.name}: ${f.type}`, doc: f.desc, docs,
        snippet: f.name });
    }
  }
}

function paramDoc(params) {
  const ds = params.filter(p => p.desc);
  return ds.length ? '\n\n' + ds.map(p => `*@param* \`${p.name}\` — ${p.desc}`).join('  \n') : '';
}
function parentOf(full) {
  const i = Math.max(full.lastIndexOf('.'), full.lastIndexOf(':'));
  if (i < 0) return undefined;
  const p = full.slice(0, i);
  return FLATTEN.has(p) ? undefined : p;
}
function groupFor(full, fallback, isEvent) {
  if (isEvent || /^Event(\.|$)/.test(full)) return 'events';
  return fallback;
}
function inheritDocs(owner) {
  const e = entries.get(owner);
  return (e && e.docs) || classDocs.get(owner);
}
function ensureParent(full, group) {
  if (!entries.has(full) && !FLATTEN.has(full)) add({ full, name: full.split('.').pop(), kind: 'class', parent: parentOf(full), group: groupFor(full, group), doc: '', snippet: full });
}

// tidy: drop the pure-namespace entries, fix parents that don't exist, inherit docs
for (const n of FLATTEN) entries.delete(n);
for (const e of entries.values()) {
  if (e.parent && !entries.has(e.parent)) {
    // nearest existing ancestor
    let p = e.parent;
    while (p && !entries.has(p)) p = parentOf(p);
    e.parent = p;
  }
  if (!e.docs && e.parent) {
    let p = entries.get(e.parent);
    while (p && !p.docs && p.parent) p = entries.get(p.parent);
    if (p && p.docs) e.docs = p.docs;
  }
  if (e.kind === 'class' && e.parent && entries.get(e.parent)) e.group = entries.get(e.parent).group;
}
// children follow their parent's group so the tree is consistent
let changed = true;
while (changed) {
  changed = false;
  for (const e of entries.values()) {
    const p = e.parent && entries.get(e.parent);
    if (p && p.group !== e.group) { e.group = p.group; changed = true; }
  }
}

// colon methods on real global tables (PersistentDB:Get) insert with their owner
for (const e of entries.values()) {
  if (e.kind === 'method' && e.parent) {
    const p = entries.get(e.parent);
    if (p && p.typeOnly === false && p.className && p.className !== p.full && /^[A-Za-z_][\w.]*$/.test(p.full)) e.snippet = p.full + ':' + e.snippet;
  }
}
const list = [...entries.values()].sort((a, b) => a.full.localeCompare(b.full));
const used = new Set(list.map(e => e.group));
const out = { generated: new Date().toISOString(), groups: GROUPS.filter(g => used.has(g.id)), entries: list };
fs.writeFileSync(OUT, JSON.stringify(out));
const counts = {};
for (const e of list) counts[e.kind] = (counts[e.kind] || 0) + 1;
console.log(`api-index.json: ${list.length} entries`, counts);
