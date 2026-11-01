// Checks a plugin the way the client and Jagex's review will. Pure: it takes text and returns
// findings, so it can be tested without VS Code. Rules marked "found in-game" come from the beta
// client (951.1), and are things the docs don't say or say differently.
'use strict';

const PLACEHOLDER_EMAIL = /(^|@)(you@)?example\.(com|org)$|^change-?me|you@example/i;
const MAX_IMAGE = 1024;

/** Whether a plugin.json belongs to an RS3 plugin. Other tools use the same file name. */
function isPluginManifest(text, hasMain) {
  let data;
  try { data = JSON.parse(text); } catch { return !!hasMain; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if ('contactEmailAddress' in data) return true;
  return !!hasMain && typeof data.name === 'string';
}

/** Lua with comments and string contents blanked, keeping every line and column where it was. */
function codeOnly(src) {
  let out = '', i = 0;
  const n = src.length;
  const blank = (to) => { while (i < to && i < n) { out += src[i] === '\n' ? '\n' : ' '; i += 1; } };
  const longEnd = at => {
    const m = src.slice(at).match(/^\[(=*)\[/);
    if (!m) return -1;
    const close = src.indexOf(']' + m[1] + ']', at);
    return close < 0 ? n : close + m[1].length + 2;
  };
  while (i < n) {
    const c = src[i];
    if (c === '-' && src[i + 1] === '-') {
      const long = longEnd(i + 2);
      if (long >= 0) { blank(long); continue; }
      const nl = src.indexOf('\n', i);
      blank(nl < 0 ? n : nl);
    } else if (c === '[' && longEnd(i) >= 0) {
      blank(longEnd(i));
    } else if (c === '"' || c === "'") {
      out += c; i += 1;
      while (i < n && src[i] !== c && src[i] !== '\n') {
        if (src[i] === '\\') { out += ' '; i += 1; }
        if (i < n) { out += src[i] === '\n' ? '\n' : ' '; i += 1; }
      }
      if (i < n && src[i] === c) { out += c; i += 1; }
    } else { out += c; i += 1; }
  }
  return out;
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

const USES = [
  { permission: 'chatAccess', pattern: /\bEvent\.ChatMessage\b|\bChat\.[A-Z]/g, what: 'chat' },
  { permission: 'httpAccess', pattern: /\bHTTPRequest\b|\bHTTP\.[A-Za-z]/g, what: 'HTTP' },
];

// found in-game: patterns on code, or on the raw line when `raw` is set
const GOTCHAS = [
  { raw: true, pattern: /\.(content|label)\s*=\s*(["'])(?:(?!\2).)*\\n/g, severity: 'warn', msg: 'The client draws "\\n" as a box. Use <br> for a line break.' },
  { pattern: /\bui\.Hook\.ON(DRAG|DRAGCOMPLETE)\b/g, severity: 'warn', msg: 'The client doesn\'t send drag hooks to plugin components. Use ONHOLD, which repeats while the button is held.' },
  { pattern: /\.cellHeight\b/g, severity: 'warn', msg: 'Reading cellHeight before SetColumnRows crashes the client. Call SetColumnRows first.' },
  { pattern: /:Select\(\s*1\s*\)/g, severity: 'info', msg: 'ComboField:Select(n) picked the n-th entry counting from 0 on the beta, not ID n. Read selectedID afterwards.' },
];

/**
 * input: { manifestText, files: { rel: text }, images: [{ file, w, h }] }
 * Returns findings: { severity: 'error'|'warn'|'info', msg, file, line?, code }.
 */
function checkPlugin(input) {
  const out = [];
  const add = (severity, code, msg, file, line) => out.push({ severity, code, msg, file: file || 'plugin.json', line });
  const files = input.files || {};
  let m = null;
  if (input.manifestText == null) add('error', 'no-manifest', 'plugin.json is missing.');
  else {
    try { m = JSON.parse(input.manifestText); } catch (e) { add('error', 'bad-manifest', 'plugin.json isn\'t valid JSON: ' + e.message); }
  }
  if (!('main.lua' in files)) add('error', 'no-main', 'main.lua is missing. It has to sit next to plugin.json.', 'main.lua');

  const manifestLine = key => {
    const at = String(input.manifestText || '').indexOf('"' + key + '"');
    return at < 0 ? 1 : lineOf(input.manifestText, at);
  };
  const declared = new Set();
  if (m && typeof m === 'object') {
    const name = m.name;
    if (typeof name !== 'string' || !name.trim()) add('error', 'name', 'The plugin needs a name.', null, manifestLine('name'));
    else {
      if (name.length > 50) add('error', 'name', 'Mod.io allows at most 50 characters in a plugin name.', null, manifestLine('name'));
      // eslint-disable-next-line no-control-regex
      if (/[^\x20-\x7e]/.test(name)) add('error', 'name', 'Mod.io allows only ASCII in a plugin name.', null, manifestLine('name'));
    }
    if (!/^\d+(\.\d+)*$/.test(String(m.version == null ? '' : m.version))) add('error', 'version', 'Versions can only be digits and full stops, like 1.0.2.', null, manifestLine('version'));
    const email = String(m.contactEmailAddress == null ? '' : m.contactEmailAddress);
    if (!email.includes('@')) add('error', 'email', 'contactEmailAddress needs a real address. It\'s shown publicly.', null, manifestLine('contactEmailAddress'));
    else if (PLACEHOLDER_EMAIL.test(email)) add('warn', 'email', `Replace the placeholder address ${email} before uploading.`, null, manifestLine('contactEmailAddress'));
    for (const key of ['requiredDependencies', 'optionalDependencies']) {
      // found in-game: "Failed to decode metadata at plugin.json - unexpected json Array, expected a json Object"
      if (Array.isArray(m[key])) add('warn', 'deps-array', `${key} should be an object ({ }), even when it's empty. The beta client reported "unexpected json Array, expected a json Object" and prf failed.`, null, manifestLine(key));
    }
    for (const key of ['requiredPermissions', 'optionalPermissions']) {
      if (Array.isArray(m[key])) m[key].forEach(p => declared.add(String(p)));
    }
    if (Array.isArray(m.requiredPermissions) && m.requiredPermissions.length && !('urls' in m) && m.requiredPermissions.includes('httpAccess')) {
      add('warn', 'urls', 'httpAccess needs the addresses it will call listed under "urls".', null, manifestLine('requiredPermissions'));
    }
    if (declared.size) add('info', 'review', 'Plugins that request permissions get extra review. Explain each one in the Mod.io description, and add its tag.', null, manifestLine('requiredPermissions'));
  }

  const used = new Set();
  let subscribes = null, hasShutdown = false;
  for (const [file, text] of Object.entries(files)) {
    const code = codeOnly(text);
    for (const use of USES) {
      use.pattern.lastIndex = 0;
      const hit = use.pattern.exec(code);
      if (!hit) continue;
      used.add(use.permission);
      if (m && !declared.has(use.permission)) add('error', 'permission', `This uses ${use.what}, which needs the "${use.permission}" permission in plugin.json.`, file, lineOf(code, hit.index));
    }
    for (const g of GOTCHAS) {
      const hay = g.raw ? text : code;
      g.pattern.lastIndex = 0;
      let hit;
      while ((hit = g.pattern.exec(hay))) add(g.severity, 'gotcha', g.msg, file, lineOf(hay, hit.index));
    }
    for (const hit of code.matchAll(/:SetHeaderLayout\(\s*(\d+)/g)) {
      if (Number(hit[1]) > 255) add('error', 'header-width', `The client keeps the header width in one byte, so ${hit[1]} wraps around. The most it can be is 255.`, file, lineOf(code, hit.index));
    }
    const cheat = text.match(/ExecuteConsoleCommand\s*\(\s*["']!/);
    if (cheat) add('warn', 'cheat', 'This runs a beta cheat, which only works on beta worlds and shouldn\'t ship.', file, lineOf(text, cheat.index));
    const capture = code.match(/\brequire\s*\(?\s*["'][ ]*["']/) && /require\s*\(?\s*["']rs3log["']/.exec(text);
    if (capture) add('warn', 'log-capture', 'Log capture is for development. Take this require out before uploading.', file, lineOf(text, capture.index));
    if (!subscribes) { const sub = code.match(/\.Subscribe\(/); if (sub) subscribes = { file, line: lineOf(code, sub.index) }; }
    if (/\bfunction\s+PluginShutdown\b|\bPluginShutdown\s*=/.test(code)) hasShutdown = true;
  }
  for (const permission of declared) {
    if (USES.some(u => u.permission === permission) && !used.has(permission)) add('warn', 'unused-permission', `plugin.json asks for "${permission}" but no code uses it. Ask only for what you use.`, null, manifestLine('Permissions'));
  }
  if (subscribes && !hasShutdown) add('info', 'shutdown', 'There\'s no PluginShutdown. Components and event subscriptions from before a reload can linger while you develop.', subscribes.file, subscribes.line);

  for (const image of input.images || []) {
    if (image.w > MAX_IMAGE || image.h > MAX_IMAGE) add('error', 'image-size', `${image.file} is ${image.w}x${image.h}. Images can be at most ${MAX_IMAGE}x${MAX_IMAGE}.`, image.file);
  }
  if ((input.images || []).length) add('info', 'review', 'Bundled images get extra review from Jagex.', input.images[0].file);
  return out;
}

module.exports = { isPluginManifest, checkPlugin, codeOnly, lineOf };
