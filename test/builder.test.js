'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const L = require('../builder/lib');
const { Session } = require('../preview/engine');

const INDEX = path.join(__dirname, '..', 'api-index.json');
const TOP = 'ui.Interfaces:GetComponent(id.Component.TOPLEVEL_V2__PLUGIN_BUILD_LAYER_TOP)';

/** Runs generated Lua in the preview's mock client. */
async function run(code, main) {
  const files = { 'main.lua': main || `HANDLERS = {}\nUI = require("panel").create(${TOP}, HANDLERS)`, 'panel.lua': code };
  const session = await Session.create({
    indexPath: INDEX, readFile: rel => (rel in files ? files[rel] : null),
    cfg: { screenW: 1920, screenH: 1080, instructionLimit: 20000000 }, scene: { id: 'game', kind: 'game' },
  });
  return { session, data: await session.dump() };
}
const errorsIn = data => data.logs.filter(l => l.kind === 'error').map(l => l.msg);

function everyType(kind) {
  const d = L.blank('panel', kind);
  d.host.title = 'Everything';
  for (const type of Object.keys(L.TYPES)) {
    const c = L.create(d, type, 10, 10);
    if (type === 'Sprite') c.props.resource = '';
    d.comps.push(c);
  }
  const box = d.comps.find(c => c.type === 'GroupBox');
  box.children.push(L.create(d, 'Button', 4, 4));
  return L.normalize(d).design;
}

test('Lua strings can\'t be broken out of', () => {
  assert.equal(L.luaString('a"b\\c\nd'), '"a\\"b\\\\c\\nd"');
  assert.equal(L.luaString('\u0001'), '"\\001"');
  assert.equal(L.luaString('é'), '"\\u{E9}"');
  assert.equal(L.luaString(null), '""');
});

