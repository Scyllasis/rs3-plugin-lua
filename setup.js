// Getting the RS3 definitions into the Lua language server (sumneko.lua), checking that it
// worked, and fixing the setups that silently stop it working.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const LUA_EXT = 'sumneko.lua';
// Our library folder, and the deps/<name> folders for library plugins (any extension version).
const LIB_MARKER = /rs3-plugin-lua[^\\/]*[\\/](library|deps[\\/][^\\/]+)[\\/]?$/i;
// Other extensions that also answer Lua completion requests.
const CONFLICTS = {
  'trixnz.vscode-lua': 'vscode-lua (trixnz)',
  'keyring.lua': 'Lua (keyring)',
  'tangzx.emmylua': 'EmmyLua',
  'yinfei.luahelper': 'LuaHelper',
  'xxxg0001.lua-for-vscode': 'Lua for VSCode',
  'johnnymorganz.luau-lsp': 'Luau Language Server'
};

let ctx;
let status;
const dismissed = new Set(); // per-session "don't ask again" keys

const libPath = () => ctx.asAbsolutePath('library');
const norm = p => {
  let s = path.normalize(String(p).replace(/^~(?=$|[\\/])/, require('os').homedir())).replace(/[\\/]+$/, '');
  return process.platform === 'win32' ? s.toLowerCase() : s;
};
/** One of our own definition folders: this copy's library/deps, or another version's (by folder name). */
const ours = p => LIB_MARKER.test(String(p)) || norm(p).startsWith(norm(ctx.extensionPath) + path.sep);
const asArray = v => Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v) : [];

function findPluginRoot(file) {
  try {
    const { findPluginRoot: f } = require('./preview/panel');
    const roots = (vscode.workspace.workspaceFolders || []).map(w => w.uri.fsPath);
    return f(file, roots);
  } catch { return undefined; }
}
function hasManifest(dir) { return !!dir && fs.existsSync(path.join(dir, 'plugin.json')); }

// ---------------------------------------------------------------- library plugin dependencies
/** Library plugins we ship definitions for (deps/index.json), keyed by dependency alias. */
function knownDeps() {
  try { return JSON.parse(fs.readFileSync(ctx.asAbsolutePath(path.join('deps', 'index.json')), 'utf8')); } catch { return {}; }
}
/** plugin.json files in a folder, a few levels deep. */
function manifestsIn(dir, depth = 3) {
  const out = [];
  if (hasManifest(dir)) out.push(path.join(dir, 'plugin.json'));
  if (depth <= 0) return out;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.isDirectory() && !/^(\.|node_modules$)/.test(e.name)) out.push(...manifestsIn(path.join(dir, e.name), depth - 1));
  }
  return out;
}
/** Definition folders for the library plugins that the folder's plugin.json files depend on. */
function depLibs(folderPath) {
  if (!folderPath) return [];
  const known = knownDeps();
  const byId = new Map(Object.entries(known).map(([k, d]) => [String(d.id), k]));
  const wanted = new Set();
  for (const file of manifestsIn(folderPath)) {
    let m;
    try { m = JSON.parse(stripJsonc(fs.readFileSync(file, 'utf8'))); } catch { continue; }
    for (const deps of [m.requiredDependencies, m.optionalDependencies]) {
      // object form { alias: id } or array form [ name, ... ]
      const pairs = Array.isArray(deps) ? deps.map(n => [String(n), n]) : Object.entries(deps && typeof deps === 'object' ? deps : {});
      for (const [alias, id] of pairs) {
        const key = known[alias.toLowerCase()] ? alias.toLowerCase() : byId.get(String(id));
        if (key) wanted.add(key);
      }
    }
  }
  return [...wanted].sort().map(k => ctx.asAbsolutePath(path.join('deps', k)));
}

// ---------------------------------------------------------------- .luarc.json
function stripJsonc(s) {
  let out = '', i = 0, inStr = false;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (inStr) { out += c; if (c === '\\') { out += n; i += 2; continue; } if (c === '"') inStr = false; i++; continue; }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}
