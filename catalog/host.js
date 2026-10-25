// Item catalog host: "RS3: Find Item…", wiki download, item export plugin, id.Obj completion and hover.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const C = require('./lib');

let ctx;
let cache = null; // merged catalog
const file = name => path.join(ctx.globalStorageUri.fsPath, 'catalog', name);
const port = () => vscode.workspace.getConfiguration('rs3lua.probe').get('port', 47321);

function wikiData() { return C.readJson(file('wiki.json'), null); }
function mineData() { return C.readJson(file('mine.json'), { items: [] }); }
function catalog() {
  if (!cache) {
    const w = wikiData();
    cache = C.merge(w ? w.items : [], mineData().items);
  }
  return cache;
}
function invalidate() { cache = null; }

/** Called by the probe receiver / console import for kind === "items". */
function saveExport(payload) {
  const rows = C.parseExport(payload);
  const mine = mineData();
  const byId = new Map(mine.items.map(i => [i.id, i]));
  for (const r of rows) byId.set(r.id, Object.assign(byId.get(r.id) || {}, r));
  mine.items = [...byId.values()];
  mine.updated = new Date().toISOString();
  C.writeJson(file('mine.json'), mine);
  invalidate();
  vscode.window.setStatusBarMessage(`$(package) Item catalog: ${rows.length} of your items received (${mine.items.length} total)`, 6000);
  return rows.length;
}

async function fetchJson(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 60000);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': 'rs3-plugin-lua VS Code extension (item search; one bulk download, cached locally)', 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`the wiki answered ${r.status} ${r.statusText}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function updateFromWiki() {
  try {
    const items = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Downloading the item list from the RS Wiki', cancellable: false },
      p => C.downloadWiki(fetchJson, (n, page) => p.report({ message: `${n.toLocaleString()} items (page ${page})` })));
    if (!items.length) throw new Error('the wiki returned no items');
    C.writeJson(file('wiki.json'), { updated: new Date().toISOString(), items });
    invalidate();
    vscode.window.showInformationMessage(`Item list updated: ${items.length.toLocaleString()} items from the RS Wiki.`);
    return true;
  } catch (e) {
    const c = await vscode.window.showErrorMessage(`Couldn't download the item list from the RS Wiki: ${e.message}`, 'Use my in-game items instead');
    if (c) createExport();
    return false;
  }
}

async function createExport() {
  const folders = vscode.workspace.workspaceFolders || [];
  let base = folders.length ? folders[0].uri.fsPath : undefined;
  const ed = vscode.window.activeTextEditor;
  if (ed && ed.document.uri.scheme === 'file') {
    const { findPluginRoot } = require('../preview/panel');
    const root = findPluginRoot(ed.document.uri.fsPath, folders.map(f => f.uri.fsPath));
    if (root) base = path.dirname(root);
  }
  if (!base) {
    const u = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, openLabel: 'Put rs3_item_export here' });
    if (!u || !u[0]) return;
    base = u[0].fsPath;
  }
  const target = path.join(base, 'rs3_item_export');
  fs.mkdirSync(target, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'items.lua'), path.join(target, 'main.lua'));
  fs.writeFileSync(path.join(target, 'plugin.json'), JSON.stringify({
    name: 'RS3 Item Export', version: '1.0.0', contactEmailAddress: 'export@example.com',
    optionalPermissions: ['httpAccess'], urls: { probe: `http://127.0.0.1:${port()}` }
  }, null, 2) + '\n');
  const ok = await require('../probe/host').startReceiver(true);
  const commands = require('../probe/lib').consoleCommands(path.basename(target));
  const c = await vscode.window.showInformationMessage(
    `Created the item export plugin in ${target}. ` + (ok ? `Listening on 127.0.0.1:${port()}. ` : '') +
    `Load it on the beta (${commands.join(', ')}), then open your bank once.`,
    'Copy console commands');
  if (c) await vscode.env.clipboard.writeText(commands.join('\n'));
}

