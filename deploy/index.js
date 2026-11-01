// RS3: Deploy to Game (copy the plugin into the client's dev_plugins folder) and
// RS3: Package for Upload (the zip Mod.io wants). What was deployed is remembered in .rs3/deploy.json.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const lib = require('./lib');
const util = require('../util');

const recordFile = root => path.join(root, '.rs3', 'deploy.json');
function readRecord(root) {
  try {
    const r = JSON.parse(fs.readFileSync(recordFile(root), 'utf8'));
    return r && typeof r === 'object' ? r : null;
  } catch { return null; }
}
function readManifest(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8')); } catch { return null; }
}

async function chooseDevFolder(record) {
  const { devPluginFolders } = require('../catalog/receiver');
  // a folder someone set on purpose wins over the ones found by looking
  const chosen = vscode.workspace.getConfiguration('rs3lua').get('devPluginsFolder', '');
  if (chosen && fs.existsSync(chosen)) return chosen;
  if (record && record.devFolder && fs.existsSync(record.devFolder)) return record.devFolder;
  const found = devPluginFolders();
  if (found.length === 1) return found[0];
  if (found.length > 1) {
    const pick = await vscode.window.showQuickPick(found, { placeHolder: 'Which client?' });
    return pick;
  }
  const c = await vscode.window.showWarningMessage('The game client\'s dev_plugins folder wasn\'t found.', 'Choose Folder…');
  if (!c) return undefined;
  const picked = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, openLabel: 'Use this folder' });
  return picked && picked[0].fsPath;
}

async function deploy(root, quiet) {
  const manifest = readManifest(root);
  if (!manifest) throw new Error('plugin.json is missing or isn\'t valid JSON.');
  const record = readRecord(root);
  const devFolder = await chooseDevFolder(record);
  if (!devFolder) return false;
  const folder = record && lib.validFolder(record.folder) ? record.folder : lib.folderName(manifest, root);
  const dest = path.join(devFolder, folder);
  // a folder this plugin didn't make could be another plugin: never merge into it unasked
  if (fs.existsSync(dest) && !(record && record.folder === folder && record.devFolder === devFolder)) {
    const ok = await vscode.window.showWarningMessage(`${folder} already exists in dev_plugins. Copy this plugin over it?`, { modal: true }, 'Copy Over It');
    if (ok !== 'Copy Over It') return false;
  }
  const first = !record || record.devFolder !== devFolder;
  const result = lib.deploy(root, dest, record && record.devFolder === devFolder ? record.files : []);
  util.writeFileAtomic(recordFile(root), JSON.stringify({ devFolder, folder, files: result.files }, null, 2) + '\n');
  if (!quiet) {
    const commands = first ? ['prf', `pon ${folder}`, `prl ${folder}`] : [`prl ${folder}`];
    await vscode.env.clipboard.writeText(commands.join('\n'));
    const removed = result.removed.length ? `, removed ${result.removed.length} old` : '';
    vscode.window.setStatusBarMessage(`$(rocket) Deployed ${result.files.length} files${removed}. Copied for the client console: ${commands.join(', ')}`, 8000);
  } else {
    vscode.window.setStatusBarMessage(`$(rocket) Deployed ${folder}`, 3000);
  }
  return true;
}

async function deployCommand(uri) {
  const root = await util.pickPluginRoot(uri, 'Deploy which plugin?');
  if (root) await deploy(root, false);
}

async function packageCommand(uri) {
  const root = await util.pickPluginRoot(uri, 'Package which plugin?');
  if (!root) return;
  const check = require('../check');
  const findings = check.run(root);
  const { errors } = check.counts(findings);
  if (errors) {
    const c = await vscode.window.showWarningMessage(`Check Plugin found ${errors} error${errors === 1 ? '' : 's'}. Mod.io or the client may refuse this.`, { modal: true }, 'Package Anyway', 'Show Problems');
    if (c === 'Show Problems') vscode.commands.executeCommand('workbench.actions.view.problems');
    if (c !== 'Package Anyway') return;
  }
  const manifest = readManifest(root) || {};
  const files = lib.listFiles(root);
  if (!files.includes('main.lua') || !files.includes('plugin.json')) throw new Error('main.lua and plugin.json have to be at the top of the plugin folder.');
  const zip = lib.makeZip(files.map(rel => ({ name: rel, data: fs.readFileSync(path.join(root, ...rel.split('/'))) })));
  const name = `${lib.folderName(manifest, root)}-${String(manifest.version || '0').replace(/[^0-9.]/g, '')}.zip`;
  const out = path.join(root, 'dist', name);
  util.writeFileAtomic(out, zip);
  const c = await vscode.window.showInformationMessage(`Packaged ${files.length} files to dist/${name}.`, 'Show in Folder', 'Upload Checklist');
  if (c === 'Show in Folder') vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(out));
  if (c === 'Upload Checklist') vscode.commands.executeCommand('rs3lua.submissionChecklist');
}

function activate(context) {
  let timer;
  context.subscriptions.push(
    util.command('rs3lua.deploy', deployCommand),
    util.command('rs3lua.package', packageCommand),
    { dispose: () => clearTimeout(timer) },
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.uri.scheme !== 'file' || !vscode.workspace.getConfiguration('rs3lua.deploy', doc.uri).get('onSave', false)) return;
      const { findPluginRoot } = require('../preview/panel');
      const root = findPluginRoot(doc.uri.fsPath, (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath));
      if (!root || !readRecord(root)) return; // only plugins already deployed by hand
      clearTimeout(timer);
      timer = setTimeout(() => util.guard('deploy on save', () => deploy(root, true))(), 500);
    }),
  );
}

module.exports = { activate };
