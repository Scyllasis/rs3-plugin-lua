// RS3 UI Preview panel: runs the plugin in the mock client and shows it on a simulated RS screen.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { Session, findPreviews } = require('./engine');
const Libraries = require('./libraries');
const { planMove } = require('./move');

const RESOLUTIONS = ['1280x720', '1366x768', '1600x900', '1920x1080', '2560x1440', '3440x1440', '3840x2160'];

class PreviewPanel {
  /** @type {PreviewPanel|undefined} */ static current;

  static async show(context, rootDir) {
    if (PreviewPanel.current) {
      PreviewPanel.current.setRoot(rootDir);
      PreviewPanel.current.panel.reveal(vscode.ViewColumn.Beside, true);
      return PreviewPanel.current;
    }
    const panel = vscode.window.createWebviewPanel('rs3lua.preview', 'RS3 UI Preview', { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'preview', 'webview')), vscode.Uri.file(rootDir)]
    });
    panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'icon.png'));
    PreviewPanel.current = new PreviewPanel(context, panel, rootDir);
    return PreviewPanel.current;
  }

  constructor(context, panel, rootDir) {
    this.context = context;
    this.panel = panel;
    this.root = rootDir;
    this.session = null;
    this.queue = Promise.resolve();
    this.diags = vscode.languages.createDiagnosticCollection('rs3-preview');
    const saved = context.workspaceState.get('rs3lua.preview.state') || {};
    const conf = vscode.workspace.getConfiguration('rs3lua.preview');
    this.state = Object.assign({
      sceneId: 'game',
      viewMode: 'game',
      resolution: conf.get('resolution', '1920x1080'),
      uiScale: conf.get('uiScale', 1),
      showClient: true,
      showBounds: false,
      interact: false,
      syncEditor: true,
    }, saved);
    this.disposables = [];
    panel.webview.html = this.html();
    panel.onDidDispose(() => this.dispose(), null, this.disposables);
    panel.webview.onDidReceiveMessage(m => this.onMessage(m), null, this.disposables);

    let timer;
    const later = () => { clearTimeout(timer); timer = setTimeout(() => this.rebuild(), 350); };
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => { if (this.owns(e.document.uri) && /\.(lua|json)$/i.test(e.document.uri.fsPath)) later(); }),
      vscode.workspace.onDidSaveTextDocument(d => { if (this.owns(d.uri)) later(); }),
      vscode.window.onDidChangeTextEditorSelection(e => {
        const d = e.textEditor.document;
        if (!this.owns(d.uri) || !d.uri.fsPath.endsWith('.lua')) return;
        this.lastEditorColumn = e.textEditor.viewColumn;
        this.post({ type: 'cursor', file: this.rel(d.uri.fsPath), line: e.selections[0].active.line + 1 });
      }),
      vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('rs3lua.preview')) later(); })
    );
    this.watchResources();
    this.rebuild();
  }

  setRoot(dir) {
    if (dir && dir !== this.root) {
      this.root = dir;
      this.panel.webview.options = {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'preview', 'webview')), vscode.Uri.file(dir)]
      };
      this.watchResources();
      this.rebuild();
    }
  }

  watchResources() {
    if (this.resWatcher) this.resWatcher.dispose();
    let timer;
    const later = () => { clearTimeout(timer); timer = setTimeout(() => this.rebuild(), 300); };
    this.resWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.root, 'resources/**/*.png'));
    this.resWatcher.onDidCreate(later); this.resWatcher.onDidChange(later); this.resWatcher.onDidDelete(later);
  }

  /** PNGs under resources/, keyed the way Lua sees them: Plugin.resources.images.icon */
  resources() {
    const out = {};
    const base = path.join(this.root, 'resources');
    const walk = (dir, segs, depth) => {
      if (depth > 6) return;
      let ents = [];
      try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of ents) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, segs.concat(e.name), depth + 1);
        else if (/\.png$/i.test(e.name)) {
          const key = 'Plugin.resources.' + segs.concat(e.name.replace(/\.png$/i, '')).join('.');
          let w = 0, h = 0, mtime = 0;
          try {
            const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(24); fs.readSync(fd, buf, 0, 24, 0); fs.closeSync(fd);
            if (buf.toString('ascii', 12, 16) === 'IHDR') { w = buf.readUInt32BE(16); h = buf.readUInt32BE(20); }
            mtime = Math.round(fs.statSync(p).mtimeMs);
          } catch { /* unreadable */ }
          out[key] = { uri: this.panel.webview.asWebviewUri(vscode.Uri.file(p)).toString() + '?v=' + mtime, w, h, file: path.relative(this.root, p).split(path.sep).join('/') };
        }
      }
    };
    walk(base, [], 0);
    return out;
  }
  owns(uri) { return uri.scheme === 'file' && this.root && (uri.fsPath + path.sep).startsWith(this.root + path.sep); }
  rel(f) { return path.relative(this.root, f).split(path.sep).join('/'); }
  post(m) { this.panel.webview.postMessage(m); }

  readFile(rel) {
    const lib = String(rel).match(/^__lib\/([^/]+)\/(.+)$/);
    if (lib) { const v = this.libFiles && this.libFiles[lib[1]] && this.libFiles[lib[1]][lib[2]]; return v == null ? null : v; }
    const clean = path.posix.normalize(String(rel).replace(/\\/g, '/'));
    if (clean.startsWith('..') || path.isAbsolute(clean)) return null;
    const abs = path.join(this.root, clean);
    const open = vscode.workspace.textDocuments.find(d => d.uri.scheme === 'file' && d.uri.fsPath === abs);
    if (open) return open.getText();
    try { return fs.readFileSync(abs, 'utf8'); } catch { return null; }
  }

  luaFiles() {
    const out = {};
    let n = 0;
    const walk = (dir, depth) => {
      if (depth > 6 || n > 300) return;
      let ents = [];
      try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of ents) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, depth + 1);
        else if (e.name.endsWith('.lua')) { const r = this.rel(p); out[r] = this.readFile(r) || ''; n++; }
      }
    };
    walk(this.root, 0);
    return out;
  }

  cfg() {
    const conf = vscode.workspace.getConfiguration('rs3lua.preview');
    const [rw, rh] = String(this.state.resolution).split('x').map(Number);
    const scale = Number(this.state.uiScale) || 1;
    const W = Math.round((rw || 1920) / scale), H = Math.round((rh || 1080) / scale);
    const size = (s, d) => { const m = String(s || '').match(/^(\d+)\s*x\s*(\d+)$/i); return m ? [+m[1], +m[2]] : d; };
    const [cw, ch] = size(conf.get('contentWindowSize'), [420, 560]);
    const [sw, sh] = size(conf.get('settingsWindowSize'), [520, 420]);
    return {
      screenW: W, screenH: H,
      contentRect: [64, 96, cw, ch],
      settingsRect: [Math.round((W - sw) / 2), Math.round((H - sh) / 2), sw, sh],
      instructionLimit: 20000000
    };
  }

  scenes(previews, subs) {
    const cfg = this.cfg();
    const list = [{ id: 'game', kind: 'game', label: 'Startup: game window' }];
    const has = n => subs.some(s => s.name === n);
    if (has('ContentLayerReady') || this.state.sceneId === 'content')
      list.push({ id: 'content', kind: 'content', label: 'Plugin window (ribbon icon)', rect: cfg.contentRect });
    if (has('SettingsLayerReady') || this.state.sceneId === 'settings')
      list.push({ id: 'settings', kind: 'settings', label: 'Plugin settings', rect: cfg.settingsRect });
    for (const p of previews) list.push({ id: 'fn:' + p.file + ':' + p.name, kind: 'fn', label: 'Pop-up: ' + p.title, file: p.file, name: p.name, line: p.line });
    return list;
  }

  rebuild() {
    this.queue = this.queue.then(() => this._rebuild()).catch(e => {
      this.post({ type: 'fatal', msg: String(e && e.stack || e) });
    });
    return this.queue;
  }

  async _rebuild() {
    if (!this.root) { this.post({ type: 'fatal', msg: 'Open a plugin folder (one with plugin.json or main.lua).' }); return; }
    const files = this.luaFiles();
    if (!('main.lua' in files)) {
      this.post({ type: 'fatal', msg: 'No main.lua found in ' + this.root });
      return;
    }
    const previews = findPreviews(files);
    // a first pass learns which events exist; scene list depends on it
    let scenes = this.scenes(previews, this.lastSubs || []);
    let scene = scenes.find(s => s.id === this.state.sceneId);
    if (!scene) { scene = scenes[0]; this.state.sceneId = scene.id; }
    if (this.session) { this.session.close(); this.session = null; }
    const cfg = this.cfg();
    if (scene.kind === 'content') scene.rect = cfg.contentRect;
    if (scene.kind === 'settings') scene.rect = cfg.settingsRect;
    this.session = await Session.create({
      indexPath: path.join(this.context.extensionPath, 'api-index.json'),
      readFile: r => this.readFile(r),
      cfg, scene, libraries: this.libraryLoad()
    });
    await this.send(previews, cfg);
  }

  async send(previews, cfg) {
    const data = await this.session.dump();
    this.lastData = data;
    const lib = this.libraryInfo();
    if (lib.uses && !lib.available) data.logs.unshift({ kind: 'warn', msg: lib.error + ' Until then PrettyUI components are not drawn.' });
    else if (lib.uses && !lib.active) data.logs.unshift({ kind: 'info', msg: 'PrettyUI is switched off: its components are not drawn (base view). Turn the PrettyUI switch on to draw them.' });
    this.lastSubs = data.subs;
    if (previews) this.lastPreviews = previews;
    const scenes = this.scenes(this.lastPreviews || [], data.subs);
    this.reportDiagnostics(data.logs, data.comps);
    this.panel.title = 'RS3 UI Preview: ' + path.basename(this.root);
    this.post({
      type: 'render', data, scenes, state: this.state, library: this.libraryInfo(), cfg: cfg || this.cfg(), resources: this.resources(),
      resolutions: RESOLUTIONS, pluginName: this.pluginName()
    });
  }

  manifest() {
    try { return JSON.parse(fs.readFileSync(path.join(this.root, 'plugin.json'), 'utf8')); } catch { return {}; }
  }

  /** The PrettyUI switch: on by default when plugin.json depends on it, and only if the client has it. */
  libraryInfo() {
    const key = 'prettyui';
    const uses = Libraries.dependsOn(this.manifest(), key);
    const found = Libraries.find(key);
    const override = (this.state.libraries || {})[this.root];
    const want = override === undefined ? uses : !!override;
    return { key, name: Libraries.LIBS[key].name, uses, available: !found.error, error: found.error, version: found.version,
      active: want && !found.error, auto: override === undefined };
  }

  libraryLoad() {
    const info = this.libraryInfo();
    this.libFiles = {};
    if (!info.active) return [];
    this.libFiles[info.key] = Libraries.find(info.key).files;
    return [info.key];
  }

  pluginName() {
    try { return JSON.parse(fs.readFileSync(path.join(this.root, 'plugin.json'), 'utf8')).name || path.basename(this.root); }
    catch { return path.basename(this.root); }
  }

  reportDiagnostics(logs, comps) {
    this.diags.clear();
    const byFile = new Map();
    // layout problems the preview can see (mirrors the warnings in the preview sidebar)
    logs = logs.slice();
    const STYLED = new Set(['GroupBox', 'Button']);
    for (const c of comps || []) {
      if (c.root || !c.file || !c.line) continue;
      const add = msg => logs.push({ kind: 'warn', msg: 'ui.' + c.type + ': ' + msg, file: c.file, line: c.line });
      if (!c.sizeSet) add('size never set, so it has no area in-game (use SetSize).');
      else if (c.w <= 0 || c.h <= 0) add(`resolves to ${Math.round(c.w)}×${Math.round(c.h)} in the preview, so nothing will be visible.`);
      if (c.type === 'Text' && !c.props.font) add('no font set, so the text is invisible in-game.');
      if (STYLED.has(c.type) && !c.props.stylesheetID) add('no stylesheetID, so it is drawn invisible in-game.');
    }
    for (const l of logs) {
      if (!l.file || !l.line || (l.kind !== 'error' && l.kind !== 'warn') || l.file.startsWith('__lib/')) continue;
      const uri = vscode.Uri.file(path.join(this.root, l.file));
      const line = Math.max(0, l.line - 1);
      const d = new vscode.Diagnostic(new vscode.Range(line, 0, line, 999),
        l.msg.replace(/^[^:]+\.lua:\d+:\s*/, ''),
        l.kind === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning);
      d.source = 'RS3 preview';
      if (!byFile.has(uri.toString())) byFile.set(uri.toString(), [uri, []]);
      byFile.get(uri.toString())[1].push(d);
    }
    for (const [, [uri, ds]] of byFile) this.diags.set(uri, ds);
  }

  saveState() { this.context.workspaceState.update('rs3lua.preview.state', this.state); }

  async onMessage(m) {
    switch (m.type) {
      case 'ready': this.rebuild(); break;
      case 'setState': {
        const needsRebuild = ['sceneId', 'resolution', 'uiScale'].some(k => k in m.state && m.state[k] !== this.state[k]);
        Object.assign(this.state, m.state);
        this.saveState();
        if (needsRebuild) this.rebuild();
        break;
      }
      case 'rerun': this.rebuild(); break;
      case 'setLibrary': {
        const libs = Object.assign({}, this.state.libraries);
        // back to automatic when the choice matches what plugin.json says
        if (!!m.on === this.libraryInfo().uses) delete libs[this.root]; else libs[this.root] = !!m.on;
        this.state.libraries = libs;
        this.saveState();
        this.rebuild();
        break;
      }
      case 'fireHook':
        this.queue = this.queue.then(async () => { if (this.session) { await this.session.fireHook(m.id, m.hook); await this.send(); } });
        break;
      case 'fireEvent':
        this.queue = this.queue.then(async () => { if (this.session) { await this.session.fireEvent(m.name); await this.send(); } });
        break;
      case 'reveal': await this.reveal(m.file, m.line, m.focus); break;
      case 'moveComp': await this.moveComp(Number(m.id), Number(m.dx) || 0, Number(m.dy) || 0); break;
      case 'command': {
        const here = vscode.Uri.file(path.join(this.root, 'main.lua'));
        if (m.id === 'rs3lua.styleStudio') vscode.commands.executeCommand('rs3lua.styleStudio', here);
        if (m.id === 'rs3lua.newSprite') {
          const c = await vscode.window.showQuickPick([
            { label: '$(add) New sprite…', id: 'rs3lua.newSprite' },
            { label: '$(edit) Edit a sprite in resources/…', id: 'rs3lua.editSprite' }]);
          if (c) vscode.commands.executeCommand(c.id, c.id === 'rs3lua.newSprite' ? here : undefined);
        }
        break;
      }
      case 'openSettings': vscode.commands.executeCommand('workbench.action.openSettings', 'rs3lua.preview'); break;
      case 'help': vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(path.join(this.context.extensionPath, 'reference', 'ui-preview.md'))); break;
    }
  }

  /** Drag-to-move: rewrite the numbers that position component `id`, moved by (dx, dy) interface units. */
  async moveComp(id, dx, dy) {
    const reply = (ok, msg) => this.post({ type: 'moveResult', ok, msg });
    const c = this.lastData && this.lastData.comps.find(k => k.id === id);
    const at = c && c.posAt;
    if (!at || !at.file || !at.line || at.file.startsWith('__lib/')) {
      reply(false, c && c.posSet ? 'Its position is set somewhere the preview cannot edit.' : 'Its position is never set in your code (SetPos, or x/y options), so there is nothing to change.');
      return;
    }
    const uri = vscode.Uri.file(path.join(this.root, at.file));
    let doc;
    try { doc = await vscode.workspace.openTextDocument(uri); } catch { reply(false, `Couldn't open ${at.file}.`); return; }
    const plan = planMove(doc.getText(), at.line, Math.round(dx), Math.round(dy));
    if (!plan.ok) { reply(false, plan.msg); return; }
    const edit = new vscode.WorkspaceEdit();
    for (const e of plan.edits) edit.replace(uri, new vscode.Range(e.line, e.start, e.line, e.end), e.text);
    const ok = await vscode.workspace.applyEdit(edit);
    reply(ok, ok ? `Moved: ${at.file}:${at.line} updated (Ctrl+Z in the editor to undo).` : 'The edit was refused.');
    if (ok) this.rebuild();
  }

  async reveal(file, line, focus) {
    if (!file || !line) return;
    const uri = vscode.Uri.file(path.join(this.root, file));
    const doc = await vscode.workspace.openTextDocument(uri);
    const pos = new vscode.Position(Math.max(0, line - 1), 0);
    const visible = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === uri.fsPath);
    const col = visible ? visible.viewColumn : (this.lastEditorColumn || vscode.ViewColumn.One);
    const ed = await vscode.window.showTextDocument(doc, { viewColumn: col, preserveFocus: !focus, selection: new vscode.Range(pos, pos) });
    ed.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }

  html() {
    const wv = this.panel.webview;
    const base = vscode.Uri.file(path.join(this.context.extensionPath, 'preview', 'webview'));
    const js = wv.asWebviewUri(vscode.Uri.joinPath(base, 'preview.js'));
    const css = wv.asWebviewUri(vscode.Uri.joinPath(base, 'preview.css'));
    const nonce = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join('');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${wv.cspSource} data:; style-src ${wv.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${css}"><title>RS3 UI Preview</title></head>
<body><div id="app"></div><script nonce="${nonce}" src="${js}"></script></body></html>`;
  }

  dispose() {
    PreviewPanel.current = undefined;
    if (this.session) this.session.close();
    this.diags.dispose();
    if (this.resWatcher) this.resWatcher.dispose();
    for (const d of this.disposables) { try { d.dispose(); } catch { /* ignore */ } }
  }
}

/** Find the plugin folder for a file: nearest parent with plugin.json, else with main.lua. */
function findPluginRoot(startPath, workspaceRoots) {
  let dir = startPath && fs.existsSync(startPath) && fs.statSync(startPath).isDirectory() ? startPath : startPath && path.dirname(startPath);
  let mainOnly;
  while (dir) {
    if (fs.existsSync(path.join(dir, 'plugin.json'))) return dir;
    if (!mainOnly && fs.existsSync(path.join(dir, 'main.lua'))) mainOnly = dir;
    if (workspaceRoots.includes(dir)) break;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return mainOnly;
}

module.exports = { PreviewPanel, findPluginRoot };
