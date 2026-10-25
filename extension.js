// RS3 Plugin API (Lua) — VS Code extension
// Completions, hover and signature help come from the Lua language server (sumneko.lua),
// fed with the bundled ./library annotation files. This file wires that up and adds
// the API Explorer, API search, docs links and a new-plugin scaffold.
'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let apiIndex = null;

function loadIndex(context) {
  if (apiIndex) return apiIndex;
  try {
    apiIndex = JSON.parse(fs.readFileSync(context.asAbsolutePath('api-index.json'), 'utf8'));
  } catch (e) {
    apiIndex = { groups: [], entries: [] };
    vscode.window.showWarningMessage('RS3 Plugin API: could not load api-index.json (' + e.message + ')');
  }
  return apiIndex;
}

// ---------------------------------------------------------------- LuaLS wiring (see setup.js)
const setup = require('./setup');
const setLibrary = (context, folder, on) => setup.setLibrary(folder, on);
const autoEnable = () => setup.enableFolders();

async function pickFolder() {
  const folders = vscode.workspace.workspaceFolders || [];
  if (folders.length === 0) {
    vscode.window.showErrorMessage('Open a folder first.');
    return undefined;
  }
  if (folders.length === 1) return folders[0];
  return vscode.window.showWorkspaceFolderPick();
}

// ---------------------------------------------------------------- Docs
function docsUrl(rel) {
  const base = vscode.workspace.getConfiguration('rs3lua').get('docsBaseUrl', 'https://developer.runescape.com/rs/');
  if (!rel) return base;
  if (/^https?:/i.test(rel)) return rel;
  return base.replace(/\/?$/, '/') + rel.replace(/^\//, '');
}
function openUrl(u) { return vscode.env.openExternal(vscode.Uri.parse(u)); }

function symbolAtCursor(editor) {
  const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_][\w]*(?:[.:][A-Za-z_][\w]*)*/);
  return range ? editor.document.getText(range) : '';
}

function findEntry(context, text) {
  const idx = loadIndex(context);
  if (!text) return undefined;
  const norm = text.replace(/:/g, '.');
  const byFull = idx.entries.find(e => e.full.replace(/:/g, '.') === norm);
  if (byFull) return byFull;
  // try progressively shorter prefixes: Event.InventoryUpdated.Subscribe -> Event.InventoryUpdated
  const parts = norm.split('.');
  while (parts.length > 1) {
    parts.pop();
    const e = idx.entries.find(x => x.full.replace(/:/g, '.') === parts.join('.'));
    if (e) return e;
  }
  const last = norm.split('.').pop();
  const byName = idx.entries.filter(e => e.name === last);
  return byName.length === 1 ? byName[0] : (byName.find(e => e.kind === 'class') || byName[0]);
}

// ---------------------------------------------------------------- Insert
function insertEntry(entry) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { vscode.env.clipboard.writeText(entry.insert || entry.full); vscode.window.showInformationMessage('Copied ' + entry.full); return; }
  editor.insertSnippet(new vscode.SnippetString(entry.snippet || entry.insert || entry.full));
}

// ---------------------------------------------------------------- Explorer tree
class ApiTree {
  constructor(context) {
    this.context = context;
    this._em = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._em.event;
  }
  getChildren(node) {
    const idx = loadIndex(this.context);
    if (!node) return idx.groups.map(g => ({ type: 'group', group: g }));
    if (node.type === 'group') {
      return idx.entries
        .filter(e => e.group === node.group.id && !e.parent)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(e => ({ type: 'entry', entry: e }));
    }
    const kids = idx.entries.filter(e => e.parent === node.entry.full);
    const order = { event: 0, function: 1, method: 2, field: 3, enum: 4, class: 5 };
    return kids
      .sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || a.name.localeCompare(b.name))
      .map(e => ({ type: 'entry', entry: e }));
  }
  getTreeItem(node) {
    if (node.type === 'group') {
      const t = new vscode.TreeItem(node.group.label, vscode.TreeItemCollapsibleState.Collapsed);
      t.iconPath = new vscode.ThemeIcon(node.group.icon || 'folder');
      t.contextValue = node.group.docs ? 'docs' : '';
      t.tooltip = node.group.description || node.group.label;
      return t;
    }
    const e = node.entry;
    const idx = loadIndex(this.context);
    const hasKids = idx.entries.some(x => x.parent === e.full);
    const t = new vscode.TreeItem(e.name,
      hasKids ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    t.description = e.detail || '';
    const md = new vscode.MarkdownString();
    md.appendCodeblock(e.signature || e.full, 'lua');
    if (e.doc) md.appendMarkdown('\n' + e.doc);
    if (e.docs) md.appendMarkdown(`\n\n[Open docs](${docsUrl(e.docs)})`);
    t.tooltip = md;
    t.iconPath = new vscode.ThemeIcon({
      class: 'symbol-class', function: 'symbol-function', method: 'symbol-method',
      field: 'symbol-field', enum: 'symbol-enum', enumMember: 'symbol-enum-member',
      event: 'symbol-event', global: 'symbol-variable', alias: 'symbol-type-parameter'
    }[e.kind] || 'symbol-misc');
    t.contextValue = ['insertable', e.docs ? 'docs' : ''].join(' ');
    return t;
  }
}

