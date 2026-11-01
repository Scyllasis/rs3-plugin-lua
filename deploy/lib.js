// What goes into a deployed plugin or an upload, and how to write a zip. Pure Node: no VS Code.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SKIP_FOLDERS = new Set(['node_modules', 'docs', 'doc', 'tools', 'test', 'tests', 'dist', 'spec']);
const SKIP_FILES = /^(rs3preview\.lua|.*\.(zip|log|tmp|vsix|map|bak|broken-\d+))$/i;

/** The plugin's own files, relative with forward slashes. Links are skipped: they can lead anywhere. */
function listFiles(root) {
  const out = [];
  const walk = (dir, prefix, depth) => {
    if (depth > 12) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const rel = prefix ? prefix + '/' + e.name : e.name;
      if (e.isDirectory()) { if (!SKIP_FOLDERS.has(e.name)) walk(path.join(dir, e.name), rel, depth + 1); }
      else if (e.isFile() && !SKIP_FILES.test(e.name)) out.push(rel);
    }
  };
  walk(root, '', 0);
  return out.sort();
}

/** The client names a dev plugin by its folder, so this is also the name in console commands. */
function folderName(manifest, root) {
  const from = (manifest && manifest.name) || path.basename(root);
  const out = String(from).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return out || 'plugin';
}
const validFolder = s => typeof s === 'string' && /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(s);

/** What to delete from a previous deploy: only files we put there ourselves. */
const stale = (previous, current) => {
  const keep = new Set(current);
  return (previous || []).filter(f => !keep.has(f));
};

function pathsOverlap(a, b) {
  const within = (x, y) => { const r = path.relative(y, x); return !r || (!r.startsWith('..') && !path.isAbsolute(r)); };
  return within(a, b) || within(b, a);
}

/** Copies a plugin into dest. Removes only what the last deploy left and this one doesn't include. */
function deploy(root, dest, previous) {
  if (pathsOverlap(path.resolve(root), path.resolve(dest))) throw new Error('The deploy folder overlaps the plugin folder.');
  const files = listFiles(root);
  for (const rel of files) {
    const to = path.join(dest, ...rel.split('/'));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(root, ...rel.split('/')), to);
  }
  const removed = [];
  const base = path.resolve(dest);
  for (const rel of stale(previous, files)) {
    const target = path.resolve(base, rel);
    const inside = path.relative(base, target);
    if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) continue; // a tampered list can't reach outside
    try { fs.unlinkSync(target); removed.push(rel); } catch { /* already gone */ }
  }
  return { files, removed };
}

// ---------------------------------------------------------------- zip
let crcTable;
function crc32(data) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) crc = crcTable[(crc ^ data[i]) & 255] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

/** A zip of { name, data } entries, with names as given (forward slashes). */
function makeZip(entries) {
  const parts = [], central = [];
  let offset = 0;
  const date = new Date();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const packed = zlib.deflateRawSync(raw);
    const store = packed.length >= raw.length;
    const body = store ? raw : packed;
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(store ? 0 : 8, 8); local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, body);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(20, 6); head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(store ? 0 : 8, 10); head.writeUInt16LE(dosTime, 12); head.writeUInt16LE(dosDate, 14);
    head.writeUInt32LE(crc, 16); head.writeUInt32LE(body.length, 20); head.writeUInt32LE(raw.length, 24);
    head.writeUInt16LE(name.length, 28); head.writeUInt32LE(offset, 42);
    central.push(head, name);
    offset += local.length + name.length + body.length;
  }
  const size = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(size, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...central, end]);
}

module.exports = { listFiles, folderName, validFolder, stale, pathsOverlap, deploy, makeZip, crc32 };
