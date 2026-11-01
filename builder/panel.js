// RS3 UI Builder host: opens a design from .rs3/ui, saves it with its generated Lua as it changes,
// and runs that Lua in the preview's mock client to catch what the design's own checks can't.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const L = require('./lib');
const util = require('../util');

const panels = new Map(); // design file -> BuilderPanel
const SAVE_DELAY = 400;
const TOP_LAYER = 'ui.Interfaces:GetComponent(id.Component.TOPLEVEL_V2__PLUGIN_BUILD_LAYER_TOP)';

const designDir = root => path.join(root, '.rs3', 'ui');
const designFile = (root, name) => path.join(designDir(root), name + '.json');

function listDesigns(root) {
  try { return fs.readdirSync(designDir(root)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort(); } catch { return []; }
}
function readManifest(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8')); } catch { return null; }
}
function dependsOnPrettyUI(manifest) {
  const hit = deps => (Array.isArray(deps) ? deps : Object.keys(deps || {})).some(k => String(k).toLowerCase() === 'prettyui')
    || (!Array.isArray(deps) && Object.values(deps || {}).some(v => String(v) === '6398181'));
  return !!manifest && (hit(manifest.requiredDependencies) || hit(manifest.optionalDependencies));
}
/** Plugin.resources paths for the PNGs in resources/. */
function resourcePaths(root) {
  const out = [];
  const walk = (dir, segs, depth) => {
    if (depth > 6) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name), segs.concat(e.name), depth + 1);
      else if (/\.png$/i.test(e.name)) out.push('Plugin.resources.' + segs.concat(e.name.replace(/\.png$/i, '')).join('.'));
    }
  };
  walk(path.join(root, 'resources'), [], 0);
  return out.sort();
}

/** Runs generated Lua in the mock client. Returns the errors it logged. */
async function tryInMock(context, name, code, style, hasPrettyUI) {
  const { Session } = require('../preview/engine');
  const Libraries = require('../preview/libraries');
  const library = style === 'prettyui' && hasPrettyUI ? Libraries.find('prettyui') : null;
  // PrettyUI mode needs PrettyUI: its absence is already a problem of its own, not a code error
  if (style === 'prettyui' && (!library || library.error)) return [];
  const files = { 'main.lua': `require(${L.luaString(name)}).create(${TOP_LAYER})`, [name + '.lua']: code };
  const session = await Session.create({
    indexPath: context.asAbsolutePath('api-index.json'),
    readFile: rel => {
      const lib = String(rel).match(/^__lib\/prettyui\/(.+)$/);
      if (lib) return library.files[lib[1]] == null ? null : library.files[lib[1]];
      return files[rel] == null ? null : files[rel];
    },
    cfg: { screenW: 1920, screenH: 1080, contentRect: [64, 96, 420, 560], settingsRect: [700, 300, 520, 420], instructionLimit: 20000000 },
    scene: { id: 'game', kind: 'game' },
    libraries: library ? ['prettyui'] : [],
  });
  try {
    const data = await session.dump();
    return data.logs.filter(l => l.kind === 'error').map(l => l.msg);
  } finally { session.close(); }
}

class BuilderPanel {
  static open(context, root, name) {
    const file = designFile(root, name);
    const open = panels.get(file);
    if (open) { open.panel.reveal(); return open; }
    const p = new BuilderPanel(context, root, name, file);
    panels.set(file, p);
    return p;
  }