// ---------------------------------------------------------------- Search
async function searchApi(context) {
  const idx = loadIndex(context);
  const docsBtn = { iconPath: new vscode.ThemeIcon('link-external'), tooltip: 'Open docs' };
  const qp = vscode.window.createQuickPick();
  qp.placeholder = 'Search the RS3 Plugin API (Enter inserts at cursor)';
  qp.matchOnDescription = true;
  qp.matchOnDetail = true;
  qp.items = idx.entries.map(e => ({
    label: `$(${{ class: 'symbol-class', function: 'symbol-function', method: 'symbol-method', field: 'symbol-field', enum: 'symbol-enum', enumMember: 'symbol-enum-member', event: 'symbol-event' }[e.kind] || 'symbol-misc'}) ${e.full}`,
    description: e.detail || '',
    detail: (e.doc || '').split('\n')[0].slice(0, 140),
    buttons: e.docs ? [docsBtn] : [],
    entry: e
  }));
  qp.onDidTriggerItemButton(ev => openUrl(docsUrl(ev.item.entry.docs)));
  qp.onDidAccept(() => { const it = qp.selectedItems[0]; qp.hide(); if (it) insertEntry(it.entry); });
  qp.onDidHide(() => qp.dispose());
  qp.show();
}

// ---------------------------------------------------------------- New plugin
async function newPlugin(context) {
  const folder = await pickFolder();
  if (!folder) return;
  const name = await vscode.window.showInputBox({
    prompt: 'Plugin name',
    placeHolder: 'My Plugin',
    validateInput: v => v.trim() ? undefined : 'Enter a name'
  });
  if (!name) return;
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plugin';
  const where = await vscode.window.showQuickPick([
    { label: `New folder "${slug}"`, sub: slug },
    { label: 'Workspace root', sub: '' }
  ], { placeHolder: 'Where should the plugin files go?' });
  if (!where) return;
  const kind = await vscode.window.showQuickPick([
    { label: 'Plain RS3 API', detail: 'Builds UI with the client\'s own ui.* components.', tpl: 'basic' },
    { label: 'With PrettyUI', detail: 'Adds the PrettyUI library plugin (ID 6398181) as a dependency: windows, panels, buttons and fields with flow layout. Completions for prettyui.* turn on automatically.', tpl: 'prettyui' }
  ], { placeHolder: 'Which UI style?' });
  if (!kind) return;
  const dir = vscode.Uri.joinPath(folder.uri, where.sub);
  const tplDir = context.asAbsolutePath(path.join('templates', kind.tpl));
  const fill = s => s.replace(/\{\{name\}\}/g, name.trim()).replace(/\{\{slug\}\}/g, slug);
  const files = fs.readdirSync(tplDir);
  for (const f of files) {
    const target = vscode.Uri.joinPath(dir, f);
    try { await vscode.workspace.fs.stat(target);
      const ok = await vscode.window.showWarningMessage(`${f} already exists. Overwrite?`, { modal: true }, 'Overwrite');
      if (ok !== 'Overwrite') continue;
    } catch { /* does not exist */ }
    await vscode.workspace.fs.writeFile(target, Buffer.from(fill(fs.readFileSync(path.join(tplDir, f), 'utf8')), 'utf8'));
  }
  await setLibrary(context, folder, true);
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(dir, 'main.lua'));
  await vscode.window.showTextDocument(doc);
}

// ---------------------------------------------------------------- Cheats & console commands
/** Rows of the command tables in reference/cheats.md and reference/console-commands.md. */
function consoleCommandRows(context) {
  const read = f => { try { return fs.readFileSync(context.asAbsolutePath(path.join('reference', f)), 'utf8'); } catch { return ''; } };
  const cells = line => line.split('|').slice(1, -1).map(c => c.trim());
  const rows = [];
  for (const line of read('cheats.md').split(/\r?\n/)) {
    const c = cells(line);
    if (c.length !== 3 || !c[1].startsWith('`!')) continue;
    rows.push({ text: c[1].split(' / ')[0].replace(/`/g, ''), desc: c[2].replace(/`/g, ''), kind: 'Cheat (beta worlds only)', file: 'cheats.md' });
  }
  for (const line of read('console-commands.md').split(/\r?\n/)) {
    const c = cells(line);
    if (c.length !== 3 || !c[0].startsWith('`')) continue;
    const full = c[0].replace(/`/g, ''), short = c[1].replace(/`/g, '');
    const args = full.split(' ').slice(1).join(' ');
    rows.push({ text: short ? (short + (args ? ' ' + args : '')) : full, desc: c[2] + (short ? ` (${full.split(' ')[0]})` : ''), kind: 'Plugin console command', file: 'console-commands.md' });
  }
  return rows;
}

