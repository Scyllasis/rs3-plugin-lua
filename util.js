// Small helpers every feature shares: safe commands, safe file writes, webview nonces.
'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let channel;
const errors = []; // what's gone wrong this session, for the smoke test
function output() {
  if (!channel) channel = vscode.window.createOutputChannel('RS3 Plugin API');
  return channel;
}
function logError(where, e) {
  errors.push(`${where}: ${(e && e.message) || e}`);
  output().appendLine(`[${new Date().toISOString()}] ${where}: ${(e && e.stack) || e}`);
}

/** A failure in one command is reported and logged, never left as an unhandled rejection. */
function guard(name, fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      logError(name, e);
      const c = await vscode.window.showErrorMessage(`RS3 Plugin API: ${(e && e.message) || e}`, 'Show Log');
      if (c) output().show();
      return undefined;
    }
  };
}
const command = (id, fn) => vscode.commands.registerCommand(id, guard(id, fn));

/** Runs one part of activation, so a broken feature can't take the others down with it. */
function step(name, fn) {
  try { return fn(); } catch (e) { logError('activate ' + name, e); return undefined; }
}

const nonce = () => crypto.randomBytes(18).toString('base64url');

/** Writes through a temporary file, so a crash can't leave a half-written file behind. */
function writeFileAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* already gone */ }
    throw e;
  }
}

/** The absolute path of `rel` inside `root`, or null if it would land outside. */
function insideRoot(root, rel) {
  if (typeof rel !== 'string' || !rel || rel.includes('\0')) return null;
  const base = path.resolve(root);
  const abs = path.resolve(base, rel);
  const within = path.relative(base, abs);
  return within && !within.startsWith('..') && !path.isAbsolute(within) ? abs : null;
}

/** The plugin folder for a command: from a file, the active editor, or by asking. */
async function pickPluginRoot(uri, prompt) {
  const { findPluginRoot } = require('./preview/panel');
  const roots = (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath);
  const active = vscode.window.activeTextEditor;
  const start = (uri && uri.fsPath) || (active && active.document.uri.scheme === 'file' ? active.document.uri.fsPath : undefined);
  const root = start && findPluginRoot(start, roots);
  if (root) return root;
  const found = await vscode.workspace.findFiles('**/plugin.json', '**/node_modules/**', 50);
  const { isPluginManifest } = require('./check/lib');
  const dirs = found.map(f => path.dirname(f.fsPath)).filter(d => {
    try { return isPluginManifest(fs.readFileSync(path.join(d, 'plugin.json'), 'utf8'), fs.existsSync(path.join(d, 'main.lua'))); }
    catch { return false; }
  });
  if (dirs.length === 1) return dirs[0];
  if (dirs.length > 1) {
    const pick = await vscode.window.showQuickPick(dirs.map(d => ({ label: vscode.workspace.asRelativePath(d), dir: d })), { placeHolder: prompt || 'Which plugin?' });
    return pick && pick.dir;
  }
  vscode.window.showWarningMessage('Open a plugin folder (one with plugin.json) first.');
  return undefined;
}

module.exports = { errors, output, logError, guard, command, step, nonce, writeFileAtomic, insideRoot, pickPluginRoot };
