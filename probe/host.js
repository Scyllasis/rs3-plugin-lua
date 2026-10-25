// RS3 API Probe host: writes the probe plugin, receives its results (HTTP or pasted console text),
// shows a report and applies what it learned.
'use strict';
const vscode = require('vscode');
const http = require('http');
const path = require('path');
const fs = require('fs');
const L = require('./lib');

let server = null, serverTimer = null, ctx = null;

const dir = (...p) => path.join(ctx.globalStorageUri.fsPath, 'probe', ...p);
const port = () => vscode.workspace.getConfiguration('rs3lua.probe').get('port', 47321);
const index = () => JSON.parse(fs.readFileSync(ctx.asAbsolutePath('api-index.json'), 'utf8'));
const version = () => require(ctx.asAbsolutePath('package.json')).version;

function saveResult(payload) {
  if (!payload || payload.probe !== 'rs3' || !payload.run) throw new Error('not an RS3 API Probe payload');
  if (payload.kind === 'items') { require('../catalog/host').saveExport(payload); return { items: true }; }
  fs.mkdirSync(dir('runs'), { recursive: true });
  const file = dir('runs', payload.run + '.json');
  let rec = {};
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* new run */ }
  if (payload.kind === 'layers') rec.layers = Object.assign(rec.layers || {}, payload.layers);
  else if (payload.kind === 'objects') {
    // phase 2 arrives separately; merge it into the phase-1 report (which may have been lost)
    rec.report = rec.report || { probe: 'rs3', run: payload.run, kind: 'report', counts: { ok: 0, missing: 0, wrongType: 0, error: 0 }, notes: [] };
    rec.report.instances = payload.instances || {};
    rec.report.notes = [...new Set([...(rec.report.notes || []), ...(payload.notes || [])])];
    rec.report.meta = Object.assign(rec.report.meta || {}, payload.meta || {});
    rec.objectsDone = true;
  }
  else rec.report = Object.assign(payload, rec.report && rec.report.instances ? { instances: rec.report.instances } : {});
  rec.run = payload.run;
  rec.updated = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(rec));
  fs.writeFileSync(dir('latest.txt'), payload.run);
  return rec;
}

function loadRun(run) {
  try {
    run = run || fs.readFileSync(dir('latest.txt'), 'utf8').trim();
    return JSON.parse(fs.readFileSync(dir('runs', run + '.json'), 'utf8'));
  } catch { return null; }
}

// ---------------------------------------------------------------- receiver
function startReceiver(quiet) {
  if (server) { bumpTimer(); return Promise.resolve(true); }
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      if (req.method !== 'POST') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('RS3 API Probe receiver is running.'); return; }
      let body = '', size = 0;
      req.on('data', d => { size += d.length; if (size > 20 * 1024 * 1024) { req.destroy(); return; } body += d; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const rec = saveResult(payload);
          res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok');
          bumpTimer();
          onReceived(payload, rec);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end('bad payload: ' + e.message);
        }
      });
    });
    server.on('error', e => {
      server = null;
      vscode.window.showErrorMessage(`RS3 probe receiver could not listen on 127.0.0.1:${port()} (${e.code || e.message}). Change rs3lua.probe.port and recreate the probe plugin.`);
      resolve(false);
    });
    server.listen(port(), '127.0.0.1', () => {
      bumpTimer();
      if (!quiet) vscode.window.setStatusBarMessage(`$(radio-tower) RS3 probe receiver listening on 127.0.0.1:${port()}`, 8000);
      resolve(true);
    });
  });
}
function bumpTimer() {
  clearTimeout(serverTimer);
  serverTimer = setTimeout(stopReceiver, 60 * 60 * 1000);
}
function stopReceiver() {
  clearTimeout(serverTimer);
  if (server) { server.close(); server = null; }
}

async function onReceived(payload, rec) {
  if (payload.kind === 'items') return; // the catalog shows its own status message
  if (payload.kind === 'layers') {
    const parts = Object.entries(payload.layers || {}).filter(([k]) => k !== 'screen').map(([k, v]) => `${k} ${v.w}×${v.h}`);
    const c = await vscode.window.showInformationMessage(`RS3 probe measured: ${parts.join(', ')}.`, 'Use in UI preview');
    if (c) await applyLayers(rec.layers);
    return;
  }
  if (payload.kind === 'objects') {
    const n = Object.keys(payload.instances || {}).length;
    const ch = await vscode.window.showInformationMessage(`RS3 API probe finished: checked ${n} object types.`, 'Open report');
    if (ch) showReport(payload.run);
    return;
  }
  const c = payload.counts || {};
  const choice = await vscode.window.showInformationMessage(
    `RS3 API probe: names checked (${c.ok} found, ${c.missing} missing, ${c.wrongType} different type). Now checking objects one at a time…`, 'Open report');
  if (choice) showReport(payload.run);
}

