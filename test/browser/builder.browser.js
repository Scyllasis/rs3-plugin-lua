// Drives the real UI Builder page in a real browser with real mouse input, over the DevTools
// protocol, and checks the design that comes out. No VS Code: acquireVsCodeApi is stubbed.
// Run: node test/browser/builder.browser.js [path to Edge or Chrome] [folder for a screenshot]
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const L = require('../../builder/lib');

const BROWSERS = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'];
const browser = process.argv[2] && fs.existsSync(process.argv[2]) ? process.argv[2] : BROWSERS.find(p => fs.existsSync(p));
const shots = process.argv[3];
if (!browser) { console.log('SKIPPED: no Edge or Chrome found.'); process.exit(0); }

const ROOT = path.join(__dirname, '..', '..', 'builder');
const page = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/webview/builder.css">
<style>:root { color-scheme: dark; }</style></head><body><div id="app"></div>
<script>
  window.__sent = [];
  window.acquireVsCodeApi = () => ({ postMessage: m => window.__sent.push(m), getState: () => undefined, setState() {} });
  window.onerror = (m, s, l) => { (window.__errors = window.__errors || []).push(m + ' @' + l); };
</script><script src="/lib.js"></script><script src="/webview/builder.js"></script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(page); return; }
  const file = path.join(ROOT, req.url.replace(/\?.*$/, ''));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/javascript' });
  fs.createReadStream(file).pipe(res);
});

class Page {
  constructor(ws) { this.ws = ws; this.seq = 0; this.waiting = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && this.waiting.has(m.id)) { this.waiting.get(m.id)(m); this.waiting.delete(m.id); } }; }
  send(method, params) {
    const id = ++this.seq;
    return new Promise(resolve => { this.waiting.set(id, resolve); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception.description);
    return r.result.result.value;
  }
  mouse(type, x, y, extra) { return this.send('Input.dispatchMouseEvent', Object.assign({ type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' }, extra)); }
  async drag(from, to, extra) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
    await this.mouse('mousePressed', from.x, from.y, extra);
    for (let i = 1; i <= 8; i += 1) {
      await this.send('Input.dispatchMouseEvent', Object.assign({ type: 'mouseMoved', x: from.x + (to.x - from.x) * i / 8, y: from.y + (to.y - from.y) * i / 8, button: 'left', buttons: 1 }, extra));
    }
    await this.mouse('mouseReleased', to.x, to.y, extra);
  }
  key(key, code, modifiers) {
    return this.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers: modifiers || 0, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : { Delete: 46, ArrowRight: 39, Escape: 27 }[key] })
      .then(() => this.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers: modifiers || 0 }));
  }
  center(selector) {
    return this.eval(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; })()`);
  }
  partAt(label) {
    return this.eval(`(() => { const el = [...document.querySelectorAll('.part')].find(p => p.textContent === ${JSON.stringify(label)}); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  }
  design() { return this.eval('(() => { const c = window.__sent.filter(m => m.design).pop(); return c ? JSON.parse(JSON.stringify(c.design)) : null; })()'); }
  async wait(ms) { await new Promise(r => setTimeout(r, ms)); }
  async shot(name) {
    if (!shots) return;
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(shots, { recursive: true });
    fs.writeFileSync(path.join(shots, name + '.png'), Buffer.from(r.result.data, 'base64'));
  }
}

