// RS3 Style Studio webview.
(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  const S = { spec: { styles: [] }, catalog: { keys: {}, sheets: {} }, builtins: [], docKeys: [], discovery: '', plugin: '',
    tab: 'mine', sel: 0, dirty: false, code: '', savedModule: 'styles' };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }
  const isIdent = s => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s);
  const fmtVal = (k, v) => /(^|\.)rgb$/i.test(k) && typeof v === 'number' ? '0x' + ((v >>> 0) & 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0') : String(v);
  const hex6 = n => '#' + ((Number(n) >>> 0) & 0xFFFFFF).toString(16).padStart(6, '0');

  // ---------------------------------------------------------------- model helpers
  const compOf = base => { const b = S.builtins.find(g => g.ids.includes(base)); return b ? b.component : 'Button'; };
  function chainOf(style) {
    const seen = new Set(), chain = [];
    let cur = style;
    while (cur && !seen.has(cur.name)) {
      seen.add(cur.name); chain.push(cur);
      if (!cur.parent) return { chain, base: null };
      if (!cur.parent.startsWith('custom:')) return { chain, base: cur.parent };
      cur = S.spec.styles.find(s => s.name === cur.parent.slice(7));
    }
    return { chain, base: null, cycle: !!cur };
  }
  function effectiveValues(style) {
    const { chain, base } = chainOf(style);
    const out = Object.assign({}, base && S.catalog.sheets[base] || {});
    for (const s of chain.slice().reverse()) for (const v of s.values || []) if (v.key && v.value !== '' && v.value != null) out[v.key] = Number(v.value);
    return out;
  }
  function nextId() {
    const used = new Set(S.spec.styles.map(s => Number(s.id)));
    let id = 10000;
    while (used.has(id)) id++;
    return id;
  }
  function uniqueName(base) {
    let n = base, i = 2;
    while (S.spec.styles.some(s => s.name === n)) n = base + '_' + i++;
    return n;
  }

  // ---------------------------------------------------------------- RS-ish samples
  const VARIANT = { POSITIVE: '#3f7a3a', NEGATIVE: '#8a2f2a', NEUTRAL: '#4c4c4c' };
  function sample(component, base, values) {
    base = base || '';
    switch (component) {
      case 'Button': {
        const el = h('div', { class: 'w-btn' }, 'Button');
        const rgb = values['button.tint.rgb'];
        let a = values['button.tint.alpha'];
        a = typeof a === 'number' ? (a > 1 ? a / 255 : a) : 1;
        const v = Object.keys(VARIANT).find(k => base.includes(k));
        const tint = typeof rgb === 'number' ? `rgba(${(rgb >>> 16) & 255},${(rgb >>> 8) & 255},${rgb & 255},${Math.max(0, Math.min(1, a))})` : v && VARIANT[v];
        if (tint) el.style.background = `linear-gradient(rgba(255,255,255,.16), rgba(0,0,0,.28)), ${tint}`;
        if (/CORNERED/.test(base)) el.style.borderRadius = '0';
        if (/BOLD/.test(base)) el.style.fontWeight = '700';
        return el;
      }
      case 'Check': {
        const right = /RIGHT/.test(base);
        const box = h('span', { class: 'box' }, '✓'), lab = h('span', {}, 'Checkbox');
        return h('div', { class: 'w-check' }, right ? [lab, box] : [box, lab]);
      }
      case 'InputField': return h('div', { class: 'w-input' }, 'Search…');
      case 'RadioGroup': return h('div', { class: 'w-radio' }, h('span', {}, h('i', { class: 'on' }), 'Option A'), h('span', {}, h('i'), 'Option B'));
      case 'List': return h('div', { class: 'w-list' }, h('div', { class: 'sel' }, 'Selected ▾'), h('div', {}, 'Entry two'), h('div', {}, 'Entry three'));
      case 'ComboField': return h('div', { class: 'w-list' }, h('div', { class: 'sel' }, 'Combo ▾'));
      case 'GroupBox': return h('div', { class: 'w-panel' }, h('div', { class: 'hd' }, 'Group box'));
      case 'Carousel': return h('div', { class: 'w-carousel' }, h('b', {}, '‹'), h('div', { class: 'pane' }, 'Item 1'), h('b', {}, '›'));
      case 'PagedCarousel': {
        const n = /SINGLE/.test(base) ? 1 : /TRIPLE/.test(base) ? 3 : 2;
        return h('div', {}, h('div', { class: 'w-carousel' }, h('b', {}, '‹'), Array.from({ length: n }, (_, i) => h('div', { class: 'pane', style: { width: (n === 1 ? 150 : n === 2 ? 80 : 54) + 'px' } }, 'Page ' + (i + 1))), h('b', {}, '›')),
          h('div', { class: 'w-dots' }, h('i', { class: 'on' }), h('i'), h('i')));
      }
      case 'PagedLayer': return h('div', { class: 'w-tabs' }, h('div', { class: 'hdr' }, h('span', { class: 'on' }, 'Tab 1'), h('span', {}, 'Tab 2')), h('div', { class: 'body' }));
      case 'RadialProgressOverlay': return h('div', { class: 'w-radial' + (/SQUARE/.test(base) ? ' square' : '') });
      case 'Slider': return h('div', { class: 'w-slider' + (/WIDE/.test(base) ? ' wide' : '') }, h('div', { class: 'tr' }), h('div', { class: 'th' }));
      default: return h('div', { class: 'w-panel' });
    }
  }

  // ---------------------------------------------------------------- shell
  const app = document.getElementById('app');
  const tabs = {};
  const views = {};
  const tabbar = h('div', { class: 'tabs', role: 'tablist' }, h('span', { class: 'title' }));
  for (const [id, label] of [['mine', 'My styles'], ['gallery', 'Built-in gallery'], ['discover', 'Discover keys']]) {
    tabs[id] = h('button', { class: 'tab', role: 'tab', onclick: () => { S.tab = id; render(); } }, label);
    tabbar.append(tabs[id]);
    views[id] = h('div', { class: 'view', role: 'tabpanel' });
  }
  tabbar.append(h('div', { class: 'grow' }));
  const main = h('div', { style: { minHeight: 0, display: 'grid' } }, Object.values(views));
  app.append(tabbar, main);

  function markDirty() { S.dirty = true; regen(); renderStatus(); }
  let regenTimer;
  function regen() { clearTimeout(regenTimer); regenTimer = setTimeout(() => vscode.postMessage({ type: 'generate', spec: S.spec }), 150); }

  // ---------------------------------------------------------------- My styles
  const codePre = h('pre', { class: 'code' });
  const usagePre = h('pre', { class: 'code' });
  const statusLine = h('div', { class: 'hint' });
  function renderStatus() {
    statusLine.textContent = S.dirty ? 'Unsaved changes. Save writes .rs3/styles.json and styles.lua.' : 'Saved.';
  }
  function renderMine() {
    const v = views.mine;
    const styles = S.spec.styles;
    if (S.sel >= styles.length) S.sel = styles.length - 1;
    const list = h('div', { class: 'list' },
      styles.map((s, i) => h('div', { class: 'item' + (i === S.sel ? ' sel' : ''), onclick: () => { S.sel = i; renderMine(); } },
        h('div', { class: 'n' }, s.name || '(unnamed)'),
        h('div', { class: 'd' }, `${s.id} · ${s.parent ? s.parent.replace(/^custom:/, '') : 'no parent'}`))),
      h('div', { class: 'actions' },
        h('button', { class: 'primary', onclick: () => addStyle('BUTTON_DEFAULT') }, '+ New style'),
        styles.length ? h('button', { onclick: duplicate, title: 'Duplicate selected' }, 'Duplicate') : null));
    const style = styles[S.sel];
    let editor;
    if (!style) {
      editor = h('div', { class: 'editor' }, h('div', { class: 'empty' },
        h('div', {}, 'No custom stylesheets yet.'),
        h('div', { class: 'hint' }, 'A custom stylesheet starts from a built-in one (its parent) and overrides some values.'),
        h('div', { style: { marginTop: '12px' } }, h('button', { class: 'primary', onclick: () => addStyle('BUTTON_DEFAULT') }, 'Create a button style'), ' ',
          h('a', { onclick: () => { S.tab = 'gallery'; render(); } }, 'or start from the gallery'))));
    } else editor = styleEditor(style);
    const side = h('div', { class: 'side' },
      h('div', {}, h('h3', {}, 'Preview (approximate)'), previewOf(style)),
      h('div', { class: 'row' },
        h('button', { class: 'primary', onclick: () => vscode.postMessage({ type: 'save', spec: S.spec }) }, 'Save styles.lua'),
        h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: S.code }) }, 'Copy code')),
      statusLine,
      h('div', {}, h('h3', {}, 'Use it'), usagePre,
        h('div', { class: 'row', style: { marginTop: '6px' } },
          h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: usagePre.textContent }) }, 'Copy'),
          h('button', { onclick: () => vscode.postMessage({ type: 'insert', text: usagePre.textContent }) }, 'Insert into editor'))),
      h('div', {}, h('h3', {}, 'styles.lua'), codePre));
    usagePre.textContent = style
      ? `local Styles = require("${S.savedModule}")\ncomponent.stylesheetID = Styles.${style.name}`
      : `local Styles = require("${S.savedModule}")`;
    renderStatus();
    v.replaceChildren(h('div', { class: 'mine' }, list, editor, side));
  }

  function previewOf(style) {
    if (!style) return h('div', { class: 'stage' }, h('span', { class: 'hint' }, 'Nothing selected'));
    const { base } = chainOf(style);
    return h('div', { class: 'stage' }, sample(compOf(base), base, effectiveValues(style)));
  }

  function keyOptions() {
    const keys = new Set([...S.docKeys, ...Object.keys(S.catalog.keys)]);
    return h('datalist', { id: 'keys' }, [...keys].sort().map(k => h('option', { value: k })));
  }

  function styleEditor(style) {
    const others = S.spec.styles.filter(s => s !== style && s.name);
    const parentSel = h('select', { onchange: e => { style.parent = e.target.value; markDirty(); renderMine(); } },
      h('option', { value: '' }, '(none)'),
      S.builtins.map(g => h('optgroup', { label: g.component }, g.ids.map(id => h('option', { value: id, selected: style.parent === id ? true : null }, id)))),
      others.length ? h('optgroup', { label: 'My styles' }, others.map(o => h('option', { value: 'custom:' + o.name, selected: style.parent === 'custom:' + o.name ? true : null }, o.name))) : null);
    const nameErr = !isIdent(style.name || '') ? 'Use letters, digits and _ (a Lua name), e.g. GOLD_BUTTON.'
      : S.spec.styles.some(s => s !== style && s.name === style.name) ? 'Another style already uses this name.' : '';
    const idErr = !Number.isInteger(Number(style.id)) ? 'Must be a whole number.'
      : S.spec.styles.some(s => s !== style && Number(s.id) === Number(style.id)) ? 'Another style already uses this ID.' : '';
    const { chain, base, cycle } = chainOf(style);
    const inherited = base ? S.catalog.sheets[base] || {} : {};
    const rows = (style.values || []).map((v, i) => {
      const isRgb = /(^|\.)rgb$/i.test(v.key || ''), isAlpha = /(^|\.)alpha$/i.test(v.key || '');
      const num = h('input', { type: 'number', value: v.value ?? '', step: 1, oninput: e => { v.value = e.target.value === '' ? '' : Number(e.target.value); markDirty(); refreshPreview(); } });
      const extra = isRgb ? h('input', { type: 'color', value: hex6(v.value || 0), title: 'Pick colour', oninput: e => { v.value = parseInt(e.target.value.slice(1), 16); num.value = v.value; hexOut.textContent = '0x' + e.target.value.slice(1).toUpperCase(); markDirty(); refreshPreview(); } })
        : isAlpha ? h('input', { type: 'range', min: 0, max: 255, value: v.value ?? 255, oninput: e => { v.value = Number(e.target.value); num.value = v.value; markDirty(); refreshPreview(); } }) : null;
      const hexOut = h('span', { class: 'hint' }, isRgb && v.value !== '' && v.value != null ? '0x' + ((Number(v.value) >>> 0) & 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0') : '');
      const known = S.docKeys.includes(v.key) || v.key in S.catalog.keys || /^\d+$/.test(v.key || '');
      return h('tr', {},
        h('td', { style: { width: '45%' } }, h('input', { class: 'key', list: 'keys', value: v.key || '', placeholder: 'button.tint.rgb',
          onchange: e => { v.key = e.target.value.trim(); markDirty(); renderMine(); } }),
          v.key && !known ? h('div', { class: 'warn' }, 'Not a known key. Run Discover keys to check it exists.') : null),
        h('td', {}, h('div', { class: 'valcell' }, num, extra, hexOut)),
        h('td', { class: 'inh' }, v.key && v.key in inherited ? 'parent: ' + fmtVal(v.key, inherited[v.key]) : ''),
        h('td', {}, h('button', { class: 'icon', title: 'Remove', onclick: () => { style.values.splice(i, 1); markDirty(); renderMine(); } }, '✕')));
    });
    const inheritedRows = Object.entries(inherited).filter(([k]) => !(style.values || []).some(v => v.key === k));
    return h('div', { class: 'editor' }, keyOptions(),
      h('div', {}, h('h3', {}, 'Stylesheet'),
        h('div', { class: 'form' },
          h('label', {}, 'Lua name'), h('div', {}, h('input', { value: style.name, style: { width: '100%' }, oninput: e => { style.name = e.target.value.trim(); markDirty(); }, onchange: () => renderMine() }), nameErr ? h('div', { class: 'warn' }, nameErr) : null),
          h('label', {}, 'ID'), h('div', {}, h('input', { type: 'number', value: style.id, oninput: e => { style.id = Number(e.target.value); markDirty(); }, onchange: () => renderMine() }),
            idErr ? h('div', { class: 'warn' }, idErr) : h('div', { class: 'hint' }, 'Stylesheet IDs are shared by every plugin, so pick one that is unlikely to clash. Jagex\'s example uses 10000.')),
          h('label', {}, 'Parent'), h('div', {}, parentSel,
            h('div', { class: 'hint' }, cycle ? 'Parents loop back to this style.' : base ? `Inherits everything from ${base} (${compOf(base)}). Values below override it.` : 'No built-in parent: it only has the values you set.')),
          h('label', {}, 'Note'), h('input', { value: style.note || '', placeholder: 'optional comment in styles.lua', oninput: e => { style.note = e.target.value; markDirty(); } }))),
      h('div', {}, h('h3', {}, 'Values'),
        h('table', { class: 'props' }, h('tr', {}, h('th', {}, 'Key (ui.StyleValue…)'), h('th', {}, 'Value (integer)'), h('th', {}, ''), h('th', {})), rows),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          h('button', { onclick: () => { style.values = style.values || []; style.values.push({ key: compOf(base) === 'Button' && !style.values.some(v => v.key === 'button.tint.rgb') ? 'button.tint.rgb' : '', value: compOf(base) === 'Button' ? 0xC8A24A : '' }); markDirty(); renderMine(); } }, '+ Add value')),
        h('div', { class: 'hint', style: { marginTop: '6px' } },
          'The docs only list button.tint.rgb and button.tint.alpha. Other keys exist in the game; use Discover keys to list them and their default values. Stylesheets only hold integers (colours as 0xRRGGBB).')),
      inheritedRows.length ? h('div', {}, h('h3', {}, `Inherited from ${base} (discovered)`),
        h('table', { class: 'props' }, inheritedRows.map(([k, val]) => h('tr', {}, h('td', {}, k), h('td', { class: 'inh' }, fmtVal(k, val)),
          h('td', {}, h('button', { onclick: () => { style.values.push({ key: k, value: val }); markDirty(); renderMine(); } }, 'Override')))))) : null,
      chain.length > 1 ? h('div', { class: 'hint' }, 'Chain: ' + chain.map(s => s.name).join(' → ') + (base ? ' → ' + base : '')) : null);
  }
  function refreshPreview() {
    const st = views.mine.querySelector('.side .stage');
    if (st) st.replaceWith(previewOf(S.spec.styles[S.sel]));
  }
  function addStyle(parent) {
    const comp = compOf(parent);
    const style = { name: uniqueName((comp === 'Button' ? 'MY_BUTTON' : 'MY_' + comp.toUpperCase())), id: nextId(), parent, values: [] };
    if (comp === 'Button') style.values.push({ key: 'button.tint.rgb', value: 0xC8A24A }, { key: 'button.tint.alpha', value: 255 });
    S.spec.styles.push(style);
    S.sel = S.spec.styles.length - 1;
    S.tab = 'mine';
    markDirty();
    render();
  }
  function duplicate() {
    const s = S.spec.styles[S.sel];
    if (!s) return;
    S.spec.styles.push({ name: uniqueName(s.name + '_COPY'), id: nextId(), parent: s.parent, values: (s.values || []).map(v => ({ ...v })), note: s.note });
    S.sel = S.spec.styles.length - 1;
    markDirty(); renderMine();
  }
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); vscode.postMessage({ type: 'save', spec: S.spec }); }
    if (e.key === 'Delete' && S.tab === 'mine' && !(e.target instanceof HTMLInputElement) && S.spec.styles[S.sel]) {
      S.spec.styles.splice(S.sel, 1); markDirty(); renderMine();
    }
  });

  // ---------------------------------------------------------------- Gallery
  function renderGallery() {
    views.gallery.replaceChildren(h('div', { class: 'gallery' },
      h('div', { class: 'hint' }, 'Built-in stylesheets listed in the RuneScape docs. The look is an approximation; the real client uses its own art. Assign one with component.stylesheetID = id.StyleSheet.NAME, or start a custom style from it.'),
      S.builtins.map(g => h('div', {}, h('h2', {}, g.component),
        h('div', { class: 'cards' }, g.ids.map((id, i) => h('div', { class: 'card' },
          h('div', { class: 'stage' }, sample(g.component, id, S.catalog.sheets[id] || {})),
          h('div', { class: 'meta' },
            h('div', { class: 'row' }, h('code', {}, 'id.StyleSheet.' + id), i === 0 ? h('span', { class: 'badge' }, 'recommended') : null,
              S.catalog.sheets[id] ? h('span', { class: 'badge', title: Object.entries(S.catalog.sheets[id]).map(([k, v]) => k + ' = ' + v).join('\n') }, Object.keys(S.catalog.sheets[id]).length + ' values known') : null),
            h('div', { class: 'row' },
              h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: 'id.StyleSheet.' + id }) }, 'Copy ID'),
              h('button', { onclick: () => addStyle(id) }, 'New style from this'))))))))));
  }

  // ---------------------------------------------------------------- Discover
  const pasteArea = h('textarea', { rows: 10, placeholder: 'Paste the console output here (lines with SV| and SS|)…' });
  const resultLine = h('div', { class: 'result' });
  function renderDiscover() {
    const keys = Object.entries(S.catalog.keys).sort((a, b) => a[0].localeCompare(b[0]));
    const sheets = Object.entries(S.catalog.sheets);
    views.discover.replaceChildren(h('div', { class: 'discover' },
      h('div', {}, h('h3', {}, 'Why'),
        h('div', { class: 'hint', style: { marginBottom: '10px' } }, 'The docs name only two ui.StyleValue keys, but the game has more. This script runs in the dev client and prints every key plus the values the built-in stylesheets use. Importing the output gives you the full key list in the designer, the defaults you inherit, and ui.StyleValue autocomplete.'),
        h('h3', {}, 'Steps'),
        h('ol', {},
          h('li', {}, 'Click ', h('b', {}, 'Create discovery plugin'), ' (or copy the script into a test plugin).'),
          h('li', {}, 'Copy that folder into the beta client\'s ', h('code', {}, 'dev_plugins'), ' folder, run ', h('code', {}, 'prf'), ', then ', h('code', {}, 'pon style_discovery'), '.'),
          h('li', {}, 'Copy the console output and paste it below.')),
        h('div', { class: 'row', style: { margin: '10px 0' } },
          h('button', { class: 'primary', onclick: () => vscode.postMessage({ type: 'makeDiscoveryPlugin' }) }, 'Create discovery plugin'),
          h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: S.discovery }) }, 'Copy script')),
        h('pre', { class: 'code' }, S.discovery)),
      h('div', {}, h('h3', {}, 'Import output'), pasteArea,
        h('div', { class: 'row', style: { marginTop: '8px' } },
          h('button', { class: 'primary', onclick: () => vscode.postMessage({ type: 'import', text: pasteArea.value }) }, 'Import'),
          keys.length ? h('button', { onclick: () => vscode.postMessage({ type: 'clearCatalog' }) }, 'Clear imported keys') : null),
        resultLine),
      h('div', { class: 'catalog' }, h('h3', {}, `Known keys (${keys.length + S.docKeys.filter(k => !(k in S.catalog.keys)).length})`),
        h('table', {}, h('tr', {}, h('th', {}, 'ui.StyleValue key'), h('th', {}, 'Property ID'), h('th', {}, 'Source')),
          S.docKeys.filter(k => !(k in S.catalog.keys)).map(k => h('tr', {}, h('td', {}, k), h('td', {}, '?'), h('td', {}, 'docs'))),
          keys.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, String(v)), h('td', {}, S.docKeys.includes(k) ? 'docs + discovered' : 'discovered')))),
        sheets.length ? h('div', { style: { marginTop: '14px' } }, h('h3', {}, 'Built-in stylesheet values'),
          h('table', {}, h('tr', {}, h('th', {}, 'Stylesheet'), h('th', {}, 'Key'), h('th', {}, 'Value')),
            sheets.flatMap(([s, vals]) => Object.entries(vals).map(([k, v]) => h('tr', {}, h('td', {}, s), h('td', {}, k), h('td', {}, String(v))))))) : null)));
  }

  // ---------------------------------------------------------------- render + messages
  function render() {
    tabbar.querySelector('.title').textContent = 'Style Studio · ' + S.plugin;
    for (const [id, t] of Object.entries(tabs)) { t.setAttribute('aria-selected', String(S.tab === id)); views[id].classList.toggle('hidden', S.tab !== id); }
    if (S.tab === 'mine') renderMine();
    if (S.tab === 'gallery') renderGallery();
    if (S.tab === 'discover') renderDiscover();
  }
  window.addEventListener('message', ev => {
    const m = ev.data;
    if (m.type === 'init') {
      S.spec = m.spec && Array.isArray(m.spec.styles) ? m.spec : { styles: [] };
      S.catalog = m.catalog; S.builtins = m.builtins; S.docKeys = m.docKeys; S.discovery = m.discovery; S.plugin = m.plugin;
      S.sel = 0; S.dirty = false;
      if (!S.spec.styles.length) S.tab = 'gallery';
      render(); regen();
    } else if (m.type === 'generated') {
      S.code = m.code; codePre.textContent = m.code;
    } else if (m.type === 'saved') {
      S.dirty = false; S.savedModule = m.module; renderStatus();
      statusLine.textContent = `Saved ${m.file} and .rs3/styles.json.`;
      if (S.tab === 'mine') renderMine();
    } else if (m.type === 'catalog') {
      S.catalog = m.catalog; render();
    } else if (m.type === 'importResult') {
      resultLine.className = 'result ' + (m.ok ? 'ok' : 'bad');
      resultLine.textContent = m.msg;
      if (m.ok) pasteArea.value = '';
    }
  });
  vscode.postMessage({ type: 'ready' });
})();
