// Drives the real Plugin Data page in a browser. Run: node test/browser/data.browser.js [browser] [shots]
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');

const BROWSERS = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'];
const browser = process.argv[2] && fs.existsSync(process.argv[2]) ? process.argv[2] : BROWSERS.find(p => fs.existsSync(p));
const shots = process.argv[3];
if (!browser) { console.log('SKIPPED: no Edge or Chrome found.'); process.exit(0); }

const ROOT = path.join(__dirname, '..', '..', 'data', 'webview');
const page = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/data.css"></head><body><div id="app"></div><script>
window.__sent = []; window.acquireVsCodeApi = () => ({ postMessage: m => window.__sent.push(m) });
window.onerror = m => { (window.__errors = window.__errors || []).push(m); };</script><script src="/data.js"></script></body></html>`;
const server = http.createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(page); return; }
  const file = path.join(ROOT, path.basename(req.url));
  res.writeHead(fs.existsSync(file) ? 200 : 404, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/javascript' });
  if (fs.existsSync(file)) fs.createReadStream(file).pipe(res); else res.end();
});

const DATA = { type: 'data', file: 'x', read: '12:00', db: 'RuneScape-BETA', dbs: ['RuneScape-BETA'], plugins: [
  { name: 'Crypt Crawler', log: null, rows: [{ key: 'a.b', value: '<img src=x onerror=window.__pwned=1>', type: 3 }, { key: 'count', value: '7', type: 1 }] },
  { name: 'Logger', log: ['first <b>line</b>', 'second line'], rows: [{ key: 'rs3log.next', value: '1', type: 3 }] },
] };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-data-'));
  const proc = spawn(browser, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1100,700', '--no-first-run', '--disable-gpu', `http://127.0.0.1:${server.address().port}/`], { stdio: ['ignore', 'ignore', 'pipe'] });
  let passed = 0, failed = 0;
  const check = async (name, fn) => { try { await fn(); passed += 1; console.log('ok   ' + name); } catch (e) { failed += 1; console.log('FAIL ' + name + '\n     ' + e.message.split('\n')[0]); } };
  try {
    const url = await new Promise((resolve, reject) => { let t = ''; proc.stderr.on('data', d => { t += d; const m = t.match(/DevTools listening on (ws:\S+)/); if (m) resolve(m[1]); }); setTimeout(() => reject(new Error('no browser')), 20000); });
    const target = (await (await fetch(url.replace(/^ws/, 'http').replace(/\/devtools.*$/, '/json'))).json()).find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });
    let seq = 0; const wait = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
    const send = (method, params) => new Promise(r => { seq += 1; wait.set(seq, r); ws.send(JSON.stringify({ id: seq, method, params })); });
    const ev = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception.description); return r.result.result.value; };
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await send('Runtime.enable'); await send('Page.enable');
    // a message sent before the page says it's ready is lost, and slow machines take seconds to get there
    for (let i = 0; i < 300 && !(await ev('window.__sent && window.__sent.some(m => m.type === "ready")')); i += 1) await sleep(100);
    const push = m => ev(`window.postMessage(${JSON.stringify(m)}, '*')`);
    await push(DATA); await sleep(120);
    await check('asks for data, then lists plugins and picks the first', async () => {
      assert.equal(await ev('window.__sent[0].type'), 'ready');
      assert.equal(await ev('document.querySelectorAll(".plugins .row").length'), 2);
      assert.equal(await ev('document.querySelectorAll(".keys .row").length'), 2);
    });
    await check('a value from another plugin stays text: it can\'t run as HTML', async () => {
      await ev('document.querySelector(".keys .row").click()');
      await sleep(80);
      assert.match(await ev('document.querySelector(".value-pane pre").textContent'), /<img/);
      assert.equal(await ev('document.querySelectorAll(".value-pane img, .keys img").length'), 0);
      assert.equal(await ev('window.__pwned === undefined'), true);
    });
    await check('the filter narrows the list and keeps the caret', async () => {
      await ev(`(() => { const i = document.querySelector('.bar input'); i.focus(); i.value = 'count'; i.dispatchEvent(new Event('input')); })()`);
      await sleep(40);
      assert.equal(await ev('document.querySelectorAll(".keys .row").length'), 1);
      await push(DATA); await sleep(80);
      assert.equal(await ev('document.activeElement.tagName'), 'INPUT', 'a refresh doesn\'t steal focus');
      assert.equal(await ev('document.querySelectorAll(".keys .row").length'), 1);
      await ev(`(() => { const i = document.querySelector('.bar input'); i.value = ''; i.dispatchEvent(new Event('input')); i.blur(); })()`);
    });
    await check('without capture, the log tab offers to add it', async () => {
      await ev(`[...document.querySelectorAll('.bar button')].find(b => b.textContent === 'Log').click()`);
      await sleep(40);
      await ev(`document.querySelector('.empty button').click()`);
      assert.equal(await ev('window.__sent.some(m => m.type === "addLog")'), true);
    });
    await check('captured lines show as text', async () => {
      await ev(`document.querySelectorAll('.plugins .row')[1].click()`);
      await sleep(40);
      assert.match(await ev('document.querySelector("pre.log").textContent'), /first <b>line<\/b>\nsecond line/);
    });
    await check('an error replaces the content, and data brings it back', async () => {
      await push({ type: 'error', msg: 'The file is gone.' }); await sleep(40);
      assert.equal(await ev('document.querySelector(".error").textContent'), 'The file is gone.');
      await push(DATA); await sleep(60);
      assert.equal(await ev('document.querySelector(".error")'), null);
    });
    await check('no script errors', async () => assert.equal(await ev('(window.__errors || []).join()'), ''));
    if (shots) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.mkdirSync(shots, { recursive: true }); fs.writeFileSync(path.join(shots, 'data.png'), Buffer.from(r.result.data, 'base64')); }
    ws.close();
  } finally {
    proc.kill(); server.close();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* still held */ }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
