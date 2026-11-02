'use strict';
require('./helpers/vscode');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkPlugin, isPluginManifest, codeOnly } = require('../check/lib');
const deploy = require('../deploy/lib');
const { readZip } = require('../preview/libraries');
const { parseConsole, allowed } = require('../catalog/receiver');
const { planMove } = require('../preview/move');
const { Session } = require('../preview/engine');
const util = require('../util');

const GOOD = JSON.stringify({ name: 'Good', version: '1.0', contactEmailAddress: 'a@b.net', requiredDependencies: {}, optionalDependencies: {}, requiredPermissions: [], optionalPermissions: [] });
const codes = (input, severity) => checkPlugin(input).filter(f => !severity || f.severity === severity).map(f => f.code);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-test-'));

// ---- which plugin.json files are ours
test('other tools\' plugin.json files aren\'t RS3 plugins', () => {
  assert.equal(isPluginManifest('{"name":"x","version":"1","description":"a claude plugin"}', false), false);
  assert.equal(isPluginManifest('[]', true), false);
  assert.equal(isPluginManifest('not json', false), false);
  assert.equal(isPluginManifest(GOOD, false), true);
  assert.equal(isPluginManifest('{"name":"x"}', true), true);
  assert.equal(isPluginManifest('{ broken', true), true); // mid-edit, next to a main.lua
});

// ---- check plugin
test('a clean plugin passes', () => {
  assert.deepEqual(codes({ manifestText: GOOD, files: { 'main.lua': 'log("hi")' } }, 'error'), []);
  assert.deepEqual(codes({ manifestText: GOOD, files: { 'main.lua': 'log("hi")' } }, 'warn'), []);
});

test('the array dependencies the client refused are flagged', () => {
  const m = JSON.parse(GOOD); m.requiredDependencies = [];
  const hit = checkPlugin({ manifestText: JSON.stringify(m, null, 2), files: { 'main.lua': '' } }).find(f => f.code === 'deps-array');
  assert.ok(hit);
  assert.ok(hit.line > 1);
});

test('the shipped templates would pass the client', () => {
  for (const name of ['basic', 'prettyui']) {
    const text = fs.readFileSync(path.join(__dirname, '..', 'templates', name, 'plugin.json'), 'utf8');
    assert.ok(!codes({ manifestText: text.replace('{{name}}', 'x'), files: { 'main.lua': '' } }).includes('deps-array'), name);
  }
});

test('permissions must match what the code uses', () => {
  const uses = { 'main.lua': 'Event.ChatMessage.Subscribe("a", function() end)' };
  assert.ok(codes({ manifestText: GOOD, files: uses }, 'error').includes('permission'));
  const m = JSON.parse(GOOD); m.optionalPermissions = ['chatAccess'];
  assert.ok(!codes({ manifestText: JSON.stringify(m), files: uses }, 'error').includes('permission'));
  assert.ok(codes({ manifestText: JSON.stringify(m), files: { 'main.lua': '' } }, 'warn').includes('unused-permission'));
  assert.ok(!codes({ manifestText: GOOD, files: { 'main.lua': '-- Event.ChatMessage in a comment\nlog("Chat.AddMessage in a string")' } }).includes('permission'));
});

test('manifest rules', () => {
  const bad = { name: 'x'.repeat(51), version: 'v1', contactEmailAddress: 'you@example.com' };
  const found = codes({ manifestText: JSON.stringify(bad), files: { 'main.lua': '' } });
  for (const code of ['name', 'version', 'email']) assert.ok(found.includes(code), code);
  assert.ok(codes({ manifestText: '{ nope', files: {} }).includes('bad-manifest'));
  assert.ok(codes({ manifestText: null, files: {} }).includes('no-manifest'));
  assert.ok(codes({ manifestText: GOOD, files: {} }).includes('no-main'));
});

test('in-game gotchas', () => {
  const lua = ['t.content = "a\\nb"', 'g:Subscribe(ui.Hook.ONDRAG, f)', 'box:SetHeaderLayout(300, 25)', 'local h = grid.cellHeight'].join('\n');
  const list = checkPlugin({ manifestText: GOOD, files: { 'main.lua': lua } });
  assert.ok(list.find(f => f.code === 'gotcha' && f.line === 1 && /box/.test(f.msg)));
  assert.ok(list.find(f => f.code === 'gotcha' && f.line === 2));
  assert.ok(list.find(f => f.code === 'header-width' && f.line === 3));
  assert.ok(list.find(f => f.code === 'gotcha' && f.line === 4 && /crashes/.test(f.msg)));
});

