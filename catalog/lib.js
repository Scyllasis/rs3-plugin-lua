// Item catalog: pure helpers (no VS Code APIs).
// Sources: the RS Wiki's public item data (released items only) and the player's own
// bank/backpack/worn items exported from the client (player-known information).
'use strict';
const fs = require('fs');
const path = require('path');

const WIKI_API = 'https://runescape.wiki/api.php';
const PAGE = 5000;

function wikiQueryUrl(offset) {
  const q = `bucket('infobox_item').select('page_name','item_id','item_name').limit(${PAGE}).offset(${offset}).run()`;
  return `${WIKI_API}?action=bucket&format=json&formatversion=2&query=${encodeURIComponent(q)}`;
}

const asList = v => v == null ? [] : Array.isArray(v) ? v : [v];
/** Rows from a Bucket response -> [{ id, name, page }]. Tolerates the shapes the docs show. */
function parseWikiRows(json) {
  if (json && json.error) throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error));
  const rows = (json && (json.bucket || (json.query && json.query.bucket))) || [];
  if (!Array.isArray(rows)) throw new Error('unexpected response from the wiki');
  const out = [];
  out.raw = rows.length;
  for (const r of rows) {
    const page = asList(r.page_name)[0] || '';
    const names = asList(r.item_name).map(String).filter(Boolean);
    const ids = asList(r.item_id).flatMap(x => String(x).split(/[,;\s]+/)).map(s => parseInt(s, 10)).filter(n => Number.isInteger(n) && n >= 0);
    ids.forEach((id, i) => out.push({ id, name: names[i] || names[0] || page, page }));
  }
  return out;
}

/** Download every item from the wiki, page by page. fetchJson(url) -> Promise<json>. */
async function downloadWiki(fetchJson, onProgress) {
  const all = [];
  for (let page = 0; page < 40; page++) {
    const rows = parseWikiRows(await fetchJson(wikiQueryUrl(page * PAGE)));
    all.push(...rows);
    if (onProgress) onProgress(all.length, page + 1);
    if (rows.raw < PAGE) break; // a short page is the last one
  }
  const seen = new Set();
  return all.filter(r => { const k = r.id + '|' + r.name; if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Merge wiki rows and exported items into one list keyed by item id. */
function merge(wiki, mine) {
  const byId = new Map();
  for (const w of wiki || []) {
    const e = byId.get(w.id) || { id: w.id, names: [], sources: [] };
    if (!e.names.includes(w.name)) e.names.push(w.name);
    if (w.page && !e.page) e.page = w.page;
    if (!e.sources.includes('wiki')) e.sources.push('wiki');
    byId.set(w.id, e);
  }
  for (const m of mine || []) {
    const e = byId.get(m.id) || { id: m.id, names: [], sources: [] };
    if (m.name && !e.names.includes(m.name)) e.names.unshift(m.name);
    if (m.configName) e.configName = m.configName;
    if (m.cost != null) e.cost = m.cost;
    if (m.where) e.where = m.where;
    if (!e.sources.includes('mine')) e.sources.push('mine');
    byId.set(m.id, e);
  }
  return [...byId.values()].sort((a, b) => (a.names[0] || '').localeCompare(b.names[0] || '') || a.id - b.id);
}

/** What to insert for an item: the config name when known (stable across updates), else the number. */
function insertText(e, mode) {
  const name = e.names[0] || ('item ' + e.id);
  if (mode === 'number' || !e.configName) return `${e.id} --[[ ${name.replace(/\]\]/g, '] ]')} ]]`;
  return /^[A-Za-z_]\w*$/.test(e.configName) ? `id.Obj.${e.configName}` : `id.Obj[${JSON.stringify(e.configName)}]`;
}

const wikiUrl = e => e.page ? 'https://runescape.wiki/w/' + encodeURIComponent(e.page.replace(/ /g, '_')).replace(/%2F/g, '/') : null;

/** Items payload from the export plugin -> rows for merge(). */
function parseExport(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.filter(i => Number.isInteger(i.id)).map(i => ({ id: i.id, name: i.name, configName: i.configName, cost: i.cost, where: i.where }));
}

function readJson(file, def) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; } }
function writeJson(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); }

module.exports = { WIKI_API, wikiQueryUrl, parseWikiRows, downloadWiki, merge, insertText, wikiUrl, parseExport, readJson, writeJson };
