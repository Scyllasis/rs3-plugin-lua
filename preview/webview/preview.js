// RS3 UI Preview webview: draws the mock client and the plugin's components.
(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  const saved = vscode.getState() || {};
  const S = {
    data: null, scenes: [], state: {}, cfg: {}, resolutions: [],
    sel: saved.sel || null, resources: {}, hover: null, cursor: null,
    zoom: saved.zoom || 'fit', logsOpen: saved.logsOpen !== false, byId: new Map(), pressed: null
  };
  const persist = () => vscode.setState({ sel: S.sel, zoom: S.zoom, logsOpen: S.logsOpen });

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
  const opt = (value, label, selected) => h('option', { value, selected: selected ? true : null }, label);
  const fmt = n => (Math.round(n * 100) / 100).toString();

  // ---------------------------------------------------------------- layout
  const app = document.getElementById('app');
  // options are a scene id, or WIN_SEP + scene id + WIN_SEP + window key for one of a scene's windows
  const WIN_SEP = '\u0001';
  const sceneSel = h('select', { class: 'scene', title: 'Which window to show', onchange: e => {
    const [, scene, key] = e.target.value.split(WIN_SEP);
    if (key) setState({ sceneId: scene, windowKey: key });
    else setState({ sceneId: e.target.value, windowKey: null });
  } });
  const resSel = h('select', { title: 'Client resolution', onchange: e => setState({ resolution: e.target.value }) });
  const scaleSel = h('select', { title: 'Interface scaling', onchange: e => setState({ uiScale: Number(e.target.value) }) });
  const ZOOMS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8];
  const zoomSel = h('select', { title: 'Zoom (Ctrl+wheel over the preview, or + / - / 0 for fit / 1 for 100%)', onchange: e => { setZoom(e.target.value); } });
  const btnZoomOut = h('button', { class: 'icon-btn', title: 'Zoom out (-)', onclick: () => stepZoom(-1) }, '\u2212');
  const btnZoomIn = h('button', { class: 'icon-btn', title: 'Zoom in (+)', onclick: () => stepZoom(1) }, '+');
  function syncZoomSel() {
    const cur = S.zoom === 'fit' || !S.zoom ? 'fit' : String(Number(S.zoom));
    const presets = ZOOMS.map(String);
    const custom = cur !== 'fit' && !presets.includes(cur) ? [opt(cur, Math.round(Number(cur) * 100) + '%', true)] : [];
    zoomSel.replaceChildren(opt('fit', 'Fit', cur === 'fit'), ...custom, ...ZOOMS.map(z => opt(String(z), Math.round(z * 100) + '%', String(z) === cur)));
  }
  syncZoomSel();
  const evSel = h('select', { title: 'Fire an event your plugin subscribes to', onchange: e => {
    if (e.target.value) vscode.postMessage({ type: 'fireEvent', name: e.target.value });
    e.target.value = '';
  } });
  const btnInGame = h('button', { title: 'See your UI on the simulated game screen (V)', onclick: () => setView('game') }, 'In game');
  const btnWindow = h('button', { title: 'See only the window you are building, zoomed to fit (V)', onclick: () => setView('window') }, 'Window only');
  const viewSwitch = h('div', { class: 'segmented', role: 'group', 'aria-label': 'View' }, btnInGame, btnWindow);
  function setView(v) { setState({ viewMode: v }); }
  const btnClient = h('button', { title: 'Show a mock RuneScape client behind your UI', onclick: () => setState({ showClient: !S.state.showClient }) }, 'Client');
  const btnBounds = h('button', { title: 'Outline every component, including invisible layout ones', onclick: () => setState({ showBounds: !S.state.showBounds }) }, 'Bounds');
  const btnInteract = h('button', { title: 'Interact: clicks press buttons and run their hooks. Off: clicks select components.', onclick: () => setState({ interact: !S.state.interact }) }, 'Interact');
  // PrettyUI switch: off = base view (PrettyUI calls are stubs), on = PrettyUI runs and is drawn
  const libInput = h('input', { type: 'checkbox', role: 'switch', onchange: e => vscode.postMessage({ type: 'setLibrary', on: e.target.checked }) });
  const libSwitch = h('label', { class: 'switch hidden' }, libInput, h('span', { class: 'track' }, h('span', { class: 'knob' })), h('span', { class: 'switch-label' }, 'PrettyUI'));
  const btnSync = h('button', { title: 'Selecting a component jumps to the line that created it', onclick: () => setState({ syncEditor: !S.state.syncEditor }) }, 'Sync editor');
  const toolbar = h('div', { class: 'toolbar' },
    h('label', {}, 'Window', sceneSel),
    viewSwitch,
    h('div', { class: 'sep' }),
    h('div', { class: 'group' }, resSel, scaleSel, btnZoomOut, zoomSel, btnZoomIn),
    h('div', { class: 'sep' }),
    h('div', { class: 'group' }, btnClient, btnBounds, btnInteract, btnSync),
    h('div', { class: 'sep' }),
    evSel,
    libSwitch,
    h('div', { class: 'grow' }),
    h('button', { title: 'Make or edit a PNG in resources/ (Sprite Maker)', onclick: () => vscode.postMessage({ type: 'command', id: 'rs3lua.newSprite' }) }, 'Sprites…'),
    h('button', { title: 'Design custom stylesheets (Style Studio)', onclick: () => vscode.postMessage({ type: 'command', id: 'rs3lua.styleStudio' }) }, 'Styles…'),
        h('button', { title: 'Run the plugin again from scratch', onclick: () => vscode.postMessage({ type: 'rerun' }) }, '↻ Re-run'),
    h('button', { title: 'Preview settings (window sizes)', onclick: () => vscode.postMessage({ type: 'openSettings' }) }, '⚙'),
    h('button', { title: 'How the preview works', onclick: () => vscode.postMessage({ type: 'help' }) }, '?')
  );

  const screen = h('div', { class: 'screen' });
  const stageOuter = h('div', { class: 'stage-outer' }, screen);
  const stageHint = h('div', { class: 'stage-hint' });
  const stageWrap = h('div', { class: 'stage-wrap' }, stageOuter);
  const stageBox = h('div', { class: 'stage-box' }, stageWrap, stageHint);
  const treeBox = h('div', { class: 'scroll' });
  const treeCount = h('span', { class: 'count' });
  const propsBox = h('div', { class: 'scroll props' });
  const side = h('div', { class: 'side' },
    h('section', {}, h('h3', {}, 'Components', treeCount), treeBox),
    h('section', {}, h('h3', {}, 'Properties'), propsBox));
  const main = h('div', { class: 'main' }, stageBox, side);
  const outBadges = h('span', { class: 'badge' });
  const outList = h('div', { class: 'scroll' });
  const output = h('div', { class: 'output' + (S.logsOpen ? '' : ' collapsed') },
    h('h3', { onclick: () => { S.logsOpen = !S.logsOpen; output.classList.toggle('collapsed', !S.logsOpen); persist(); } }, 'Output', outBadges),
    outList);
  const tip = h('div', { class: 'tip' });
  app.append(toolbar, main, output, tip);

  function setState(patch) {
    Object.assign(S.state, patch);
    vscode.postMessage({ type: 'setState', state: patch });
    syncToolbar();
    if ('showClient' in patch || 'showBounds' in patch || 'interact' in patch || 'viewMode' in patch || 'windowKey' in patch) { drawScreen(); if ('viewMode' in patch || 'windowKey' in patch) drawTree(); }
  }

  function syncHint() {
    const mode = S.state.interact
      ? 'Interact mode: click buttons and checkboxes to run their hooks'
      : 'Click to select · drag to move (updates your code) · arrows nudge · double-click to press · Alt+click for the parent';
    stageHint.textContent = S.moveMsg || (mode + ' · Ctrl+wheel zooms · middle-drag or Space+drag pans · V switches view · ' + Math.round((S.z || 1) * 100) + '%');
  }
  function syncToolbar() {
    const isolated = S.state.viewMode === 'window';
    btnInGame.classList.toggle('on', !isolated);
    btnWindow.classList.toggle('on', isolated);
    btnInGame.setAttribute('aria-pressed', String(!isolated));
    btnWindow.setAttribute('aria-pressed', String(isolated));
    btnClient.disabled = isolated;
    btnClient.title = isolated ? 'Only used in the "In game" view' : 'Show a mock RuneScape client behind your UI';
    btnClient.classList.toggle('on', !!S.state.showClient);
    btnBounds.classList.toggle('on', !!S.state.showBounds);
    btnInteract.classList.toggle('on', !!S.state.interact);
    btnSync.classList.toggle('on', !!S.state.syncEditor);
    screen.classList.toggle('client', !!S.state.showClient && !isolated);
    screen.classList.toggle('isolated', isolated);
    screen.classList.toggle('show-bounds', !!S.state.showBounds);
    screen.classList.toggle('interact', !!S.state.interact);
    syncHint();
  }

  // ---------------------------------------------------------------- colours / text
  function hexColour(n, hasAlpha) {
    n = Number(n) >>> 0;
    if (hasAlpha) return `rgba(${(n >>> 24) & 255},${(n >>> 16) & 255},${(n >>> 8) & 255},${((n & 255) / 255).toFixed(3)})`;
    return `rgb(${(n >>> 16) & 255},${(n >>> 8) & 255},${n & 255})`;
  }
  function colourOf(p, fallback) {
    if (!p) return fallback;
    if (typeof p.rgba === 'number') return hexColour(p.rgba, true);
    if (typeof p.rgb === 'number') return hexColour(p.rgb, false);
    const c = p.colour;
    if (c && typeof c === 'object' && typeof c.x === 'number') {
      const ch = v => Math.round(Math.max(0, Math.min(1, v ?? 0)) * 255);
      return `rgba(${ch(c.x)},${ch(c.y)},${ch(c.z)},${Math.max(0, Math.min(1, c.w ?? 1))})`;
    }
    return fallback;
  }
  function applyFont(el, font) {
    const name = typeof font === 'string' ? font : '';
    const pt = name.match(/(\d+)\s*PT/i);
    el.style.fontSize = (pt ? Number(pt[1]) : 12) + 'px';
    if (/BOLD/i.test(name)) el.style.fontWeight = '700';
  }
  function applyAlign(el, p) {
    const hz = String(p.alignHorizontal || '');
    const vt = String(p.alignVertical || p.alignHorizontal || '');
    const pick = (s, a, b) => /CENTRE|CENTER|MIDDLE/i.test(s) && !new RegExp(a + '|' + b, 'i').test(s.split('.').pop()) ? 'center'
      : new RegExp(b, 'i').test(s.split('.').pop()) ? 'flex-end' : 'flex-start';
    el.style.justifyContent = pick(hz, 'LEFT', 'RIGHT');
    el.style.alignItems = pick(vt, 'TOP', 'BOTTOM');
    el.style.textAlign = el.style.justifyContent === 'center' ? 'center' : el.style.justifyContent === 'flex-end' ? 'right' : 'left';
  }
  // <br> is the game's line break in text
  const textOf = v => (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/<br\s*\/?>/gi, '\n') : '';

  // ---------------------------------------------------------------- stylesheets & sprites
  // Follow a stylesheetID through custom sheets (ui.StyleSheets[id].parent = …) to the built-in it inherits from.
  function resolveSheet(sid) {
    if (sid == null || sid === '') return null;
    const sheets = (S.data && S.data.sheets) || {};
    let key = String(sid);
    const values = {};
    const chain = [];
    const seen = new Set();
    while (key && !seen.has(key)) {
      seen.add(key);
      chain.push(key);
      const sh = sheets[key];
      if (sh && sh.values) for (const [k, v] of Object.entries(sh.values)) if (!(k in values)) values[k] = v;
      if (/^id\.StyleSheet\./.test(key)) return { base: key.replace(/^id\.StyleSheet\./, ''), values, chain, custom: chain.length > 1 };
      key = sh && sh.parent;
    }
    return { base: null, values, chain, custom: true, orphan: true };
  }
  function tintOf(st) {
    if (!st) return null;
    const rgb = st.values['button.tint.rgb'];
    if (typeof rgb !== 'number') return null;
    let a = st.values['button.tint.alpha'];
    a = typeof a === 'number' ? (a > 1 ? a / 255 : a) : 1;
    return `rgba(${(rgb >>> 16) & 255},${(rgb >>> 8) & 255},${rgb & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  }
  const VARIANT = { POSITIVE: '#3f7a3a', NEGATIVE: '#8a2f2a', NEUTRAL: '#4c4c4c' };
  function styleButton(el, st) {
    const base = st && st.base || '';
    const v = Object.keys(VARIANT).find(k => base.includes(k));
    const tint = tintOf(st) || (v && VARIANT[v]);
    if (tint) el.style.background = `linear-gradient(rgba(255,255,255,.16), rgba(0,0,0,.28)), ${tint}`;
    if (/CORNERED/.test(base)) el.style.borderRadius = '0';
    if (/BOLD/.test(base)) el.style.fontWeight = '700';
  }

  const isNonWhite = c => c && !/^rgba?\(255,255,255(,1(\.0+)?)?\)$/.test(c.replace(/\s/g, ''));
  /** Draw a SpriteData that points at a plugin PNG. `ignoreMargins` for ui.Sprite (docs: no 3x3 there). */
  function spriteEl(sd, ignoreMargins) {
    if (!sd || typeof sd.sprite !== 'string' || !/^Plugin\.resources\./.test(sd.sprite)) return null;
    const res = S.resources[sd.sprite];
    if (!res) return h('div', { class: 'spr-missing' }, 'missing ' + sd.sprite.replace(/^Plugin\.resources\./, 'resources/').replace(/\./g, '/') + '.png');
    const el = h('div', { class: 'spr' });
    const m = sd.visualMargins || {};
    const L = Number(m.left) || 0, T = Number(m.top) || 0, R = Number(m.right) || 0, B = Number(m.bottom) || 0;
    const url = `url("${res.uri}")`;
    if (!ignoreMargins && (L || T || R || B)) {
      Object.assign(el.style, {
        borderStyle: 'solid', borderWidth: `${T}px ${R}px ${B}px ${L}px`,
        borderImage: `${url} ${T} ${R} ${B} ${L} fill / ${T}px ${R}px ${B}px ${L}px ${sd.isTiling ? 'round' : 'stretch'}`
      });
    } else if (sd.isTiling) {
      Object.assign(el.style, { backgroundImage: url, backgroundRepeat: 'repeat', backgroundSize: `${res.w}px ${res.h}px` });
    } else {
      Object.assign(el.style, { backgroundImage: url, backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%' });
      const tint = colourOf(sd, null);
      if (isNonWhite(tint)) {
        const ov = h('div', { class: 'spr-tint' });
        Object.assign(ov.style, { background: tint, webkitMaskImage: url, maskImage: url, webkitMaskSize: '100% 100%', maskSize: '100% 100%' });
        el.append(ov);
      }
    }
    const tf = [];
    if (sd.isFlippedHorizontally) tf.push('scaleX(-1)');
    if (sd.isFlippedVertical) tf.push('scaleY(-1)');
    const deg = typeof sd.rotationDegrees === 'number' ? sd.rotationDegrees : typeof sd.rotationRadians === 'number' ? sd.rotationRadians * 180 / Math.PI : 0;
    if (deg) tf.push(`rotate(${deg}deg)`);
    if (tf.length) el.style.transform = tf.join(' ');
    if (typeof sd.alpha === 'number') el.style.opacity = String(Math.max(0, Math.min(1, sd.alpha)));
    return el;
  }
  const hasMargins = m => m && ['left', 'top', 'right', 'bottom'].some(k => Number(m[k]));

  // ---------------------------------------------------------------- warnings
  const STYLED = new Set(['GroupBox', 'Button']);
  const LAYOUT = new Set(['Layer', 'Grid', 'Panel', 'PagedLayer', 'Carousel', 'PagedCarousel', 'CutsceneLayer', 'RadioGroup']);
  function warningsFor(c) {
    const w = [];
    if (c.root) return w;
    if (!c.sizeSet) w.push('Size never set, so it has no area in-game (use SetSize).');
    else if (c.w <= 0 || c.h <= 0) w.push(`Resolves to ${fmt(c.w)}×${fmt(c.h)}, so nothing will be visible.`);
    if (c.type === 'Text' && !c.props.font) w.push('No font set: the text is invisible in-game (set .font = id.Font.…).');
    if (STYLED.has(c.type) && !c.props.stylesheetID) w.push('No stylesheetID: drawn invisible in-game (e.g. id.StyleSheet.DEFAULT).');
    const st = resolveSheet(c.props.stylesheetID);
    if (st && st.orphan) w.push(`Stylesheet ${st.chain[0]} has no built-in parent, so it only has the values you set (set .parent = ui.StyleSheets[id.StyleSheet.…]).`);
    if (c.type === 'Sprite' && hasMargins(c.props.visualMargins)) w.push('ui.Sprite ignores visualMargins (per the docs), so it stretches. Use a Button/GroupBox sprite for 9-slice.');
    for (const sd of [c.props, c.props.sprite, c.props.contentBackgroundSprite, c.props.headerBackgroundSprite]) {
      const name = sd && typeof sd.sprite === 'string' ? sd.sprite : null;
      if (!name || !/^Plugin\.resources\./.test(name)) continue;
      const res = S.resources[name];
      if (!res) w.push('Missing resource ' + name.replace(/^Plugin\.resources\./, 'resources/').replace(/\./g, '/') + '.png');
      else if (res.w > 1024 || res.h > 1024) w.push(`${res.file} is ${res.w}×${res.h}; images are limited to 1024×1024.`);
    }
    const p = S.byId.get(c.parent);
    if (p && c.w > 0 && c.h > 0 && (c.x + c.w <= p.x || c.y + c.h <= p.y || c.x >= p.x + p.w || c.y >= p.y + p.h))
      w.push('Completely outside its parent.');
    return w;
  }

  // ---------------------------------------------------------------- drawing
  function chrome(W, H) {
    const box = (cls, x, y, w, hh, label) => h('div', { class: 'chrome ' + cls, style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' } }, label || '');
    const els = [];
    for (let i = 0; i < 9; i++) els.push(box('slot', 8 + i * 42, 8, 38, 38));
    els.push(h('div', { class: 'chrome-note', style: { left: '8px', top: '50px' } }, 'ribbon'));
    els.push(box('minimap', W - 196, 12, 180, 180, 'minimap'));
    els.push(box('', 8, H - 236, Math.min(520, W * 0.36), 228, 'chat'));
    const slots = 14, sw = 44, bw = slots * sw + 16;
    const bx = Math.round((W - bw) / 2);
    els.push(box('', bx, H - 64, bw, 56));
    for (let i = 0; i < slots; i++) els.push(box('slot', bx + 8 + i * sw, H - 58, 40, 40));
    els.push(h('div', { class: 'chrome-note', style: { right: '8px', bottom: '8px' } }, 'mock client, positions approximate'));
    return h('div', { class: 'client-chrome' }, els);
  }

  /** Game sprites aren't available to the preview, so draw them by what their name says they are. */
  function gameSpriteClass(name) {
    const n = name.replace(/^id\.Sprite\./, '');
    const rules = [
      [/CLOSE_(NML|OVR|ACTIVE)|BTN_MODAL_WINDOW.*CLOSE/, 'gs-close'],
      [/TITLE|CLOSE_CORNER/, 'gs-title'],
      [/POSITIVE/, 'gs-btn-pos'], [/NEGATIVE/, 'gs-btn-neg'], [/BTN_MAIN/, 'gs-btn'],
      [/SCROLLBAR_DRAGGER_V2_[012]$/, 'gs-thumb'], [/SCROLLBAR/, 'gs-track'],
      [/SLIDER_BAR_BACKING/, 'gs-track'], [/SLIDER_BAR/, 'gs-thumb'],
      [/TAB_CURRENT/, 'gs-tab-on'], [/TAB_/, 'gs-tab'],
      [/SLOT/, 'gs-slot'], [/CHECKBOX_SMALL_[245]$|RADIO.*(ON|SELECTED)/, 'gs-check-on'], [/CHECKBOX|RADIO/, 'gs-check'],
      [/CONTENT_TILE|BACKGROUND|_BG/, 'gs-fill'],
      [/WINDOW|FRAME|BORDER|CORNER|SIDE|EDGE|DIVIDER|LINE/, 'gs-frame'],
      [/ICON|BTN_|ARROW|INCREASE|DECREASE|ACCORDION/, 'gs-icon'],
      [/INPUT/, 'gs-input']
    ];
    for (const [re, cls] of rules) if (re.test(n)) return cls;
    return 'gs-other';
  }

  function visual(c) {
    const p = c.props;
    const el = h('div', { class: 'c', 'data-id': c.id });
    Object.assign(el.style, { left: c.x + 'px', top: c.y + 'px', width: Math.max(0, c.w) + 'px', height: Math.max(0, c.h) + 'px' });
    if (typeof p.alpha === 'number' && c.type !== 'Text') el.style.opacity = String(Math.max(0, Math.min(1, p.alpha)));
    if (p.hidden === true) el.classList.add('hidden-c');
    if (c.hooks.length) el.classList.add('hooked');
    if (!c.root && (c.w <= 0 || c.h <= 0)) el.classList.add('zero');

    switch (c.type) {
      case 'Root':
        if (c.kind === 'game') { el.style.pointerEvents = 'none'; return el; }
        el.classList.add('root-window');
        el.append(h('div', { class: 'window-title' }, S.pluginName || 'Plugin', h('span', { class: 'approx' }, c.title + ' · size/position approximate')));
        return el;
      case 'GroupBox': {
        if (!p.stylesheetID) { el.classList.add('ghost'); el.append('GroupBox (no stylesheet)'); return el; }
        const bg = spriteEl(p.contentBackgroundSprite);
        if (bg) el.append(bg); else el.classList.add('rs-panel');
        const hh = p.headerHeight == null ? 26 : Number(p.headerHeight) || 0;
        if (hh > 0) {
          const head = h('div', { class: 'rs-header', style: { height: hh + 'px' } });
          const hbg = spriteEl(p.headerBackgroundSprite);
          if (hbg) { head.style.background = 'none'; head.append(hbg); }
          head.append(h('span', { style: { position: 'relative' } }, textOf(p.headerText && p.headerText.content)));
          if (p.headerText) applyFont(head, p.headerText.font);
          el.append(head);
        }
        return el;
      }
      case 'Button': {
        const t = p.text || {};
        const label = textOf(p.label) || textOf(t.content);
        if (!p.stylesheetID) { el.classList.add('ghost'); el.append('Button (no stylesheet) ' + label); return el; }
        el.classList.add('rs-button');
        if (S.pressed === c.id) el.classList.add('pressed');
        const art = spriteEl(p.sprite);
        if (art) { el.classList.add('has-art'); el.append(art); } else styleButton(el, resolveSheet(p.stylesheetID));
        applyFont(el, t.font || 'MUSEO_SANS_13PT');
        el.style.color = colourOf(t, '') || '';
        el.append(h('span', { class: 'lbl' }, label));
        return el;
      }
      case 'Text': {
        el.classList.add('txt');
        if (!p.font) el.classList.add('nofont');
        applyFont(el, p.font);
        applyAlign(el, p);
        el.style.color = colourOf(p, '#ffffff');
        if (typeof p.alpha === 'number') el.style.opacity = String(p.alpha);
        if (p.isShadowed) el.style.textShadow = '1px 1px 0 ' + (typeof p.shadowRGBA === 'number' ? hexColour(p.shadowRGBA, true) : '#000');
        el.append(h('span', {}, textOf(p.content) || (p.associatedObjectID != null ? '[object ' + p.associatedObjectID + ' name]' : '')));
        return el;
      }
      case 'Rectangle': {
        const col = colourOf(p, '#ffffff');
        if (p.fill) el.style.background = col;
        else el.style.boxShadow = `inset 0 0 0 ${Math.max(1, Math.abs(Number(p.outlineThickness) || 1))}px ${col}`;
        return el;
      }
      case 'Line': {
        const col = colourOf(p, '#ffffff');
        const sw = Number(p.width) || 1;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
        svg.style.overflow = 'visible';
        const ln = document.createElementNS(ns, 'line');
        const inv = !!p.invert;
        ln.setAttribute('x1', '0'); ln.setAttribute('y1', inv ? String(c.h) : '0');
        ln.setAttribute('x2', String(c.w)); ln.setAttribute('y2', inv ? '0' : String(c.h));
        ln.setAttribute('stroke', col); ln.setAttribute('stroke-width', String(sw));
        svg.append(ln); el.append(svg);
        return el;
      }
      case 'Check': {
        const t = p.text || {};
        el.classList.add('check');
        applyFont(el, t.font || 'MUSEO_SANS_13PT');
        const right = /RIGHT|INVERTED/.test(String(p.alignment || ''));
        const box = h('span', { class: 'box' }, p.value ? '✓' : '');
        const lab = h('span', {}, textOf(p.label) || textOf(t.content));
        if (right) el.append(box, lab); else el.append(lab, box);
        return el;
      }
      case 'Slider': {
        el.classList.add('slider');
        const setup = c.calls.Setup || [];
        const max = Number(setup[0]) || 10;
        const val = Number(p.value ?? setup[1] ?? 0);
        const thumb = h('div', { class: 'thumb', style: { left: (Math.max(0, Math.min(1, val / max)) * 100) + '%' } });
        el.append(h('div', { class: 'track' }, thumb));
        return el;
      }
      case 'InputField': {
        el.classList.add('input');
        applyFont(el, (p.text && p.text.font) || 'MUSEO_SANS_13PT');
        const v = textOf(p.content);
        el.append(v ? h('span', {}, v) : h('span', { class: 'empty' }, textOf(p.emptyText) || 'input'));
        return el;
      }
      case 'ComboField': {
        // closed combo box: the selected (or first) entry and an arrow
        el.classList.add('listbox', 'combo');
        const names = Array.isArray(p.entries) ? p.entries.map(e => typeof e === 'object' && e ? (e.text || e.name || e.label || '') : String(e))
          : p.entries && typeof p.entries === 'object' ? Object.keys(p.entries) : [];
        const byValue = p.entries && !Array.isArray(p.entries) && typeof p.entries === 'object' ? Object.keys(p.entries).find(k => p.entries[k] === p.value) : null;
        el.append(h('span', { class: 'combo-text' }, textOf(byValue || names[0] || '') || '(no entries)'), h('span', { class: 'combo-arrow' }, '\u25be'));
        return el;
      }
      case 'List': {
        el.classList.add('listbox');
        // a list, or a name -> ID map (SetEntries({ A = 1 }))
        const entries = Array.isArray(p.entries) ? p.entries : p.entries && typeof p.entries === 'object' ? Object.keys(p.entries) : [];
        if (!entries.length) el.append(h('div', { style: { opacity: .5 } }, c.type + ' (no entries)'));
        for (const e of entries.slice(0, 40)) {
          const label = typeof e === 'object' && e ? (e.text || e.name || e.label || e.content || JSON.stringify(e)) : String(e);
          el.append(h('div', {}, textOf(label)));
        }
        return el;
      }
      case 'Sprite': case 'Model': case 'ModelGroup': case 'Canvas': case 'RadialProgressOverlay': {
        if (c.type === 'Sprite') { const art = spriteEl(p, true); if (art) { el.append(art); return el; } }
        if (c.type === 'Sprite' && p.associatedObjectID != null && p.associatedObjectID !== '') {
          // an item (ItemSlot): no game art in the preview, so show its name
          const raw = String(p.associatedObjectID).replace(/^config\.Obj\./, '').replace(/\.id$/, '');
          const name = /^\d+$/.test(raw) ? 'item ' + raw : raw.toLowerCase().replace(/_/g, ' ').replace(/^./, ch => ch.toUpperCase());
          el.classList.add('gs', 'gs-item');
          el.title = 'Item: ' + name + ' (drawn as its name; no game art in the preview)';
          el.append(h('span', { class: 'item-name' }, name));
          const q = Number(p.associatedObjectQuantity);
          if (q > 1) el.append(h('span', { class: 'item-qty' }, String(q)));
          return el;
        }
        if (c.type === 'Sprite' && p.spriteID == null && p.sprite == null && p.associatedObjectID == null) {
          // nothing to draw yet (an empty slot, an overlay waiting for art): outline only, no label
          el.classList.add('spr-empty');
          return el;
        }
        if (c.type === 'Sprite' && typeof p.spriteID === 'string' && /^id\.Sprite\./.test(p.spriteID)) {
          el.classList.add('gs', gameSpriteClass(p.spriteID));
          el.title = p.spriteID.replace(/^id\.Sprite\./, '') + ' (game sprite, drawn approximately)';
          return el;
        }
        el.classList.add('placeholder');
        const what = p.associatedObjectID != null ? 'obj ' + p.associatedObjectID : p.sprite != null ? 'sprite ' + p.sprite : '';
        el.append(c.type + (what ? '\n' + what : ''));
        el.style.whiteSpace = 'pre';
        return el;
      }
      default:
        el.classList.add('layout');
        return el;
    }
  }

  function drawOrder() {
    const out = [];
    const walk = id => {
      const c = S.byId.get(id);
      if (!c) return;
      out.push(c);
      for (const k of c.children) walk(k);
    };
    for (const r of S.data.roots) walk(r);
    return out;
  }

  // Components that belong to a scene in the Window menu, with its top-level components.
  function sceneSet(scene) {
    const ids = new Set();
    for (const c of S.data.comps) {
      if (c.root && c.kind === 'game') continue;
      if (c.scene === scene) ids.add(c.id);
    }
    // keep whole subtrees together even if a child was created by a later hook
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of S.data.comps) if (!ids.has(c.id) && ids.has(c.parent)) { ids.add(c.id); grew = true; }
    }
    const tops = [...ids].filter(id => !ids.has(S.byId.get(id).parent));
    return { ids, tops };
  }
  function subtree(id) {
    const ids = new Set([id]);
    const walk = c => { for (const k of c.children) { const kc = S.byId.get(k); if (kc) { ids.add(k); walk(kc); } } };
    walk(S.byId.get(id));
    return ids;
  }
  /** A scene's separate windows (its top-level components with a size), each with a stable key and a label. */
  function sceneWindows(scene) {
    const { tops } = sceneSet(scene);
    const sized = tops.map(id => S.byId.get(id)).filter(c => c && c.w > 0 && c.h > 0);
    // a window has some size and a title or text; small unlabelled pieces (a library's scrollbar or
    // overlay layers) join the window created by the same line of code
    const isWindow = c => c.w >= 60 && c.h >= 40 && !!windowText(c);
    const wins = sized.filter(isWindow);
    if (wins.length < 2) return [];
    const extras = new Map(wins.map(w => [w.id, []]));
    for (const c of sized) {
      if (isWindow(c)) continue;
      const owner = wins.filter(w => w.file === c.file && w.line === c.line)
        .sort((a, b) => Math.abs(a.id - c.id) - Math.abs(b.id - c.id))[0];
      if (owner) extras.get(owner.id).push(c.id);
    }
    const seen = new Map();
    return wins.map(c => {
      const label = windowLabel(c);
      const base = (c.file || '') + ':' + (c.line || '') + '#' + label;
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      return { id: c.id, extra: extras.get(c.id), key: base + (n > 1 ? '#' + n : ''), label };
    });
  }
  function windowText(c) {
    const p = c.props || {};
    const own = textOf(p.headerText && p.headerText.content) || textOf(p.label) || textOf(p.content);
    if (own) return own;
    for (const id of [...subtree(c.id)].sort((a, b) => a - b)) {
      const k = S.byId.get(id);
      const t = textOf(k.props.headerText && k.props.headerText.content) || (k.type === 'Text' ? textOf(k.props.content) : '');
      if (t) return t;
    }
    return '';
  }
  /** The window's title: a header, or the first text inside it (in creation order). */
  function windowLabel(c) {
    return windowText(c) || `${c.type} ${fmt(c.w)}×${fmt(c.h)}`;
  }

  // Components that belong to the window chosen in the Window menu: a whole scene, or one of its windows.
  function focusSet() {
    const f = sceneSet(S.state.sceneId);
    f.all = f.ids;
    if (S.state.windowKey) {
      const w = sceneWindows(S.state.sceneId).find(x => x.key === S.state.windowKey);
      if (w) {
        f.ids = subtree(w.id);
        for (const x of w.extra || []) for (const id of subtree(x)) f.ids.add(id);
        f.tops = [w.id, ...(w.extra || [])];
        f.window = w;
      }
    }
    return f;
  }

  function focusBounds(f) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const hiddenUnder = c => { for (let k = c; k; k = S.byId.get(k.parent)) if (k.props && k.props.hidden === true) return true; return false; };
    for (const id of f.ids) {
      const c = S.byId.get(id);
      if (c.w <= 0 && c.h <= 0) continue;
      if (hiddenUnder(c)) continue; // hidden parts (e.g. an unused scrollbar) don't stretch the view
      const top = c.root ? c.y - 28 : c.y; // window title bar
      x1 = Math.min(x1, c.x); y1 = Math.min(y1, top);
      x2 = Math.max(x2, c.x + Math.max(c.w, 0)); y2 = Math.max(y2, c.y + Math.max(c.h, 0));
    }
    if (!isFinite(x1)) return null;
    const pad = 32;
    return { x: x1 - pad, y: y1 - pad, w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2 };
  }

  const world = h('div', { class: 'world' });
  const emptyMsg = h('div', { class: 'isolated-empty' });

  function drawScreen() {
    if (!S.data) return;
    const { screenW: W, screenH: H } = S.cfg;
    const isolated = S.state.viewMode === 'window';
    world.replaceChildren();
    screen.replaceChildren(world);
    let order = drawOrder();
    S.view = { x: 0, y: 0, w: W, h: H };
    if (isolated) {
      const f = focusSet();
      order = order.filter(c => f.ids.has(c.id));
      const b = focusBounds(f);
      if (b) S.view = b;
      else {
        S.view = { x: 0, y: 0, w: 480, h: 200 };
        emptyMsg.textContent = f.ids.size
          ? 'This window has components, but none of them has a size yet.'
          : 'This window draws nothing yet.';
        screen.append(emptyMsg);
      }
      S.focus = f;
    } else {
      S.focus = null;
      if (S.state.showClient) world.append(chrome(W, H));
      // one window picked: hide the scene's other windows, keep everything else
      if (S.state.windowKey) {
        const f = focusSet();
        if (f.window) order = order.filter(c => !f.all.has(c.id) || f.ids.has(c.id));
      }
    }
    Object.assign(screen.style, { width: S.view.w + 'px', height: S.view.h + 'px' });
    Object.assign(world.style, { width: W + 'px', height: H + 'px', transform: `translate(${-S.view.x}px, ${-S.view.y}px)` });
    for (const c of order) world.append(visual(c));
    world.append(hoverBox, selBox);
    markClasses();
    layoutStage();
  }

  function fitZoom() {
    const v = S.view || { w: S.cfg.screenW, h: S.cfg.screenH };
    return Math.max(0.1, Math.min((stageWrap.clientWidth - 24) / v.w, (stageWrap.clientHeight - 24) / v.h, 2));
  }
  function layoutStage() {
    if (!S.data) return;
    const v = S.view || { w: S.cfg.screenW, h: S.cfg.screenH };
    const W = v.w, H = v.h;
    let z = Number(S.zoom);
    if (!(z > 0)) {
      const aw = stageWrap.clientWidth - 24, ah = stageWrap.clientHeight - 24;
      const maxZ = 2;
      z = Math.max(0.1, Math.min(aw / W, ah / H, maxZ));
    }
    S.z = z;
    syncHint();
    // show the real zoom in the menu: Fit (63%)
    const fitOpt = zoomSel.querySelector('option[value="fit"]');
    if (fitOpt) fitOpt.textContent = 'Fit (' + Math.round((!(Number(S.zoom) > 0) ? z : fitZoom()) * 100) + '%)';
    zoomSel.dataset.zoom = String(Math.round(z * 100));
    screen.style.transform = `scale(${z})`;
    Object.assign(stageOuter.style, { width: W * z + 'px', height: H * z + 'px' });
  }

  const hoverBox = h('div', { class: 'hl hover-box' }, h('span', { class: 'hl-label' }));
  const selBox = h('div', { class: 'hl sel-box' }, h('span', { class: 'hl-label' }));
  function placeBox(box, id) {
    const c = id != null && S.byId.get(id);
    if (!c || (c.root && c.kind === 'game')) { box.style.display = 'none'; return; }
    Object.assign(box.style, { display: 'block', left: c.x + 'px', top: c.y + 'px', width: Math.max(2, c.w) + 'px', height: Math.max(2, c.h) + 'px' });
    const z = S.z || 1;
    const lab = box.firstChild;
    lab.textContent = (c.root ? 'Window' : c.type) + ' ' + fmt(c.w) + '×' + fmt(c.h);
    lab.style.transform = `scale(${1 / z})`;
    lab.style.transformOrigin = '0 100%';
    box.style.outlineWidth = (2 / z) + 'px';
  }
  function markClasses() {
    for (const el of screen.querySelectorAll('.c')) {
      const id = Number(el.dataset.id);
      const c = S.byId.get(id);
      el.classList.toggle('cursor-line', !!(S.cursor && c && c.file === S.cursor.file && c.line === S.cursor.line));
    }
    placeBox(selBox, S.sel);
    placeBox(hoverBox, S.hover !== S.sel ? S.hover : null);
    for (const row of treeBox.querySelectorAll('.row')) {
      const id = Number(row.dataset.id);
      const c = S.byId.get(id);
      row.classList.toggle('sel', id === S.sel);
      row.classList.toggle('cursor-line', !!(S.cursor && c && c.file === S.cursor.file && c.line === S.cursor.line));
    }
  }

  // ---------------------------------------------------------------- tree / props / output
  function describe(c) {
    const p = c.props;
    if (c.root) return c.title;
    const t = textOf(p.label) || textOf(p.content) || textOf(p.text && p.text.content) || textOf(p.headerText && p.headerText.content);
    return t ? '"' + (t.length > 28 ? t.slice(0, 27) + '…' : t) + '"' : `${fmt(c.w)}×${fmt(c.h)}`;
  }

  function drawTree() {
    const mk = id => {
      const c = S.byId.get(id);
      if (!c) return null;
      const warns = warningsFor(c);
      const row = h('div', {
        class: 'row' + (c.root ? ' root' : ''), 'data-id': id, title: c.file ? c.file + ':' + c.line : '',
        onclick: e => { e.stopPropagation(); select(id, true); },
        onmouseenter: () => setHover(id), onmouseleave: () => setHover(null)
      },
      h('span', { class: 't' }, c.root ? (c.kind === 'game' ? 'Game window' : 'Window') : c.type),
      h('span', { class: 'd' }, describe(c)),
      warns.length ? h('span', { class: 'w', title: warns.join('\n') }, '⚠') : null,
      c.hooks.length ? h('span', { class: 'd', title: c.hooks.map(x => x.name).join('\n') }, '⚡') : null);
      const kids = c.children.map(mk).filter(Boolean);
      return h('li', {}, row, kids.length ? h('ul', {}, kids) : null);
    };
    const topIds = S.state.viewMode === 'window' && S.focus ? S.focus.tops : S.data.roots;
    const items = topIds.map(mk).filter(Boolean);
    treeBox.replaceChildren(h('ul', { class: 'tree' }, items));
    treeCount.textContent = String(S.data.comps.filter(c => !c.root && (!S.focus || S.focus.ids.has(c.id))).length);
  }

  function specPos(c) {
    const p = c.pos || {};
    const parts = [String(p.x ?? 0)];
    if (p.px) parts.push(`${fmt(p.px)}×parent`);
    if (p.sx) parts.push(`${fmt(p.sx)}×self`);
    const partsY = [String(p.y ?? 0)];
    if (p.py) partsY.push(`${fmt(p.py)}×parent`);
    if (p.sy) partsY.push(`${fmt(p.sy)}×self`);
    return `x = ${parts.join(' + ')}, y = ${partsY.join(' + ')}`;
  }
  function specSize(c) {
    const s = c.size || {};
    const w = [String(s.w ?? 0)]; if (s.pw) w.push(`${fmt(s.pw)}×parent`);
    const hh = [String(s.h ?? 0)]; if (s.ph) hh.push(`${fmt(s.ph)}×parent`);
    return `w = ${w.join(' + ')}, h = ${hh.join(' + ')}`;
  }
  function flatProps(obj, prefix, out) {
    for (const [k, v] of Object.entries(obj || {})) {
      if (k.startsWith('__call_')) continue;
      const key = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v) && !('$comp' in v)) {
        if (typeof v.x === 'number' && typeof v.y === 'number') out.push([key, `(${['x', 'y', 'z', 'w'].filter(a => typeof v[a] === 'number').map(a => fmt(v[a])).join(', ')})`]);
        else flatProps(v, key, out);
      } else if (Array.isArray(v)) out.push([key, `[${v.length} items]`]);
      else if (v && typeof v === 'object') out.push([key, 'component #' + v.$comp]);
      else out.push([key, String(v)]);
    }
    return out;
  }

  function drawProps() {
    const c = S.byId.get(S.sel);
    if (!c) {
      propsBox.replaceChildren(h('div', { class: 'empty-note' },
        'Select a component on the screen or in the tree.', h('br'), h('br'),
        'Pick a window from the Window menu. To add your own pop-up, put ', h('code', {}, '---@preview My popup'),
        ' above a top-level function that builds it.'));
      return;
    }
    const rows = [
      ['Screen rect', `${fmt(c.x)}, ${fmt(c.y)} · ${fmt(c.w)} × ${fmt(c.h)}`],
    ];
    if (!c.root) {
      const par = S.byId.get(c.parent);
      if (par) rows.push(['Local pos', `${fmt(c.x - par.x)}, ${fmt(c.y - par.y)}`]);
      rows.push(['Position', c.posSet ? specPos(c) : 'not set (0, 0)']);
      rows.push(['Size', c.sizeSet ? specSize(c) : 'not set (0 × 0)']);
    }
    const st = resolveSheet(c.props.stylesheetID);
    if (st) {
      rows.push(['Style chain', st.chain.map(k => k.replace(/^id\.StyleSheet\./, '')).join(' → ') + (st.orphan ? ' (no built-in parent)' : '')]);
      for (const [k, v] of Object.entries(st.values)) rows.push(['style ' + k, /rgb$/.test(k) && typeof v === 'number' ? '0x' + v.toString(16).toUpperCase().padStart(6, '0') : String(v)]);
    }
    for (const [k, v] of flatProps(c.props, '', [])) rows.push([k, v]);
    for (const [k, v] of Object.entries(c.calls || {})) rows.push([k + '()', JSON.stringify(v)]);
    const warns = warningsFor(c);
    propsBox.replaceChildren(...[
      h('div', { class: 'title' }, c.root ? c.title : 'ui.' + c.type, h('span', { style: { opacity: .6, fontWeight: 400 } }, '#' + c.id),
        c.file ? h('a', { onclick: () => vscode.postMessage({ type: 'reveal', file: c.file, line: c.line, focus: true }) }, c.file + ':' + c.line) : null),
      warns.map(w => h('div', { class: 'warnline' }, '⚠ ' + w)),
      c.hooks.length ? h('div', { class: 'actions' }, c.hooks.map(hk =>
        h('button', { class: 'primary', title: (hk.file || '') + ':' + (hk.line || ''), onclick: () => fire(c.id, hk.name) }, '▶ ' + hk.name.replace(/^ui\.Hook\./, '')))) : null,
      h('table', {}, rows.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, v))))
    ].flat().filter(Boolean));
  }

  function drawOutput() {
    const logs = S.data.logs;
    const errs = logs.filter(l => l.kind === 'error').length;
    const warns = logs.filter(l => l.kind === 'warn').length;
    outBadges.replaceChildren(
      h('span', { class: 'badge err' }, errs ? `● ${errs} error${errs > 1 ? 's' : ''}` : ''), ' ',
      h('span', { class: 'badge warn' }, warns ? `▲ ${warns} warning${warns > 1 ? 's' : ''}` : ''), ' ',
      h('span', { class: 'badge' }, `${logs.length} line${logs.length === 1 ? '' : 's'}`));
    outList.replaceChildren(...(logs.length ? logs.map(l => h('div', { class: 'log ' + l.kind },
      h('span', { class: 'k' }, l.kind), h('span', {}, l.msg),
      l.file ? h('a', { class: 'where', onclick: () => vscode.postMessage({ type: 'reveal', file: l.file, line: l.line, focus: true }) }, l.file + ':' + l.line) : null))
      : [h('div', { class: 'log' }, h('span', { style: { opacity: .6 } }, 'No output. log() and print() calls appear here.'))]));
    if (errs && !S.logsOpen) { S.logsOpen = true; output.classList.remove('collapsed'); }
  }

  function drawToolbar() {
    // each scene, then its separate windows (known for the startup scene and the scene being shown)
    const picked = S.state.windowKey && sceneWindows(S.state.sceneId).some(w => w.key === S.state.windowKey) ? S.state.windowKey : null;
    sceneSel.replaceChildren(...S.scenes.flatMap(s => {
      const wins = s.id === 'game' || s.id === S.state.sceneId ? sceneWindows(s.id) : [];
      return [
        opt(s.id, s.label + (wins.length ? ` (all ${wins.length} windows)` : ''), s.id === S.state.sceneId && !picked),
        ...wins.map(w => opt(WIN_SEP + s.id + WIN_SEP + w.key, '\u00a0\u00a0\u21b3 ' + (w.label.length > 40 ? w.label.slice(0, 39) + '\u2026' : w.label),
          s.id === S.state.sceneId && picked === w.key))
      ];
    }));
    resSel.replaceChildren(...S.resolutions.map(r => opt(r, r.replace('x', ' × '), r === S.state.resolution)));
    scaleSel.replaceChildren(...[0.75, 1, 1.25, 1.5, 2].map(v => opt(String(v), `UI ${Math.round(v * 100)}%`, Number(S.state.uiScale) === v)));
    const layer = new Set(['ContentLayerReady', 'SettingsLayerReady']);
    const evs = S.data.subs.filter(s => !layer.has(s.name));
    evSel.replaceChildren(opt('', evs.length ? 'Fire event…' : 'No events subscribed', true), ...evs.map(e => opt(e.name, e.name)));
    evSel.disabled = !evs.length;
    const lib = S.library;
    libSwitch.classList.toggle('hidden', !lib || (!lib.uses && !lib.available));
    if (lib) {
      libInput.checked = !!lib.active;
      libInput.disabled = !lib.available;
      libSwitch.classList.toggle('disabled', !lib.available);
      libSwitch.title = !lib.available ? lib.error
        : (lib.active ? `${lib.name} ${lib.version || ''} is running and drawn (game sprites are approximate). Switch off for the base view.`
          : `Base view: ${lib.name} calls do nothing. Switch on to run ${lib.name} ${lib.version || ''} from your game client and draw it.`)
          + (lib.auto ? (lib.uses ? ' (On because plugin.json depends on it.)' : ' (Off because plugin.json does not depend on it.)') : ' (Set by you; matches plugin.json again when flipped back.)');
    }
    syncToolbar();
  }

  // ---------------------------------------------------------------- interaction
  function select(id, fromTree) {
    S.sel = id;
    persist();
    markClasses();
    drawProps();
    const c = S.byId.get(id);
    if (c && c.file && S.state.syncEditor) vscode.postMessage({ type: 'reveal', file: c.file, line: c.line, focus: false });
    if (!fromTree) {
      const row = treeBox.querySelector(`.row[data-id="${id}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    }
  }
  function setHover(id) {
    if (S.hover === id) return;
    S.hover = id;
    markClasses();
  }
  function fire(id, hook) {
    S.pressed = id;
    vscode.postMessage({ type: 'fireHook', id, hook });
    setTimeout(() => { S.pressed = null; }, 150);
  }
  function primaryHook(c) {
    if (!c || !c.hooks.length) return null;
    const pref = c.hooks.find(x => /PRESS|CLICK|CHECK|TOGGLE|SELECT/i.test(x.name));
    return (pref || c.hooks[0]).name;
  }
  function compAt(e) {
    const el = e.target.closest && e.target.closest('.c');
    if (!el) return null;
    let c = S.byId.get(Number(el.dataset.id));
    if (e.altKey && c && c.parent) c = S.byId.get(c.parent) || c;
    return c;
  }

  screen.addEventListener('click', e => {
    if (S.justDragged) { S.justDragged = false; return; }
    const c = compAt(e);
    if (!c) { S.sel = null; persist(); markClasses(); drawProps(); return; }
    if (S.state.interact) {
      // run the nearest component (or ancestor) that has a hook
      let k = c;
      while (k && !k.hooks.length) k = S.byId.get(k.parent);
      if (k) { fire(k.id, primaryHook(k)); return; }
    }
    select(c.id);
  });
  screen.addEventListener('dblclick', e => {
    const c = compAt(e);
    const hk = primaryHook(c);
    if (hk) fire(c.id, hk);
  });
  screen.addEventListener('mousemove', e => {
    const c = compAt(e);
    setHover(c && !c.root || (c && c.kind !== 'game') ? c.id : null);
    if (c) {
      tip.style.display = 'block';
      tip.textContent = `${c.root ? c.title : 'ui.' + c.type}  ${fmt(c.w)}×${fmt(c.h)} @ ${fmt(c.x)},${fmt(c.y)}` + (c.file ? `  ·  ${c.file}:${c.line}` : '');
      const r = tip.getBoundingClientRect();
      tip.style.left = Math.min(e.clientX + 14, window.innerWidth - r.width - 6) + 'px';
      tip.style.top = Math.min(e.clientY + 16, window.innerHeight - r.height - 6) + 'px';
    } else tip.style.display = 'none';
  });
  screen.addEventListener('mouseleave', () => { tip.style.display = 'none'; setHover(null); });
  window.addEventListener('resize', layoutStage);
  window.addEventListener('keydown', e => {
    if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target instanceof HTMLSelectElement)) {
      setView(S.state.viewMode === 'window' ? 'game' : 'window');
    }
    if (e.key === 'Escape') { S.sel = null; persist(); markClasses(); drawProps(); }
    if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowUp' && e.altKey && S.sel) { const c = S.byId.get(S.sel); if (c && c.parent && !S.byId.get(c.parent).root) select(c.parent); return; }
    const NUDGE = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (NUDGE[e.key] && S.sel && !S.state.interact) {
      e.preventDefault();
      const t = moveTarget(S.byId.get(S.sel));
      const k = e.shiftKey ? 10 : 1;
      if (t) requestMove(t, NUDGE[e.key][0] * k, NUDGE[e.key][1] * k);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '+' || e.key === '=') stepZoom(1);
    else if (e.key === '-' || e.key === '_') stepZoom(-1);
    else if (e.key === '0') setZoom('fit');
    else if (e.key === '1') setZoom('1');
  });

  // ---------------------------------------------------------------- zoom & pan
  function setZoom(z, cx, cy) {
    const before = stageOuter.getBoundingClientRect();
    const oldZ = S.z || 1;
    if (z !== 'fit') z = String(Math.max(0.1, Math.min(8, Number(z) || 1)));
    S.zoom = z;
    persist();
    syncZoomSel();
    layoutStage();
    // keep the point under the cursor (or the view centre) where it was
    const wr = stageWrap.getBoundingClientRect();
    if (cx == null) { cx = wr.left + wr.width / 2; cy = wr.top + wr.height / 2; }
    const px = (cx - before.left) / oldZ, py = (cy - before.top) / oldZ;
    const after = stageOuter.getBoundingClientRect();
    stageWrap.scrollLeft += after.left - (cx - px * S.z);
    stageWrap.scrollTop += after.top - (cy - py * S.z);
  }
  function stepZoom(dir, cx, cy) {
    const cur = S.z || 1;
    const next = dir > 0 ? ZOOMS.find(z => z > cur + 1e-6) : [...ZOOMS].reverse().find(z => z < cur - 1e-6);
    if (next) setZoom(next, cx, cy);
  }
  stageWrap.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return; // plain wheel scrolls
    e.preventDefault();
    setZoom((S.z || 1) * Math.pow(1.0015, -e.deltaY), e.clientX, e.clientY);
  }, { passive: false });
  let spaceDown = false;
  window.addEventListener('keydown', e => { if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) { spaceDown = true; stageWrap.classList.add('pan-ready'); e.preventDefault(); } });
  window.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; stageWrap.classList.remove('pan-ready'); } });

  // ---------------------------------------------------------------- drag to move
  /** What a drag moves: the outermost component whose position comes from the same line of your code. */
  function moveTarget(c) {
    let t = c;
    while (t && !t.root && !t.posAt) t = S.byId.get(t.parent);
    if (!t || t.root) return c && !c.root ? c : null;
    const key = k => k.posAt && k.posAt.file + ':' + k.posAt.line;
    for (let p = S.byId.get(t.parent); p && !p.root && key(p) === key(t); p = S.byId.get(p.parent)) t = p;
    return t;
  }
  function requestMove(t, dx, dy) {
    S.moveMsg = 'Moving ' + (t.type || 'component') + '…';
    syncHint();
    vscode.postMessage({ type: 'moveComp', id: t.id, dx, dy });
  }
  let drag = null;
  stageWrap.addEventListener('pointerdown', e => {
    const pan = e.button === 1 || (e.button === 0 && (spaceDown || !e.target.closest('.screen')));
    if (pan) {
      drag = { pan: true, x: e.clientX, y: e.clientY, sl: stageWrap.scrollLeft, st: stageWrap.scrollTop };
      stageWrap.setPointerCapture(e.pointerId);
      stageWrap.classList.add('panning');
      e.preventDefault();
      return;
    }
    if (e.button !== 0 || S.state.interact) return;
    const c = compAt(e);
    if (!c || c.root) return;
    drag = { pan: false, x: e.clientX, y: e.clientY, c, moving: false };
  });
  stageWrap.addEventListener('pointermove', e => {
    if (!drag) return;
    if (drag.pan) {
      stageWrap.scrollLeft = drag.sl - (e.clientX - drag.x);
      stageWrap.scrollTop = drag.st - (e.clientY - drag.y);
      return;
    }
    let dx = (e.clientX - drag.x) / (S.z || 1), dy = (e.clientY - drag.y) / (S.z || 1);
    if (!drag.moving) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 4) return;
      drag.moving = true;
      drag.t = moveTarget(drag.c);
      if (!drag.t) { drag = null; return; }
      const ids = new Set([drag.t.id]);
      const walk = k => { for (const id of k.children) { const kc = S.byId.get(id); if (kc) { ids.add(id); walk(kc); } } };
      walk(drag.t);
      drag.els = [...world.querySelectorAll('.c')].filter(el => ids.has(Number(el.dataset.id)));
      stageWrap.setPointerCapture(e.pointerId);
      select(drag.t.id);
    }
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; } // Shift: one axis
    drag.dx = Math.round(dx); drag.dy = Math.round(dy);
    for (const el of drag.els) el.style.transform = `translate(${drag.dx}px, ${drag.dy}px)`;
    S.moveMsg = `Move ${drag.t.type} by ${drag.dx}, ${drag.dy} (Shift: one axis) · release to update the code`;
    syncHint();
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    stageWrap.classList.remove('panning');
    if (d.pan || !d.moving) return;
    S.justDragged = true;
    setTimeout(() => { S.justDragged = false; }, 0);
    if (!d.dx && !d.dy) { for (const el of d.els) el.style.transform = ''; S.moveMsg = null; syncHint(); return; }
    requestMove(d.t, d.dx, d.dy);
  };
  stageWrap.addEventListener('pointerup', endDrag);
  stageWrap.addEventListener('pointercancel', endDrag);

  // ---------------------------------------------------------------- messages
  window.addEventListener('message', ev => {
    const m = ev.data;
    if (m.type === 'render') {
      S.resources = m.resources || {};
      S.library = m.library;
      S.data = m.data; S.scenes = m.scenes; S.state = m.state; S.cfg = m.cfg; S.resolutions = m.resolutions; S.pluginName = m.pluginName;
      S.byId = new Map(m.data.comps.map(c => [c.id, c]));
      if (S.sel && !S.byId.has(S.sel)) S.sel = null;
      drawToolbar(); drawScreen(); drawTree(); drawProps(); drawOutput(); markClasses();
    } else if (m.type === 'moveResult') {
      S.moveMsg = (m.ok ? '\u2713 ' : '\u2715 ') + m.msg;
      if (!m.ok) drawScreen(); // snap back
      syncHint();
      clearTimeout(S.moveTimer);
      S.moveTimer = setTimeout(() => { S.moveMsg = null; syncHint(); }, m.ok ? 3000 : 7000);
    } else if (m.type === 'cursor') {
      S.cursor = { file: m.file, line: m.line };
      markClasses();
    } else if (m.type === 'fatal') {
      screen.replaceChildren();
      propsBox.replaceChildren(h('div', { class: 'fatal' }, m.msg));
    }
  });
  syncToolbar();
  vscode.postMessage({ type: 'ready' });
})();