test('codeOnly blanks comments and strings but keeps positions', () => {
  const src = 'a = "x" -- c\n--[[ long\nstill ]] b = [==[ s ]==]\nc = 1';
  const out = codeOnly(src);
  assert.equal(out.length, src.length);
  assert.equal(out.split('\n').length, src.split('\n').length);
  assert.ok(!/\bx\b|long|still| s /.test(out));
  assert.ok(/b =/.test(out) && /c = 1/.test(out));
});

// ---- deploy
test('only the plugin\'s own files are deployed', () => {
  const root = tmp();
  for (const f of ['main.lua', 'plugin.json', 'lib/a.lua', 'rs3preview.lua', 'notes.log', 'x.zip', '.secret', '.rs3/ui/a.json', 'docs/a.md', 'node_modules/b.js', 'dist/o.zip']) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), 'x');
  }
  assert.deepEqual(deploy.listFiles(root), ['lib/a.lua', 'main.lua', 'plugin.json']);
});

test('deploy removes only what it put there', () => {
  const root = tmp(), dest = path.join(tmp(), 'p');
  fs.writeFileSync(path.join(root, 'main.lua'), 'new');
  fs.mkdirSync(dest);
  fs.writeFileSync(path.join(dest, 'old.lua'), 'mine');
  fs.writeFileSync(path.join(dest, 'keep.txt'), 'not ours');
  const r = deploy.deploy(root, dest, ['old.lua', 'main.lua']);
  assert.deepEqual(r.removed, ['old.lua']);
  assert.ok(fs.existsSync(path.join(dest, 'keep.txt')));
  assert.equal(fs.readFileSync(path.join(dest, 'main.lua'), 'utf8'), 'new');
});

test('a tampered deploy record can\'t delete outside the plugin', () => {
  const base = tmp(), root = path.join(base, 'src'), dest = path.join(base, 'dest');
  fs.mkdirSync(root); fs.mkdirSync(dest);
  fs.writeFileSync(path.join(root, 'main.lua'), 'x');
  const victim = path.join(base, 'victim.txt');
  fs.writeFileSync(victim, 'keep');
  deploy.deploy(root, dest, ['../victim.txt', victim]);
  assert.ok(fs.existsSync(victim));
});

test('deploy refuses overlapping folders', () => {
  const root = tmp();
  fs.writeFileSync(path.join(root, 'main.lua'), 'x');
  assert.throws(() => deploy.deploy(root, root, []), /overlaps/);
  assert.throws(() => deploy.deploy(root, path.join(root, 'sub'), []), /overlaps/);
  assert.throws(() => deploy.deploy(path.join(root, 'sub'), root, []), /overlaps/);
});

test('folder names are safe', () => {
  assert.equal(deploy.folderName({ name: 'Crypt Crawler' }, 'x'), 'crypt_crawler');
  assert.equal(deploy.folderName({ name: '!!!' }, 'x'), 'plugin');
  assert.equal(deploy.validFolder('../x'), false);
  assert.equal(deploy.validFolder('..'), false);
  assert.equal(deploy.validFolder('ok_name-1'), true);
});

// ---- zip
test('zips read back exactly, with files at the top level', () => {
  const big = 'hello world '.repeat(5000);
  const file = path.join(tmp(), 'o.zip');
  fs.writeFileSync(file, deploy.makeZip([{ name: 'main.lua', data: big }, { name: 'plugin.json', data: '{}' }, { name: 'lib/é.lua', data: '' }]));
  const out = readZip(file);
  assert.equal(out['main.lua'], big);
  assert.equal(out['plugin.json'], '{}');
  assert.ok('lib/é.lua' in out);
});

test('crc32 matches the standard check value', () => {
  assert.equal(deploy.crc32(Buffer.from('123456789')), 0xCBF43926);
});

// ---- util
test('insideRoot stays inside', () => {
  const root = tmp();
  assert.equal(util.insideRoot(root, 'a/b.lua'), path.join(root, 'a', 'b.lua'));
  for (const bad of ['../x', 'a/../../x', path.resolve(root, '..', 'x'), '', null, 5, 'a\0b', '.']) assert.equal(util.insideRoot(root, bad), null, String(bad));
});

test('writeFileAtomic leaves no temporary file, and keeps the old file on failure', () => {
  const dir = tmp(), file = path.join(dir, 'sub', 'a.txt');
  util.writeFileAtomic(file, 'one');
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['a.txt']);
  assert.throws(() => util.writeFileAtomic(path.join(file, 'nope'), 'x'));
  assert.equal(fs.readFileSync(file, 'utf8'), 'one');
});

