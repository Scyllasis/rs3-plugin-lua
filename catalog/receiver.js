// Receives the item export plugin's results: over local HTTP, or as RS3X|… console lines pasted back.
'use strict';
const vscode = require('vscode');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

let server = null, serverTimer = null, onItems = null;

const port = () => vscode.workspace.getConfiguration('rs3lua.itemExport').get('port', 47321);

function accept(payload) {
  if (!payload || payload.source !== 'rs3-item-export' || payload.kind !== 'items') throw new Error('not an RS3 item export payload');
  return onItems(payload);
}

function startReceiver() {
  if (server) { bumpTimer(); return Promise.resolve(true); }
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      if (req.method !== 'POST') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('RS3 item export receiver is running.'); return; }
      let body = '', size = 0;
      req.on('data', d => { size += d.length; if (size > 20 * 1024 * 1024) { req.destroy(); return; } body += d; });
      req.on('end', () => {
        try {
          accept(JSON.parse(body));
          res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok');
          bumpTimer();
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end('bad payload: ' + e.message);
        }
      });
    });
    server.on('error', e => {
      server = null;
      vscode.window.showErrorMessage(`The item export receiver could not listen on 127.0.0.1:${port()} (${e.code || e.message}). Change rs3lua.itemExport.port and create the export plugin again.`);
      resolve(false);
    });
    server.listen(port(), '127.0.0.1', () => { bumpTimer(); resolve(true); });
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

/** Reassemble RS3X|run|tag|i/n|chunk lines from pasted console text. */
function parseConsole(text) {
  const groups = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const at = line.indexOf('RS3X|');
    if (at < 0) continue;
    const m = line.slice(at + 5).match(/^(\d+)\|(\w+)\|(\d+)\/(\d+)\|(.*)$/);
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
    if (missing.length) { problems.push(`${missing.length} of ${g.n} lines are missing.`); continue; }
    const json = Array.from({ length: g.n }, (_, i) => g.parts.get(i + 1)).join('');
    try { results.push(JSON.parse(json)); } catch (e) { problems.push(`The pasted lines could not be read (${e.message}).`); }
  }
  return { results, problems };
}

async function importOutput() {
  const ed = vscode.window.activeTextEditor;
  let text = ed && ed.document.getText();
  if (!text || !text.includes('RS3X|')) text = await vscode.env.clipboard.readText();
  if (!text || !text.includes('RS3X|')) {
    const doc = await vscode.workspace.openTextDocument({ language: 'plaintext', content: '-- Paste the RS3 Item Export console output (the RS3X|… lines) below, then run "RS3: Import Item Export Output" again.\n\n' });
    await vscode.window.showTextDocument(doc);
    return;
  }
  const { results, problems } = parseConsole(text);
  for (const p of problems) vscode.window.showWarningMessage(p + ' Copy every RS3X line and try again.');
  let n = 0;
  for (const r of results) { try { n += accept(r); } catch { /* not ours */ } }
  if (n) vscode.window.showInformationMessage(`Imported ${n} of your items into the item list. Use "RS3: Find Item…" to search.`);
  else if (!problems.length) vscode.window.showWarningMessage('No complete RS3X lines found.');
}

/** Console commands that load a dev plugin with HTTP access. The client names plugins by folder. */
function consoleCommands(folder) {
  return ['prf', `pon ${folder}`, `ppr ${folder}`, `ppe ${folder} httpAccess`, `prl ${folder}`];
}

/** The game client's dev_plugins folders that exist on this computer (setting first). */
function devPluginFolders() {
  const set = vscode.workspace.getConfiguration('rs3lua').get('devPluginsFolder', '');
  const data = process.env.ProgramData || (process.platform === 'win32' ? 'C:\\ProgramData' : path.join(os.homedir(), '.local', 'share'));
  const guesses = [set, path.join(data, 'Jagex', 'RuneScape-BETA', 'dev_plugins'), path.join(data, 'Jagex', 'RuneScape', 'dev_plugins')];
  return [...new Set(guesses.filter(p => p && fs.existsSync(p)))];
}

function activate(context, itemsHandler) {
  onItems = itemsHandler;
  context.subscriptions.push(
    vscode.commands.registerCommand('rs3lua.catalog.import', importOutput),
    { dispose: stopReceiver }
  );
}

module.exports = { activate, startReceiver, consoleCommands, devPluginFolders, port };