/** Pick a cheat or console command, fill in its <arguments>, and copy it for the client console. */
async function pickConsoleCommand(context) {
  const docsBtn = { iconPath: new vscode.ThemeIcon('book'), tooltip: 'Open the full reference' };
  const qp = vscode.window.createQuickPick();
  qp.placeholder = 'Search cheats and console commands (Enter copies it for the client console)';
  qp.matchOnDescription = true;
  qp.matchOnDetail = true;
  let last;
  qp.items = consoleCommandRows(context).map(r => {
    const sep = r.kind !== last ? [{ label: r.kind, kind: vscode.QuickPickItemKind.Separator }] : [];
    last = r.kind;
    return [...sep, { label: r.text, detail: r.desc, buttons: [docsBtn], row: r }];
  }).flat();
  qp.onDidTriggerItemButton(ev => {
    qp.hide();
    vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(context.asAbsolutePath(path.join('reference', ev.item.row.file))));
  });
  const picked = await new Promise(resolve => {
    qp.onDidAccept(() => { resolve(qp.selectedItems[0]); qp.hide(); });
    qp.onDidHide(() => { resolve(undefined); qp.dispose(); });
    qp.show();
  });
  if (!picked) return;
  let text = picked.row.text;
  // ask for each <argument>; [optional] ones may be left empty
  for (const m of [...text.matchAll(/<([^>]+)>|\[([^\]]+)\]/g)]) {
    const optional = !!m[2];
    const v = await vscode.window.showInputBox({ title: picked.row.text, prompt: (m[1] || m[2]) + (optional ? ' (optional, Enter to skip)' : ''), placeHolder: m[1] || m[2] });
    if (v === undefined) return;
    text = text.replace(m[0], v.trim());
  }
  text = text.replace(/\s+/g, ' ').trim();
  await vscode.env.clipboard.writeText(text);
  vscode.window.setStatusBarMessage(`$(clippy) Copied "${text}": paste it in the client console`, 5000);
}

// ---------------------------------------------------------------- activate
function activate(context) {
  setup.activate(context);
  require('./catalog/host').activate(context);
  loadIndex(context);
  const tree = new ApiTree(context);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('rs3lua.explorer', tree),
    vscode.commands.registerCommand('rs3lua.enable', async () => {
      const f = await pickFolder(); if (!f) return;
      await setLibrary(context, f, true);
      vscode.window.showInformationMessage('RS3 Plugin API enabled for ' + f.name + '.');
    }),
    vscode.commands.registerCommand('rs3lua.disable', async () => {
      const f = await pickFolder(); if (!f) return;
      await setLibrary(context, f, false);
      vscode.window.showInformationMessage('RS3 Plugin API removed from ' + f.name + '.');
    }),
    vscode.commands.registerCommand('rs3lua.newPlugin', () => newPlugin(context)),
    vscode.commands.registerCommand('rs3lua.openDocs', () => openUrl(docsUrl(''))),
    vscode.commands.registerCommand('rs3lua.docsForSymbol', () => {
      const ed = vscode.window.activeTextEditor; if (!ed) return;
      const e = findEntry(context, symbolAtCursor(ed));
      if (e && e.docs) openUrl(docsUrl(e.docs));
      else vscode.window.showInformationMessage('No RS3 API docs found for that symbol.');
    }),
    vscode.commands.registerCommand('rs3lua.cheats', () => pickConsoleCommand(context)),
    vscode.commands.registerCommand('rs3lua.preview', async (uri) => {
      const { PreviewPanel, findPluginRoot } = require('./preview/panel');
      const roots = (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath);
      const start = (uri && uri.fsPath) || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.scheme === 'file'
        ? vscode.window.activeTextEditor.document.uri.fsPath : undefined);
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
      if (!root) { vscode.window.showWarningMessage('Open a plugin\'s main.lua (or a folder with plugin.json) first.'); return; }
      await PreviewPanel.show(context, root);
    }),
    vscode.commands.registerCommand('rs3lua.newSprite', uri => require('./sprite/panel').newSprite(context, uri)),
    vscode.commands.registerCommand('rs3lua.editSprite', uri => require('./sprite/panel').editSprite(context, uri)),
    vscode.commands.registerCommand('rs3lua.styleStudio', uri => require('./styles/panel').openStudio(context, uri)),
    vscode.commands.registerCommand('rs3lua.searchApi', () => searchApi(context)),
    vscode.commands.registerCommand('rs3lua.explorer.insert', node => node && node.entry && insertEntry(node.entry)),
    vscode.commands.registerCommand('rs3lua.explorer.copy', node => node && node.entry && vscode.env.clipboard.writeText(node.entry.full)),
    vscode.commands.registerCommand('rs3lua.explorer.openDocs', node => {
      const rel = node && (node.entry ? node.entry.docs : node.group && node.group.docs);
      if (rel) openUrl(docsUrl(rel));
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => autoEnable(context))
  );
  const watcher = vscode.workspace.createFileSystemWatcher('**/plugin.json', false, true, true);
  watcher.onDidCreate(() => autoEnable(context));
  context.subscriptions.push(watcher);
  require('./sprite/panel').trackEditors(context);
  autoEnable(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