test('nonces differ and are long', () => {
  assert.notEqual(util.nonce(), util.nonce());
  assert.ok(util.nonce().length >= 24);
});

// ---- item receiver
test('web pages can\'t reach the item receiver', () => {
  const req = headers => ({ headers });
  assert.equal(allowed(req({ host: '127.0.0.1:47321' })), true);
  assert.equal(allowed(req({ host: 'localhost:47321' })), true);
  assert.equal(allowed(req({ host: '127.0.0.1:47321', origin: 'https://evil.example' })), false);
  assert.equal(allowed(req({ host: 'evil.example:47321' })), false);
  assert.equal(allowed(req({})), false);
});

test('console output reassembles and reports what\'s missing', () => {
  const ok = parseConsole('x RS3X|1|items|1/2|{"a":\nRS3X|1|items|2/2|1}\n');
  assert.deepEqual(ok.results, [{ a: 1 }]);
  assert.equal(parseConsole('RS3X|1|items|1/2|{').problems.length, 1);
});

// ---- preview
test('drag-to-move rewrites the numbers', () => {
  const plan = planMove('b:SetPos(10, 20)\n', 1, 5, -5);
  assert.ok(plan.ok);
  assert.deepEqual(plan.edits.map(e => e.text), ['15', '15']);
});

const INDEX = path.join(__dirname, '..', 'api-index.json');
async function session(main) {
  return Session.create({ indexPath: INDEX, readFile: r => (r === 'main.lua' ? main : null), cfg: { screenW: 1920, screenH: 1080, instructionLimit: 20000000 }, scene: { id: 'game', kind: 'game' } });
}
const messages = async s => { const d = await s.dump(); s.close(); return d.logs.map(l => l.msg).join(' | '); };

test('a plugin that never stops is stopped', async () => {
  assert.match(await messages(await session('while true do end')), /ran too long/);
});
test('a plugin that eats memory is stopped, and says so', async () => {
  assert.match(await messages(await session('local t = {} while true do t[#t + 1] = string.rep("y", 100000) .. #t end')), /too much memory|ran too long/);
});
test('runaway recursion is reported', async () => {
  assert.match(await messages(await session('local function f() return f() + 1 end f()')), /stack overflow/);
});
test('a plugin error names its line', async () => {
  const s = await session('\n\nerror("boom")');
  const d = await s.dump();
  s.close();
  assert.ok(d.logs.find(l => l.kind === 'error' && l.line === 3 && /boom/.test(l.msg)));
});
test('closing a session twice is harmless', async () => {
  const s = await session('');
  s.close();
  s.close();
});

test('replacing an API function is not called a duplicate, in any definition file', () => {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.lua') ? [path.join(d, e.name)] : []);
  const root = path.join(__dirname, '..');
  const files = [...walk(path.join(root, 'library')), ...walk(path.join(root, 'deps'))];
  assert.ok(files.length > 50);
  for (const f of files) assert.match(fs.readFileSync(f, 'utf8'), /^---@meta\r?\n---@diagnostic disable: duplicate-set-field\b/, f);
});

test('an image from Plugin.resources is a valid sprite', () => {
  const lib = f => fs.readFileSync(path.join(__dirname, '..', 'library', f), 'utf8');
  assert.match(lib('ui/common_types.lua'), /---@field sprite [^ ]*\bPluginImageResource\b/);
  const plugin = lib('core/plugin.lua');
  assert.match(plugin, /---@class PluginResourceEntry : PluginImageResource, PluginAudioResource/);
  assert.match(plugin, /---@field resources table<string, PluginResourceEntry>/);
  assert.doesNotMatch(plugin, /PluginResource\|table/, 'a union with table can\'t be assigned to a sprite');
});

test('the sidebar header stays uncrowded, and every action in it is a real command', () => {
  const { contributes } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const items = contributes.menus['view/title'];
  assert.ok(items.filter(i => /^navigation/.test(i.group)).length <= 3);
  const known = new Set(contributes.commands.map(c => c.command));
  for (const i of items) assert.ok(known.has(i.command), i.command);
  assert.equal(new Set(items.map(i => i.command)).size, items.length);
  // the palette still has to say RS3, with or without a category
  for (const c of contributes.commands.filter(x => !x.command.startsWith('rs3lua.explorer.'))) assert.ok(c.category === 'RS3' || c.title.startsWith('RS3: '), c.command);
});
