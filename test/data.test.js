'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Database, varint, decodeRecord } = require('../data/sqlite');
const { readStore, logLines, decodeValue, databases } = require('../data/lib');
const { checkPlugin } = require('../check/lib');
const { Session } = require('../preview/engine');

const python = (() => { for (const p of ['python', 'python3']) { try { execFileSync(p, ['--version'], { stdio: 'ignore' }); return p; } catch { /* next */ } } return null; })();

/** A real database, made by real SQLite, the way the client lays one out. */
function makeDb(rows) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-db-'));
  const file = path.join(dir, 'PluginData.db');
  fs.writeFileSync(path.join(dir, 'rows.json'), JSON.stringify(rows));
  fs.writeFileSync(path.join(dir, 'make.py'), `
import json, sqlite3, sys
c = sqlite3.connect(sys.argv[1])
c.execute("""CREATE TABLE DataStore (
    PluginID    TEXT,
    Key         TEXT,
    Type        INTEGER,
    Value       BLOB,
    PRIMARY KEY(PluginID, Key)
)""")
for p, k, t, v in json.load(open(sys.argv[2], encoding="utf-8")):
    c.execute("insert into DataStore values (?,?,?,?)", (p, k, t, bytes.fromhex(v)))
c.commit()
`);
  execFileSync(python, [path.join(dir, 'make.py'), file, path.join(dir, 'rows.json')]);
  return file;
}
const str = s => Buffer.from(s + '\0', 'utf8').toString('hex');
const needsPython = { skip: python ? false : 'Python isn\'t installed' };

test('varints decode, including the 9-byte form', () => {
  assert.equal(varint(Buffer.from([0x7f]), 0).value, 127n);
  assert.equal(varint(Buffer.from([0x81, 0x00]), 0).value, 128n);
  assert.equal(varint(Buffer.alloc(9, 0xff), 0).size, 9);
});

test('records decode every storage type', () => {
  const body = Buffer.from([0x06, 0x00, 0x01, 0x09, 0x0f, 0x10, 0xfe, 0x61, 0x62]);
  assert.deepEqual(decodeRecord(body.subarray(0, 8)).slice(0, 3), [null, -2, 1]);
});

test('strings lose their NUL, and numbers read as numbers', () => {
  assert.equal(decodeValue(3, Buffer.from('hello\0')), 'hello');
  assert.equal(decodeValue(1, Buffer.from([0x2a, 0, 0, 0])), '42');
  assert.equal(decodeValue(1, Buffer.from([0xff, 0xff, 0xff, 0xff])), '-1');
  assert.equal(decodeValue(3, null), '');
});

test('reads what real SQLite wrote, across many pages and overflow', needsPython, () => {
  const rows = [];
  for (let i = 0; i < 2000; i += 1) rows.push(['Plugin ' + (i % 3), `key.${i}`, 3, str('value ' + i)]);
  const long = 'é'.repeat(60000);
  rows.push(['Big', 'huge', 3, str(long)]);
  rows.push(['Big', 'count', 1, Buffer.from([7, 0, 0, 0]).toString('hex')]);
  const store = readStore(makeDb(rows));
  assert.deepEqual(store.map(p => p.name), ['Big', 'Plugin 0', 'Plugin 1', 'Plugin 2']);
  assert.equal(store.reduce((n, p) => n + p.rows.length, 0), 2002);
  const big = store[0].rows;
  assert.equal(big.find(r => r.key === 'huge').value, long);
  assert.equal(big.find(r => r.key === 'count').value, '7');
  assert.equal(store[2].rows.find(r => r.key === 'key.1').value, 'value 1');
});