function luarcFor(folderPath) {
  for (const name of ['.luarc.json', '.luarc.jsonc']) {
    const file = path.join(folderPath, name);
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    let data = null, error = null;
    try { data = JSON.parse(stripJsonc(raw)); } catch (e) { error = e.message; }
    let lib, flat = false;
    if (data) {
      if ('workspace.library' in data) { lib = data['workspace.library']; flat = true; }
      else if (data.workspace && typeof data.workspace === 'object' && 'library' in data.workspace) lib = data.workspace.library;
    }
    return { file, raw, data, error, lib, flat, hasComments: raw !== stripJsonc(raw) };
  }
  return null;
}

// ---------------------------------------------------------------- checks
/** What stands between this document and RS3 completions. */
function diagnose(doc) {
  const lib = libPath();
  const issues = [];
  const ext = vscode.extensions.getExtension(LUA_EXT);
  if (!ext) issues.push({ id: 'noLuaExt', severity: 'error', msg: 'The Lua extension (sumneko.lua) is not installed. It provides the completions.' });
  if (!fs.existsSync(path.join(lib, 'ui', 'component.lua'))) issues.push({ id: 'noLib', severity: 'error', msg: 'The RS3 definitions folder is missing from this extension. Reinstall the .vsix.' });
  const folder = doc && vscode.workspace.getWorkspaceFolder(doc.uri);
  const root = doc && doc.uri.scheme === 'file' ? findPluginRoot(doc.uri.fsPath) : undefined;
  if (doc && doc.languageId !== 'lua') issues.push({ id: 'notLua', severity: 'error', msg: `This file's language mode is "${doc.languageId}", not Lua.` });

  const cfg = vscode.workspace.getConfiguration('Lua', doc ? doc.uri : undefined);
  const effective = asArray(cfg.get('workspace.library'));
  const want = norm(lib);
  const hasCurrent = effective.some(p => norm(p) === want);
  const ownDeps = norm(ctx.asAbsolutePath('deps')) + path.sep;
  const stale = effective.filter(p => LIB_MARKER.test(String(p)) && norm(p) !== want && !norm(p).startsWith(ownDeps));
  const rc = folder ? luarcFor(folder.uri.fsPath) : null;
  const rcHas = rc && rc.lib !== undefined && asArray(rc.lib).some(p => norm(path.resolve(folder.uri.fsPath, String(p))) === want);

  if (rc && rc.error) issues.push({ id: 'luarcBroken', severity: 'warn', msg: `${path.basename(rc.file)} could not be read (${rc.error}). The Lua server may ignore your settings.`, file: rc.file });
  if (rc && rc.lib !== undefined && !rcHas) {
    issues.push({ id: 'luarcOverride', severity: 'error', msg: `${path.basename(rc.file)} sets its own workspace.library, which replaces VS Code's settings, so the RS3 definitions are skipped.`, file: rc.file });
  } else if (!hasCurrent && !rcHas) {
    issues.push({ id: 'notConfigured', severity: 'error', msg: folder
      ? `The RS3 definitions are not enabled for "${folder.name}".`
      : 'This file is not inside an open folder, and the RS3 definitions are not in your user settings.', loose: !folder });
  }
  if (stale.length) issues.push({ id: 'stale', severity: 'warn', msg: 'Settings still point at an older copy of this extension: ' + stale.join(', ') });
  const loaded = p => effective.some(e => norm(e) === norm(p)) || (rc && asArray(rc.lib).some(e => norm(path.resolve(folder.uri.fsPath, String(e))) === norm(p)));
  const missingDeps = folder ? depLibs(folder.uri.fsPath).filter(p => !loaded(p)) : [];
  if (missingDeps.length && (hasCurrent || rcHas)) {
    const names = missingDeps.map(p => (knownDeps()[path.basename(p)] || {}).name || path.basename(p));
    issues.push({ id: 'depMissing', severity: 'warn', msg: `plugin.json depends on ${names.join(', ')}, but its definitions are not loaded.` });
  }
  const rv = rc && rc.data && (rc.data['runtime.version'] || (rc.data.runtime && rc.data.runtime.version));
  const runtime = rv || cfg.get('runtime.version');
  if (runtime && runtime !== 'Lua 5.4') issues.push({ id: 'runtime', severity: 'warn', msg: `Lua runtime is set to "${runtime}"; RS3 plugins use Lua 5.4.` });
  for (const [id, name] of Object.entries(CONFLICTS)) {
    const e = vscode.extensions.getExtension(id);
    if (e) issues.push({ id: 'conflict:' + id, severity: 'warn', msg: `${name} is also installed and may answer completions instead. Disable it for this workspace if suggestions look wrong.`, ext: id });
  }
  if (ext && !ext.isActive && doc && doc.languageId === 'lua') issues.push({ id: 'luaInactive', severity: 'warn', msg: 'The Lua extension is installed but not running (is it disabled for this workspace?).' });
  return { issues, folder, root, ok: !issues.some(i => i.severity === 'error') };
}

