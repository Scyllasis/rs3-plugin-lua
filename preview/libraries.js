// Library plugins (PrettyUI) for the UI preview, loaded from the copy the game client already
// downloaded (%ProgramData%\Jagex\RuneScape-BETA\plugins\<hub id>\<hub id>.zip). Nothing is bundled.
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const zlib = require('zlib');

const LIBS = { prettyui: { name: 'PrettyUI', id: 6398181 } };

function clientDirs() {
  const data = process.env.ProgramData || (process.platform === 'win32' ? 'C:\\ProgramData' : path.join(os.homedir(), '.local', 'share'));
  return ['RuneScape-BETA', 'RuneScape'].map(c => path.join(data, 'Jagex', c, 'plugins'));
}

/** Text files of a zip archive: { 'src/window.lua': '...' }. Stored and deflated entries only. */
function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip directory');
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen).replace(/\\/g, '/');
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/') || !/\.(lua|json)$/i.test(name)) continue;
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + csize);
    if (method === 0) out[name] = data.toString('utf8');
    else if (method === 8) out[name] = zlib.inflateRawSync(data).toString('utf8');
  }
  // archives may wrap everything in one folder; make paths relative to the folder holding main.lua
  const main = Object.keys(out).filter(k => /(^|\/)main\.lua$/.test(k)).sort((a, b) => a.length - b.length)[0];
  const prefix = main ? main.slice(0, -'main.lua'.length) : '';
  if (!prefix) return out;
  const rebased = {};
  for (const [k, v] of Object.entries(out)) if (k.startsWith(prefix)) rebased[k.slice(prefix.length)] = v;
  return rebased;
}

const cache = new Map(); // key -> { file, mtime, files, version }

/** The installed copy of a library plugin, or { error } saying where it looked. */
function find(key) {
  const lib = LIBS[key];
  if (!lib) return { error: 'unknown library ' + key };
  const looked = [];
  for (const dir of clientDirs()) {
    const folder = path.join(dir, String(lib.id));
    looked.push(folder);
    let zips = [];
    try { zips = fs.readdirSync(folder).filter(f => /\.zip$/i.test(f)); } catch { continue; }
    if (!zips.length) continue;
    const file = path.join(folder, zips.includes(lib.id + '.zip') ? lib.id + '.zip' : zips[0]);
    const mtime = fs.statSync(file).mtimeMs;
    const hit = cache.get(key);
    if (hit && hit.file === file && hit.mtime === mtime) return hit;
    try {
      const files = readZip(file);
      if (!files['main.lua']) throw new Error('no main.lua inside');
      let version;
      try { version = JSON.parse(files['plugin.json']).version; } catch { /* none */ }
      const entry = { key, name: lib.name, file, mtime, files, version };
      cache.set(key, entry);
      return entry;
    } catch (e) {
      return { error: `${lib.name} at ${file} could not be read (${e.message}).` };
    }
  }
  return { error: `${lib.name} is not installed in the game client (looked in ${looked.join(' and ')}). Enable a plugin that uses it in the client once so it downloads.` };
}

/** Does this plugin.json list the library as a dependency (by alias or hub ID)? */
function dependsOn(manifest, key) {
  const lib = LIBS[key];
  return [manifest.requiredDependencies, manifest.optionalDependencies].some(d => d && typeof d === 'object' &&
    (Array.isArray(d) ? d.some(n => String(n).toLowerCase() === key)
      : Object.entries(d).some(([k, v]) => k.toLowerCase() === key || String(v) === String(lib.id))));
}

module.exports = { LIBS, find, dependsOn, readZip };