test('junk and damage give an error, never a hang', needsPython, () => {
  assert.throws(() => new Database(Buffer.from('not a database')), /Not a SQLite/);
  assert.throws(() => new Database(Buffer.alloc(4096)), /Not a SQLite/);
  const file = makeDb([['A', 'k', 3, str('x'.repeat(9000))]]);
  const whole = fs.readFileSync(file);
  for (const cut of [8192, 4096]) {
    assert.throws(() => { const d = new Database(whole.subarray(0, cut)); d.table('DataStore'); });
  }
  const looped = Buffer.from(whole);
  for (let i = 4096; i < looped.length; i += 4096) looped.writeUInt32BE(3, i); // overflow pages pointing at themselves
  assert.throws(() => new Database(looped).table('DataStore'));
});

test('a real database, if this computer has one', { skip: !fs.existsSync('C:\\ProgramData\\Jagex\\RuneScape-BETA\\plugins\\PluginData.db') }, () => {
  const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-db-')), 'copy.db');
  fs.copyFileSync('C:\\ProgramData\\Jagex\\RuneScape-BETA\\plugins\\PluginData.db', copy);
  const store = readStore(copy);
  assert.ok(store.length > 0);
  const script = `import sqlite3,sys\nc=sqlite3.connect(sys.argv[1])\nprint(c.execute("select count(*),sum(length(Value)) from DataStore").fetchone()[0])`;
  if (python) {
    assert.equal(Number(execFileSync(python, ['-c', script, copy], { encoding: 'utf8' })), store.reduce((n, p) => n + p.rows.length, 0));
  }
});

test('logs come back in order, even after the ring wraps', () => {
  const rows = [
    { key: 'rs3log.000000', value: 'c\nd\n' }, { key: 'rs3log.000001', value: 'x\n' }, { key: 'rs3log.000002', value: 'a\nb\n' },
    { key: 'rs3log.next', value: '2' }, { key: 'other', value: 'no' },
  ];
  assert.deepEqual(logLines(rows), ['a', 'b', 'c', 'd', 'x']);
  assert.equal(logLines([{ key: 'other', value: 'no' }]), null);
});

test('databases are found next to dev_plugins', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-db-'));
  fs.mkdirSync(path.join(base, 'plugins'));
  fs.writeFileSync(path.join(base, 'plugins', 'PluginData.db'), '');
  assert.equal(databases([path.join(base, 'dev_plugins'), path.join(os.tmpdir(), 'nope', 'dev_plugins')]).length, 1);
});

test('log capture really captures, in the mock client', async () => {
  const rs3log = fs.readFileSync(path.join(__dirname, '..', 'data', 'rs3log.lua'), 'utf8');
  const main = 'require("rs3log")\nlog("hello {}", 42)\nlog("score", 5)\nlog(7)';
  const s = await Session.create({ indexPath: path.join(__dirname, '..', 'api-index.json'), readFile: r => ({ 'main.lua': main, 'rs3log.lua': rs3log })[r] || null,
    cfg: { screenW: 1920, screenH: 1080, instructionLimit: 20000000 }, scene: { id: 'game', kind: 'game' } });
  for (let i = 0; i < 100; i += 1) await s.fireEvent('Logic');
  const d = await s.dump();
  assert.deepEqual(d.logs.filter(l => l.kind === 'error'), []);
  assert.ok(d.logs.some(l => /score 5/.test(l.msg)), 'the real log() still gets the line');
  const saved = await s.lua.doString('return tostring(PersistentDB:GetString("rs3log.000000")) .. tostring(PersistentDB:GetString("rs3log.000001"))');
  s.close();
  assert.deepEqual(logLines([{ key: 'rs3log.000000', value: saved.replace(/nil$/, '') }]), ['--- plugin loaded ---', 'hello 42', 'score 5', '7']);
});

test('Check Plugin warns about shipping log capture', () => {
  const manifest = JSON.stringify({ name: 'x', version: '1', contactEmailAddress: 'a@b.net' });
  const hit = checkPlugin({ manifestText: manifest, files: { 'main.lua': 'require("rs3log")\n' } }).find(f => f.code === 'log-capture');
  assert.ok(hit);
  assert.ok(!checkPlugin({ manifestText: manifest, files: { 'main.lua': '-- require("rs3log")\n' } }).some(f => f.code === 'log-capture'));
});
