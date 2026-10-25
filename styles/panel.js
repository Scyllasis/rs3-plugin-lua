// RS3 Style Studio host: built-in style gallery, custom stylesheet designer (-> styles.lua),
// and import of ui.StyleValue keys discovered in the dev client.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const { BUILTINS, DOC_KEYS, GEN_HEADER, generateLua, DISCOVERY_LUA, parseDiscovery, generateAnnotations } = require('./lib');

const panels = new Map(); // root -> StudioPanel

class StudioPanel {
  static open(context, root) {
    const p = panels.get(root);
    if (p) { p.panel.reveal(); return p; }
    const np = new StudioPanel(context, root);
    panels.set(root, np);
    return np;
  }

  constructor(context, root) {
    this.context = context;
    this.root = root;
    this.panel = vscode.window.createWebviewPanel('rs3lua.styles', 'Style Studio: ' + path.basename(root), vscode.ViewColumn.Active, {
      enableScripts: true, retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'styles', 'webview'))]
    });
    this.panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'icon.png'));
    this.panel.webview.html = this.html();
    this.panel.webview.onDidReceiveMessage(m => this.onMessage(m));
    this.panel.onDidDispose(() => panels.delete(root));
  }

  f(...p) { return path.join(this.root, ...p); }
  readJson(rel, def) { try { return JSON.parse(fs.readFileSync(this.f(rel), 'utf8')); } catch { return def; } }
  writeJson(rel, data) { fs.mkdirSync(path.dirname(this.f(rel)), { recursive: true }); fs.writeFileSync(this.f(rel), JSON.stringify(data, null, 2) + '\n'); }

  catalog() {
    const c = this.readJson('.rs3/stylevalues.json', { keys: {}, sheets: {} });
    c.keys = c.keys || {}; c.sheets = c.sheets || {};
    return c;
  }

  send() {
    const spec = this.readJson('.rs3/styles.json', { styles: [] });
    this.panel.webview.postMessage({
      type: 'init', spec, catalog: this.catalog(), builtins: BUILTINS, docKeys: DOC_KEYS,
      discovery: DISCOVERY_LUA, plugin: path.basename(this.root),
      stylesLuaExists: fs.existsSync(this.f('styles.lua'))
    });
  }

  async onMessage(m) {
    switch (m.type) {
      case 'ready': this.send(); break;
      case 'generate': this.panel.webview.postMessage({ type: 'generated', code: generateLua(m.spec) }); break;
      case 'save': await this.save(m.spec); break;
      case 'import': {
        const r = parseDiscovery(m.text);
        const n = Object.keys(r.keys).length, ns = Object.keys(r.sheets).length;
        if (!n && !ns) {
          this.panel.webview.postMessage({ type: 'importResult', ok: false, msg: r.errors.length ? 'The script ran but could not list keys: ' + r.errors.join('; ') : 'No SV| or SS| lines found in what you pasted.' });
          return;
        }
        const cat = this.catalog();
        Object.assign(cat.keys, r.keys);
        for (const [s, vals] of Object.entries(r.sheets)) cat.sheets[s] = Object.assign(cat.sheets[s] || {}, vals);
        cat.updated = new Date().toISOString();
        this.writeJson('.rs3/stylevalues.json', cat);
        fs.writeFileSync(this.f('.rs3', 'stylevalues.lua'), generateAnnotations(cat.keys));
        this.panel.webview.postMessage({ type: 'catalog', catalog: cat });
        this.panel.webview.postMessage({ type: 'importResult', ok: true,
          msg: `Imported ${n} key${n === 1 ? '' : 's'} and values for ${ns} built-in stylesheet${ns === 1 ? '' : 's'}. ui.StyleValue autocomplete now includes them.` + (r.done != null && r.done !== n ? ` (The script reported ${r.done}; paste every line if some are missing.)` : '') });
        break;
      }
      case 'clearCatalog': {
        this.writeJson('.rs3/stylevalues.json', { keys: {}, sheets: {} });
        try { fs.unlinkSync(this.f('.rs3', 'stylevalues.lua')); } catch { /* none */ }
        this.panel.webview.postMessage({ type: 'catalog', catalog: { keys: {}, sheets: {} } });
        break;
      }
      case 'copy': await vscode.env.clipboard.writeText(m.text); vscode.window.setStatusBarMessage('Copied', 2000); break;
      case 'insert': {
        await require('../sprite/panel').insertIntoEditor(m.text);
        break;
      }
      case 'makeDiscoveryPlugin': await this.makeDiscoveryPlugin(); break;
      case 'openFile': {
        const doc = await vscode.workspace.openTextDocument(this.f(m.file));
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
        break;
      }
    }
  }

  async save(spec) {
    const target = this.f('styles.lua');
    let file = target;
    if (fs.existsSync(target) && !fs.readFileSync(target, 'utf8').startsWith(GEN_HEADER)) {
      const c = await vscode.window.showWarningMessage('styles.lua already exists and was not made by the Style Studio.', { modal: true }, 'Overwrite', 'Write styles_generated.lua instead');
      if (!c) return;
      if (c !== 'Overwrite') file = this.f('styles_generated.lua');
    }
    this.writeJson('.rs3/styles.json', spec);
    fs.writeFileSync(file, generateLua(spec));
    const mod = path.basename(file, '.lua');
    this.panel.webview.postMessage({ type: 'saved', file: path.basename(file), module: mod });
    const { PreviewPanel } = require('../preview/panel');
    if (PreviewPanel.current) PreviewPanel.current.rebuild();
    const main = this.f('main.lua');
    try {
      const src = fs.readFileSync(main, 'utf8');
      if (!new RegExp(`require\\s*\\(?\\s*["']${mod}["']`).test(src)) {
        const c = await vscode.window.showInformationMessage(`Saved ${path.basename(file)}. main.lua doesn't load it yet.`, 'Add require to main.lua');
        if (c) {
          const doc = await vscode.workspace.openTextDocument(main);
          const ed = await vscode.window.showTextDocument(doc);
          await ed.edit(e => e.insert(new vscode.Position(0, 0), `local Styles = require("${mod}")\n`));
        }
      }
    } catch { /* no main.lua */ }
  }

  async makeDiscoveryPlugin() {
    const dir = path.join(path.dirname(this.root), 'style_discovery');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'plugin.json'), JSON.stringify({ name: 'Style Discovery', version: '0.0.1', contactEmailAddress: 'you@example.com' }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'main.lua'), DISCOVERY_LUA);
    const c = await vscode.window.showInformationMessage(`Created ${dir}. Copy it into the beta client's dev_plugins folder, run prf and pon style_discovery (plugins are named by folder), then paste the console output here.`, 'Open main.lua');
    if (c) await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(path.join(dir, 'main.lua')), { viewColumn: vscode.ViewColumn.Beside });
  }

  html() {
    const wv = this.panel.webview;
    const base = vscode.Uri.file(path.join(this.context.extensionPath, 'styles', 'webview'));
    const js = wv.asWebviewUri(vscode.Uri.joinPath(base, 'studio.js'));
    const css = wv.asWebviewUri(vscode.Uri.joinPath(base, 'studio.css'));
    const nonce = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join('');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${wv.cspSource} data:; style-src ${wv.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${css}"><title>Style Studio</title></head>
<body><div id="app"></div><script nonce="${nonce}" src="${js}"></script></body></html>`;
  }
}

async function openStudio(context, uri) {
  const { findPluginRoot } = require('../preview/panel');
  const roots = (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath);
  const start = (uri && uri.fsPath) || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.scheme === 'file' ? vscode.window.activeTextEditor.document.uri.fsPath : undefined);
  let root = start && findPluginRoot(start, roots);
  if (!root) {
    const found = await vscode.workspace.findFiles('**/plugin.json', '**/node_modules/**', 20);
    if (found.length === 1) root = path.dirname(found[0].fsPath);
    else if (found.length > 1) {
      const pick = await vscode.window.showQuickPick(found.map(f => ({ label: vscode.workspace.asRelativePath(path.dirname(f.fsPath)), dir: path.dirname(f.fsPath) })), { placeHolder: 'Which plugin?' });
      if (!pick) return;
      root = pick.dir;
    }
  }
  if (!root) { vscode.window.showWarningMessage('Open a plugin folder (with plugin.json) first.'); return; }
  StudioPanel.open(context, root);
}

module.exports = { openStudio };