async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'rs3-builder-'));
  const proc = spawn(browser, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1400,900', '--no-first-run', '--disable-gpu', `http://127.0.0.1:${port}/`], { stdio: ['ignore', 'ignore', 'pipe'] });
  let results = 0, failed = 0;
  const check = async (name, fn) => {
    try { await fn(); results += 1; console.log('ok   ' + name); } catch (e) { failed += 1; console.log('FAIL ' + name + '\n     ' + e.message.split('\n').slice(0, 6).join('\n     ')); }
  };
  try {
    const wsUrl = await new Promise((resolve, reject) => {
      let text = '';
      proc.stderr.on('data', d => { text += d; const m = text.match(/DevTools listening on (ws:\S+)/); if (m) resolve(m[1]); });
      setTimeout(() => reject(new Error('The browser didn\'t start.')), 20000);
    });
    const list = await (await fetch(wsUrl.replace(/^ws/, 'http').replace(/\/devtools.*$/, '/json'))).json();
    const target = list.find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });
    const p = new Page(ws);
    await p.send('Page.enable');
    await p.send('Runtime.enable');
    // a message sent before the page says it's ready is lost, and slow machines take seconds to get there
    for (let i = 0; i < 300 && !(await p.eval('window.__sent && window.__sent.some(m => m.type === "ready")')); i += 1) await p.wait(100);
    const start = L.blank('test', 'groupbox');
    start.host.w = 480; start.host.h = 360;
    await p.eval(`window.postMessage({ type: 'init', design: ${JSON.stringify(start)}, notes: [], resources: [], hasPrettyUI: true, hasManifest: true }, '*')`);
    await p.wait(200);
    await p.eval(`window.dispatchEvent(new Event('resize'))`);

    await check('the page draws with no script errors', async () => {
      assert.equal(await p.eval('(window.__errors || []).length'), 0, await p.eval('(window.__errors || []).join()'));
      const plain = Object.values(L.TYPES).filter(t => !t.prettyOnly).length;
      assert.equal(await p.eval('document.querySelectorAll(".part").length'), plain);
    });

    const content = () => p.center('.content');
    await check('dragging Button from the palette drops it on the window', async () => {
      const c = await content();
      await p.drag(await p.partAt('Button'), { x: c.left + 200, y: c.top + 100 });
      await p.wait(50);
      const d = await p.design();
      assert.equal(d.comps.length, 1);
      assert.equal(d.comps[0].type, 'Button');
      assert.equal(d.comps[0].x % 8, 0, 'snaps to the grid');
      assert.equal(d.comps[0].x, 144);  // centred under the pointer: 200 - 60 = 140, then snapped
      assert.equal(d.comps[0].y, 88);   // 100 - 15 = 85, then snapped
      assert.equal(await p.eval('document.querySelectorAll(".comp").length'), 1);
      assert.equal(await p.eval('document.querySelectorAll(".handle").length'), 8);
    });

    await check('a drop outside the window adds nothing', async () => {
      await p.drag(await p.partAt('Text'), { x: 5, y: 880 });
      assert.equal((await p.design()).comps.length, 1);
    });

    await check('dragging a part moves it, and it lines up with the window centre', async () => {
      const box = await p.center('.comp');
      await p.drag(box, { x: box.x + 40, y: box.y + 24 });
      await p.wait(50);
      const c = (await p.design()).comps[0];
      assert.equal(c.x + c.w / 2, 240, 'centred: 480 wide, so its middle is at 240');
      assert.equal(c.y, 112);
    });

    await check('holding Alt turns snapping off', async () => {
      const box = await p.center('.comp');
      const was = (await p.design()).comps[0];
      await p.drag(box, { x: box.x + 13, y: box.y + 3 }, { modifiers: 1 });
      await p.wait(50);
      const c = (await p.design()).comps[0];
      assert.equal(c.x, was.x + 13);
      assert.equal(c.y, was.y + 3);
      await p.key('z', 'KeyZ', 2);
      await p.wait(50);
    });

    await check('a corner handle resizes it', async () => {
      const h = await p.center('.handle.se');
      await p.drag(h, { x: h.x + 32, y: h.y + 16 });
      await p.wait(50);
      const c = (await p.design()).comps[0];
      assert.equal((c.x + c.w) % 8, 0, 'the right edge lands on the grid');
      assert.equal((c.y + c.h) % 8, 0, 'the bottom edge lands on the grid');
      assert.ok(c.w > 120 && c.h > 30);
    });

    await check('undo and redo walk back and forward', async () => {
      const before = (await p.design()).comps[0].w;
      await p.key('z', 'KeyZ', 2);
      await p.wait(50);
      assert.equal((await p.design()).comps[0].w, 120);
      await p.key('y', 'KeyY', 2);
      await p.wait(50);
      assert.equal((await p.design()).comps[0].w, before);
    });

    await check('arrow keys nudge by one', async () => {
      const x = (await p.design()).comps[0].x;
      await p.key('ArrowRight', 'ArrowRight');
      await p.wait(50);
      assert.equal((await p.design()).comps[0].x, x + 1);
    });

    await check('a part dropped into a group box moves inside it and stays put on screen', async () => {
      const c = await content();
      await p.drag(await p.partAt('Group box'), { x: c.left + 150, y: c.top + 230 });
      await p.wait(50);
      await p.drag(await p.partAt('Checkbox'), { x: c.left + 400, y: c.top + 40 });
      await p.wait(50);
      let d = await p.design();
      assert.equal(d.comps.length, 3);
      const before = await p.center(`.comp[data-id="${d.comps[2].id}"]`);
      const box = d.comps[1];
      const target = await p.center(`.comp[data-id="${box.id}"]`);
      await p.drag(before, { x: target.x, y: target.y + 10 }, { modifiers: 0 });
      await p.wait(80);
      d = await p.design();
      assert.equal(d.comps.length, 2);
      assert.equal(d.comps[1].children.length, 1);
      assert.equal(d.comps[1].children[0].type, 'Check');
      const after = await p.center(`.comp[data-id="${d.comps[1].children[0].id}"]`);
      assert.ok(Math.abs(after.x - target.x) < 12 && Math.abs(after.y - target.y - 10) < 12, JSON.stringify([after, target]));
    });

    await check('moving a group box carries its children', async () => {
      let d = await p.design();
      const box = d.comps[1];
      const head = await p.center(`.comp[data-id="${box.id}"] .v-group-head`);
      await p.drag(head, { x: head.x + 16, y: head.y + 8 });
      await p.wait(50);
      d = await p.design();
      assert.equal(d.comps[1].x, box.x + 16);
      assert.equal(d.comps[1].children[0].x, box.children[0].x, 'the child keeps its offset');
    });

    await check('dragging a part back out of a container works', async () => {
      let d = await p.design();
      const child = d.comps[1].children[0];
      const c = await content();
      await p.drag(await p.center(`.comp[data-id="${child.id}"]`), { x: c.left + 380, y: c.top + 30 });
      await p.wait(50);
      d = await p.design();
      assert.equal(d.comps[1].children.length, 0);
      assert.equal(d.comps.length, 3);
    });

    await check('marquee selects, and Delete removes', async () => {
      const c = await content();
      await p.drag({ x: c.left + 300, y: c.top + 4 }, { x: c.right - 2, y: c.top + 80 });
      await p.wait(50);
      assert.equal(await p.eval('document.querySelectorAll(".selbox").length'), 1);
      await p.key('Delete', 'Delete');
      await p.wait(50);
      assert.equal((await p.design()).comps.length, 2);
    });

    await check('duplicate gives a new name and id', async () => {
      await p.eval('document.querySelector(".tree-row").click()');
      await p.key('d', 'KeyD', 2);
      await p.wait(50);
      const d = await p.design();
      assert.equal(d.comps.length, 3);
      assert.equal(new Set(d.comps.map(c => c.name)).size, 3);
      assert.equal(new Set(d.comps.map(c => c.id)).size, 3);
    });

    await check('copy and paste, with Ctrl+C and Ctrl+V', async () => {
      await p.key('c', 'KeyC', 2);
      await p.key('v', 'KeyV', 2);
      await p.wait(50);
      const d = await p.design();
      assert.equal(d.comps.length, 4);
      assert.equal(new Set(d.comps.map(c => c.name)).size, 4);
      await p.key('z', 'KeyZ', 2);
      await p.wait(50);
      assert.equal((await p.design()).comps.length, 3);
    });

    await check('a copied group box brings its children, renamed', async () => {
      const c = await content();
      const start = await p.design();
      const over = start.comps.find(k => k.type === 'GroupBox');
      const count = start.comps.filter(k => k.type === 'GroupBox').length;
      await p.drag(await p.partAt('Button'), { x: (await p.center(`.comp[data-id="${over.id}"]`)).x, y: (await p.center(`.comp[data-id="${over.id}"]`)).y + 20 });
      await p.wait(50);
      // boxes can overlap, so the part goes into whichever is on top
      const box = (await p.design()).comps.find(k => k.type === 'GroupBox' && k.children.length);
      await p.eval(`document.querySelector('[data-tree="${box.id}"]').click()`);
      await p.key('d', 'KeyD', 2);
      await p.wait(50);
      const d = await p.design();
      const boxes = d.comps.filter(k => k.type === 'GroupBox');
      await p.key('z', 'KeyZ', 2); await p.wait(30);
      await p.key('z', 'KeyZ', 2); await p.wait(30);
      await p.key('Escape', 'Escape');
      assert.equal(boxes.length, count + 1);
      const copy = boxes[boxes.length - 1];
      assert.equal(copy.children.length, 1);
      assert.notEqual(copy.children[0].name, boxes.find(k => k.id === box.id).children[0].name);
      assert.ok(c.left);
    });

    await check('the properties panel edits a part, and bad names are refused', async () => {
      await p.eval(`(() => {
        const row = [...document.querySelectorAll('.tree-row')].find(r => r.textContent.includes('Button'));
        row.click();
      })()`);
      const name = await p.eval('document.querySelector(".props input").value');
      await p.eval(`(() => { const i = document.querySelector('.props input'); i.value = 'not a name'; i.dispatchEvent(new Event('change')); })()`);
      await p.wait(30);
      assert.equal(await p.eval('document.querySelector(".props input").value'), name);
      await p.eval(`(() => { const i = document.querySelector('.props input'); i.value = 'save_button'; i.dispatchEvent(new Event('change')); })()`);
      await p.wait(30);
      const c = (await p.design()).comps.find(k => k.type === 'Button');
      assert.equal(c.name, 'save_button');
      assert.equal(c.handler, 'onSaveButton');
    });

    await check('pinning right keeps the part where it is', async () => {
      const id = (await p.design()).comps.find(k => k.type === 'Button').id;
      const before = await p.center(`.comp[data-id="${id}"]`);
      await p.eval(`(() => { const s = [...document.querySelectorAll('.props select')].find(e => [...e.options].some(o => o.value === 'Stretch' && [...e.options].some(q => q.value === 'Right'))); s.value = 'Right'; s.dispatchEvent(new Event('change')); })()`);
      await p.wait(50);
      const c = (await p.design()).comps.find(k => k.type === 'Button');
      assert.equal(c.ax, 'end');
      const after = await p.center(`.comp[data-id="${id}"]`);
      assert.ok(Math.abs(after.x - before.x) < 1.5, JSON.stringify([before.x, after.x]));
    });

    await check('dragging a layer row reorders it, and the canvas follows', async () => {
      const before = (await p.design()).comps.map(c => c.id);
      assert.ok(before.length >= 3);
      const rows = await p.eval(`[...document.querySelectorAll('[data-tree]')].map(r => { const b = r.getBoundingClientRect(); return { id: r.dataset.tree, x: b.left + 40, top: b.top, bottom: b.bottom }; })`);
      const top = rows[0], last = rows[rows.length - 1];
      await p.drag({ x: last.x, y: (last.top + last.bottom) / 2 }, { x: top.x, y: top.top + 2 });
      await p.wait(60);
      const after = (await p.design()).comps.map(c => c.id);
      assert.equal(after[after.length - 1], last.id, 'moved to the front');
      assert.equal(after.length, before.length);
      assert.equal(await p.eval(`document.querySelector('.tree-row').dataset.tree`), last.id);
      assert.equal(await p.eval(`[...document.querySelectorAll('.parts > .comp')].pop().dataset.id`), last.id);
      await p.key('z', 'KeyZ', 2);
      await p.wait(40);
      assert.deepEqual((await p.design()).comps.map(c => c.id), before);
    });

    await check('dragging a row onto a group box puts it inside, and it stays put on screen', async () => {
      let d = await p.design();
      const box = d.comps.find(c => c.type === 'GroupBox');
      const part = d.comps.find(c => c.type === 'Button');
      const rect = await p.center(`.comp[data-id="${part.id}"]`);
      const rows = await p.eval(`[...document.querySelectorAll('[data-tree]')].map(r => { const b = r.getBoundingClientRect(); return { id: r.dataset.tree, x: b.left + 40, y: (b.top + b.bottom) / 2 }; })`);
      const from = rows.find(r => r.id === part.id), to = rows.find(r => r.id === box.id);
      await p.drag({ x: from.x, y: from.y }, { x: to.x, y: to.y });
      await p.wait(60);
      d = await p.design();
      assert.ok(d.comps.find(c => c.id === box.id).children.some(c => c.id === part.id));
      const after = await p.center(`.comp[data-id="${part.id}"]`);
      assert.ok(Math.abs(after.x - rect.x) < 2 && Math.abs(after.y - rect.y) < 2, JSON.stringify([rect.x, rect.y, after.x, after.y]));
      await p.key('z', 'KeyZ', 2);
      await p.wait(40);
    });

    await check('a row can\'t be dragged into itself', async () => {
      const before = await p.design();
      const box = before.comps.find(c => c.type === 'GroupBox');
      const r = await p.center(`[data-tree="${box.id}"]`);
      await p.drag({ x: r.x, y: r.y }, { x: r.x + 5, y: r.y + 1 });
      await p.wait(40);
      assert.equal(JSON.stringify(await p.design()), JSON.stringify(before));
    });

    await check('a click on a row still just selects it', async () => {
      const id = (await p.design()).comps[0].id;
      const r = await p.center(`[data-tree="${id}"]`);
      await p.mouse('mousePressed', r.x, r.y);
      await p.mouse('mouseReleased', r.x, r.y);
      await p.wait(40);
      assert.ok(await p.eval(`document.querySelector('[data-tree="${id}"]').classList.contains('on')`));
    });

    await check('the toggle switches to PrettyUI, parts and all', async () => {
      const before = await p.design();
      const count = await p.eval('document.querySelectorAll(".part").length');
      const button = await p.eval(`[...document.querySelectorAll('.toolbar button')].find(b => b.textContent === 'PrettyUI').click()`);
      assert.equal(button, undefined);
      await p.wait(60);
      const d = await p.design();
      assert.equal(d.style, 'prettyui');
      assert.equal(d.host.kind, 'window');
      assert.equal(JSON.stringify(d.comps.map(c => c.id)), JSON.stringify(before.comps.map(c => c.id)));
      assert.ok(await p.eval('document.querySelectorAll(".part").length') > count, 'PrettyUI\'s extra parts appear');
      const { design } = L.normalize(d);
      assert.match(L.generateLua(design), /prettyui\.Window\.new/);
      assert.ok(await p.eval('document.querySelector(".pane pre") ? document.querySelector(".pane pre").textContent.includes("prettyui.") : false'), 'the code pane follows');
    });

    await check('a PrettyUI-only part drags in, and undo takes the toggle back', async () => {
      const c = await content();
      await p.drag(await p.partAt('Divider'), { x: c.left + 200, y: c.top + 280 });
      await p.wait(60);
      const d = await p.design();
      const div = L.all(d).find(k => k.type === 'Divider'); // it may land inside a group box
      assert.ok(div);
      assert.equal(div.h, 60, 'the height PrettyUI really gives it');
      await p.shot('builder-prettyui');
      await p.key('z', 'KeyZ', 2); await p.wait(30);
      await p.key('z', 'KeyZ', 2); await p.wait(40);
      assert.equal((await p.design()).style, 'plain');
      assert.equal(await p.eval(`[...document.querySelectorAll('.toolbar button')].find(b => b.textContent === 'Plain').classList.contains('on')`), true);
    });

    await check('the host grip resizes the window', async () => {
      const g = await p.center('.host-grip');
      await p.drag(g, { x: g.x + 40, y: g.y + 24 });
      await p.wait(50);
      const d = await p.design();
      assert.equal(d.host.w, 520);
      assert.equal(d.host.h, 384);
    });

    await check('what came out normalizes cleanly and generates code', async () => {
      const raw = await p.design();
      const { design, notes } = L.normalize(raw);
      assert.deepEqual(notes, []);
      assert.ok(L.generateLua(design).includes('c.save_button = ui.Button.new'));
      assert.ok(await p.eval('document.querySelector(".pane pre").textContent.includes("c.save_button")'), 'the code pane updates live');
    });

    await check('Ctrl+S asks the host to save', async () => {
      await p.key('s', 'KeyS', 2);
      await p.wait(30);
      assert.equal(await p.eval('window.__sent.filter(m => m.type === "save").length'), 1);
    });

    await check('no script errors after all of that', async () => {
      assert.equal(await p.eval('(window.__errors || []).join(" | ")'), '');
    });
    await p.shot('builder');
    ws.close();
  } finally {
    proc.kill();
    server.close();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* the browser may still hold it */ }
  }
  console.log(`\n${results} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