// ---------------------------------------------------------------- Find Item
async function findItem() {
  let items = catalog();
  if (!items.length) {
    const c = await vscode.window.showQuickPick([
      { label: '$(cloud-download) Download the item list from the RS Wiki', detail: 'Every released item\'s name and ID. One download, cached on this computer.', id: 'wiki' },
      { label: '$(package) Export my own items from the game', detail: 'Your bank, backpack and worn items, with the config names the game uses (id.Obj.NAME).', id: 'export' }
    ], { placeHolder: 'The item list is empty. Where should it come from?' });
    if (!c) return;
    if (c.id === 'export') { createExport(); return; }
    if (!(await updateFromWiki())) return;
    items = catalog();
  }
  const btnNumber = { iconPath: new vscode.ThemeIcon('symbol-numeric'), tooltip: 'Insert the number instead' };
  const btnCopy = { iconPath: new vscode.ThemeIcon('copy'), tooltip: 'Copy the ID' };
  const btnWiki = { iconPath: new vscode.ThemeIcon('link-external'), tooltip: 'Open the wiki page' };
  const qp = vscode.window.createQuickPick();
  qp.placeholder = 'Type an item name (Enter inserts id.Obj.NAME when known, otherwise the number)';
  qp.matchOnDescription = true;
  qp.matchOnDetail = false;
  const wiki = wikiData();
  qp.title = `Find item · ${items.length.toLocaleString()} items` + (wiki ? ` · wiki list from ${new Date(wiki.updated).toLocaleDateString()}` : '');
  qp.items = items.map(e => ({
    label: (e.sources.includes('mine') ? '$(package) ' : '') + (e.names[0] || 'item ' + e.id),
    description: `${e.id}` + (e.configName ? ` · ${e.configName}` : '') + (e.names.length > 1 ? ` · ${e.names.slice(1, 3).join(', ')}` : ''),
    detail: e.where ? 'in your ' + e.where : undefined,
    buttons: [btnNumber, btnCopy, ...(e.page ? [btnWiki] : [])],
    e
  }));
  qp.onDidTriggerItemButton(async ev => {
    const e = ev.item.e;
    if (ev.button === btnWiki) vscode.env.openExternal(vscode.Uri.parse(C.wikiUrl(e)));
    else if (ev.button === btnCopy) { await vscode.env.clipboard.writeText(String(e.id)); vscode.window.setStatusBarMessage(`Copied ${e.id}`, 2000); }
    else if (ev.button === btnNumber) { qp.hide(); insert(C.insertText(e, 'number')); }
  });
  qp.onDidAccept(() => { const it = qp.selectedItems[0]; qp.hide(); if (it) insert(C.insertText(it.e)); });
  qp.onDidHide(() => qp.dispose());
  qp.show();
}

async function insert(text) {
  const ed = vscode.window.activeTextEditor;
  if (ed && ed.document.languageId === 'lua') { await ed.edit(b => ed.selections.forEach(s => b.replace(s, text))); return; }
  await vscode.env.clipboard.writeText(text);
  vscode.window.setStatusBarMessage(`Copied ${text}`, 3000);
}

// ---------------------------------------------------------------- id.Obj completion + hover
function byConfigName() {
  const m = new Map();
  for (const e of catalog()) if (e.configName) m.set(e.configName, e);
  return m;
}

function activate(context) {
  ctx = context;
  const sel = { language: 'lua' };
  context.subscriptions.push(
    vscode.commands.registerCommand('rs3lua.findItem', findItem),
    vscode.commands.registerCommand('rs3lua.catalog.updateWiki', updateFromWiki),
    vscode.commands.registerCommand('rs3lua.catalog.createExport', createExport),
    vscode.commands.registerCommand('rs3lua.catalog.clear', async () => {
      const c = await vscode.window.showWarningMessage('Delete the cached item list (wiki download and your exported items)?', { modal: true }, 'Delete');
      if (!c) return;
      for (const f of ['wiki.json', 'mine.json']) { try { fs.unlinkSync(file(f)); } catch { /* none */ } }
      invalidate();
    }),
    vscode.languages.registerCompletionItemProvider(sel, {
      provideCompletionItems(doc, pos) {
        const before = doc.lineAt(pos.line).text.slice(0, pos.character);
        if (!/\bid\.Obj\.\w*$/.test(before)) return undefined;
        const out = [];
        for (const [cfg, e] of byConfigName()) {
          const it = new vscode.CompletionItem({ label: cfg, description: e.names[0] }, vscode.CompletionItemKind.EnumMember);
          it.detail = `${e.names[0] || ''} (${e.id})`;
          it.filterText = cfg + ' ' + (e.names[0] || '');
          it.sortText = '0' + cfg;
          out.push(it);
        }
        return out;
      }
    }, '.'),
    vscode.languages.registerHoverProvider(sel, {
      provideHover(doc, pos) {
        const range = doc.getWordRangeAtPosition(pos, /id\.Obj\.[A-Za-z_]\w*/);
        if (!range) return undefined;
        const cfg = doc.getText(range).slice('id.Obj.'.length);
        const e = byConfigName().get(cfg);
        if (!e) return undefined;
        const md = new vscode.MarkdownString(`**${e.names[0] || cfg}** · item ${e.id}` + (e.where ? ` · in your ${e.where}` : ''));
        const url = C.wikiUrl(e);
        if (url) md.appendMarkdown(`\n\n[Wiki](${url})`);
        return new vscode.Hover(md, range);
      }
    })
  );
}

module.exports = { activate, saveExport };
