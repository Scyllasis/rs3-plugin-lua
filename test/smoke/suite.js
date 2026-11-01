// Runs inside real VS Code (see run.js). Commands that end with a notification are left running
// rather than awaited, because they wait for someone to dismiss it.
'use strict';
const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const EXT = 'sam-local.rs3-plugin-lua';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(what, test, ms = 15000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await test();
    if (v) return v;
    if (Date.now() > end) throw new Error('Timed out waiting for ' + what);
    await sleep(100);
  }
}

exports.run = async function run() {
  const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const dev = process.env.RS3_SMOKE_DEV;
  const lines = [];
  let failed = 0;
  const report = () => fs.writeFileSync(path.join(root, 'smoke-report.txt'), lines.join('\n') + '\n');
  const check = async (name, fn) => {
    try {
      await Promise.race([fn(), sleep(30000).then(() => { throw new Error('Timed out: is it waiting for an answer?'); })]);
      lines.push('ok   ' + name);
    } catch (e) { failed += 1; lines.push(`FAIL ${name}\n     ${String(e && e.stack || e).split('\n').slice(0, 5).join('\n     ')}`); }
    report(); // written as it goes, so a hang still shows how far it got
  };
  const uri = vscode.Uri.file(path.join(root, 'main.lua'));

  const ext = vscode.extensions.getExtension(EXT);
  await check('the extension activates', async () => {
    assert.ok(ext, 'found');
    await ext.activate();
    assert.equal(ext.isActive, true);
  });
  await check('every declared command is registered', async () => {
    const have = new Set(await vscode.commands.getCommands(true));
    const missing = ext.packageJSON.contributes.commands.map(c => c.command).filter(c => !have.has(c));
    assert.deepEqual(missing, []);
  });
  await check('the walkthrough pages all exist', () => {
    for (const w of ext.packageJSON.contributes.walkthroughs) for (const s of w.steps) {
      assert.ok(fs.existsSync(path.join(ext.extensionPath, s.media.markdown)), s.media.markdown);
    }
  });
  await check('Check Plugin finds the missing permission, on the right line', async () => {
    vscode.commands.executeCommand('rs3lua.checkPlugin', uri);
    const list = await until('diagnostics', () => { const d = vscode.languages.getDiagnostics(uri).filter(x => x.source === 'RS3 check'); return d.length ? d : null; });
    const hit = list.find(d => /chatAccess/.test(d.message));
    assert.ok(hit);
    assert.equal(hit.range.start.line, 1);
  });
  await check('Deploy copies the plugin and the console commands', async () => {
    await vscode.env.clipboard.writeText('');
    await vscode.commands.executeCommand('rs3lua.deploy', uri);
    assert.ok(fs.existsSync(path.join(dev, 'smoke_test', 'main.lua')));
    assert.ok(fs.existsSync(path.join(dev, 'smoke_test', 'plugin.json')));
    assert.match(await vscode.env.clipboard.readText(), /prf\r?\npon smoke_test\r?\nprl smoke_test/);
    assert.ok(fs.existsSync(path.join(root, '.rs3', 'deploy.json')));
  });
  await check('a second deploy removes a file that was deleted', async () => {
    const extra = path.join(root, 'extra.lua');
    fs.writeFileSync(extra, '');
    await vscode.commands.executeCommand('rs3lua.deploy', uri);
    assert.ok(fs.existsSync(path.join(dev, 'smoke_test', 'extra.lua')));
    fs.unlinkSync(extra);
    await vscode.commands.executeCommand('rs3lua.deploy', uri);
    assert.ok(!fs.existsSync(path.join(dev, 'smoke_test', 'extra.lua')));
    assert.equal(await vscode.env.clipboard.readText(), 'prl smoke_test');
  });
  await check('Package for Upload writes a zip', async () => {
    fs.writeFileSync(path.join(root, 'main.lua'), 'log("hi")\n');
    vscode.commands.executeCommand('rs3lua.package', uri);
    await until('the zip', () => fs.existsSync(path.join(root, 'dist', 'smoke_test-1.0.zip')));
  });
  await check('the UI Builder opens, its page runs under the real security policy, and it saves', async () => {
    const design = path.join(root, '.rs3', 'ui', 'panel.json');
    fs.mkdirSync(path.dirname(design), { recursive: true });
    const L = require('../../builder/lib');
    const d = L.fillTemplate(L.blank('panel', 'groupbox'), 'settings');
    fs.writeFileSync(design, JSON.stringify(d));
    await vscode.commands.executeCommand('rs3lua.uiBuilder', vscode.Uri.file(design));
    await until('the builder tab', () => vscode.window.tabGroups.all.some(g => g.tabs.some(t => /UI Builder/.test(t.label))));
    const { panels } = require('../../builder/panel');
    const panel = await until('the panel', () => [...panels.values()][0]);
    await until('the page to report in', () => panel.ready);
    await panel.onMessage({ type: 'save', design: d });
    const lua = fs.readFileSync(path.join(root, 'panel.lua'), 'utf8');
    assert.ok(lua.startsWith(L.GEN_HEADER));
    assert.ok(lua.includes('c.slider = ui.Slider.new'));
    assert.ok(JSON.parse(fs.readFileSync(design, 'utf8')).comps.length > 0);
  });
  await check('the UI Builder regenerates in PrettyUI mode', async () => {
    const { panels } = require('../../builder/panel');
    const L = require('../../builder/lib');
    const panel = [...panels.values()][0];
    const d = L.applyStyle(L.fillTemplate(L.blank('panel', 'groupbox'), 'settings'), 'prettyui');
    await panel.onMessage({ type: 'save', design: d });
    assert.match(fs.readFileSync(path.join(root, 'panel.lua'), 'utf8'), /prettyui\.Window\.new/);
  });
  await check('Add Log Capture adds the module and the require', async () => {
    await vscode.commands.executeCommand('rs3lua.addLogCapture', uri);
    assert.ok(fs.existsSync(path.join(root, 'rs3log.lua')));
    assert.match(fs.readFileSync(path.join(root, 'main.lua'), 'utf8'), /^require\("rs3log"\)/);
  });
  await check('Plugin Data opens, or says why it can\'t', async () => {
    vscode.commands.executeCommand('rs3lua.pluginData');
    await sleep(1000);
    assert.deepEqual(require('../../util').errors, []);
  });
  await check('the UI Preview opens', async () => {
    await vscode.commands.executeCommand('rs3lua.preview', vscode.Uri.file(path.join(root, 'main.lua')));
    await until('the preview tab', () => vscode.window.tabGroups.all.some(g => g.tabs.some(t => /RS3 UI Preview/.test(t.label))));
    await sleep(500);
  });
  await check('nothing was logged as a failure, even after closing everything', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await sleep(600);
    assert.deepEqual(require('../../util').errors, []);
  });
  lines.push(failed ? `${failed} FAILED` : 'ALL PASSED');
  report();
};