// ---------------------------------------------------------------- fixes
/** Add (or remove) our library in VS Code settings for a folder, or user settings when no folder. */
async function setLibrary(folderOrUndefined, on) {
  const lib = libPath();
  const scope = folderOrUndefined ? folderOrUndefined.uri : undefined;
  const cfg = vscode.workspace.getConfiguration('Lua', scope);
  const ins = cfg.inspect('workspace.library') || {};
  const multi = (vscode.workspace.workspaceFolders || []).length > 1;
  const target = !folderOrUndefined ? vscode.ConfigurationTarget.Global
    : multi ? vscode.ConfigurationTarget.WorkspaceFolder : vscode.ConfigurationTarget.Workspace;
  const own = target === vscode.ConfigurationTarget.Global ? ins.globalValue
    : target === vscode.ConfigurationTarget.WorkspaceFolder ? ins.workspaceFolderValue : ins.workspaceValue;
  // A workspace value replaces the user value entirely, so start from the user's entries.
  const base = own !== undefined ? asArray(own) : target === vscode.ConfigurationTarget.Global ? [] : asArray(ins.globalValue);
  const cleaned = base.filter(p => norm(p) !== norm(lib) && !ours(p));
  const next = on ? [...cleaned, lib, ...depLibs(folderOrUndefined && folderOrUndefined.uri.fsPath)] : cleaned;
  const same = own !== undefined && next.length === asArray(own).length && next.every((p, i) => p === asArray(own)[i]);
  if (!same) await cfg.update('workspace.library', next, target);
  if (on && cfg.get('runtime.version') !== 'Lua 5.4') await cfg.update('runtime.version', 'Lua 5.4', target);
}

async function patchLuarc(rc, folderPath) {
  if (rc.hasComments) {
    const ok = await vscode.window.showWarningMessage(`${path.basename(rc.file)} has comments, which will be removed when it is rewritten.`, { modal: true }, 'Rewrite it', 'Open it instead');
    if (ok !== 'Rewrite it') {
      if (ok) await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(rc.file));
      vscode.window.showInformationMessage(`Add this to workspace.library in ${path.basename(rc.file)}: ${libPath()}`);
      return false;
    }
  }
  const data = rc.data || {};
  const want = norm(libPath());
  const keep = asArray(rc.lib).filter(p => !ours(path.resolve(folderPath, String(p))) && norm(path.resolve(folderPath, String(p))) !== want);
  const next = [...keep, libPath(), ...depLibs(folderPath)];
  if (rc.flat) data['workspace.library'] = next;
  else { data.workspace = data.workspace || {}; data.workspace.library = next; }
  fs.writeFileSync(rc.file, JSON.stringify(data, null, 2) + '\n');
  return true;
}