// ---------------------------------------------------------------- creating the probe plugin
async function createProbe() {
  const folders = vscode.workspace.workspaceFolders || [];
  let base;
  const ed = vscode.window.activeTextEditor;
  if (ed && ed.document.uri.scheme === 'file') {
    const { findPluginRoot } = require('../preview/panel');
    const root = findPluginRoot(ed.document.uri.fsPath, folders.map(f => f.uri.fsPath));
    if (root) base = path.dirname(root);
  }
  if (!base && folders.length) base = folders[0].uri.fsPath;
  const pick = await vscode.window.showQuickPick([
    ...(base ? [{ label: '$(folder) ' + path.join(base, 'rs3_api_probe'), dir: path.join(base, 'rs3_api_probe') }] : []),
    { label: '$(folder-opened) Choose a folder…', choose: true }
  ], { placeHolder: 'Where should the probe plugin go? (copy or point the beta client\'s plugin path here)' });
  if (!pick) return;
  let target = pick.dir;
  if (pick.choose) {
    const u = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, openLabel: 'Put rs3_api_probe here' });
    if (!u || !u[0]) return;
    target = path.join(u[0].fsPath, 'rs3_api_probe');
  }
  const commands = L.consoleCommands(path.basename(target));
  const B = require('../styles/lib').BUILTINS.flatMap(b => b.ids);
  const { lua, expected } = L.generateProbe(index(), version(), B);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'main.lua'), lua);
  fs.writeFileSync(path.join(target, 'plugin.json'), JSON.stringify({
    name: 'RS3 API Probe', version: version(), contactEmailAddress: 'probe@example.com',
    optionalPermissions: ['httpAccess'], urls: { probe: `http://127.0.0.1:${port()}` },
    hasRibbonIcon: true, hasSettingsIcon: true
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(target, 'README.md'), [
    '# RS3 API Probe', '',
    'Generated by the RS3 Plugin API extension. Checks the real client against the extension\'s definitions.', '',
    `It checks ${expected.statics.length} names reachable from globals, the members of ${Object.keys(expected.instances).length} object types,`,
    'enum values, id.StyleSheet / id.Font names, ui.StyleValue keys and the ribbon/settings window sizes.', '',
    '## Run it on the beta', '',
    '1. In VS Code, keep the receiver running (it starts when this probe is created; or run **RS3: Start Probe Receiver**).',
    '2. Put this folder in the beta client\'s `dev_plugins` folder (or `plugins_setpath` to its parent), then in the console:', '',
    '```', ...commands, '```', '',
    'The commands take the folder name. If the probe says it printed lines instead, run the `ppr` and `ppe` lines again, then `prl`.', '',
    '3. A small window shows progress. When it says "Sent to VS Code", open the report there.',
    '4. Click the probe\'s ribbon icon and its settings icon once each to measure those windows.', '',
    'No HTTP? The probe prints `RS3P|…` lines to the console. Copy them into VS Code and run **RS3: Import Probe Output**.', '',
    'Read-only: it looks names up and briefly creates one hidden component of each UI type, then destroys them.',
    `Disable it afterwards with \`poff ${path.basename(target)}\`. Do not submit it to mod.io.`, ''
  ].join('\n'));
  const ok = await startReceiver(true);
  const msg = `Created the RS3 API Probe in ${target}. ` + (ok ? `Listening on 127.0.0.1:${port()} for results. ` : '') +
    `Load it in the beta client, then run: ${commands.join(', ')}.`;
  const c = await vscode.window.showInformationMessage(msg, 'Copy console commands', 'Open folder');
  if (c === 'Copy console commands') await vscode.env.clipboard.writeText(commands.join('\n'));
  if (c === 'Open folder') vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(path.join(target, 'main.lua')));
}

// ---------------------------------------------------------------- import pasted console output
async function importOutput() {
  const ed = vscode.window.activeTextEditor;
  let text = ed && ed.document.getText();
  if (!text || !text.includes('RS3P|')) text = await vscode.env.clipboard.readText();
  if (!text || !text.includes('RS3P|')) {
    const doc = await vscode.workspace.openTextDocument({ language: 'plaintext', content: '-- Paste the RS3 API Probe console output (the RS3P|… lines) below, then run "RS3: Import Probe Output" again.\n\n' });
    await vscode.window.showTextDocument(doc);
    return;
  }
  const { results, problems } = L.parseConsole(text);
  for (const p of problems) vscode.window.showWarningMessage(p + ' Copy every RS3P line and try again.');
  let last, itemCount = 0;
  for (const r of results) { saveResult(r); if (r.kind === 'report' || r.kind === 'objects') last = r.run; if (r.kind === 'items') itemCount += (r.items || []).length; }
  if (itemCount && !last) { vscode.window.showInformationMessage(`Imported ${itemCount} of your items into the item list. Use "RS3: Find Item…" to search.`); return; }
  const layers = results.find(r => r.kind === 'layers');
  if (layers && !last) {
    const c = await vscode.window.showInformationMessage('Imported the window measurements.', 'Use in UI preview');
    if (c) await applyLayers(loadRun(layers.run).layers);
  }
  if (last) showReport(last);
  else if (!results.length && !problems.length) vscode.window.showWarningMessage('No complete RS3P results found.');
}

