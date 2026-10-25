// RS3 Sprite Maker host: opens PNG resources in a pixel-editor webview and saves them back.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const panels = new Map(); // abs file path -> SpritePanel

const TEMPLATES = [
  { id: 'icon', label: 'Icon', detail: '32 × 32, plain sprite', w: 32, h: 32 },
  { id: 'button', label: 'Button (9-slice)', detail: '24 × 24 frame with stretchable middle, for Button sprites', w: 24, h: 24 },
  { id: 'panel', label: 'Panel frame (9-slice)', detail: '32 × 32 border for GroupBox backgrounds', w: 32, h: 32 },
  { id: 'scrollbar', label: 'Scrollbar states', detail: '16 × 64: idle, mouseover, pressed, disabled stacked', w: 16, h: 64 },
  { id: 'blank', label: 'Blank…', detail: 'Choose the size', w: 0, h: 0 }
];

/** Lua expression for a file under resources/: Plugin.resources.images.icon */
function luaPathFor(relUnderResources) {
  const segs = relUnderResources.replace(/\.png$/i, '').split('/').filter(Boolean);
  return 'Plugin.resources' + segs.map(s => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? '.' + s : '[' + JSON.stringify(s) + ']').join('');
}

function metaFile(root) { return path.join(root, '.rs3', 'sprites.json'); }
function readMeta(root) { try { return JSON.parse(fs.readFileSync(metaFile(root), 'utf8')); } catch { return {}; } }
function writeMeta(root, rel, meta) {
  const all = readMeta(root);
  all[rel] = meta;
  fs.mkdirSync(path.dirname(metaFile(root)), { recursive: true });
  fs.writeFileSync(metaFile(root), JSON.stringify(all, null, 2));
}

class SpritePanel {
  static open(context, file, root, init) {
    const existing = panels.get(file);
    if (existing) { existing.panel.reveal(); return existing; }
    const p = new SpritePanel(context, file, root, init || {});
    panels.set(file, p);
    return p;
  }

