// The UI Builder's saving, with VS Code stubbed so the file handling can be pushed harder than the
// real window allows.
'use strict';
const stub = require('./helpers/vscode');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

let warnings = [], answer;
stub.Uri = { file: f => ({ fsPath: f }), joinPath: (u, f) => ({ fsPath: path.join(u.fsPath, f) }) };
stub.ViewColumn = { Active: 1, Beside: 2 };
stub.RelativePattern = function RelativePattern() {};
stub.workspace.createFileSystemWatcher = () => ({ onDidChange() {}, onDidCreate() {}, dispose() {} });
stub.window.showWarningMessage = async (...args) => { warnings.push(args[0]); return answer; };
stub.window.showErrorMessage = async () => undefined;
stub.window.createWebviewPanel = () => ({
  webview: { html: '', cspSource: 'x', asWebviewUri: u => u.fsPath, onDidReceiveMessage() {}, postMessage() {} },
  onDidDispose() {}, reveal() {},
});

const L = require('../builder/lib');
const { BuilderPanel, panels, dependsOnPrettyUI, tryInMock } = require('../builder/panel');
const Libraries = require('../preview/libraries');

const context = { extensionPath: path.join(__dirname, '..'), asAbsolutePath: p => path.join(__dirname, '..', p) };
function plugin(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-panel-'));
  for (const [f, text] of Object.entries(files || {})) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), text);
  }
  return root;
}
const open = (root, name) => {
  warnings = []; answer = undefined;
  panels.clear();
  return BuilderPanel.open(context, root, name);
};
const sample = () => L.fillTemplate(L.blank('panel', 'groupbox'), 'settings');

test('saving writes the design and its Lua', async () => {
  const root = plugin();
  const p = open(root, 'panel');
  await p.onMessage({ type: 'save', design: sample() });
  assert.ok(fs.readFileSync(path.join(root, 'panel.lua'), 'utf8').startsWith(L.GEN_HEADER));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.rs3', 'ui', 'panel.json'), 'utf8')).name, 'panel');
});

test('someone else\'s Lua file is never replaced unasked', async () => {
  const root = plugin({ 'panel.lua': '-- my own work\n' });
  const p = open(root, 'panel');
  await p.onMessage({ type: 'save', design: sample() });
  assert.equal(fs.readFileSync(path.join(root, 'panel.lua'), 'utf8'), '-- my own work\n');
  assert.ok(fs.existsSync(path.join(root, 'panel_generated.lua')));
  assert.equal(warnings.length, 1);
  await p.onMessage({ type: 'save', design: sample() });
  assert.equal(warnings.length, 1, 'it only asks once');
});

test('overwriting needs a yes', async () => {
  const root = plugin({ 'panel.lua': '-- my own work\n' });
  const p = open(root, 'panel');
  answer = 'Overwrite';
  await p.onMessage({ type: 'save', design: sample() });
  assert.ok(fs.readFileSync(path.join(root, 'panel.lua'), 'utf8').startsWith(L.GEN_HEADER));
});

test('a design can\'t choose where it\'s saved', async () => {
  const root = plugin();
  const p = open(root, 'panel');
  await p.onMessage({ type: 'save', design: Object.assign(sample(), { name: '../../evil' }) });
  assert.deepEqual(fs.readdirSync(root).sort(), ['.rs3', 'panel.lua']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.rs3', 'ui', 'panel.json'), 'utf8')).name, 'panel');
});

test('a design file that can\'t be read is kept, not overwritten', async () => {
  const root = plugin({ '.rs3/ui/panel.json': '{ "almost": json,' });
  const p = open(root, 'panel');
  const { design } = p.load();
  assert.equal(design.comps.length, 0);
  assert.equal(warnings.length, 1);
  assert.ok(fs.readdirSync(path.join(root, '.rs3', 'ui')).some(f => f.includes('.broken-')));
});

test('quick changes collapse into one save, and the last one wins', async () => {
  const root = plugin();
  const p = open(root, 'panel');
  const one = sample(), two = sample();
  one.host.title = 'First'; two.host.title = 'Second';
  await p.onMessage({ type: 'change', design: one });
  await p.onMessage({ type: 'change', design: two });
  assert.ok(!fs.existsSync(path.join(root, 'panel.lua')), 'waits for a pause');
  await new Promise(r => setTimeout(r, 600));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.rs3', 'ui', 'panel.json'), 'utf8')).host.title, 'Second');
});

test('closing the panel still saves what was typed last', async () => {
  const root = plugin();
  const p = open(root, 'panel');
  await p.onMessage({ type: 'change', design: sample() });
  p.dispose();
  await p.chain;
  assert.ok(fs.existsSync(path.join(root, 'panel.lua')));
});

test('PrettyUI dependencies are recognised in every form', () => {
  assert.equal(dependsOnPrettyUI({ requiredDependencies: { prettyui: 6398181 } }), true);
  assert.equal(dependsOnPrettyUI({ requiredDependencies: { ui: 6398181 } }), true);
  assert.equal(dependsOnPrettyUI({ optionalDependencies: ['PrettyUI'] }), true);
  assert.equal(dependsOnPrettyUI({ requiredDependencies: {} }), false);
  assert.equal(dependsOnPrettyUI(null), false);
});

test('a window design that lacks PrettyUI isn\'t reported as a code error', async () => {
  const code = L.generateLua(L.normalize(L.blank('panel', 'window')).design);
  assert.deepEqual(await tryInMock(context, 'panel', code, 'prettyui', false), []);
});

const prettyui = Libraries.find('prettyui');
test('a PrettyUI window really runs on PrettyUI', { skip: prettyui.error ? 'the client\'s copy of PrettyUI is not on this computer' : false }, async () => {
  const d = L.fillTemplate(L.blank('panel', 'window'), 'settings');
  const code = L.generateLua(L.normalize(d).design);
  assert.deepEqual(await tryInMock(context, 'panel', code, 'prettyui', true), []);
});

test('every part, in PrettyUI mode, pinned or not, runs on the real PrettyUI', { skip: prettyui.error ? 'the client\'s copy of PrettyUI is not on this computer' : false }, async () => {
  for (const pin of ['start', 'end', 'center']) {
    const d = L.blank('panel', 'window');
    for (const type of Object.keys(L.TYPES)) {
      const c = L.create(d, type, pin === 'start' ? 10 : -10, 10);
      c.ax = pin;
      d.comps.push(c);
    }
    const { design, notes } = L.normalize(d);
    assert.deepEqual(notes, []);
    assert.deepEqual(await tryInMock(context, 'panel', L.generateLua(design), 'prettyui', true), [], pin);
  }
});

test('a mistake in generated code would be caught', async () => {
  assert.equal((await tryInMock(context, 'panel', 'error("boom")', 'plain', false)).length, 1);
});