// ---------------------------------------------------------------- report + actions
async function pluginRoots() {
  const found = await vscode.workspace.findFiles('**/plugin.json', '**/{node_modules,rs3_api_probe,style_discovery}/**', 50);
  return found.map(u => path.dirname(u.fsPath));
}

async function applyLayers(layers) {
  if (!layers) return;
  const cfg = vscode.workspace.getConfiguration('rs3lua.preview');
  if (layers.ribbon && layers.ribbon.w) await cfg.update('contentWindowSize', `${Math.round(layers.ribbon.w)}x${Math.round(layers.ribbon.h)}`, vscode.ConfigurationTarget.Global);
  if (layers.settings && layers.settings.w) await cfg.update('settingsWindowSize', `${Math.round(layers.settings.w)}x${Math.round(layers.settings.h)}`, vscode.ConfigurationTarget.Global);
  vscode.window.setStatusBarMessage('UI preview now uses the measured window sizes', 4000);
}

async function showReport(run) {
  const rec = loadRun(run);
  if (!rec || !rec.report) { vscode.window.showInformationMessage('No RS3 API probe results yet. Run "RS3: Create API Probe Plugin" first.'); return; }
  const idx = index();
  const f = L.analyze(rec.report, rec.layers, idx);
  const md = L.markdown(f, rec.run, new Date(rec.updated).toLocaleString());
  const file = dir('report-' + rec.run + '.md');
  fs.writeFileSync(file, md);
  await vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(file));

  const undocCount = Object.values(f.undocumented).reduce((a, x) => a + x.length, 0) + Object.keys(f.undocumentedGlobals).length;
  const styleCount = Object.keys(f.styles.keys || {}).length;
  const actions = [];
  if (f.layers && (f.layers.ribbon || f.layers.settings)) actions.push({ label: '$(screen-full) Use the measured window sizes in the UI preview', id: 'layers' });
  if (undocCount) actions.push({ label: `$(symbol-field) Add ${undocCount} undocumented names to autocomplete`, detail: 'Writes .rs3/probe-additions.lua in your plugin folders (editor-only)', id: 'additions' });
  if (styleCount) actions.push({ label: `$(symbol-color) Import ${styleCount} ui.StyleValue keys into the Style Studio`, detail: 'Also adds them to ui.StyleValue autocomplete', id: 'styles' });
  actions.push({ label: '$(copy) Copy a summary to send to Claude', detail: 'So the extension\'s definitions can be corrected for everyone', id: 'claude' });
  const picks = await vscode.window.showQuickPick(actions, { canPickMany: true, placeHolder: 'Apply what the probe learned (pick any)' });
  if (!picks) return;
  for (const p of picks) {
    if (p.id === 'layers') await applyLayers(f.layers);
    if (p.id === 'additions' || p.id === 'styles') {
      const roots = await pluginRoots();
      if (!roots.length) { vscode.window.showWarningMessage('No plugin folders (with plugin.json) found in this workspace.'); continue; }
      for (const root of roots) {
        fs.mkdirSync(path.join(root, '.rs3'), { recursive: true });
        if (p.id === 'additions') fs.writeFileSync(path.join(root, '.rs3', 'probe-additions.lua'), L.additionsLua(f, idx));
        if (p.id === 'styles') {
          const S = require('../styles/lib');
          const catFile = path.join(root, '.rs3', 'stylevalues.json');
          let cat = { keys: {}, sheets: {} };
          try { cat = Object.assign(cat, JSON.parse(fs.readFileSync(catFile, 'utf8'))); } catch { /* new */ }
          Object.assign(cat.keys, f.styles.keys);
          for (const [s, vals] of Object.entries(f.styles.sheets || {})) cat.sheets[s] = Object.assign(cat.sheets[s] || {}, vals);
          cat.updated = new Date().toISOString();
          fs.writeFileSync(catFile, JSON.stringify(cat, null, 2) + '\n');
          fs.writeFileSync(path.join(root, '.rs3', 'stylevalues.lua'), S.generateAnnotations(cat.keys));
        }
      }
      vscode.window.setStatusBarMessage(`Updated ${roots.length} plugin folder${roots.length === 1 ? '' : 's'}`, 4000);
    }
    if (p.id === 'claude') {
      await vscode.env.clipboard.writeText(L.summaryForClaude(f, version()));
      vscode.window.showInformationMessage('Probe summary copied. Paste it into your chat with Claude.');
    }
  }
}

function activate(context) {
  ctx = context;
  context.subscriptions.push(
    vscode.commands.registerCommand('rs3lua.probe.create', createProbe),
    vscode.commands.registerCommand('rs3lua.probe.receive', async () => {
      if (await startReceiver()) vscode.window.showInformationMessage(`RS3 probe receiver listening on 127.0.0.1:${port()} (stops after an hour without results).`);
    }),
    vscode.commands.registerCommand('rs3lua.probe.import', importOutput),
    vscode.commands.registerCommand('rs3lua.probe.report', () => showReport()),
    { dispose: stopReceiver }
  );
}

module.exports = { activate, saveResult, startReceiver, stopReceiver };