async function fixIssue(issue, doc) {
  const folder = doc && vscode.workspace.getWorkspaceFolder(doc.uri);
  switch (issue.id) {
    case 'noLuaExt':
      await vscode.commands.executeCommand('workbench.extensions.installExtension', LUA_EXT);
      return true;
    case 'notLua':
      await vscode.languages.setTextDocumentLanguage(doc, 'lua');
      return true;
    case 'notConfigured':
    case 'stale':
    case 'depMissing':
      if (!folder) {
        const ok = await vscode.window.showInformationMessage(
          'This file is not in an open folder. Turn on the RS3 definitions in your user settings (all Lua files), or open the plugin folder instead?',
          'Use user settings', 'Open plugin folder');
        if (ok === 'Open plugin folder') {
          const root = findPluginRoot(doc.uri.fsPath) || path.dirname(doc.uri.fsPath);
          await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(root));
          return false;
        }
        if (ok !== 'Use user settings') return false;
      }
      await setLibrary(folder, true);
      return true;
    case 'luarcOverride': {
      const rc = luarcFor(folder.uri.fsPath);
      return rc ? patchLuarc(rc, folder.uri.fsPath) : false;
    }
    case 'luarcBroken':
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(issue.file));
      return false;
    case 'runtime': {
      const rc = folder && luarcFor(folder.uri.fsPath);
      if (rc && rc.data && (rc.data['runtime.version'] || (rc.data.runtime && rc.data.runtime.version))) {
        if (rc.data['runtime.version']) rc.data['runtime.version'] = 'Lua 5.4'; else rc.data.runtime.version = 'Lua 5.4';
        if (!rc.hasComments) fs.writeFileSync(rc.file, JSON.stringify(rc.data, null, 2) + '\n');
        else await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(rc.file));
      } else await vscode.workspace.getConfiguration('Lua', doc && doc.uri).update('runtime.version', 'Lua 5.4',
        folder ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global);
      return true;
    }
    case 'luaInactive':
      await vscode.commands.executeCommand('workbench.extensions.search', '@id:' + LUA_EXT);
      return false;
    default:
      if (issue.ext) { await vscode.commands.executeCommand('workbench.extensions.search', '@id:' + issue.ext); return false; }
      return false;
  }
}

// ---------------------------------------------------------------- check command
async function checkSetup() {
  const ed = vscode.window.activeTextEditor;
  let doc = ed && ed.document;
  if (!doc || doc.languageId !== 'lua') {
    const lua = vscode.workspace.textDocuments.find(d => d.languageId === 'lua' && d.uri.scheme === 'file');
    if (lua) doc = lua;
  }
  const r = diagnose(doc);
  const items = [];
  if (!r.issues.length) {
    items.push({ label: '$(pass) RS3 completions are set up', detail: `${libPath()} is loaded by the Lua language server${r.folder ? ' for ' + r.folder.name : ''}.` });
    items.push({ label: '$(debug-restart) Still seeing plain words? Reload the window', action: 'reload' });
  } else {
    const fixable = r.issues.filter(i => !i.id.startsWith('conflict:') && !['luaInactive', 'luarcBroken'].includes(i.id));
    if (fixable.length) items.push({ label: '$(wrench) Fix all', detail: fixable.map(i => i.msg).join(' · '), action: 'fixAll' });
    for (const i of r.issues) items.push({ label: (i.severity === 'error' ? '$(error) ' : '$(warning) ') + i.msg, issue: i });
  }
  items.push({ label: '$(info) What this checks', detail: 'Lua extension installed, file is Lua, RS3 definitions in Lua.workspace.library, no .luarc.json overriding it, Lua 5.4, no other Lua extension competing.', action: 'none' });
  const pick = await vscode.window.showQuickPick(items, { placeHolder: doc ? 'RS3 setup for ' + vscode.workspace.asRelativePath(doc.uri) : 'RS3 setup (open a .lua file for a complete check)', matchOnDetail: true });
  if (!pick || pick.action === 'none') return;
  if (pick.action === 'reload') { await vscode.commands.executeCommand('workbench.action.reloadWindow'); return; }
  const todo = pick.action === 'fixAll'
    ? r.issues.filter(i => !i.id.startsWith('conflict:') && !['luaInactive', 'luarcBroken'].includes(i.id))
    : [pick.issue];
  let changed = false;
  for (const i of todo) changed = (await fixIssue(i, doc)) || changed;
  updateStatus();
  const after = diagnose(doc);
  if (changed && after.ok) {
    const c = await vscode.window.showInformationMessage('RS3 completions are set up. If suggestions still look wrong, reload the window.', 'Reload Window');
    if (c) vscode.commands.executeCommand('workbench.action.reloadWindow');
  } else if (changed) checkSetup();
}

