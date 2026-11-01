// Starts real VS Code with this extension, and runs suite.js inside it. Uses its own profile, so your
// settings and windows aren't touched. Run: node test/smoke/run.js
'use strict';
const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function findCode() {
  if (process.env.VSCODE_EXE && fs.existsSync(process.env.VSCODE_EXE)) return process.env.VSCODE_EXE;
  const local = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code', 'Code.exe') : '';
  if (local && fs.existsSync(local)) return local;
  try {
    const line = execSync(process.platform === 'win32' ? 'where code' : 'which code', { encoding: 'utf8' }).split(/\r?\n/)[0];
    const exe = path.resolve(path.dirname(line), '..', 'Code.exe');
    if (fs.existsSync(exe)) return exe;
  } catch { /* not on the path */ }
  return null;
}

const code = findCode();
if (!code) { console.log('SKIPPED: VS Code not found. Set VSCODE_EXE to Code.exe.'); process.exit(0); }

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-smoke-'));
const plugin = path.join(work, 'plugin');
const dev = path.join(work, 'dev_plugins');
fs.mkdirSync(path.join(plugin, '.vscode'), { recursive: true });
fs.mkdirSync(dev);
// a stand-in client folder, so Plugin Data has a real database to open
const clientData = path.join(work, 'plugins');
fs.mkdirSync(clientData);
fs.copyFileSync(path.join(__dirname, 'sample.db'), path.join(clientData, 'PluginData.db'));
fs.writeFileSync(path.join(plugin, 'plugin.json'), JSON.stringify({ name: 'Smoke Test', version: '1.0', contactEmailAddress: 'a@b.net', requiredDependencies: {}, optionalDependencies: {}, requiredPermissions: [], optionalPermissions: [] }, null, 2));
fs.writeFileSync(path.join(plugin, 'main.lua'), 'log("hi")\nEvent.ChatMessage.Subscribe("x", function() end)\n');
fs.writeFileSync(path.join(plugin, '.vscode', 'settings.json'), JSON.stringify({ 'rs3lua.devPluginsFolder': dev }));

const result = spawnSync(code, [
  plugin,
  '--extensionDevelopmentPath=' + path.join(__dirname, '..', '..'),
  '--extensionTestsPath=' + path.join(__dirname, 'suite.js'),
  '--user-data-dir=' + path.join(work, 'profile'),
  // empty on purpose: everything has to work without the Lua extension, which offers itself as a fix
  '--extensions-dir=' + path.join(work, 'extensions'),
  '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--disable-gpu',
], { stdio: 'inherit', env: Object.assign({}, process.env, { RS3_SMOKE_DEV: dev, ELECTRON_RUN_AS_NODE: undefined }), timeout: 180000 });

const report = path.join(plugin, 'smoke-report.txt');
if (fs.existsSync(report)) console.log(fs.readFileSync(report, 'utf8'));
else console.log('No report: the suite never finished.', result.error ? result.error.message : '', 'exit', result.status);
const ok = fs.existsSync(report) && fs.readFileSync(report, 'utf8').includes('ALL PASSED');
try { fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* VS Code may still hold it */ }
process.exit(ok ? 0 : 1);
