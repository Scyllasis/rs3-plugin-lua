// RS3: Check Plugin. Runs check/lib.js on a plugin and shows the results in the Problems panel.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { checkPlugin, isPluginManifest } = require('./lib');
const { listFiles } = require('../deploy/lib');
const util = require('../util');

const SEVERITY = { error: vscode.DiagnosticSeverity.Error, warn: vscode.DiagnosticSeverity.Warning, info: vscode.DiagnosticSeverity.Information };
let diagnostics;

function pngSize(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const b = Buffer.alloc(24);
    fs.readSync(fd, b, 0, 24, 0);
    return b.toString('ascii', 12, 16) === 'IHDR' ? { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } : null;
  } catch { return null; } finally { if (fd !== undefined) fs.closeSync(fd); }
}

function inspect(root) {
  const read = rel => {
    const abs = path.join(root, rel);
    const open = vscode.workspace.textDocuments.find(d => d.uri.scheme === 'file' && d.uri.fsPath === abs);
    if (open) return open.getText();
    try { return fs.readFileSync(abs, 'utf8'); } catch { return null; }
  };
  const files = {}, images = [];
  for (const rel of listFiles(root)) {
    if (rel.endsWith('.lua')) files[rel] = read(rel) || '';
    else if (/\.png$/i.test(rel)) {
      const size = pngSize(path.join(root, rel));
      if (size) images.push({ file: rel, w: size.w, h: size.h });
    }
  }
  return checkPlugin({ manifestText: read('plugin.json'), files, images });
}

function publish(root, findings) {
  const byFile = new Map();
  for (const f of findings) {
    const uri = vscode.Uri.file(path.join(root, f.file));
    const line = Math.max(0, (f.line || 1) - 1);
    const d = new vscode.Diagnostic(new vscode.Range(line, 0, line, 999), f.msg, SEVERITY[f.severity]);
    d.source = 'RS3 check';
    d.code = f.code;
    const key = uri.toString();
    if (!byFile.has(key)) byFile.set(key, [uri, []]);
    byFile.get(key)[1].push(d);
  }
  // only this plugin's files, so other plugins' results stay in the Problems panel
  diagnostics.forEach(uri => { if (uri.fsPath.startsWith(root + path.sep)) diagnostics.delete(uri); });
  for (const [, [uri, list]] of byFile) diagnostics.set(uri, list);
}

/** Checks a plugin and shows the results. Returns the findings. */
function run(root) {
  const findings = inspect(root);
  publish(root, findings);
  return findings;
}

const counts = findings => ({ errors: findings.filter(f => f.severity === 'error').length, warnings: findings.filter(f => f.severity === 'warn').length });

async function command(uri) {
  const root = await util.pickPluginRoot(uri, 'Check which plugin?');
  if (!root) return;
  const { errors, warnings } = counts(run(root));
  if (!errors && !warnings) { vscode.window.showInformationMessage(`${path.basename(root)}: no problems found.`); return; }
  const c = await vscode.window.showWarningMessage(`${path.basename(root)}: ${errors} error${errors === 1 ? '' : 's'} and ${warnings} warning${warnings === 1 ? '' : 's'}.`, 'Show Problems');
  if (c) vscode.commands.executeCommand('workbench.actions.view.problems');
}

function activate(context) {
  diagnostics = vscode.languages.createDiagnosticCollection('rs3-check');
  context.subscriptions.push(
    diagnostics,
    util.command('rs3lua.checkPlugin', command),
    util.command('rs3lua.submissionChecklist', () => vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(context.asAbsolutePath(path.join('reference', 'submission-checklist.md'))))),
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.uri.scheme !== 'file' || !/\.(lua|json)$/i.test(doc.uri.fsPath)) return;
      if (!vscode.workspace.getConfiguration('rs3lua.check', doc.uri).get('onSave', true)) return;
      const { findPluginRoot } = require('../preview/panel');
      const root = findPluginRoot(doc.uri.fsPath, (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath));
      if (!root) return;
      try {
        if (!isPluginManifest(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'), fs.existsSync(path.join(root, 'main.lua')))) return;
        run(root);
      } catch (e) { util.logError('check on save', e); }
    }),
  );
}

module.exports = { activate, run, counts };