// ---------------------------------------------------------------- automatic enable + status bar
async function maybeAutoFix(doc) {
  if (!doc || doc.languageId !== 'lua' || doc.uri.scheme !== 'file') return;
  const mode = vscode.workspace.getConfiguration('rs3lua').get('autoEnable', 'whenPluginJson');
  if (mode === 'never') return;
  const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
  const root = findPluginRoot(doc.uri.fsPath);
  if (mode !== 'always' && !hasManifest(root)) return;
  const r = diagnose(doc);
  for (const issue of r.issues) {
    // quiet fixes: our own setting in an open folder
    if ((issue.id === 'notConfigured' || issue.id === 'stale' || issue.id === 'depMissing') && folder) { try { await setLibrary(folder, true); } catch (e) { console.error('[rs3lua]', e); } continue; }
    // everything else asks once per session
    const key = issue.id + ':' + (folder ? folder.uri.fsPath : doc.uri.fsPath);
    if (dismissed.has(key)) continue;
    if (issue.id === 'notConfigured' && !folder) {
      dismissed.add(key);
      const c = await vscode.window.showInformationMessage('RS3 completions are off: this plugin file is not inside an open folder.', 'Open plugin folder', 'Use user settings');
      if (c === 'Open plugin folder') vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(root || path.dirname(doc.uri.fsPath)));
      if (c === 'Use user settings') await setLibrary(undefined, true);
    } else if (issue.id === 'luarcOverride' || issue.id === 'noLuaExt') {
      dismissed.add(key);
      const c = await vscode.window.showWarningMessage('RS3 completions are off: ' + issue.msg, 'Fix', 'Details');
      if (c === 'Fix') await fixIssue(issue, doc);
      if (c === 'Details') checkSetup();
    }
  }
  updateStatus();
}

function updateStatus() {
  if (!status) return;
  const ed = vscode.window.activeTextEditor;
  if (!ed || ed.document.languageId !== 'lua') { status.hide(); return; }
  const r = diagnose(ed.document);
  const errors = r.issues.filter(i => i.severity === 'error');
  const warns = r.issues.filter(i => i.severity === 'warn');
  status.text = errors.length ? '$(warning) RS3 API off' : warns.length ? '$(check) RS3 API $(warning)' : '$(check) RS3 API';
  status.backgroundColor = errors.length ? new vscode.ThemeColor('statusBarItem.warningBackground') : undefined;
  const md = new vscode.MarkdownString(undefined, true);
  md.appendMarkdown(errors.length ? '**RS3 completions are off for this file**\n\n' : '**RS3 completions are on**\n\n');
  for (const i of r.issues) md.appendMarkdown(`- ${i.severity === 'error' ? '$(error)' : '$(warning)'} ${i.msg}\n`);
  md.appendMarkdown('\nClick to check and fix.');
  status.tooltip = md;
  status.show();
}

function activate(context) {
  ctx = context;
  status = vscode.window.createStatusBarItem('rs3lua.status', vscode.StatusBarAlignment.Right, 100);
  status.name = 'RS3 API';
  status.command = 'rs3lua.checkSetup';
  context.subscriptions.push(
    status,
    vscode.commands.registerCommand('rs3lua.checkSetup', checkSetup),
    vscode.window.onDidChangeActiveTextEditor(e => { updateStatus(); if (e) maybeAutoFix(e.document); }),
    vscode.workspace.onDidOpenTextDocument(d => maybeAutoFix(d)),
    vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('Lua') || e.affectsConfiguration('rs3lua')) updateStatus(); }),
    vscode.workspace.onDidSaveTextDocument(d => {
      if (/\.luarc\.jsonc?$/.test(d.uri.fsPath)) updateStatus();
      // dependencies may have changed: add or drop library plugin definitions
      if (path.basename(d.uri.fsPath) === 'plugin.json') enableFolders();
    }),
    vscode.extensions.onDidChange(() => updateStatus())
  );
  const ed = vscode.window.activeTextEditor;
  if (ed) maybeAutoFix(ed.document);
  for (const d of vscode.workspace.textDocuments) if (d !== (ed && ed.document)) maybeAutoFix(d);
  updateStatus();
}

/** Startup pass for folders with a plugin.json (works before any Lua file is opened). */
async function enableFolders() {
  const mode = vscode.workspace.getConfiguration('rs3lua').get('autoEnable', 'whenPluginJson');
  if (mode === 'never') return;
  for (const folder of vscode.workspace.workspaceFolders || []) {
    let yes = mode === 'always';
    if (!yes) {
      const found = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/plugin.json'), '**/node_modules/**', 1);
      yes = found.length > 0;
    }
    if (yes) { try { await setLibrary(folder, true); } catch (e) { console.error('[rs3lua] enable failed', e); } }
  }
  updateStatus();
}

module.exports = { activate, setLibrary, enableFolders, diagnose, checkSetup, luarcFor, stripJsonc };
