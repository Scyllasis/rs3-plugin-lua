// RS3 UI Builder: drag parts from the palette onto a window, then move, resize and pin them.
// Pointer events rather than HTML drag and drop: they behave the same in every webview, and they
// keep working when the pointer leaves the canvas.
(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  const B = window.RS3Builder;
  const saved = vscode.getState() || {};

  const S = {
    design: null, sel: [], past: [], future: [], clip: null,
    zoom: saved.zoom || 1, grid: saved.grid || 8, snap: saved.snap !== false, showGrid: saved.showGrid !== false,
    tab: saved.tab || 'code', mock: [], notes: [], resources: [], hasPrettyUI: false, hasManifest: true,
    status: '', module: '', guides: [],
  };
  let D = null; // the drag in progress

  // ---------------------------------------------------------------- DOM helpers
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'style') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k in el && k !== 'list') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  }
  const $ = {};
  const persist = () => vscode.setState({ zoom: S.zoom, grid: S.grid, snap: S.snap, showGrid: S.showGrid, tab: S.tab });
  const post = m => vscode.postMessage(m);
  const css = hex => {
    const s = B.hexColour(hex, 'FFFFFFFF');
    return `rgba(${parseInt(s.slice(0, 2), 16)},${parseInt(s.slice(2, 4), 16)},${parseInt(s.slice(4, 6), 16)},${(parseInt(s.slice(6, 8), 16) / 255).toFixed(3)})`;
  };

  // ---------------------------------------------------------------- state changes
  const snapshot = () => JSON.stringify(S.design);
  function remember(before) {
    S.past.push(before === undefined ? snapshot() : before);
    if (S.past.length > 200) S.past.shift();
    S.future = [];
  }
  function changed() {
    B.enforceStyle(S.design);
    post({ type: 'change', design: S.design });
    renderAll();
  }
  function commit(fn) {
    remember();
    S.status = '';
    fn();
    changed();
  }
  function restore(from, to) {
    if (!from.length) return;
    to.push(snapshot());
    S.design = JSON.parse(from.pop());
    S.sel = S.sel.filter(id => B.find(S.design, id));
    changed();
  }
  const undo = () => restore(S.past, S.future);
  const redo = () => restore(S.future, S.past);
  const selected = () => S.sel.map(id => B.find(S.design, id)).filter(Boolean);
  function select(ids) {
    S.sel = ids;
    renderCanvasMarks();
    renderTree();
    renderProps();
  }

  // ---------------------------------------------------------------- geometry
  /** A component's rectangle in content coordinates, and the parent area it's measured against. */
  function geometry(id) {
    const content = B.contentSize(S.design);
    let found = null;
    const visit = (list, ox, oy, pw, ph) => {
      for (const c of list) {
        const r = B.resolve(c, pw, ph);
        const abs = { x: ox + r.x, y: oy + r.y, w: r.w, h: r.h };
        if (c.id === id) { found = { c, rel: r, abs, pw, ph, ox, oy }; return; }
        if (c.children) {
          const inner = B.innerSize(c, r);
          visit(c.children, abs.x, abs.y + inner.top, inner.w, inner.h);
          if (found) return;
        }
      }
    };
    visit(S.design.comps, 0, 0, content.w, content.h);
    return found;
  }
  const bounds = rects => {
    const x = Math.min(...rects.map(r => r.x)), y = Math.min(...rects.map(r => r.y));
    return { x, y, w: Math.max(...rects.map(r => r.x + r.w)) - x, h: Math.max(...rects.map(r => r.y + r.h)) - y };
  };
  const toContent = e => {
    const r = $.content.getBoundingClientRect();
    return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom };
  };
  const snapValue = (v, e) => (S.snap && !(e && e.altKey) ? Math.round(v / S.grid) * S.grid : Math.round(v));
  const overContent = e => {
    const r = $.content.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };
  /** The deepest container under the pointer that isn't being dragged. */
  function containerAt(e, skip) {
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      if (!el.classList || !el.classList.contains('comp') || !el.classList.contains('is-container')) continue;
      const id = el.dataset.id;
      if (skip.some(s => s === id || isInside(id, s))) continue;
      return id;
    }
    return null;
  }
  function isInside(id, ancestorId) {
    const top = B.find(S.design, ancestorId);
    let hit = false;
    if (top) B.walk(top.comp.children, c => { if (c.id === id) hit = true; });
    return hit;
  }
  function originOf(containerId) {
    if (!containerId) return { x: 0, y: 0, w: B.contentSize(S.design).w, h: B.contentSize(S.design).h, list: S.design.comps };
    const g = geometry(containerId), inner = B.innerSize(g.c, g.rel);
    return { x: g.abs.x, y: g.abs.y + inner.top, w: inner.w, h: inner.h, list: g.c.children };
  }

  /** Lines up a moving box with what's around it. Returns the shift, and guide lines to draw. */
  function smartSnap(box, ids, e) {
    if (e && e.altKey) return { dx: 0, dy: 0, lines: [] };
    const content = B.contentSize(S.design);
    const edgesX = [0, content.w / 2, content.w], edgesY = [0, content.h / 2, content.h];
    B.walk(S.design.comps, c => {
      if (ids.includes(c.id) || ids.some(i => isInside(c.id, i))) return;
      const g = geometry(c.id);
      edgesX.push(g.abs.x, g.abs.x + g.abs.w / 2, g.abs.x + g.abs.w);
      edgesY.push(g.abs.y, g.abs.y + g.abs.h / 2, g.abs.y + g.abs.h);
    });
    const closest = (points, edges) => {
      let best = null;
      for (const p of points) for (const edge of edges) {
        const d = edge - p;
        if (Math.abs(d) <= 5 / S.zoom && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, edge };
      }
      return best;
    };
    const bx = closest([box.x, box.x + box.w / 2, box.x + box.w], edgesX);
    const by = closest([box.y, box.y + box.h / 2, box.y + box.h], edgesY);
    const lines = [];
    if (bx) lines.push({ x: bx.edge });
    if (by) lines.push({ y: by.edge });
    return { dx: bx ? bx.d : null, dy: by ? by.d : null, lines };
  }

  // ---------------------------------------------------------------- drawing components
  function visual(c, rect) {
    const p = c.props;
    switch (c.type) {
      case 'Text': return h('div', { class: 'v-text', style: { color: css(p.rgba), textAlign: p.align === 'CENTRE' ? 'center' : p.align === 'BOTTOMRIGHT' ? 'right' : 'left',
        justifyContent: p.align === 'CENTRE' ? 'center' : p.align === 'BOTTOMRIGHT' ? 'flex-end' : 'flex-start', textShadow: p.shadow ? '1px 1px 0 #000' : '' } }, h('span', {}, p.text));
      case 'Button': return h('div', { class: 'v-button ' + (/POSITIVE/.test(p.style) ? 'positive' : /NEGATIVE/.test(p.style) ? 'negative' : '') + (S.design.style === 'prettyui' ? ' pretty' : '') }, p.text);
      case 'Check': return h('div', { class: 'v-check' }, h('i', { class: p.checked ? 'on' : '' }), h('span', {}, p.text));
      case 'InputField': return h('div', { class: 'v-input' }, p.text);
      case 'ComboField': {
        const entries = p.options.split('\n').map(s => s.trim()).filter(Boolean);
        return h('div', { class: 'v-input v-combo' }, h('span', {}, entries[p.selected - 1] || ''), h('b', {}, '▾'));
      }
      case 'Slider': {
        const pc = p.max ? Math.max(0, Math.min(1, p.value / p.max)) * 100 : 0;
        return h('div', { class: 'v-slider' + (S.design.style === 'prettyui' ? ' pretty' : '') }, h('i', {}), h('b', { style: { left: pc + '%' } }));
      }
      case 'Rectangle': return h('div', { class: 'v-rect', style: p.fill ? { background: css(p.rgba) } : { border: `${Math.max(1, Math.abs(p.thickness))}px solid ${css(p.rgba)}` } });
      case 'Sprite': return h('div', { class: 'v-sprite' }, p.resource ? p.resource.split('.').pop() : 'Image');
      case 'List': return h('div', { class: 'v-list' }, B.entriesOf(c).map(e => h('div', {}, e)));
      case 'RadioGroup': return h('div', { class: 'v-radio' }, B.entriesOf(c).map((e, i) => h('div', {}, h('i', { class: p.selected === i + 1 ? 'on' : '' }), h('span', {}, e))));
      case 'Carousel': return h('div', { class: 'v-input v-carousel' }, h('b', {}, '‹'), h('span', {}, B.entriesOf(c)[p.selected - 1] || ''), h('b', {}, '›'));
      case 'Line': return h('div', { class: 'v-line', style: { background: css(p.rgba) } });
      case 'RadialProgressOverlay': return h('div', { class: 'v-ring', style: { background: `conic-gradient(#c9a94a ${p.max ? (p.value / p.max) * 360 : 0}deg, #2d2a25 0)` } });
      case 'Divider': return h('div', { class: 'v-divider' }, h('i', {}));
      case 'Spinner': return h('div', { class: 'v-spinner' });
      case 'ColourPicker': return h('div', { class: 'v-picker', style: { background: css(p.rgba) } });
      case 'KeybindField': return h('div', { class: 'v-input' }, 'Set a key');
      case 'ItemSlot': return h('div', { class: 'v-slot' }, p.item ? String(p.item) : '');
      case 'GroupBox': return h('div', { class: 'v-group' }, h('div', { class: 'v-group-head' }, p.text));
      default: return h('div', { class: 'v-layer' }, rect.w > 60 ? c.name : '');
    }
  }
  function compEl(c, pw, ph) {
    const r = B.resolve(c, pw, ph);
    const el = h('div', { class: 'comp t-' + c.type + (c.children ? ' is-container' : ''), 'data-id': c.id,
      style: { left: r.x + 'px', top: r.y + 'px', width: Math.max(1, r.w) + 'px', height: Math.max(1, r.h) + 'px' } }, visual(c, r));
    if (c.children) {
      const inner = B.innerSize(c, r);
      el.append(h('div', { class: 'holder', style: { top: inner.top + 'px', height: inner.h + 'px' } }, c.children.map(k => compEl(k, inner.w, inner.h))));
    }
    return el;
  }

  // ---------------------------------------------------------------- render
  function renderCanvas() {
    const host = S.design.host, size = B.contentSize(S.design), head = B.HEADER_HEIGHT[host.kind];
    $.host.className = 'host kind-' + host.kind;
    Object.assign($.host.style, { width: host.w + 'px', height: host.h + 'px' });
    $.title.style.display = head ? '' : 'none';
    $.title.style.height = head + 'px';
    $.titleText.textContent = host.title;
    Object.assign($.content.style, { top: head + 'px', width: size.w + 'px', height: size.h + 'px',
      backgroundSize: `${S.grid}px ${S.grid}px` });
    $.content.classList.toggle('with-grid', S.showGrid);
    $.parts.replaceChildren(...S.design.comps.map(c => compEl(c, size.w, size.h)));
    $.canvas.style.transform = `scale(${S.zoom})`;
    $.canvas.style.width = host.w + 'px';
    $.canvas.style.height = host.h + 'px';
    $.sizer.style.width = (host.w * S.zoom + 96) + 'px';
    $.sizer.style.height = (host.h * S.zoom + 96) + 'px';
    renderCanvasMarks();
  }
  function renderCanvasMarks() {
    const boxes = [];
    const single = S.sel.length === 1;
    for (const id of S.sel) {
      const g = geometry(id);
      if (!g) continue;
      const handles = single ? ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(d => h('i', { class: 'handle ' + d, 'data-dir': d })) : [];
      boxes.push(h('div', { class: 'selbox', style: { left: g.abs.x + 'px', top: g.abs.y + 'px', width: g.abs.w + 'px', height: g.abs.h + 'px' } }, handles));
    }
    for (const line of S.guides) {
      boxes.push(h('div', { class: 'guide ' + (line.x != null ? 'v' : 'h'), style: line.x != null ? { left: line.x + 'px' } : { top: line.y + 'px' } }));
    }
    if (D && D.kind === 'marquee' && D.box) {
      boxes.push(h('div', { class: 'marquee', style: { left: D.box.x + 'px', top: D.box.y + 'px', width: D.box.w + 'px', height: D.box.h + 'px' } }));
    }
    $.marks.replaceChildren(...boxes);
  }
  function renderTree() {
    const rows = [];
    const add = (list, depth) => {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const c = list[i];
        rows.push(h('div', { class: 'tree-row' + (S.sel.includes(c.id) ? ' on' : ''), style: { paddingLeft: 6 + depth * 12 + 'px' }, 'data-tree': c.id, title: B.TYPES[c.type].label },
          h('span', { class: 'tree-name' }, c.name), h('span', { class: 'tree-type' }, B.TYPES[c.type].label)));
        if (c.children) add(c.children, depth + 1);
      }
    };
    add(S.design.comps, 0);
    $.tree.replaceChildren(...(rows.length ? rows : [h('p', { class: 'muted' }, 'Drag a part onto the window.')]));
  }

  function field(label, input, hint) {
    return h('label', { class: 'field' }, h('span', {}, label), input, hint ? h('small', {}, hint) : null);
  }
  function input(value, apply, attrs) {
    return h('input', Object.assign({ value: value == null ? '' : value, onchange: e => apply(e.target.value) }, attrs));
  }
  const numberInput = (value, apply) => input(value, v => { if (v !== '' && Number.isFinite(Number(v))) apply(Math.round(Number(v))); else renderProps(); }, { type: 'number' });
  const checkbox = (value, apply) => h('input', { type: 'checkbox', checked: !!value, onchange: e => apply(e.target.checked) });
  function choice(value, options, apply) {
    const list = options.includes(value) ? options : [value, ...options];
    return h('select', { onchange: e => apply(e.target.value) }, list.map(o => h('option', { value: o, selected: o === value }, o)));
  }
  function colour(value, apply) {
    const text = input(value, v => apply(v), { spellcheck: false, maxLength: 8, 'aria-label': 'RGBA' });
    const pick = h('input', { type: 'color', value: '#' + value.slice(0, 6), onchange: () => apply(text.value),
      oninput: e => { text.value = e.target.value.slice(1).toUpperCase() + value.slice(6, 8); } });
    return h('div', { class: 'colour' }, pick, text);
  }

  function hostProps() {
    const host = S.design.host;
    const set = (key, value) => commit(() => { host[key] = value; });
    const pretty = S.design.style === 'prettyui';
    const kinds = pretty ? { Window: 'window', 'Layer only': 'layer' } : { 'Window (GroupBox)': 'groupbox', 'Layer only': 'layer' };
    const kindName = Object.keys(kinds).find(k => kinds[k] === host.kind);
    return [
      h('h3', {}, 'Window'),
      field('Kind', choice(kindName, Object.keys(kinds), v => set('kind', kinds[v]))),
      host.kind === 'layer' ? null : field('Title', input(host.title, v => set('title', v))),
      h('div', { class: 'grid2' },
        host.kind === 'layer' ? null : field('X', numberInput(host.x, v => set('x', v))),
        host.kind === 'layer' ? null : field('Y', numberInput(host.y, v => set('y', v))),
        field('Width', numberInput(host.w, v => set('w', Math.max(40, v)))),
        field('Height', numberInput(host.h, v => set('h', Math.max(40, v))))),
      host.kind === 'window' ? h('label', { class: 'tick' }, checkbox(host.resizable, v => set('resizable', v)), 'Can be resized') : null,
      h('p', { class: 'muted' }, host.kind === 'groupbox' ? 'Plain windows stay where they\'re put: moving them is code you\'d add yourself.' : 'Pick a part to edit it. Drag on the empty window to select several.'),
    ];
  }

  function compProps(c) {
    const g = geometry(c.id), t = B.TYPES[c.type], p = c.props;
    const set = fn => commit(fn);
    const prop = (key, value) => set(() => { p[key] = value; });
    const pinH = c.fillW ? 'Stretch' : { start: 'Left', center: 'Centre', end: 'Right' }[c.ax];
    const pinV = c.fillH ? 'Stretch' : { start: 'Top', center: 'Middle', end: 'Bottom' }[c.ay];
    const repin = (ax, ay, fillW, fillH) => set(() => Object.assign(c, B.repin(c, g.rel, g.pw, g.ph, ax, ay, fillW, fillH)));
    const rows = [
      h('h3', {}, t.label),
      field('Name', input(c.name, v => {
        if (!B.isPartName(v)) { S.status = `"${v}" can't be a name: use letters, digits and _.`; renderStatus(); renderProps(); return; }
        if (B.all(S.design).some(k => k !== c && k.name === v)) { S.status = `"${v}" is already used.`; renderStatus(); renderProps(); return; }
        set(() => { if (c.handler === B.handlerFor(c.name)) c.handler = B.handlerFor(v); c.name = v; });
      }, { spellcheck: false }), `In your code: create(...).${c.name}`),
      h('div', { class: 'grid2' },
        field('X', numberInput(c.x, v => set(() => { c.x = v; }))),
        field('Y', numberInput(c.y, v => set(() => { c.y = v; }))),
        field(c.fillW ? 'Width +' : 'Width', numberInput(c.w, v => set(() => { c.w = v; }))),
        field(c.fillH ? 'Height +' : 'Height', numberInput(c.h, v => set(() => { c.h = v; })))),
      h('div', { class: 'grid2' },
        field('Pin across', choice(pinH, ['Left', 'Centre', 'Right', 'Stretch'], v => repin(v === 'Stretch' ? 'start' : { Left: 'start', Centre: 'center', Right: 'end' }[v], c.ay, v === 'Stretch', c.fillH))),
        field('Pin down', choice(pinV, ['Top', 'Middle', 'Bottom', 'Stretch'], v => repin(c.ax, v === 'Stretch' ? 'start' : { Top: 'start', Middle: 'center', Bottom: 'end' }[v], c.fillW, v === 'Stretch')))),
    ];
    if ('text' in p) {
      const multi = c.type === 'Text';
      rows.push(field(c.type === 'InputField' ? 'Starting text' : c.type === 'GroupBox' ? 'Header' : 'Text',
        multi ? h('textarea', { rows: 3, value: p.text, onchange: e => prop('text', e.target.value) }) : input(p.text, v => prop('text', v))));
    }
    const pretty = S.design.style === 'prettyui' && B.PRETTY_TYPES.has(c.type);
    if (pretty && c.type === 'Button') {
      const looks = { Simple: 'BUTTON_DEFAULT', Fancy: 'BUTTON_CORNERED_BOLD_NEUTRAL', 'Fancy green': 'BUTTON_CORNERED_BOLD_POSITIVE', 'Fancy red': 'BUTTON_CORNERED_BOLD_NEGATIVE' };
      rows.push(field('Look', choice(Object.keys(looks).find(k => looks[k] === p.style) || 'Simple', Object.keys(looks), v => prop('style', looks[v]))));
    } else if ('style' in p && !pretty) rows.push(field('Style', choice(p.style, B.STYLES[c.type] || [p.style], v => prop('style', v))));
    if ('font' in p) rows.push(field('Font', choice(p.font, B.FONTS, v => prop('font', v))));
    if ('rgba' in p) rows.push(field('Colour', colour(p.rgba, v => prop('rgba', B.hexColour(v, p.rgba))), 'RRGGBBAA'));
    if ('align' in p) rows.push(field('Alignment', choice(p.align, B.ALIGNS, v => prop('align', v))));
    if ('shadow' in p) rows.push(h('label', { class: 'tick' }, checkbox(p.shadow, v => prop('shadow', v)), 'Text shadow'));
    if ('toggle' in p) rows.push(h('label', { class: 'tick' }, checkbox(p.toggle, v => prop('toggle', v)), 'Stays pressed (toggle)'));
    if ('checked' in p) rows.push(h('label', { class: 'tick' }, checkbox(p.checked, v => prop('checked', v)), 'Ticked at the start'));
    if ('filter' in p) rows.push(field('Allowed input', choice(p.filter, B.FILTERS, v => prop('filter', v))), field('Longest entry', numberInput(p.maxLength, v => prop('maxLength', v))));
    if ('options' in p) {
      rows.push(field('Entries, one per line', h('textarea', { rows: 4, value: p.options, onchange: e => prop('options', e.target.value) })),
        'selected' in p ? field('Selected entry', numberInput(p.selected, v => prop('selected', v)), '0 selects nothing') : null);
    }
    if ('max' in p) rows.push(h('div', { class: 'grid2' }, field('Highest', numberInput(p.max, v => prop('max', v))), field('Starts at', numberInput(p.value, v => prop('value', v)))));
    if ('item' in p) rows.push(field('Item ID', numberInput(p.item, v => prop('item', v))));
    if ('invert' in p) rows.push(h('label', { class: 'tick' }, checkbox(p.invert, v => prop('invert', v)), 'Slope the other way'));
    if ('fill' in p) rows.push(h('label', { class: 'tick' }, checkbox(p.fill, v => prop('fill', v)), 'Filled'));
    if ('thickness' in p && !p.fill) rows.push(field(c.type === 'Line' ? 'Thickness' : 'Outline', numberInput(p.thickness, v => prop('thickness', v))));
    if ('resource' in p) {
      rows.push(field('Image', choice(p.resource, ['', ...S.resources], v => prop('resource', v))),
        h('button', { onclick: () => post({ type: 'sprites' }) }, 'Make a sprite…'));
    }
    if (t.hook) {
      rows.push(field('Handler', input(c.handler, v => {
        if (v && !B.isIdent(v)) { S.status = `"${v}" can't be a Lua name.`; renderStatus(); renderProps(); return; }
        set(() => { c.handler = v; });
      }, { spellcheck: false }), `Called with ${t.sends === 'self' ? 'the button' : t.sends.replace('self.', 'its ')}`));
    }
    if (t.prettyOnly && S.design.style !== 'prettyui') rows.push(h('p', { class: 'muted' }, 'Only PrettyUI has this, so plain mode leaves it out.'));
    if (t.decorative) rows.push(h('label', { class: 'tick' }, checkbox(c.blockClicks, v => set(() => { c.blockClicks = v; })), 'Block clicks to the game'));
    return rows;
  }
  function renderProps() {
    if (!$.props) return;
    if (document.activeElement && $.props.contains(document.activeElement)) document.activeElement.blur();
    const items = selected();
    if (!items.length) $.props.replaceChildren(...hostProps().filter(Boolean));
    else if (items.length === 1) $.props.replaceChildren(...compProps(items[0].comp).filter(Boolean));
    else $.props.replaceChildren(h('h3', {}, `${items.length} parts selected`), h('p', { class: 'muted' }, 'Use the toolbar to line them up, or drag them together.'));
  }

  function allProblems() {
    const list = B.problems(S.design, S.hasPrettyUI);
    for (const msg of S.mock) list.unshift({ severity: 'error', msg: 'In the test run: ' + msg });
    for (const msg of S.notes) list.push({ severity: 'info', msg });
    return list;
  }
  function renderBottom() {
    const list = allProblems();
    const errors = list.filter(p => p.severity === 'error').length, warns = list.filter(p => p.severity === 'warn').length;
    const tab = (id, label) => h('button', { class: S.tab === id ? 'on' : '', onclick: () => { S.tab = id; persist(); renderBottom(); } }, label);
    const count = errors + warns ? ` (${errors + warns})` : '';
    $.tabs.replaceChildren(tab('code', 'Generated Lua'), tab('use', 'Use it'), tab('problems', 'Problems' + count));
    const code = B.generateLua(S.design), usage = B.usageSnippet(S.design);
    if (S.tab === 'code') {
      $.pane.replaceChildren(h('div', { class: 'pane-actions' }, h('button', { onclick: () => post({ type: 'copy', text: code }) }, 'Copy'), h('button', { onclick: () => post({ type: 'openLua' }) }, 'Open file')), h('pre', {}, code));
    } else if (S.tab === 'use') {
      $.pane.replaceChildren(h('div', { class: 'pane-actions' }, h('button', { onclick: () => post({ type: 'copy', text: usage }) }, 'Copy'), h('button', { onclick: () => post({ type: 'addRequire' }) }, 'Add to main.lua')),
        h('p', { class: 'muted' }, 'Your own code goes in these functions, so it survives when the file is regenerated.'), h('pre', {}, usage));
    } else {
      $.pane.replaceChildren(list.length
        ? h('ul', { class: 'problems' }, list.map(p => h('li', { class: p.severity, onclick: () => { if (p.id) select([p.id]); } }, p.msg)))
        : h('p', { class: 'muted' }, 'No problems found.'));
    }
    const needsDep = S.design.style === 'prettyui' && !S.hasPrettyUI && S.hasManifest;
    $.banner.replaceChildren(...(needsDep ? [h('span', {}, 'PrettyUI mode needs PrettyUI, and plugin.json doesn\'t list it yet.'), h('button', { onclick: () => post({ type: 'addDependency' }) }, 'Add to plugin.json')] : []));
    $.banner.hidden = !needsDep;
  }
  function renderStatus() { $.status.textContent = S.status; }
  function renderPalette() {
    const pretty = S.design.style === 'prettyui';
    $.modePretty.classList.toggle('on', pretty);
    $.modePlain.classList.toggle('on', !pretty);
    $.palette.replaceChildren(...Object.entries(B.TYPES).filter(([, t]) => pretty || !t.prettyOnly).map(([type, t]) => h('div', { class: 'part', tabIndex: 0, role: 'button', title: `Drag onto the window (or press Enter): ${t.label}`,
      onpointerdown: e => { if (e.button === 0) beginNew(e, type); },
      onkeydown: e => { if (e.key === 'Enter') { const s = B.contentSize(S.design); addPart(type, null, s.w / 2, s.h / 2); } } }, t.label)));
  }
  function setMode(style) {
    if (S.design.style !== style) commit(() => B.applyStyle(S.design, style));
  }
  function renderToolbar() {
    $.undo.disabled = !S.past.length;
    $.redo.disabled = !S.future.length;
    $.zoomLabel.textContent = Math.round(S.zoom * 100) + '%';
    $.snapBtn.classList.toggle('on', S.snap);
    $.gridBtn.classList.toggle('on', S.showGrid);
    const n = selected().length;
    for (const b of $.needsSel) b.disabled = !n;
    for (const b of $.needsTwo) b.disabled = n < 2;
    for (const b of $.needsThree) b.disabled = n < 3;
  }
  function renderAll() { renderPalette(); renderCanvas(); renderTree(); renderProps(); renderBottom(); renderToolbar(); renderStatus(); }

  // ---------------------------------------------------------------- commands
  function addPart(type, containerId, x, y) {
    commit(() => {
      const o = originOf(containerId);
      const c = B.create(S.design, type, 0, 0);
      c.x = snapValue(x - o.x - c.w / 2);
      c.y = snapValue(y - o.y - c.h / 2);
      o.list.push(c);
      S.sel = [c.id];
    });
  }
  function removeSelected() {
    if (!S.sel.length) return;
    commit(() => {
      for (const it of selected()) { const i = it.list.indexOf(it.comp); if (i >= 0) it.list.splice(i, 1); }
      S.sel = [];
    });
  }
  /** A copy with new IDs and names. `taken` collects the new names, so a batch of copies can't clash. */
  function cloned(comp, taken) {
    const copy = JSON.parse(JSON.stringify(comp));
    const fresh = c => {
      const old = c.name;
      c.id = 'c' + Math.random().toString(36).slice(2, 9);
      c.name = B.uniqueName({ comps: [...S.design.comps, ...taken] }, old.replace(/\d+$/, ''));
      taken.push({ id: c.id, name: c.name });
      if (c.handler === B.handlerFor(old)) c.handler = B.handlerFor(c.name);
      (c.children || []).forEach(fresh);
    };
    fresh(copy);
    return copy;
  }
  function placeCopies(items) {
    const taken = [], made = [];
    for (const { comp, list } of items) {
      const c = cloned(comp, taken);
      c.x += S.grid * 2; c.y += S.grid * 2;
      list.push(c);
      made.push(c.id);
    }
    S.sel = made;
  }
  function duplicate() {
    if (S.sel.length) commit(() => placeCopies(selected()));
  }
  function paste() {
    if (!S.clip || !S.clip.length) return;
    const one = selected()[0];
    const list = one ? one.list : S.design.comps;
    commit(() => placeCopies(S.clip.map(comp => ({ comp, list }))));
  }
  function nudge(dx, dy) {
    if (!S.sel.length) return;
    commit(() => { for (const it of selected()) { it.comp.x += dx; it.comp.y += dy; } });
  }
  function reorder(to) {
    commit(() => {
      for (const it of selected()) {
        const i = it.list.indexOf(it.comp);
        it.list.splice(i, 1);
        const at = to === 'front' ? it.list.length : to === 'back' ? 0 : to === 'up' ? Math.min(it.list.length, i + 1) : Math.max(0, i - 1);
        it.list.splice(at, 0, it.comp);
      }
    });
  }
  /** Lines the selection up with itself, or a single part with its parent. */
  function align(how) {
    const gs = S.sel.map(geometry).filter(Boolean);
    if (!gs.length) return;
    const first = gs[0];
    const box = gs.length > 1 ? bounds(gs.map(g => g.abs)) : { x: first.ox, y: first.oy, w: first.pw, h: first.ph };
    commit(() => {
      for (const g of gs) {
        const a = g.abs;
        if (how === 'left') g.c.x += box.x - a.x;
        if (how === 'right') g.c.x += box.x + box.w - a.x - a.w;
        if (how === 'hcenter') g.c.x += Math.round(box.x + box.w / 2 - a.x - a.w / 2);
        if (how === 'top') g.c.y += box.y - a.y;
        if (how === 'bottom') g.c.y += box.y + box.h - a.y - a.h;
        if (how === 'vcenter') g.c.y += Math.round(box.y + box.h / 2 - a.y - a.h / 2);
      }
    });
  }
  function distribute(axis) {
    const gs = S.sel.map(geometry).filter(Boolean);
    if (gs.length < 3) return;
    const pos = axis === 'x' ? 'x' : 'y', len = axis === 'x' ? 'w' : 'h';
    gs.sort((a, b) => a.abs[pos] - b.abs[pos]);
    const total = gs.reduce((sum, g) => sum + g.abs[len], 0);
    const last = gs[gs.length - 1];
    const gap = (last.abs[pos] + last.abs[len] - gs[0].abs[pos] - total) / (gs.length - 1);
    commit(() => {
      let at = gs[0].abs[pos];
      for (const g of gs) { g.c[pos] += Math.round(at - g.abs[pos]); at += g.abs[len] + gap; }
    });
  }
  function setZoom(z) {
    S.zoom = Math.max(0.25, Math.min(4, z));
    persist();
    renderCanvas();
    renderToolbar();
  }
  function fit() {
    const r = $.stage.getBoundingClientRect();
    setZoom(Math.min(2, (r.width - 64) / S.design.host.w, (r.height - 64) / S.design.host.h));
  }

  // ---------------------------------------------------------------- pointer
  function beginMove(e, id) {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      select(S.sel.includes(id) ? S.sel.filter(s => s !== id) : [...S.sel, id]);
      renderToolbar();
      if (!S.sel.includes(id)) return;
    } else if (!S.sel.includes(id)) {
      select([id]);
      renderToolbar();
    }
    // a part inside a selected container moves with it
    const ids = S.sel.filter(i => !S.sel.some(o => o !== i && isInside(i, o)));
    D = { kind: 'move', ids, before: snapshot(), start: toContent(e), from: ids.map(i => ({ c: geometry(i).c, x: geometry(i).c.x, y: geometry(i).c.y })),
      box: bounds(ids.map(i => geometry(i).abs)), moved: false };
  }
  function move(e) {
    const p = toContent(e);
    let dx = p.x - D.start.x, dy = p.y - D.start.y;
    if (!D.moved && Math.hypot(dx, dy) * S.zoom < 3) return;
    D.moved = true;
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    const box = { x: D.box.x + dx, y: D.box.y + dy, w: D.box.w, h: D.box.h };
    const near = smartSnap(box, D.ids, e);
    const fx = near.dx != null ? dx + near.dx : snapValue(D.box.x + dx, e) - D.box.x;
    const fy = near.dy != null ? dy + near.dy : snapValue(D.box.y + dy, e) - D.box.y;
    for (const f of D.from) { f.c.x = Math.round(f.x + fx); f.c.y = Math.round(f.y + fy); }
    S.guides = near.lines;
    renderCanvas();
  }
  function endMove(e) {
    S.guides = [];
    if (!D.moved) { renderCanvas(); return; }
    // dropped on a different container: it moves in, keeping its place on screen
    const items = D.ids.map(id => B.find(S.design, id));
    const sameParent = items.every(it => it.parent === items[0].parent);
    if (sameParent) {
      const target = overContent(e) ? containerAt(e, D.ids) : (items[0].parent ? null : undefined);
      const current = items[0].parent ? items[0].parent.id : null;
      if (target !== undefined && target !== current && overContent(e)) {
        const dest = originOf(target);
        for (const it of items) {
          const g = geometry(it.comp.id);
          it.list.splice(it.list.indexOf(it.comp), 1);
          Object.assign(it.comp, { x: Math.round(g.abs.x - dest.x), y: Math.round(g.abs.y - dest.y), w: Math.round(g.abs.w), h: Math.round(g.abs.h), ax: 'start', ay: 'start', fillW: false, fillH: false });
          dest.list.push(it.comp);
        }
      }
    }
    remember(D.before);
    changed();
  }
  function beginResize(e, dir) {
    const g = geometry(S.sel[0]);
    D = { kind: 'resize', dir, before: snapshot(), start: toContent(e), rect: Object.assign({}, g.rel), id: g.c.id, moved: false };
  }
  function resize(e) {
    const p = toContent(e);
    const dx = p.x - D.start.x, dy = p.y - D.start.y;
    const g = geometry(D.id);
    const r = Object.assign({}, D.rect);
    const MIN = 4;
    if (D.dir.includes('e')) r.w = Math.max(MIN, snapValue(D.rect.x + D.rect.w + dx, e) - D.rect.x);
    if (D.dir.includes('s')) r.h = Math.max(MIN, snapValue(D.rect.y + D.rect.h + dy, e) - D.rect.y);
    if (D.dir.includes('w')) { const x = Math.min(snapValue(D.rect.x + dx, e), D.rect.x + D.rect.w - MIN); r.w = D.rect.x + D.rect.w - x; r.x = x; }
    if (D.dir.includes('n')) { const y = Math.min(snapValue(D.rect.y + dy, e), D.rect.y + D.rect.h - MIN); r.h = D.rect.y + D.rect.h - y; r.y = y; }
    D.moved = true;
    Object.assign(g.c, B.repin(g.c, r, g.pw, g.ph, g.c.ax, g.c.ay, g.c.fillW, g.c.fillH));
    renderCanvas();
  }
  function beginHostResize(e) {
    D = { kind: 'host', before: snapshot(), start: { x: e.clientX, y: e.clientY }, w: S.design.host.w, h: S.design.host.h, moved: false };
  }
  function hostResize(e) {
    D.moved = true;
    S.design.host.w = Math.max(80, snapValue(D.w + (e.clientX - D.start.x) / S.zoom, e));
    S.design.host.h = Math.max(60, snapValue(D.h + (e.clientY - D.start.y) / S.zoom, e));
    renderCanvas();
  }
  function beginNew(e, type) {
    e.preventDefault();
    const t = B.TYPES[type];
    const ghost = h('div', { class: 'ghost', style: { width: t.w * S.zoom + 'px', height: t.h * S.zoom + 'px' } }, t.label);
    document.body.append(ghost);
    D = { kind: 'new', type, ghost };
    moveGhost(e);
  }
  function moveGhost(e) {
    D.ghost.style.left = e.clientX + 'px';
    D.ghost.style.top = e.clientY + 'px';
    D.ghost.classList.toggle('ok', overContent(e));
  }
  /** Where a dragged row would land: before or after another row, or inside a container. */
  function rowDrop(e) {
    const row = document.elementFromPoint(e.clientX, e.clientY);
    const el = row && row.closest && row.closest('[data-tree]');
    if (!el || el.dataset.tree === D.id || isInside(el.dataset.tree, D.id)) return null;
    const r = el.getBoundingClientRect(), at = (e.clientY - r.top) / r.height;
    const target = B.find(S.design, el.dataset.tree);
    if (target.comp.children && at > 0.3 && at < 0.7) return { id: el.dataset.tree, where: 'into', el };
    return { id: el.dataset.tree, where: at < 0.5 ? 'above' : 'below', el };
  }
  function moveRow(e) {
    if (!D.moved && Math.abs(e.clientY - D.y) < 4) return;
    D.moved = true;
    document.querySelectorAll('.drop-above,.drop-below,.drop-into').forEach(el => el.classList.remove('drop-above', 'drop-below', 'drop-into'));
    D.drop = rowDrop(e);
    if (D.drop) D.drop.el.classList.add('drop-' + D.drop.where);
  }
  /** The list runs front to back, the reverse of drawing order, so "above" means later in the array. */
  function endRow() {
    const { id, drop } = D;
    if (!drop) { renderTree(); return; }
    commit(() => {
      const moving = B.find(S.design, id), g = geometry(id);
      const target = B.find(S.design, drop.id);
      const dest = drop.where === 'into' ? target.comp.id : (target.parent ? target.parent.id : null);
      const from = moving.parent ? moving.parent.id : null;
      const origin = originOf(dest);
      moving.list.splice(moving.list.indexOf(moving.comp), 1);
      if (dest !== from) {
        // a new parent: it stays where it is on screen
        Object.assign(moving.comp, { x: Math.round(g.abs.x - origin.x), y: Math.round(g.abs.y - origin.y), w: Math.round(g.abs.w), h: Math.round(g.abs.h), ax: 'start', ay: 'start', fillW: false, fillH: false });
      }
      if (drop.where === 'into') origin.list.push(moving.comp);
      else origin.list.splice(origin.list.indexOf(target.comp) + (drop.where === 'above' ? 1 : 0), 0, moving.comp);
      S.sel = [id];
    });
  }
  function marquee(e) {
    const p = toContent(e);
    const x = Math.min(p.x, D.start.x), y = Math.min(p.y, D.start.y);
    D.box = { x, y, w: Math.abs(p.x - D.start.x), h: Math.abs(p.y - D.start.y) };
    const hit = [];
    for (const c of S.design.comps) {
      const a = geometry(c.id).abs;
      if (a.x < x + D.box.w && a.x + a.w > x && a.y < y + D.box.h && a.y + a.h > y) hit.push(c.id);
    }
    S.sel = hit;
    renderCanvasMarks();
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    const handle = e.target.closest('.handle');
    if (handle) { e.preventDefault(); beginResize(e, handle.dataset.dir); return; }
    if (e.target.closest('.host-grip')) { e.preventDefault(); beginHostResize(e); return; }
    const part = e.target.closest('.comp');
    if (part) { e.preventDefault(); beginMove(e, part.dataset.id); return; }
    if (e.target.closest('.selbox')) return;
    if (e.target.closest('.content')) {
      e.preventDefault();
      select([]);
      renderToolbar();
      D = { kind: 'marquee', start: toContent(e) };
    } else if (e.target.closest('.stage')) {
      select([]);
      renderToolbar();
    }
  }
  window.addEventListener('pointermove', e => {
    if (!D) return;
    if (D.kind === 'move') move(e);
    else if (D.kind === 'resize') resize(e);
    else if (D.kind === 'host') hostResize(e);
    else if (D.kind === 'new') moveGhost(e);
    else if (D.kind === 'marquee') marquee(e);
    else if (D.kind === 'row') moveRow(e);
  });
  function finish(e, cancelled) {
    if (!D) return;
    const d = D;
    if (d.kind === 'new') {
      d.ghost.remove();
      D = null;
      if (!cancelled && overContent(e)) { const p = toContent(e); addPart(d.type, containerAt(e, []), p.x, p.y); }
      return;
    }
    if (d.kind === 'row') {
      // cleared after the click that follows, so a drag doesn't also select
      if (!cancelled && d.moved) endRow();
      else if (d.moved) renderTree();
      setTimeout(() => { if (D === d) D = null; }, 0);
      return;
    }
    if (cancelled) {
      D = null;
      S.guides = [];
      if (d.before) S.design = JSON.parse(d.before);
      renderAll();
      return;
    }
    if (d.kind === 'move') endMove(e);
    else if ((d.kind === 'resize' || d.kind === 'host') && d.moved) { remember(d.before); changed(); }
    D = null;
    renderCanvasMarks();
    renderToolbar();
    if (d.kind === 'marquee') { renderTree(); renderProps(); }
  }
  window.addEventListener('pointerup', e => finish(e, false));
  window.addEventListener('pointercancel', e => finish(e, true));
  window.addEventListener('blur', e => finish(e, true));

  window.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    const ctrl = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
    if (ctrl && key === 's') { e.preventDefault(); post({ type: 'save', design: S.design }); return; }
    if (typing) return;
    if (e.key === 'Escape') { if (D) finish(e, true); else { select([]); renderToolbar(); } return; }
    if (ctrl && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (ctrl && key === 'y') { e.preventDefault(); redo(); return; }
    if (ctrl && key === 'a') { e.preventDefault(); select(S.design.comps.map(c => c.id)); renderToolbar(); return; }
    if (ctrl && key === 'c') { S.clip = selected().map(it => JSON.parse(JSON.stringify(it.comp))); return; }
    if (ctrl && key === 'x') { S.clip = selected().map(it => JSON.parse(JSON.stringify(it.comp))); removeSelected(); return; }
    if (ctrl && key === 'v') { paste(); return; }
    if (ctrl && key === 'd') { e.preventDefault(); duplicate(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); return; }
    const step = e.shiftKey ? 10 : 1;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key] && S.sel.length) { e.preventDefault(); nudge(...arrows[e.key]); return; }
    if (e.key === ']') reorder(e.shiftKey ? 'front' : 'up');
    if (e.key === '[') reorder(e.shiftKey ? 'back' : 'down');
  });

  // ---------------------------------------------------------------- page
  function build() {
    const btn = (label, title, onclick, group) => {
      const b = h('button', { title, onclick }, label);
      if (group) group.push(b);
      return b;
    };
    $.needsSel = []; $.needsTwo = []; $.needsThree = [];
    $.undo = btn('Undo', 'Undo (Ctrl+Z)', undo);
    $.redo = btn('Redo', 'Redo (Ctrl+Y)', redo);
    $.snapBtn = btn('Snap', 'Snap to the grid. Hold Alt while dragging to turn it off for that drag.', () => { S.snap = !S.snap; persist(); renderToolbar(); });
    $.gridBtn = btn('Grid', 'Show the grid', () => { S.showGrid = !S.showGrid; persist(); renderCanvas(); renderToolbar(); });
    $.zoomLabel = h('span', { class: 'zoom' });
    $.status = h('span', { class: 'status' });
    const sep = () => h('span', { class: 'sep' });
    const aligns = [['⇤', 'Line up left edges', 'left'], ['↔', 'Line up centres across', 'hcenter'], ['⇥', 'Line up right edges', 'right'],
      ['⤒', 'Line up tops', 'top'], ['↕', 'Line up middles', 'vcenter'], ['⤓', 'Line up bottoms', 'bottom']];
    $.modePretty = btn('PrettyUI', 'Build with PrettyUI parts. Needs the PrettyUI library plugin.', () => setMode('prettyui'));
    $.modePlain = btn('Plain', 'Build with the client\'s own parts, with no library.', () => setMode('plain'));
    const toolbar = h('div', { class: 'toolbar' }, h('span', { class: 'mode' }, $.modePretty, $.modePlain), sep(), $.undo, $.redo, sep(),
      aligns.map(a => btn(a[0], a[1], () => align(a[2]), $.needsSel)), sep(),
      btn('⋯', 'Even gaps across', () => distribute('x'), $.needsThree), btn('⋮', 'Even gaps down', () => distribute('y'), $.needsThree), sep(),
      btn('Front', 'Bring to front (Shift+])', () => reorder('front'), $.needsSel), btn('Back', 'Send to back (Shift+[)', () => reorder('back'), $.needsSel),
      btn('Copy', 'Duplicate (Ctrl+D)', duplicate, $.needsSel), btn('Delete', 'Delete (Del)', removeSelected, $.needsSel), sep(),
      $.snapBtn, $.gridBtn, sep(),
      btn('−', 'Zoom out', () => setZoom(S.zoom / 1.25)), $.zoomLabel, btn('+', 'Zoom in', () => setZoom(S.zoom * 1.25)), btn('Fit', 'Fit the window', fit),
      h('span', { class: 'spacer' }), $.status,
      btn('Preview', 'Save and open the live UI Preview', () => post({ type: 'preview', design: S.design })),
      btn('?', 'Help', () => post({ type: 'help' })));

    $.palette = h('div', { class: 'palette' });
    $.tree = h('div', { class: 'tree', onclick: e => {
      const row = e.target.closest('[data-tree]');
      if (!row || D) return;
      const id = row.dataset.tree;
      select(e.ctrlKey || e.metaKey || e.shiftKey ? (S.sel.includes(id) ? S.sel.filter(s => s !== id) : [...S.sel, id]) : [id]);
      renderToolbar();
    }, onpointerdown: e => {
      const row = e.target.closest('[data-tree]');
      if (row && e.button === 0) D = { kind: 'row', id: row.dataset.tree, y: e.clientY, moved: false, drop: null };
    } });
    $.titleText = h('span', {});
    $.title = h('div', { class: 'title' }, $.titleText);
    $.parts = h('div', { class: 'parts' });
    $.content = h('div', { class: 'content' }, $.parts);
    $.marks = h('div', { class: 'marks' });
    $.content.append($.marks);
    $.host = h('div', { class: 'host' }, $.title, $.content, h('i', { class: 'host-grip', title: 'Drag to resize the window' }));
    $.canvas = h('div', { class: 'canvas' }, $.host);
    $.sizer = h('div', { class: 'sizer' }, $.canvas);
    $.stage = h('div', { class: 'stage', onwheel: e => { if (e.ctrlKey) { e.preventDefault(); setZoom(S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); } } }, $.sizer);
    $.props = h('div', { class: 'props' });
    $.tabs = h('div', { class: 'tabs' });
    $.pane = h('div', { class: 'pane' });
    $.banner = h('div', { class: 'banner', hidden: true });
    document.getElementById('app').replaceChildren(toolbar, $.banner,
      h('div', { class: 'main' },
        h('aside', { class: 'left' }, h('h3', {}, 'Parts'), $.palette, h('h3', {}, 'In this window'), $.tree),
        $.stage,
        h('aside', { class: 'right' }, $.props)),
      h('div', { class: 'bottom' }, $.tabs, $.pane));
    document.addEventListener('pointerdown', onPointerDown);
  }

  window.addEventListener('message', ev => {
    const m = ev.data;
    switch (m.type) {
      case 'init': case 'external': case 'manifest':
        if (m.type !== 'manifest') {
          if (m.type === 'external') remember();
          S.design = m.design;
          S.sel = S.sel.filter(id => B.find(S.design, id));
          S.status = m.type === 'external' ? 'Reloaded: the file changed on disk' : '';
        }
        S.notes = m.notes || [];
        S.resources = m.resources || [];
        S.hasPrettyUI = !!m.hasPrettyUI;
        S.hasManifest = !!m.hasManifest;
        renderAll();
        break;
      case 'saved': S.status = 'Saved to ' + m.file; S.module = m.module; renderStatus(); break;
      case 'mockResult': S.mock = m.errors || []; renderBottom(); break;
      case 'resources': S.resources = m.resources || []; renderProps(); break;
    }
  });

  build();
  post({ type: 'ready' });
})();