test('a hostile design can\'t put code into the generated file', async () => {
  const evil = '"; os.exit(1) --';
  const { design } = L.normalize({
    name: 'x"; bad()', host: { kind: 'groupbox', title: evil, w: 300, h: 200 },
    comps: [
      { type: 'Text', name: 'end', id: 'a', props: { text: evil, font: 'X; bad()', rgba: 'zz', align: 'NOPE' } },
      { type: 'Button', name: 'b; bad()', id: 'b', handler: 'x(); bad', props: { text: evil, style: 'A B' } },
      { type: 'ComboField', name: 'c', id: 'c', props: { options: `${evil}\nb` } },
      { type: 'Sprite', name: 's', id: 'd', props: { resource: 'x; bad()' } },
      { type: 'Nope', name: 'gone', id: 'e' },
    ],
  });
  const code = L.generateLua(design);
  assert.ok(!/^\s*bad\(\)/m.test(code));
  assert.ok(!code.includes('bad()\n') || !/[^"]bad\(\)\s*$/m.test(code));
  assert.ok(!design.comps.some(c => c.name === 'gone'));
  assert.ok(L.isIdent(design.name));
  const { session, data } = await run(code);
  assert.deepEqual(errorsIn(data), []);
  session.close();
});

test('normalize repairs duplicates, reserved names and bad numbers', () => {
  const { design, notes } = L.normalize({
    comps: [{ type: 'Text', id: 'a', name: 'dup', x: 'NaN', w: 1e9 }, { type: 'Text', id: 'a', name: 'dup' }, { type: 'Text', id: 'b', name: 'window' }],
  });
  const names = design.comps.map(c => c.name);
  assert.equal(new Set(names).size, 3);
  assert.ok(!names.includes('window'));
  assert.equal(new Set(design.comps.map(c => c.id)).size, 3);
  assert.equal(design.comps[0].x, 0);
  assert.equal(design.comps[0].w, 32767);
  assert.ok(notes.length >= 2);
});

test('normalize survives anything', () => {
  for (const junk of [null, undefined, 5, 'x', [], { comps: 'x' }, { comps: [null, 1, 'a', {}] }, { host: 5 }]) {
    const { design } = L.normalize(junk);
    assert.ok(L.generateLua(design).includes('return M'));
  }
});

test('newlines in text become <br>', () => {
  const d = L.blank('p', 'layer');
  const c = L.create(d, 'Text', 0, 0);
  c.props.text = 'one\ntwo';
  d.comps.push(c);
  assert.ok(L.generateLua(L.normalize(d).design).includes('"one<br>two"'));
});

test('header widths never pass the one-byte limit', () => {
  const d = L.blank('p', 'groupbox');
  d.host.title = 'x'.repeat(400);
  d.host.w = 900;
  assert.match(L.generateLua(L.normalize(d).design), /SetHeaderLayout\(255,/);
  d.host.title = 'Hi';
  assert.match(L.generateLua(L.normalize(d).design), /SetHeaderLayout\(42,/);
});

test('pinned parts land in the same place at any size', () => {
  const c = { x: -16, y: -8, w: 100, h: 30, ax: 'end', ay: 'end', fillW: false, fillH: false };
  assert.deepEqual(L.resolve(c, 400, 300), { x: 284, y: 262, w: 100, h: 30 });
  const centred = { x: 0, y: 0, w: 100, h: 30, ax: 'center', ay: 'center' };
  assert.deepEqual(L.resolve(centred, 400, 300), { x: 150, y: 135, w: 100, h: 30 });
  const stretched = { x: 10, y: 0, w: -20, h: 30, ax: 'start', ay: 'start', fillW: true };
  assert.deepEqual(L.resolve(stretched, 400, 300), { x: 10, y: 0, w: 380, h: 30 });
});

test('changing a pin keeps the part where it is', () => {
  const c = { x: 40, y: 20, w: 100, h: 30, ax: 'start', ay: 'start', fillW: false, fillH: false };
  const before = L.resolve(c, 400, 300);
  for (const [ax, ay, fw, fh] of [['end', 'end', false, false], ['center', 'center', false, false], ['start', 'start', true, true], ['end', 'start', false, true]]) {
    const next = Object.assign({}, c, L.repin(c, before, 400, 300, ax, ay, fw, fh));
    assert.deepEqual(L.resolve(next, 400, 300), before, `${ax} ${ay} ${fw} ${fh}`);
  }
});

test('the mock client lays parts out where the builder drew them', async () => {
  const d = L.blank('panel', 'layer');
  const a = L.create(d, 'Button', -16, -16);
  Object.assign(a, { ax: 'end', ay: 'end' });
  const b = L.create(d, 'Rectangle', 8, 8);
  Object.assign(b, { fillW: true, w: -16 });
  const box = L.create(d, 'Layer', 20, 30);
  Object.assign(box, { w: 200, h: 100 });
  const inner = L.create(d, 'Text', 5, 6);
  box.children.push(inner);
  d.comps.push(a, b, box);
  const { design } = L.normalize(d);
  const { session, data } = await run(L.generateLua(design), `
    local parent = ui.Layer.new(${TOP}); parent:SetPos(0, 0); parent:SetSize(400, 300)
    UI = require("panel").create(parent, {})`);
  assert.deepEqual(errorsIn(data), []);
  const parent = data.comps.find(c => c.type === 'Layer' && c.w === 400);
  const near = (c, r) => ['x', 'y', 'w', 'h'].forEach(k => assert.ok(Math.abs(c[k] - r[k]) < 1, `${c.type} ${k}: ${c[k]} vs ${r[k]}`));
  const rect = (c, ox, oy, pw, ph) => { const r = L.resolve(c, pw, ph); return { x: ox + r.x, y: oy + r.y, w: r.w, h: r.h }; };
  near(data.comps.find(c => c.type === 'Button'), rect(design.comps[0], parent.x, parent.y, 400, 300));
  near(data.comps.find(c => c.type === 'Rectangle'), rect(design.comps[1], parent.x, parent.y, 400, 300));
  near(data.comps.find(c => c.type === 'Text'), rect(design.comps[2].children[0], parent.x + 20, parent.y + 30, 200, 100));
  session.close();
});

for (const kind of ['groupbox', 'layer']) {
  test(`every part type runs in the mock client (${kind})`, async () => {
    const design = everyType(kind);
    design.comps = design.comps.filter(c => !L.TYPES[c.type].prettyOnly);
    const { session, data } = await run(L.generateLua(design));
    assert.deepEqual(errorsIn(data), []);
    const warnings = data.logs.filter(l => l.kind === 'warn').map(l => l.msg);
    assert.deepEqual(warnings.filter(w => /invisible|no font|no stylesheet/i.test(w)), []);
    for (const t of Object.keys(L.TYPES).filter(k => !L.TYPES[k].prettyOnly)) assert.ok(data.comps.some(c => c.type === t), t);
    session.close();
  });
}

test('the toggle keeps parts and swaps the window', () => {
  const d = L.fillTemplate(L.blank('panel', 'groupbox'), 'settings');
  const parts = L.all(d).length;
  L.applyStyle(d, 'prettyui');
  assert.equal(d.host.kind, 'window');
  assert.equal(L.all(d).length, parts);
  assert.match(L.generateLua(L.normalize(d).design), /prettyui\.Window\.new/);
  assert.match(L.generateLua(L.normalize(d).design), /prettyui\.CheckboxButton\.new/);
  L.applyStyle(d, 'plain');
  assert.equal(d.host.kind, 'groupbox');
  const code = L.generateLua(L.normalize(d).design);
  assert.ok(!/prettyui/.test(code));
  assert.equal(L.all(d).length, parts);
});

test('a layer stays a layer through the toggle', () => {
  const d = L.blank('panel', 'layer');
  L.applyStyle(d, 'prettyui');
  assert.equal(d.host.kind, 'layer');
  assert.equal(L.normalize(d).design.style, 'prettyui');
});

test('designs from before the toggle open in the right mode', () => {
  assert.equal(L.normalize({ host: { kind: 'window' } }).design.style, 'prettyui');
  assert.equal(L.normalize({ host: { kind: 'groupbox' } }).design.style, 'plain');
  assert.equal(L.normalize({ style: 'plain', host: { kind: 'window' } }).design.host.kind, 'groupbox');
});

test('PrettyUI\'s fixed sizes are what the canvas shows', () => {
  const d = L.blank('panel', 'window');
  const b = L.create(d, 'Button', 0, 0); b.props.style = 'BUTTON_CORNERED_BOLD_POSITIVE'; d.comps.push(b);
  const s = L.create(d, 'Slider', 0, 0); s.h = 99; d.comps.push(s);
  const r = L.create(d, 'RadioGroup', 0, 0); d.comps.push(r);
  L.enforceStyle(d);
  assert.deepEqual([b.h, s.h, r.h], [27, 23, 66]);
});

test('PrettyUI-only parts are left out of plain code, with a warning', () => {
  const d = L.blank('panel', 'layer');
  d.comps.push(L.create(d, 'Divider', 0, 0));
  const code = L.generateLua(L.normalize(d).design);
  assert.ok(!/prettyui\./.test(code.replace(/--.*$/gm, '')));
  assert.ok(L.problems(L.normalize(d).design, true).some(p => /only exists in PrettyUI/.test(p.msg)));
});

test('a hostile design can\'t inject code through PrettyUI parts either', () => {
  const evil = '" }) os.exit() --';
  const d = L.blank('panel', 'window');
  for (const type of ['Button', 'Check', 'InputField', 'ComboField', 'List', 'RadioGroup']) {
    const c = L.create(d, type, 0, 0);
    if ('text' in c.props) c.props.text = evil;
    if ('options' in c.props) c.props.options = evil;
    c.handler = 'x") os.exit() --';
    d.comps.push(c);
  }
  const code = L.generateLua(L.normalize(d).design);
  for (const line of code.split('\n')) {
    if (/os\.exit/.test(line)) assert.ok(line.includes('\\"'), line);
  }
});

test('every template produces working code', async () => {
  for (const id of ['blank', 'settings', 'stats', 'confirm']) {
    const { design, notes } = L.normalize(L.fillTemplate(L.blank('panel', 'groupbox'), id));
    assert.deepEqual(notes, []);
    const { session, data } = await run(L.generateLua(design));
    assert.deepEqual(errorsIn(data), [], id);
    assert.deepEqual(L.problems(design, true).filter(p => p.severity !== 'info'), [], id);
    session.close();
  }
});

test('handlers are called with the value the docs promise', async () => {
  const d = L.blank('panel', 'layer');
  const b = L.create(d, 'Button', 0, 0);
  b.handler = 'pressed';
  d.comps.push(b);
  const { session, data } = await run(L.generateLua(L.normalize(d).design), `
    GOT = 0
    UI = require("panel").create(${TOP}, { pressed = function(button) GOT = GOT + 1; log("pressed " .. tostring(button == UI.button)) end })`);
  const button = data.comps.find(c => c.type === 'Button');
  assert.ok(button.hooks.length, 'the hook is subscribed');
  await session.fireHook(button.id, button.hooks[0].name);
  const after = await session.dump();
  assert.ok(after.logs.some(l => /pressed true/.test(l.msg)), JSON.stringify(after.logs));
  session.close();
});

test('problems point at what\'s wrong', () => {
  const d = L.blank('p', 'window');
  const off = L.create(d, 'Button', 9000, 0);
  d.comps.push(off);
  const none = L.create(d, 'Sprite', 0, 0);
  d.comps.push(none);
  const list = L.problems(L.normalize(d).design, false);
  assert.ok(list.some(p => p.severity === 'error' && /PrettyUI/.test(p.msg)));
  assert.ok(list.some(p => p.id === off.id && /outside/.test(p.msg)));
  assert.ok(list.some(p => p.id === none.id && /no image/.test(p.msg)));
});

test('new parts get unique names and handlers', () => {
  const d = L.blank('p', 'layer');
  const a = L.create(d, 'Button', 0, 0); d.comps.push(a);
  const b = L.create(d, 'Button', 0, 0); d.comps.push(b);
  assert.notEqual(a.name, b.name);
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.handler, b.handler);
});

test('the usage snippet is valid and names every handler', async () => {
  const design = L.normalize(L.fillTemplate(L.blank('panel', 'groupbox'), 'confirm')).design;
  const snippet = L.usageSnippet(design);
  assert.match(snippet, /onButton = function/);
  const { session, data } = await run(L.generateLua(design), snippet);
  assert.deepEqual(errorsIn(data), []);
  session.close();
});
