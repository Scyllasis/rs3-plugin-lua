// What's in a client's PluginData.db, in plain terms. Pure Node: no VS Code. Only ever reads.
'use strict';
const fs = require('fs');
const path = require('path');
const { Database } = require('./sqlite');

const LOG_KEY = /^rs3log\.(\d+)$/;
const TYPE_INT = 1; // the client's Type column; 3 is a string

/** Stored values are blobs. Strings end in a NUL byte; numbers are little-endian. */
function decodeValue(type, value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (type === TYPE_INT && value.length <= 8 && value.length > 0) {
    let n = 0n;
    for (let i = value.length - 1; i >= 0; i -= 1) n = (n << 8n) | BigInt(value[i]);
    return String(BigInt.asIntN(value.length * 8, n));
  }
  const end = value.length && value[value.length - 1] === 0 ? value.length - 1 : value.length;
  return value.subarray(0, end).toString('utf8');
}

/** Every saved value, grouped by plugin. */
function readStore(file) {
  const db = new Database(fs.readFileSync(file));
  const plugins = new Map();
  for (const row of db.table('DataStore')) {
    const name = String(row.PluginID);
    if (!plugins.has(name)) plugins.set(name, []);
    plugins.get(name).push({ key: String(row.Key), type: row.Type, value: decodeValue(row.Type, row.Value) });
  }
  return [...plugins.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, rows]) => ({ name, rows: rows.sort((a, b) => a.key.localeCompare(b.key)) }));
}

/** The lines rs3log.lua saved for a plugin, oldest first. The keys are a ring, so the header says where it starts. */
function logLines(rows) {
  const chunks = rows.filter(r => LOG_KEY.test(r.key)).map(r => ({ n: Number(r.key.match(LOG_KEY)[1]), text: r.value }));
  if (!chunks.length) return null;
  const head = rows.find(r => r.key === 'rs3log.next');
  const next = head ? Number(head.value) : 0;
  chunks.sort((a, b) => ((a.n - next + 1e9) % 1e9) - ((b.n - next + 1e9) % 1e9));
  return chunks.map(c => c.text).join('').split('\n').filter(Boolean);
}

/** PluginData.db next to each dev_plugins folder that has one. */
function databases(devFolders) {
  const out = [];
  for (const dev of devFolders) {
    const file = path.join(path.dirname(dev), 'plugins', 'PluginData.db');
    if (fs.existsSync(file) && !out.some(d => d.file === file)) out.push({ file, label: path.basename(path.dirname(dev)) });
  }
  return out;
}

module.exports = { readStore, logLines, decodeValue, databases };
