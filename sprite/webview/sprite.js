// RS3 Sprite Maker: a small pixel editor for plugin PNG resources, with 9-slice/tiling previews.
(function () {
  'use strict';
  const vscode = acquireVsCodeApi();

  // ---------------------------------------------------------------- state
  const S = {
    w: 32, h: 32, data: new Uint8ClampedArray(32 * 32 * 4),
    tool: 'pencil', brush: 1, mirror: false, grid: true, zoom: 12, filledRect: false,
    colour: [200, 162, 74, 255], recent: [],
    use: 'sprite', margins: { left: 0, top: 0, right: 0, bottom: 0 }, states: 4,
    pw: 64, ph: 64, tint: '#ffffff', gameBg: false, pzoom: 2,
    undo: [], redo: [], dirty: false, name: 'sprite', relPath: '', luaPath: 'Plugin.resources.sprite', exists: false,
    hover: null, drag: null
  };
  const PALETTE = ['#000000', '#1f1a14', '#2b241b', '#3a2f22', '#5b4a2e', '#8a6d2c', '#c8a24a', '#e8c873', '#f3e6c4', '#ffffff',
    '#4c4c4c', '#7a7a7a', '#b0b0b0', '#8a2f2a', '#c0392b', '#e06b5d', '#3f7a3a', '#5fae4f', '#9ad37d', '#2f4a63', '#3f7fbf', '#8fc3ff', '#6b3fa0', 'transparent'];

  // ---------------------------------------------------------------- dom helpers
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }
  const opt = (value, label) => h('option', { value }, label);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toHex = c => '#' + c.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('');
  const parseHex = s => {
    const m = String(s).trim().replace('#', '').match(/^([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) : 255];
  };
  const rgbaCss = c => `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`;

  // ---------------------------------------------------------------- layout
  const app = document.getElementById('app');
  const TOOLS = [
    ['pencil', 'Pencil', 'P'], ['eraser', 'Eraser', 'E'], ['fill', 'Fill', 'G'], ['line', 'Line', 'L'],
    ['rect', 'Rectangle', 'R'], ['picker', 'Pick colour', 'I'], ['pan', 'Pan', 'H']
  ];
  const toolBtns = {};
  const toolGroup = h('div', { class: 'tool-group', role: 'toolbar', 'aria-label': 'Tools' },
    TOOLS.map(([id, label, key]) => (toolBtns[id] = h('button', { title: `${label} (${key})`, onclick: () => setTool(id) }, label))));
  const brushSel = h('select', { title: 'Brush size', onchange: e => { S.brush = +e.target.value; } }, [1, 2, 3, 4, 6, 8].map(n => opt(n, n + ' px')));
  const btnFilled = h('button', { title: 'Rectangle: filled or outline (F)', onclick: () => { S.filledRect = !S.filledRect; syncUi(); } }, 'Filled');
  const btnMirror = h('button', { title: 'Mirror strokes left/right (M)', onclick: () => { S.mirror = !S.mirror; syncUi(); draw(); } }, 'Mirror');
  const btnGrid = h('button', { title: 'Pixel grid (#)', onclick: () => { S.grid = !S.grid; syncUi(); draw(); } }, 'Grid');
  const btnUndo = h('button', { title: 'Undo (Ctrl+Z)', onclick: undo }, '↶');
  const btnRedo = h('button', { title: 'Redo (Ctrl+Y)', onclick: redo }, '↷');
  const zoomLbl = h('span', { style: { minWidth: '44px', textAlign: 'center' } });
  const btnSave = h('button', { class: 'primary', title: 'Save PNG (Ctrl+S)', onclick: save }, 'Save');
  const toolbar = h('div', { class: 'toolbar' },
    toolGroup, brushSel, btnFilled, btnMirror,
    h('div', { class: 'sep' }), btnUndo, btnRedo,
    h('div', { class: 'sep' }), btnGrid,
    h('button', { title: 'Zoom out (-)', onclick: () => setZoom(S.zoom / 1.25) }, '−'), zoomLbl,
    h('button', { title: 'Zoom in (+)', onclick: () => setZoom(S.zoom * 1.25) }, '+'),
    h('button', { title: 'Fit to view (0)', onclick: fitZoom }, 'Fit'),
    h('div', { class: 'sep' }),
    h('button', { title: 'Change canvas size', onclick: openResize }, 'Canvas size…'),
    h('button', { title: 'Flip the whole image horizontally', onclick: () => transform('flipH') }, 'Flip ↔'),
    h('button', { title: 'Flip the whole image vertically', onclick: () => transform('flipV') }, 'Flip ↕'),
    h('button', { title: 'Clear to transparent', onclick: () => transform('clear') }, 'Clear'),
    h('div', { class: 'grow' }), btnSave);

  // left: colours
  const bigSw = h('i');
  const colourInput = h('input', { type: 'color', title: 'Colour', oninput: e => { const c = parseHex(e.target.value); setColour([c[0], c[1], c[2], S.colour[3] || 255]); } });
  const alphaInput = h('input', { type: 'range', min: 0, max: 255, title: 'Opacity', oninput: e => setColour([S.colour[0], S.colour[1], S.colour[2], +e.target.value]), style: { width: '100%' } });
  const hexInput = h('input', { class: 'hex', title: 'Hex RRGGBB or RRGGBBAA', onchange: e => { const c = parseHex(e.target.value); if (c) setColour(c); else syncColour(); } });
  const swatches = h('div', { class: 'swatches' });
  const recentBox = h('div', { class: 'swatches' });
  const left = h('div', { class: 'panel left' },
    h('div', {}, h('h3', {}, 'Colour'),
      h('div', { class: 'current' }, h('div', { class: 'big' }, bigSw), h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, colourInput, hexInput))),
    h('div', {}, h('div', { class: 'field' }, h('label', {}, 'Opacity'), alphaInput)),
    h('div', {}, h('h3', {}, 'RS palette'), swatches),
    h('div', {}, h('h3', {}, 'Recent'), recentBox),
    h('div', { class: 'hint' }, 'Right-click the canvas to pick a colour. Hold Space to pan. Alt+click fills all matching pixels.'));

  // centre: canvas
  const view = h('canvas', { class: 'view', tabindex: 0, 'aria-label': 'Sprite canvas' });
  const stageInner = h('div', { class: 'stage-inner' }, view);
  const stage = h('div', { class: 'stage' }, stageInner);

  // right: preview + Lua
  const useSel = h('select', { onchange: e => { setUse(e.target.value); } },
    opt('sprite', 'Plain sprite (stretched)'), opt('tile', 'Tiled (isTiling)'),
    opt('nine', '9-slice (Button / GroupBox / List)'), opt('states', 'Stacked states (scrollbar)'));
  const mIn = {};
  const marginsBox = h('div', { class: 'margins' }, ['left', 'top', 'right', 'bottom'].map(k =>
    h('label', {}, k, (mIn[k] = h('input', { type: 'number', min: 0, max: 255, oninput: e => { S.margins[k] = clamp(+e.target.value || 0, 0, 255); markMeta(); draw(); drawPreview(); renderLua(); } })))));
  const marginsField = h('div', {}, h('h3', {}, '9-slice margins (pixels)'), marginsBox,
    h('div', { class: 'hint', style: { marginTop: '4px' } }, 'Drag the cyan guides on the canvas. Corners stay fixed, edges stretch one way, the centre stretches both ways.'));
  const statesIn = h('input', { type: 'number', min: 2, max: 8, value: 4, oninput: e => { S.states = clamp(+e.target.value || 4, 2, 8); markMeta(); draw(); drawPreview(); renderLua(); } });
  const statesField = h('div', {}, h('div', { class: 'field' }, h('label', {}, 'States'), statesIn),
    h('div', { class: 'hint' }, 'Scrollbar sprites stack idle, mouseover, pressed, disabled top to bottom.'));
  const pwIn = h('input', { type: 'number', min: 1, max: 2048, oninput: e => { S.pw = clamp(+e.target.value || 1, 1, 2048); markMeta(); drawPreview(); renderLua(); } });
  const phIn = h('input', { type: 'number', min: 1, max: 2048, oninput: e => { S.ph = clamp(+e.target.value || 1, 1, 2048); markMeta(); drawPreview(); renderLua(); } });
  const tintIn = h('input', { type: 'color', value: '#ffffff', title: 'Tint (sprite colour/rgba)', oninput: e => { S.tint = e.target.value; drawPreview(); renderLua(); } });
  const bgChk = h('input', { type: 'checkbox', onchange: e => { S.gameBg = e.target.checked; drawPreview(); } });
  const pzSel = h('select', { onchange: e => { S.pzoom = +e.target.value; drawPreview(); } }, opt('1', '1×'), opt('2', '2×'), opt('3', '3×'), opt('4', '4×'));
  const previewCanvas = h('canvas');
  const previewBox = h('div', { class: 'preview-box' }, previewCanvas);
  const luaPre = h('pre', { class: 'code' });
  const right = h('div', { class: 'panel right' },
    h('div', {}, h('h3', {}, 'Use as'), useSel),
    marginsField, statesField,
    h('div', {}, h('h3', {}, 'Preview size (interface units)'),
      h('div', { class: 'field' }, pwIn, '×', phIn, pzSel),
      h('div', { class: 'field', style: { marginTop: '6px' } }, h('label', {}, 'Tint'), tintIn,
        h('label', { style: { minWidth: 0, display: 'inline-flex', gap: '4px', alignItems: 'center' } }, bgChk, 'game background'))),
    previewBox,
    h('div', {}, h('h3', {}, 'Lua'), luaPre),
    h('div', { class: 'row-btns' },
      h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: luaPre.textContent }) }, 'Copy'),
      h('button', { title: 'Insert at the cursor in your last Lua editor', onclick: () => vscode.postMessage({ type: 'insert', text: luaPre.textContent }) }, 'Insert into editor')));

  const statusPos = h('span'), statusCol = h('span'), statusSize = h('span'), statusFile = h('span', { class: 'grow' }), statusDirty = h('span', { class: 'dirty' });
  const status = h('div', { class: 'status' }, statusPos, statusCol, statusSize, statusFile, statusDirty);

  // resize modal
  const rw = h('input', { type: 'number', min: 1, max: 1024 }), rh = h('input', { type: 'number', min: 1, max: 1024 });
  let anchor = [0, 0];
  const anchorBtns = [];
  const anchorGrid = h('div', { class: 'anchor' });
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    const b = h('button', { title: 'Anchor', onclick: () => { anchor = [x, y]; syncAnchor(); } }, '·');
    anchorBtns.push([b, x, y]); anchorGrid.append(b);
  }
  const syncAnchor = () => anchorBtns.forEach(([b, x, y]) => b.classList.toggle('on', x === anchor[0] && y === anchor[1]));
  const modal = h('div', { class: 'modal', onclick: e => { if (e.target === modal) modal.classList.remove('open'); } },
    h('div', { class: 'box', role: 'dialog', 'aria-label': 'Canvas size' },
      h('h2', {}, 'Canvas size'),
      h('div', { class: 'field' }, h('label', {}, 'Width'), rw, h('label', {}, 'Height'), rh),
      h('div', { class: 'field' }, h('label', {}, 'Anchor'), anchorGrid),
      h('div', { class: 'hint' }, 'RuneScape accepts PNGs up to 1024 × 1024.'),
      h('div', { class: 'row-btns' },
        h('button', { class: 'primary', onclick: applyResize }, 'Apply'),
        h('button', { onclick: () => modal.classList.remove('open') }, 'Cancel'))));

  app.append(toolbar, h('div', { class: 'main' }, left, stage, right), status, modal);

  // ---------------------------------------------------------------- image ops
  const off = document.createElement('canvas');
  const offCtx = off.getContext('2d');
  function commitToOff() {
    off.width = S.w; off.height = S.h;
    offCtx.putImageData(new ImageData(new Uint8ClampedArray(S.data), S.w, S.h), 0, 0);
  }
  const idx = (x, y) => (y * S.w + x) * 4;
  function getPx(x, y) { const i = idx(x, y); return [S.data[i], S.data[i + 1], S.data[i + 2], S.data[i + 3]]; }
  function setPx(x, y, c) {
    if (x < 0 || y < 0 || x >= S.w || y >= S.h) return;
    const i = idx(x, y);
    S.data[i] = c[0]; S.data[i + 1] = c[1]; S.data[i + 2] = c[2]; S.data[i + 3] = c[3];
  }
  function stamp(x, y, c) {
    const o = Math.floor((S.brush - 1) / 2);
    for (let dy = 0; dy < S.brush; dy++) for (let dx = 0; dx < S.brush; dx++) {
      setPx(x + dx - o, y + dy - o, c);
      if (S.mirror) setPx(S.w - 1 - (x + dx - o), y + dy - o, c);
    }
  }
  function lineTo(x0, y0, x1, y1, fn) {
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      fn(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function rectPts(x0, y0, x1, y1, filled, fn) {
    const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(y0, y1), Math.max(y0, y1)];
    for (let y = c; y <= d; y++) for (let x = a; x <= b; x++)
      if (filled || x === a || x === b || y === c || y === d) fn(x, y);
  }
  const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  function flood(x, y, c, global) {
    const target = getPx(x, y);
    if (same(target, c)) return;
    if (global) {
      for (let yy = 0; yy < S.h; yy++) for (let xx = 0; xx < S.w; xx++) if (same(getPx(xx, yy), target)) setPx(xx, yy, c);
      return;
    }
    const stack = [[x, y]];
    const seen = new Uint8Array(S.w * S.h);
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= S.w || cy >= S.h) continue;
      const k = cy * S.w + cx;
      if (seen[k]) continue;
      seen[k] = 1;
      if (!same(getPx(cx, cy), target)) continue;
      setPx(cx, cy, c);
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  function snapshot() { return { w: S.w, h: S.h, data: new Uint8ClampedArray(S.data) }; }
  function pushUndo() { S.undo.push(snapshot()); if (S.undo.length > 100) S.undo.shift(); S.redo = []; syncUi(); }
  function restore(s) { S.w = s.w; S.h = s.h; S.data = new Uint8ClampedArray(s.data); afterEdit(); }
  function undo() { if (!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); }
  function redo() { if (!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); }

  let snapTimer;
  function afterEdit() {
    commitToOff();
    setDirty(true);
    draw(); drawPreview(); syncUi();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => vscode.postMessage({ type: 'snapshot', base64: pngBase64(), meta: meta() }), 800);
  }
  function setDirty(d) {
    if (S.dirty === d) return;
    S.dirty = d;
    vscode.postMessage({ type: 'dirty', dirty: d });
    statusDirty.textContent = d ? '● unsaved' : '';
  }
  function markMeta() { vscode.postMessage({ type: 'meta', meta: meta() }); }
  const meta = () => ({ use: S.use, margins: S.margins, states: S.states, pw: S.pw, ph: S.ph });

  function transform(kind) {
    pushUndo();
    const src = new Uint8ClampedArray(S.data);
    for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
      const i = idx(x, y);
      if (kind === 'clear') { S.data.fill(0, i, i + 4); continue; }
      const sx = kind === 'flipH' ? S.w - 1 - x : x, sy = kind === 'flipV' ? S.h - 1 - y : y;
      const j = (sy * S.w + sx) * 4;
      for (let k = 0; k < 4; k++) S.data[i + k] = src[j + k];
    }
    afterEdit();
  }

  function openResize() { rw.value = S.w; rh.value = S.h; anchor = [0, 0]; syncAnchor(); modal.classList.add('open'); rw.focus(); }
  function applyResize() {
    const nw = clamp(Math.round(+rw.value || S.w), 1, 1024), nh = clamp(Math.round(+rh.value || S.h), 1, 1024);
    modal.classList.remove('open');
    if (nw === S.w && nh === S.h) return;
    pushUndo();
    const ox = [0, Math.floor((nw - S.w) / 2), nw - S.w][anchor[0]];
    const oy = [0, Math.floor((nh - S.h) / 2), nh - S.h][anchor[1]];
    const nd = new Uint8ClampedArray(nw * nh * 4);
    for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
      const tx = x + ox, ty = y + oy;
      if (tx < 0 || ty < 0 || tx >= nw || ty >= nh) continue;
      const i = (y * S.w + x) * 4, j = (ty * nw + tx) * 4;
      for (let k = 0; k < 4; k++) nd[j + k] = S.data[i + k];
    }
    S.w = nw; S.h = nh; S.data = nd;
    for (const k of Object.keys(S.margins)) S.margins[k] = Math.min(S.margins[k], k === 'left' || k === 'right' ? S.w : S.h);
    fitZoom();
    afterEdit();
  }

  function pngBase64() { commitToOff(); return off.toDataURL('image/png').split(',')[1]; }
  function save() { vscode.postMessage({ type: 'save', base64: pngBase64(), meta: meta() }); }

  // ---------------------------------------------------------------- drawing the view
  const vctx = view.getContext('2d');
  function setZoom(z) {
    const maxZ = Math.max(1, Math.floor(4096 / Math.max(S.w, S.h)));
    S.zoom = clamp(Math.round(z * 100) / 100, 1, Math.min(64, maxZ));
    draw();
  }
  function fitZoom() {
    const aw = stage.clientWidth - 48, ah = stage.clientHeight - 48;
    setZoom(Math.max(1, Math.floor(Math.min(aw / S.w, ah / S.h))));
  }
  function guidePositions() {
    const g = [];
    if (S.use === 'nine') {
      const m = S.margins;
      g.push({ axis: 'x', key: 'left', at: m.left }, { axis: 'x', key: 'right', at: S.w - m.right },
        { axis: 'y', key: 'top', at: m.top }, { axis: 'y', key: 'bottom', at: S.h - m.bottom });
    }
    return g;
  }
  let tempOverlay = null; // pixels for line/rect preview
  function draw() {
    const z = S.zoom, W = S.w * z, H = S.h * z;
    view.width = W; view.height = H;
    view.style.width = W + 'px'; view.style.height = H + 'px';
    stageInner.style.width = W + 'px';
    zoomLbl.textContent = (Math.round(z * 10) / 10) + '×';
    // checkerboard
    const cs = Math.max(4, Math.min(16, z));
    for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) {
      vctx.fillStyle = ((x / cs + y / cs) & 1) ? '#3a3a3a' : '#2c2c2c';
      vctx.fillRect(x, y, cs, cs);
    }
    vctx.imageSmoothingEnabled = false;
    vctx.drawImage(off, 0, 0, W, H);
    if (tempOverlay) {
      vctx.fillStyle = tempOverlay.colour;
      for (const [x, y] of tempOverlay.pts) vctx.fillRect(x * z, y * z, z, z);
    }
    if (S.grid && z >= 6) {
      vctx.strokeStyle = 'rgba(255,255,255,.08)';
      vctx.lineWidth = 1;
      vctx.beginPath();
      for (let x = 1; x < S.w; x++) { vctx.moveTo(x * z + .5, 0); vctx.lineTo(x * z + .5, H); }
      for (let y = 1; y < S.h; y++) { vctx.moveTo(0, y * z + .5); vctx.lineTo(W, y * z + .5); }
      vctx.stroke();
    }
    if (S.mirror) {
      vctx.strokeStyle = 'rgba(255,120,200,.6)';
      vctx.setLineDash([4, 4]);
      vctx.beginPath(); vctx.moveTo(W / 2 + .5, 0); vctx.lineTo(W / 2 + .5, H); vctx.stroke();
      vctx.setLineDash([]);
    }
    if (S.use === 'states') {
      vctx.strokeStyle = 'rgba(255,204,51,.8)';
      vctx.setLineDash([6, 4]);
      vctx.beginPath();
      for (let i = 1; i < S.states; i++) { const y = Math.round(S.h * i / S.states) * z + .5; vctx.moveTo(0, y); vctx.lineTo(W, y); }
      vctx.stroke(); vctx.setLineDash([]);
    }
    for (const g of guidePositions()) {
      vctx.strokeStyle = S.drag && S.drag.guide === g.key ? '#ffffff' : '#33d6ff';
      vctx.lineWidth = 2;
      vctx.setLineDash([6, 4]);
      vctx.beginPath();
      if (g.axis === 'x') { vctx.moveTo(g.at * z, 0); vctx.lineTo(g.at * z, H); }
      else { vctx.moveTo(0, g.at * z); vctx.lineTo(W, g.at * z); }
      vctx.stroke();
      vctx.setLineDash([]); vctx.lineWidth = 1;
    }
    if (S.hover && !S.drag) {
      const o = Math.floor((S.brush - 1) / 2);
      const n = ['pencil', 'eraser'].includes(S.tool) ? S.brush : 1;
      vctx.strokeStyle = 'rgba(255,255,255,.9)';
      vctx.strokeRect((S.hover[0] - (n > 1 ? o : 0)) * z + .5, (S.hover[1] - (n > 1 ? o : 0)) * z + .5, n * z - 1, n * z - 1);
    }
  }

  // ---------------------------------------------------------------- preview
  const pctx = previewCanvas.getContext('2d');
  function drawPreview() {
    const z = S.pzoom;
    const tint = parseHex(S.tint) || [255, 255, 255, 255];
    const tinted = !(tint[0] === 255 && tint[1] === 255 && tint[2] === 255);
    previewBox.classList.toggle('game', S.gameBg);
    let W = S.pw, H = S.ph;
    const tmp = document.createElement('canvas');
    const t = tmp.getContext('2d');
    t.imageSmoothingEnabled = false;
    const nine = (ctx, sx, sy, sw, sh, dx, dy, dw, dh) => {
      let { left: L, top: T, right: R, bottom: B } = S.margins;
      L = Math.min(L, sw); R = Math.min(R, sw - L); T = Math.min(T, sh); B = Math.min(B, sh - T);
      const dL = Math.min(L, dw / 2), dR = Math.min(R, dw / 2), dT = Math.min(T, dh / 2), dB = Math.min(B, dh / 2);
      const xs = [[sx, L, dx, dL], [sx + L, sw - L - R, dx + dL, dw - dL - dR], [sx + sw - R, R, dx + dw - dR, dR]];
      const ys = [[sy, T, dy, dT], [sy + T, sh - T - B, dy + dT, dh - dT - dB], [sy + sh - B, B, dy + dh - dB, dB]];
      for (const [x0, w0, x1, w1] of xs) for (const [y0, h0, y1, h1] of ys)
        if (w0 > 0 && h0 > 0 && w1 > 0 && h1 > 0) ctx.drawImage(off, x0, y0, w0, h0, x1, y1, w1, h1);
    };
    if (S.use === 'states') {
      const n = S.states, sh = Math.floor(S.h / n), gap = 10;
      tmp.width = n * W + (n - 1) * gap; tmp.height = H;
      t.imageSmoothingEnabled = false;
      for (let i = 0; i < n; i++) t.drawImage(off, 0, i * sh, S.w, sh, i * (W + gap), 0, W, H);
    } else {
      tmp.width = W; tmp.height = H;
      t.imageSmoothingEnabled = false;
      if (S.use === 'tile') {
        t.fillStyle = t.createPattern(off, 'repeat');
        t.fillRect(0, 0, W, H);
      } else if (S.use === 'nine') nine(t, 0, 0, S.w, S.h, 0, 0, W, H);
      else t.drawImage(off, 0, 0, W, H);
    }
    if (tinted) {
      const base = document.createElement('canvas');
      base.width = tmp.width; base.height = tmp.height;
      base.getContext('2d').drawImage(tmp, 0, 0);
      t.globalCompositeOperation = 'multiply';
      t.fillStyle = S.tint; t.fillRect(0, 0, tmp.width, tmp.height);
      t.globalCompositeOperation = 'destination-in';
      t.drawImage(base, 0, 0);
      t.globalCompositeOperation = 'source-over';
    }
    previewCanvas.width = tmp.width * z; previewCanvas.height = tmp.height * z;
    pctx.imageSmoothingEnabled = false;
    pctx.drawImage(tmp, 0, 0, previewCanvas.width, previewCanvas.height);
    if (S.use === 'states') {
      pctx.font = '11px sans-serif'; pctx.fillStyle = 'rgba(255,255,255,.75)';
      const names = ['idle', 'mouseover', 'pressed', 'disabled'];
      for (let i = 0; i < S.states; i++) pctx.fillText(names[i] || 'state ' + (i + 1), i * (W + 10) * z + 2, 11);
    }
  }

  // ---------------------------------------------------------------- Lua snippet
  function renderLua() {
    const L = S.luaPath;
    const tint = parseHex(S.tint) || [255, 255, 255, 255];
    const tintLine = (v) => (tint[0] === 255 && tint[1] === 255 && tint[2] === 255) ? '' :
      `\n${v}.rgba = 0x${tint.slice(0, 3).map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase()}FF`;
    let code;
    if (S.use === 'sprite') code = `local img = ui.Sprite.new(parent)\nimg.sprite = ${L}\nimg:SetSize(${S.pw}, ${S.ph})${tintLine('img')}`;
    else if (S.use === 'tile') code = `local img = ui.Sprite.new(parent)\nimg.sprite = ${L}\nimg.isTiling = true\nimg:SetSize(${S.pw}, ${S.ph})${tintLine('img')}`;
    else if (S.use === 'nine') {
      const m = S.margins;
      code = `-- 9-slice works on Button / GroupBox / List sprite data (ui.Sprite ignores margins)\n` +
        `button.sprite.sprite = ${L}\nbutton.sprite.visualMargins = ui.Margin.new(${m.left}, ${m.top}, ${m.right}, ${m.bottom})${tintLine('button.sprite')}\n` +
        `button:SetSize(${S.pw}, ${S.ph})\n\n-- GroupBox background:\n-- box.contentBackgroundSprite.sprite = ${L}\n-- box.contentBackgroundSprite.visualMargins = ui.Margin.new(${m.left}, ${m.top}, ${m.right}, ${m.bottom})`;
    } else code = `-- ${S.states} states stacked vertically: idle, mouseover, pressed, disabled\ncomponent.scrollbar.handleSprite.sprite = ${L}\n-- or .buttonSprite / .backgroundSprite`;
    luaPre.textContent = code;
  }

  // ---------------------------------------------------------------- input
  function pxAt(e) {
    const r = view.getBoundingClientRect();
    return [Math.floor((e.clientX - r.left) / S.zoom), Math.floor((e.clientY - r.top) / S.zoom)];
  }
  function guideAt(e) {
    const r = view.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    for (const g of guidePositions()) {
      const d = g.axis === 'x' ? Math.abs(mx - g.at * S.zoom) : Math.abs(my - g.at * S.zoom);
      if (d <= 5) return g;
    }
    return null;
  }
  let spaceDown = false;
  view.addEventListener('contextmenu', e => e.preventDefault());
  view.addEventListener('pointerdown', e => {
    view.focus();
    view.setPointerCapture(e.pointerId);
    const [x, y] = pxAt(e);
    if (e.button === 1 || S.tool === 'pan' || spaceDown) {
      S.drag = { pan: true, sx: e.clientX, sy: e.clientY, sl: stage.scrollLeft, st: stage.scrollTop };
      return;
    }
    const g = guideAt(e);
    if (g) { S.drag = { guide: g.key, axis: g.axis }; return; }
    if (e.button === 2 || S.tool === 'picker') { pick(x, y); return; }
    const c = S.tool === 'eraser' ? [0, 0, 0, 0] : S.colour.slice();
    if (S.tool === 'fill') { pushUndo(); flood(x, y, c, e.altKey); if (S.mirror) flood(S.w - 1 - x, y, c, e.altKey); useColour(); afterEdit(); return; }
    if (S.tool === 'pencil' || S.tool === 'eraser') {
      pushUndo();
      stamp(x, y, c);
      S.drag = { paint: true, last: [x, y], c };
      if (S.tool === 'pencil') useColour();
      commitToOff(); draw();
      return;
    }
    if (S.tool === 'line' || S.tool === 'rect') {
      S.drag = { shape: S.tool, start: [x, y], end: [x, y], c };
      updateShape();
    }
  });
  view.addEventListener('pointermove', e => {
    const [x, y] = pxAt(e);
    const inside = x >= 0 && y >= 0 && x < S.w && y < S.h;
    S.hover = inside ? [x, y] : null;
    statusPos.textContent = inside ? `${x}, ${y}` : '';
    if (inside) { const c = getPx(x, y); statusCol.textContent = c[3] ? toHex(c).toUpperCase() + (c[3] < 255 ? ' α' + c[3] : '') : 'transparent'; }
    const d = S.drag;
    if (!d) {
      const g = guideAt(e);
      view.classList.toggle('resize-ew', !!g && g.axis === 'x');
      view.classList.toggle('resize-ns', !!g && g.axis === 'y');
      view.classList.toggle('grab', S.tool === 'pan' || spaceDown);
      draw();
      return;
    }
    if (d.pan) { stage.scrollLeft = d.sl - (e.clientX - d.sx); stage.scrollTop = d.st - (e.clientY - d.sy); return; }
    if (d.guide) {
      const r = view.getBoundingClientRect();
      const v = Math.round(((d.axis === 'x' ? e.clientX - r.left : e.clientY - r.top)) / S.zoom);
      const m = S.margins;
      if (d.guide === 'left') m.left = clamp(v, 0, S.w - m.right);
      if (d.guide === 'right') m.right = clamp(S.w - v, 0, S.w - m.left);
      if (d.guide === 'top') m.top = clamp(v, 0, S.h - m.bottom);
      if (d.guide === 'bottom') m.bottom = clamp(S.h - v, 0, S.h - m.top);
      syncMargins(); draw(); drawPreview(); renderLua();
      return;
    }
    if (d.paint) {
      lineTo(d.last[0], d.last[1], x, y, (px, py) => stamp(px, py, d.c));
      d.last = [x, y];
      commitToOff(); draw();
      return;
    }
    if (d.shape) { d.end = [x, y]; updateShape(); }
  });
  function endDrag() {
    const d = S.drag;
    S.drag = null;
    if (!d) return;
    if (d.paint) afterEdit();
    else if (d.shape) {
      pushUndo();
      for (const [x, y] of tempOverlay.pts) stamp(x, y, d.c);
      tempOverlay = null;
      useColour();
      afterEdit();
    } else if (d.guide) { markMeta(); draw(); }
  }
  view.addEventListener('pointerup', endDrag);
  view.addEventListener('pointercancel', endDrag);
  view.addEventListener('pointerleave', () => { S.hover = null; statusPos.textContent = ''; if (!S.drag) draw(); });
  view.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(S.zoom * (e.deltaY < 0 ? 1.25 : 0.8));
  }, { passive: false });
  function updateShape() {
    const d = S.drag;
    const pts = [];
    if (d.shape === 'line') lineTo(d.start[0], d.start[1], d.end[0], d.end[1], (x, y) => pts.push([x, y]));
    else rectPts(d.start[0], d.start[1], d.end[0], d.end[1], S.filledRect, (x, y) => pts.push([x, y]));
    tempOverlay = { pts, colour: d.c[3] ? rgbaCss(d.c) : 'rgba(255,0,255,.35)' };
    draw();
  }
  function pick(x, y) {
    if (x < 0 || y < 0 || x >= S.w || y >= S.h) return;
    const c = getPx(x, y);
    setColour(c[3] ? c : [S.colour[0], S.colour[1], S.colour[2], 0]);
  }

  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      return;
    }
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === ' ') { spaceDown = true; view.classList.add('grab'); e.preventDefault(); return; }
    const t = TOOLS.find(([, , key]) => key.toLowerCase() === k);
    if (t) { setTool(t[0]); return; }
    if (k === 'f') { S.filledRect = !S.filledRect; syncUi(); }
    if (k === 'm') { S.mirror = !S.mirror; syncUi(); draw(); }
    if (k === '#') { S.grid = !S.grid; syncUi(); draw(); }
    if (k === '+' || k === '=') setZoom(S.zoom * 1.25);
    if (k === '-') setZoom(S.zoom / 1.25);
    if (k === '0') fitZoom();
    if (k === 'escape') modal.classList.remove('open');
    if (k === '[') { S.brush = Math.max(1, S.brush - 1); brushSel.value = String(S.brush); }
    if (k === ']') { S.brush = Math.min(8, S.brush + 1); brushSel.value = String(S.brush); }
  });
  window.addEventListener('keyup', e => { if (e.key === ' ') { spaceDown = false; view.classList.toggle('grab', S.tool === 'pan'); } });

  // ---------------------------------------------------------------- ui sync
  function setTool(t) { S.tool = t; syncUi(); view.classList.toggle('grab', t === 'pan'); }
  function setUse(u) {
    S.use = u;
    if (u === 'nine' && !S.margins.left && !S.margins.top && !S.margins.right && !S.margins.bottom) {
      const m = Math.max(1, Math.floor(Math.min(S.w, S.h) / 4));
      S.margins = { left: m, top: m, right: m, bottom: m };
    }
    markMeta(); syncUi(); draw(); drawPreview(); renderLua();
  }
  function setColour(c) { S.colour = c.slice(); syncColour(); }
  function useColour() {
    const hx = toHex(S.colour) + S.colour[3].toString(16).padStart(2, '0');
    S.recent = [hx, ...S.recent.filter(x => x !== hx)].slice(0, 12);
    renderRecent();
  }
  function syncColour() {
    colourInput.value = toHex(S.colour);
    alphaInput.value = S.colour[3];
    hexInput.value = (toHex(S.colour) + (S.colour[3] < 255 ? S.colour[3].toString(16).padStart(2, '0') : '')).toUpperCase();
    bigSw.style.background = rgbaCss(S.colour);
    for (const b of swatches.children) b.classList.toggle('cur', b.dataset.c === toHex(S.colour) && S.colour[3] === 255 || (b.dataset.c === 'transparent' && S.colour[3] === 0));
  }
  function swatchBtn(hex) {
    const b = h('button', { class: 'sw', title: hex, 'data-c': hex.length > 7 ? hex.slice(0, 7) : hex,
      onclick: () => setColour(hex === 'transparent' ? [S.colour[0], S.colour[1], S.colour[2], 0] : parseHex(hex)) }, h('i'));
    if (hex !== 'transparent') b.firstChild.style.background = rgbaCss(parseHex(hex));
    return b;
  }
  function renderRecent() { recentBox.replaceChildren(...S.recent.map(swatchBtn)); }
  swatches.append(...PALETTE.map(swatchBtn));
  function syncMargins() { for (const k of Object.keys(mIn)) mIn[k].value = S.margins[k]; }
  function syncUi() {
    for (const [id, b] of Object.entries(toolBtns)) { b.classList.toggle('on', id === S.tool); b.setAttribute('aria-pressed', String(id === S.tool)); }
    btnFilled.classList.toggle('on', S.filledRect);
    btnFilled.disabled = S.tool !== 'rect';
    brushSel.disabled = !['pencil', 'eraser'].includes(S.tool);
    btnMirror.classList.toggle('on', S.mirror);
    btnGrid.classList.toggle('on', S.grid);
    btnUndo.disabled = !S.undo.length; btnRedo.disabled = !S.redo.length;
    useSel.value = S.use;
    marginsField.style.display = S.use === 'nine' ? '' : 'none';
    statesField.style.display = S.use === 'states' ? '' : 'none';
    pwIn.value = S.pw; phIn.value = S.ph; statesIn.value = S.states; pzSel.value = String(S.pzoom);
    syncMargins();
    statusSize.textContent = `${S.w} × ${S.h}` + (S.w > 1024 || S.h > 1024 ? ' (over 1024 limit)' : '');
    statusFile.textContent = S.relPath + (S.exists ? '' : ' (new)');
  }

  // ---------------------------------------------------------------- templates
  function template(name, w, h) {
    S.w = w; S.h = h; S.data = new Uint8ClampedArray(w * h * 4);
    const fillRect = (x, y, rw, rh, hex) => { const c = parseHex(hex); rectPts(x, y, x + rw - 1, y + rh - 1, true, (px, py) => setPx(px, py, c)); };
    const border = (x, y, rw, rh, hex) => { const c = parseHex(hex); rectPts(x, y, x + rw - 1, y + rh - 1, false, (px, py) => setPx(px, py, c)); };
    const vgrad = (x, y, rw, rh, a, b) => {
      const ca = parseHex(a), cb = parseHex(b);
      for (let yy = 0; yy < rh; yy++) {
        const t = rh > 1 ? yy / (rh - 1) : 0;
        const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
        for (let xx = 0; xx < rw; xx++) setPx(x + xx, y + yy, c);
      }
    };
    if (name === 'button') {
      vgrad(1, 1, w - 2, h - 2, '#6b5634', '#3b2f1d');
      border(0, 0, w, h, '#c8a24a');
      fillRect(2, 1, w - 4, 1, '#9c8052');
      for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) setPx(x, y, [0, 0, 0, 0]);
      S.use = 'nine'; S.margins = { left: 4, top: 4, right: 4, bottom: 4 }; S.pw = 160; S.ph = 36;
    } else if (name === 'panel') {
      fillRect(0, 0, w, h, '#000000');
      border(1, 1, w - 2, h - 2, '#8a6d2c');
      border(2, 2, w - 4, h - 4, '#c8a24a');
      border(3, 3, w - 6, h - 6, '#5b4a2e');
      vgrad(4, 4, w - 8, h - 8, '#2b241b', '#1f1a14');
      for (const [x, y] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) setPx(x, y, parseHex('#e8c873'));
      S.use = 'nine'; S.margins = { left: 8, top: 8, right: 8, bottom: 8 }; S.pw = 320; S.ph = 200;
    } else if (name === 'scrollbar') {
      const cols = [['#6b5634', '#c8a24a'], ['#8a6d3c', '#e8c873'], ['#3a2f22', '#8a6d2c'], ['#3a3a3a', '#6a6a6a']];
      const sh = Math.floor(h / 4);
      cols.forEach(([body, edge], i) => { vgrad(1, i * sh + 1, w - 2, sh - 2, body, '#2b241b'); border(0, i * sh, w, sh, edge); });
      S.use = 'states'; S.states = 4; S.pw = 16; S.ph = 48;
    } else if (name === 'icon') {
      S.use = 'sprite'; S.pw = w * 2; S.ph = h * 2;
    } else {
      S.use = 'sprite'; S.pw = Math.max(32, w); S.ph = Math.max(32, h);
    }
  }

  // ---------------------------------------------------------------- host messages
  window.addEventListener('message', async ev => {
    const m = ev.data;
    if (m.type === 'load') {
      S.name = m.name; S.relPath = m.relPath; S.luaPath = m.luaPath; S.exists = !!m.exists;
      if (m.base64) {
        const img = new Image();
        img.src = 'data:image/png;base64,' + m.base64;
        await img.decode().catch(() => null);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 1; c.height = img.naturalHeight || 1;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        S.w = c.width; S.h = c.height;
        S.data = new Uint8ClampedArray(cx.getImageData(0, 0, S.w, S.h).data);
        S.pw = Math.max(32, S.w * 2); S.ph = Math.max(32, S.h * 2);
      } else template(m.template || 'blank', m.width || 32, m.height || 32);
      if (m.meta) {
        if (m.meta.use) S.use = m.meta.use;
        if (m.meta.margins) S.margins = Object.assign({ left: 0, top: 0, right: 0, bottom: 0 }, m.meta.margins);
        if (m.meta.states) S.states = m.meta.states;
        if (m.meta.pw) S.pw = m.meta.pw;
        if (m.meta.ph) S.ph = m.meta.ph;
      }
      S.undo = []; S.redo = [];
      commitToOff();
      syncUi(); syncColour(); renderRecent();
      requestAnimationFrame(() => { fitZoom(); drawPreview(); renderLua(); });
      if (!m.base64) setDirty(true); else setDirty(false);
    } else if (m.type === 'saved') {
      S.exists = true;
      setDirty(false);
      syncUi();
    } else if (m.type === 'requestSave') {
      save();
    }
  });
  window.addEventListener('resize', () => draw());
  setColour(S.colour);
  syncUi();
  vscode.postMessage({ type: 'ready' });
})();