  constructor(context, root, name, file) {
    this.context = context;
    this.root = root;
    this.name = name;
    this.file = file;
    this.disposed = false;
    this.saveTimer = null;
    this.chain = Promise.resolve();
    this.lastWritten = null;
    this.outFile = path.join(root, name + '.lua');
    this.panel = vscode.window.createWebviewPanel('rs3lua.builder', 'UI Builder: ' + name, vscode.ViewColumn.Active, {
      enableScripts: true, retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'builder'))],
    });
    this.panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'icon.png'));
    this.panel.webview.html = this.html();
    this.panel.webview.onDidReceiveMessage(util.guard('UI Builder', m => this.onMessage(m)));
    this.panel.onDidDispose(() => this.dispose());
    // another editor, or git, changing the design while it's open
    this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(designDir(root), name + '.json'));
    const reload = () => {
      let text = null;
      try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
      if (text !== this.lastWritten) { this.lastWritten = text; this.send('external'); }
    };
    this.watcher.onDidChange(reload);
    this.watcher.onDidCreate(reload);
  }

  post(m) { if (!this.disposed) this.panel.webview.postMessage(m); }

  load() {
    let raw = null, broken = null;
    try { this.lastWritten = fs.readFileSync(this.file, 'utf8'); raw = JSON.parse(this.lastWritten); }
    catch (e) { if (e.code !== 'ENOENT') broken = e.message; }
    if (broken) {
      // keep what's there: the next save would otherwise replace a file that only needs a comma
      const aside = `${this.file}.broken-${Date.now()}`;
      try { fs.copyFileSync(this.file, aside); } catch (e) { util.logError('UI Builder', e); }
      vscode.window.showWarningMessage(`${this.name}.json couldn't be read (${broken}). A copy was kept as ${path.basename(aside)}.`);
    }
    return L.normalize(raw || L.blank(this.name));
  }

  send(type) {
    const { design, notes } = this.load();
    const manifest = readManifest(this.root);
    this.post({ type, design, notes, plugin: path.basename(this.root), resources: resourcePaths(this.root),
      hasPrettyUI: dependsOnPrettyUI(manifest), hasManifest: !!manifest });
    this.queueCheck(design);
  }

  async onMessage(m) {
    switch (m.type) {
      case 'ready': this.ready = true; this.send('init'); break;
      case 'change':
        this.pending = m.design;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flush(), SAVE_DELAY);
        break;
      case 'save': clearTimeout(this.saveTimer); this.pending = m.design; await this.flush(); break;
      case 'preview': clearTimeout(this.saveTimer); this.pending = m.design; await this.flush(); await this.preview(); break;
      case 'addRequire': await this.addRequire(); break;
      case 'addDependency': await this.addDependency(); break;
      case 'copy': await vscode.env.clipboard.writeText(String(m.text)); vscode.window.setStatusBarMessage('Copied', 2000); break;
      case 'openLua': await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(this.outFile), { viewColumn: vscode.ViewColumn.Beside }); break;
      case 'sprites': vscode.commands.executeCommand('rs3lua.newSprite', vscode.Uri.file(path.join(this.root, 'main.lua'))); break;
      case 'refreshResources': this.post({ type: 'resources', resources: resourcePaths(this.root) }); break;
      case 'help': vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(this.context.asAbsolutePath(path.join('reference', 'ui-builder.md')))); break;
    }
  }

  /** The Lua goes to <name>.lua, unless someone else's file is already there and they say keep it. */
  async chooseOutput() {
    if (this.outChecked) return this.outFile;
    this.outChecked = true;
    let existing = null;
    try { existing = fs.readFileSync(this.outFile, 'utf8'); } catch { return this.outFile; }
    if (existing.startsWith(L.GEN_HEADER)) return this.outFile;
    const keep = `Write ${this.name}_generated.lua`;
    const c = await vscode.window.showWarningMessage(`${this.name}.lua exists and wasn't made by the UI Builder.`, { modal: true }, 'Overwrite', keep);
    if (c !== 'Overwrite') this.outFile = path.join(this.root, this.name + '_generated.lua');
    return this.outFile;
  }

  flush() {
    const raw = this.pending;
    this.pending = null;
    if (!raw) return this.chain;
    this.chain = this.chain.then(async () => {
      const { design } = L.normalize(raw);
      design.name = this.name;
      const text = JSON.stringify(design, null, 2) + '\n';
      if (text !== this.lastWritten) {
        this.lastWritten = text;
        util.writeFileAtomic(this.file, text);
      }
      const out = await this.chooseOutput();
      const code = L.generateLua(design);
      util.writeFileAtomic(out, code);
      this.post({ type: 'saved', file: path.basename(out), module: path.basename(out, '.lua') });
      const { PreviewPanel } = require('../preview/panel');
      if (PreviewPanel.current && PreviewPanel.current.root === this.root) PreviewPanel.current.rebuild();
      this.queueCheck(design, code);
    }).catch(e => {
      util.logError('UI Builder save', e);
      vscode.window.showErrorMessage(`The UI Builder couldn't save: ${e.message}`);
    });
    return this.chain;
  }

  /** Mock-client runs take a moment, so only the newest design is checked. */
  queueCheck(design, code) {
    this.checkWanted = { design, code: code || L.generateLua(design) };
    if (this.checking) return;
    this.checking = true;
    const next = async () => {
      const want = this.checkWanted;
      this.checkWanted = null;
      if (!want || this.disposed) { this.checking = false; return; }
      let errors = [];
      try {
        errors = await tryInMock(this.context, want.design.name, want.code, want.design.style, dependsOnPrettyUI(readManifest(this.root)));
      } catch (e) { util.logError('UI Builder check', e); }
      this.post({ type: 'mockResult', errors });
      next();
    };
    next();
  }

  loaded() {
    const module = path.basename(this.outFile, '.lua');
    try { return new RegExp(`require\\s*\\(?\\s*["']${module}["']`).test(fs.readFileSync(path.join(this.root, 'main.lua'), 'utf8')); }
    catch { return false; }
  }

  async preview() {
    if (!this.loaded()) {
      const c = await vscode.window.showInformationMessage(`main.lua doesn't load ${path.basename(this.outFile)} yet, so the preview can't show it.`, 'Add to main.lua');
      if (!c) return;
      await this.addRequire();
    }
    const { PreviewPanel } = require('../preview/panel');
    await PreviewPanel.show(this.context, this.root);
  }

  async addRequire() {
    if (this.loaded()) { vscode.window.setStatusBarMessage('main.lua already loads it', 3000); return; }
    const uri = vscode.Uri.file(path.join(this.root, 'main.lua'));
    const doc = await vscode.workspace.openTextDocument(uri);
    const { design } = this.load();
    const edit = new vscode.WorkspaceEdit();
    const snippet = L.usageSnippet(Object.assign({}, design, { name: path.basename(this.outFile, '.lua') }));
    edit.insert(uri, new vscode.Position(doc.lineCount, 0), (doc.getText().endsWith('\n') ? '' : '\n') + '\n' + snippet + '\n');
    await vscode.workspace.applyEdit(edit);
    await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: false });
  }

  async addDependency() {
    const uri = vscode.Uri.file(path.join(this.root, 'plugin.json'));
    const doc = await vscode.workspace.openTextDocument(uri);
    const manifest = JSON.parse(doc.getText());
    const deps = Array.isArray(manifest.requiredDependencies) || !manifest.requiredDependencies ? {} : manifest.requiredDependencies;
    deps.prettyui = 6398181;
    manifest.requiredDependencies = deps;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), JSON.stringify(manifest, null, 2) + '\n');
    await vscode.workspace.applyEdit(edit);
    await doc.save();
    this.send('manifest');
  }

  html() {
    const wv = this.panel.webview;
    const base = vscode.Uri.file(path.join(this.context.extensionPath, 'builder'));
    const uri = f => wv.asWebviewUri(vscode.Uri.joinPath(base, f));
    const nonce = util.nonce();
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${wv.cspSource} data:; style-src ${wv.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${uri('webview/builder.css')}"><title>UI Builder</title></head>
<body><div id="app"></div><script nonce="${nonce}" src="${uri('lib.js')}"></script><script nonce="${nonce}" src="${uri('webview/builder.js')}"></script></body></html>`;
  }

  dispose() {
    this.disposed = true;
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.flush(); } // what was typed last still reaches disk
    this.watcher.dispose();
    panels.delete(this.file);
  }
}

async function openBuilder(context, uri) {
  // a design file was right-clicked
  const design = uri && /[\\/]\.rs3[\\/]ui[\\/][^\\/]+\.json$/.test(uri.fsPath) ? uri.fsPath : null;
  if (design) {
    BuilderPanel.open(context, path.dirname(path.dirname(path.dirname(design))), path.basename(design, '.json'));
    return;
  }
  const root = await util.pickPluginRoot(uri, 'Which plugin is this UI for?');
  if (!root) return;
  const existing = listDesigns(root);
  let name;
  if (existing.length) {
    const pick = await vscode.window.showQuickPick([
      { label: '$(add) New design…', make: true },
      ...existing.map(n => ({ label: n, description: `.rs3/ui/${n}.json` })),
    ], { placeHolder: 'Open a design, or start a new one' });
    if (!pick) return;
    name = pick.make ? undefined : pick.label;
  }
  if (!name) {
    name = await newDesign(root);
    if (!name) return;
  }
  BuilderPanel.open(context, root, name);
}

async function newDesign(root) {
  const title = await vscode.window.showInputBox({ prompt: 'Name this UI', placeHolder: 'Settings window', validateInput: v => v.trim() ? undefined : 'Enter a name' });
  if (!title) return undefined;
  const name = L.slug(title);
  const file = designFile(root, name);
  if (fs.existsSync(file)) return name;
  const usesPretty = dependsOnPrettyUI(readManifest(root));
  const styles = [
    { label: 'PrettyUI', detail: 'Native-looking parts, and windows that move, close and resize for you. Needs the PrettyUI library plugin.', style: 'prettyui' },
    { label: 'Plain', detail: 'The client\'s own parts, with no library. Windows stay where they\'re put.', style: 'plain' },
  ];
  const style = await vscode.window.showQuickPick(usesPretty ? styles : styles.reverse(), { placeHolder: 'Which UI? You can switch at any time.' });
  if (!style) return undefined;
  const host = await vscode.window.showQuickPick([
    { label: 'Window', detail: 'A titled window of its own.', kind: style.style === 'prettyui' ? 'window' : 'groupbox' },
    { label: 'Layer', detail: 'Just the parts, for the ribbon or settings window, or inside your own window.', kind: 'layer' },
  ], { placeHolder: 'What does this UI sit in?' });
  if (!host) return undefined;
  const tpl = await vscode.window.showQuickPick([
    { label: 'Blank', id: 'blank' }, { label: 'Settings form', id: 'settings' }, { label: 'Stats panel', id: 'stats' }, { label: 'Yes or no question', id: 'confirm' },
  ], { placeHolder: 'Start from' });
  if (!tpl) return undefined;
  const design = L.fillTemplate(L.blank(title.trim(), host.kind), tpl.id);
  L.applyStyle(design, style.style);
  design.name = name;
  design.host.title = title.trim();
  util.writeFileAtomic(file, JSON.stringify(design, null, 2) + '\n');
  return name;
}

module.exports = { BuilderPanel, panels, openBuilder, dependsOnPrettyUI, tryInMock, resourcePaths };
