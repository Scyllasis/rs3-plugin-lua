// RS3: Open Plugin Data. Shows what plugins saved in PluginData.db, and their captured logs. It only
// ever reads: the client owns that file.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const lib = require('./lib');
const util = require('../util');

const REFRESH_MS = 2000;
let current;

class DataPanel {
  constructor(context, dbs) {
    this.context = context;
    this.dbs = dbs;
    this.db = dbs[0];
    this.panel = vscode.window.createWebviewPanel('rs3lua.data', 'Plugin Data', vscode.ViewColumn.Active, {
      enableScripts: true, retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'data', 'webview'))],
    });
    this.panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'icon.png'));
    this.panel.webview.html = this.html();
    this.panel.webview.onDidReceiveMessage(util.guard('Plugin Data', m => this.onMessage(m)));
    this.panel.onDidDispose(() => { clearInterval(this.timer); current = undefined; });
    this.timer = setInterval(() => this.refresh(false), REFRESH_MS);
  }

  /** Sends the data when the file has changed, or when asked. A read that collides with a write is retried next time. */
  refresh(force) {
    let stamp;
    try { stamp = fs.statSync(this.db.file).mtimeMs; } catch (e) { this.fail(`${this.db.file} can't be found.`); return; }
    if (!force && stamp === this.stamp) return;
    try {
      const plugins = lib.readStore(this.db.file).map(p => ({ name: p.name, rows: p.rows, log: lib.logLines(p.rows) }));
      this.stamp = stamp;
      this.panel.webview.postMessage({ type: 'data', plugins, file: this.db.file, read: new Date().toLocaleTimeString(), dbs: this.dbs.map(d => d.label), db: this.db.label });
    } catch (e) {
      if (force) this.fail(e.message); // otherwise the client was mid-write: the next tick reads it
    }
  }

  fail(msg) { this.panel.webview.postMessage({ type: 'error', msg }); }

  async onMessage(m) {
    switch (m.type) {
      case 'ready': case 'refresh': this.refresh(true); break;
      case 'chooseDb': this.db = this.dbs.find(d => d.label === m.label) || this.db; this.refresh(true); break;
      case 'copy': await vscode.env.clipboard.writeText(String(m.text)); vscode.window.setStatusBarMessage('Copied', 2000); break;
      case 'addLog': vscode.commands.executeCommand('rs3lua.addLogCapture'); break;
    }
  }

  html() {
    const wv = this.panel.webview;
    const base = vscode.Uri.file(path.join(this.context.extensionPath, 'data', 'webview'));
    const nonce = util.nonce();
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${wv.cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${wv.asWebviewUri(vscode.Uri.joinPath(base, 'data.css'))}"><title>Plugin Data</title></head>
<body><div id="app"></div><script nonce="${nonce}" src="${wv.asWebviewUri(vscode.Uri.joinPath(base, 'data.js'))}"></script></body></html>`;
  }
}

async function openData(context) {
  if (current) { current.panel.reveal(); return; }
  const { devPluginFolders } = require('../catalog/receiver');
  const dbs = lib.databases(devPluginFolders());
  if (!dbs.length) {
    vscode.window.showWarningMessage('No PluginData.db was found. Run a plugin in the client first, or set rs3lua.devPluginsFolder.');
    return;
  }
  current = new DataPanel(context, dbs);
}

/** Copies rs3log.lua into a plugin and loads it first thing, so every later log() is captured. */
async function addLogCapture(context, uri) {
  const root = await util.pickPluginRoot(uri, 'Capture logs from which plugin?');
  if (!root) return;
  util.writeFileAtomic(path.join(root, 'rs3log.lua'), fs.readFileSync(context.asAbsolutePath(path.join('data', 'rs3log.lua'))));
  const main = vscode.Uri.file(path.join(root, 'main.lua'));
  const doc = await vscode.workspace.openTextDocument(main);
  if (!/require\s*\(?\s*["']rs3log["']/.test(doc.getText())) {
    const edit = new vscode.WorkspaceEdit();
    edit.insert(main, new vscode.Position(0, 0), 'require("rs3log") -- development only: shows log() in RS3: Open Plugin Data\n');
    await vscode.workspace.applyEdit(edit);
    await doc.save();
  }
  vscode.window.setStatusBarMessage('$(check) Log capture added. Deploy the plugin to start capturing.', 6000);
}

function activate(context) {
  context.subscriptions.push(
    util.command('rs3lua.pluginData', () => openData(context)),
    util.command('rs3lua.addLogCapture', uri => addLogCapture(context, uri)),
  );
}

module.exports = { activate };