  constructor(context, file, root, init) {
    this.context = context;
    this.file = file;
    this.root = root;
    this.init = init;
    this.dirty = false;
    this.snapshot = null;
    this.rel = path.relative(root, file).split(path.sep).join('/');
    const underRes = this.rel.startsWith('resources/') ? this.rel.slice('resources/'.length) : null;
    this.luaPath = underRes ? luaPathFor(underRes) : '-- (move this PNG into resources/ to use it)';
    this.panel = vscode.window.createWebviewPanel('rs3lua.sprite', path.basename(file), vscode.ViewColumn.Active, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'sprite', 'webview'))]
    });
    this.panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'icon.png'));
    this.panel.webview.html = this.html();
    this.panel.webview.onDidReceiveMessage(m => this.onMessage(m));
    this.panel.onDidDispose(() => this.onDispose());
    this.updateTitle();
  }

  updateTitle() { this.panel.title = (this.dirty ? '● ' : '') + path.basename(this.file); }

  async onMessage(m) {
    switch (m.type) {
      case 'ready': {
        const exists = fs.existsSync(this.file);
        const meta = readMeta(this.root)[this.rel];
        this.panel.webview.postMessage({
          type: 'load', name: path.basename(this.file), relPath: this.rel, luaPath: this.luaPath, exists,
          base64: exists ? fs.readFileSync(this.file).toString('base64') : null,
          template: this.init.template, width: this.init.width, height: this.init.height, meta
        });
        break;
      }
      case 'save': await this.save(m.base64, m.meta); break;
      case 'snapshot': this.snapshot = m.base64; this.lastMeta = m.meta; break;
      case 'meta': this.lastMeta = m.meta; break;
      case 'dirty': this.dirty = m.dirty; this.updateTitle(); break;
      case 'copy': await vscode.env.clipboard.writeText(m.text); vscode.window.setStatusBarMessage('Lua snippet copied', 2000); break;
      case 'insert': await insertIntoEditor(m.text); break;
    }
  }

  async save(base64, meta) {
    try {
      const buf = Buffer.from(base64, 'base64');
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, buf);
      if (meta) writeMeta(this.root, this.rel, meta);
      this.dirty = false;
      this.snapshot = null;
      this.updateTitle();
      this.panel.webview.postMessage({ type: 'saved' });
      if (w > 1024 || h > 1024) vscode.window.showWarningMessage(`${path.basename(this.file)} is ${w}×${h}. RuneScape only loads images up to 1024×1024.`);
      if (!this.rel.startsWith('resources/')) vscode.window.showWarningMessage(`${this.rel} is outside resources/, so plugins can't load it.`);
      const { PreviewPanel } = require('../preview/panel');
      if (PreviewPanel.current) PreviewPanel.current.rebuild();
    } catch (e) {
      vscode.window.showErrorMessage('Could not save sprite: ' + e.message);
    }
  }

  async onDispose() {
    panels.delete(this.file);
    if (!this.dirty) return;
    const snap = this.snapshot, meta = this.lastMeta;
    const choice = await vscode.window.showWarningMessage(
      `${path.basename(this.file)} was closed with unsaved changes.`, 'Save', 'Discard');
    if (choice === 'Save' && snap) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, Buffer.from(snap, 'base64'));
      if (meta) writeMeta(this.root, this.rel, meta);
    }
  }

  html() {
    const wv = this.panel.webview;
    const base = vscode.Uri.file(path.join(this.context.extensionPath, 'sprite', 'webview'));
    const js = wv.asWebviewUri(vscode.Uri.joinPath(base, 'sprite.js'));
    const css = wv.asWebviewUri(vscode.Uri.joinPath(base, 'sprite.css'));
    const nonce = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join('');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${wv.cspSource} data: blob:; style-src ${wv.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${css}"><title>Sprite Maker</title></head>
<body><div id="app"></div><script nonce="${nonce}" src="${js}"></script></body></html>`;
  }
}

let lastLuaEditor;
function trackEditors(context) {
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
    if (e && e.document.languageId === 'lua') lastLuaEditor = e;
  }));
  const e = vscode.window.activeTextEditor;
  if (e && e.document.languageId === 'lua') lastLuaEditor = e;
}
async function insertIntoEditor(text) {
  let ed = lastLuaEditor && vscode.window.visibleTextEditors.find(v => v.document === lastLuaEditor.document);
  if (!ed && lastLuaEditor) ed = await vscode.window.showTextDocument(lastLuaEditor.document, { preview: false });
  if (!ed) { await vscode.env.clipboard.writeText(text); vscode.window.showInformationMessage('No Lua editor open, so the snippet was copied to the clipboard.'); return; }
  await ed.insertSnippet(new vscode.SnippetString(text.replace(/\$/g, '\\$') + '\n'));
}

async function pickRoot(hintPath) {
  const { findPluginRoot } = require('../preview/panel');
  const roots = (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath);
  let root = hintPath && findPluginRoot(hintPath, roots);
  if (!root && vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.scheme === 'file')
    root = findPluginRoot(vscode.window.activeTextEditor.document.uri.fsPath, roots);
  if (root) return root;
  const found = await vscode.workspace.findFiles('**/plugin.json', '**/node_modules/**', 20);
  if (found.length === 1) return path.dirname(found[0].fsPath);
  if (found.length > 1) {
    const pick = await vscode.window.showQuickPick(found.map(f => ({ label: vscode.workspace.asRelativePath(path.dirname(f.fsPath)), dir: path.dirname(f.fsPath) })), { placeHolder: 'Which plugin?' });
    return pick && pick.dir;
  }
  if (roots.length) return roots[0];
  vscode.window.showWarningMessage('Open a plugin folder first.');
  return undefined;
}

async function newSprite(context, uri) {
  const root = await pickRoot(uri && uri.fsPath);
  if (!root) return;
  const t = await vscode.window.showQuickPick(TEMPLATES.map(x => ({ label: x.label, detail: x.detail, t: x })), { placeHolder: 'Start from' });
  if (!t) return;
  let { w, h } = t.t;
  if (!w) {
    const size = await vscode.window.showInputBox({ prompt: 'Size (width x height, max 1024)', value: '32x32',
      validateInput: v => { const m = v.match(/^(\d+)\s*x\s*(\d+)$/i); return m && +m[1] >= 1 && +m[2] >= 1 && +m[1] <= 1024 && +m[2] <= 1024 ? undefined : 'Like 32x32, up to 1024x1024'; } });
    if (!size) return;
    [w, h] = size.split(/x/i).map(Number);
  }
  // default folder: the explorer folder that was right-clicked, if it's inside resources/
  let defDir = 'images';
  if (uri && fs.existsSync(uri.fsPath) && fs.statSync(uri.fsPath).isDirectory()) {
    const r = path.relative(path.join(root, 'resources'), uri.fsPath).split(path.sep).join('/');
    if (!r.startsWith('..')) defDir = r;
  }
  const name = await vscode.window.showInputBox({
    prompt: 'Name, inside resources/ (folders become Plugin.resources.<folder>.<name>)',
    value: (defDir ? defDir + '/' : '') + (t.t.id === 'blank' ? 'sprite' : t.t.id),
    validateInput: v => {
      const segs = v.replace(/\.png$/i, '').split('/');
      if (!v.trim() || segs.some(s => !s)) return 'Enter a name like images/coin';
      if (segs.some(s => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(s))) return 'Use letters, digits and _ (no spaces or dashes) so Lua can write Plugin.resources.a.b';
      return undefined;
    }
  });
  if (!name) return;
  const file = path.join(root, 'resources', ...name.replace(/\.png$/i, '').split('/')) + '.png';
  if (fs.existsSync(file)) {
    const ok = await vscode.window.showWarningMessage(`${path.relative(root, file)} already exists.`, 'Open it', 'Replace');
    if (!ok) return;
    if (ok === 'Open it') { SpritePanel.open(context, file, root); return; }
    fs.unlinkSync(file);
  }
  SpritePanel.open(context, file, root, { template: t.t.id, width: w, height: h });
}

async function editSprite(context, uri) {
  let file = uri && uri.fsPath;
  if (!file) {
    const root = await pickRoot();
    if (!root) return;
    const pngs = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'resources/**/*.png'), null, 200);
    if (!pngs.length) { vscode.window.showInformationMessage('No PNGs in resources/ yet. Use RS3: New Sprite… to make one.'); return; }
    const pick = await vscode.window.showQuickPick(pngs.map(u => ({ label: path.relative(root, u.fsPath), file: u.fsPath })), { placeHolder: 'Edit which sprite?' });
    if (!pick) return;
    file = pick.file;
  }
  const root = await pickRoot(file) || path.dirname(file);
  SpritePanel.open(context, file, root);
}

module.exports = { newSprite, editSprite, trackEditors, luaPathFor, insertIntoEditor };
