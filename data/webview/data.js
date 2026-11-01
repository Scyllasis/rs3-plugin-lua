// Plugin Data page. Everything shown comes from other plugins' saved data, so it only ever goes in
// as text, never as HTML.
(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  const S = { plugins: [], plugin: null, key: null, tab: 'data', filter: '', error: '', file: '', read: '', dbs: [], db: '', follow: true };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k in el) el[k] = v;
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  }
  const app = document.getElementById('app');
  const current = () => S.plugins.find(p => p.name === S.plugin);

  function toolbar() {
    return h('div', { class: 'bar' },
      S.dbs.length > 1 ? h('select', { onchange: e => vscode.postMessage({ type: 'chooseDb', label: e.target.value }) }, S.dbs.map(d => h('option', { value: d, selected: d === S.db }, d))) : null,
      h('button', { class: S.tab === 'data' ? 'on' : '', onclick: () => { S.tab = 'data'; render(); } }, 'Saved data'),
      h('button', { class: S.tab === 'log' ? 'on' : '', onclick: () => { S.tab = 'log'; render(); } }, 'Log'),
      h('input', { placeholder: 'Filter', value: S.filter, 'aria-label': 'Filter', oninput: e => { S.filter = e.target.value; renderBody(); } }),
      h('span', { class: 'spacer' }),
      h('span', { class: 'muted' }, S.read ? `Read-only. Last read ${S.read}` : ''),
      h('button', { onclick: () => vscode.postMessage({ type: 'refresh' }) }, 'Refresh'));
  }
  function plugins() {
    return h('aside', { class: 'plugins' }, S.plugins.map(p => h('div', { class: 'row' + (p.name === S.plugin ? ' on' : ''), onclick: () => { S.plugin = p.name; S.key = null; render(); } },
      h('span', { class: 'name' }, p.name), h('span', { class: 'muted' }, String(p.rows.length)))));
  }
  function dataTab(p) {
    const needle = S.filter.toLowerCase();
    const rows = p.rows.filter(r => !needle || r.key.toLowerCase().includes(needle) || r.value.toLowerCase().includes(needle));
    const shown = rows.slice(0, 2000);
    const picked = p.rows.find(r => r.key === S.key);
    return h('div', { class: 'split' },
      h('div', { class: 'keys' },
        shown.map(r => h('div', { class: 'row' + (r.key === S.key ? ' on' : ''), onclick: () => { S.key = r.key; renderBody(); } }, h('span', { class: 'name' }, r.key), h('span', { class: 'muted value' }, r.value.slice(0, 60)))),
        rows.length > shown.length ? h('p', { class: 'muted' }, `Showing ${shown.length} of ${rows.length}. Filter to narrow it down.`) : null),
      h('div', { class: 'value-pane' }, picked
        ? [h('div', { class: 'bar' }, h('strong', {}, picked.key), h('span', { class: 'muted' }, `${picked.value.length} characters`), h('span', { class: 'spacer' }), h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: picked.value }) }, 'Copy')), h('pre', {}, picked.value)]
        : h('p', { class: 'muted' }, 'Pick a key to see its value.')));
  }
  function logTab(p) {
    if (!p.log) {
      return h('div', { class: 'empty' }, h('p', {}, `${p.name} isn't capturing its log.`),
        h('p', { class: 'muted' }, 'The client keeps its console to itself. Log capture copies log() lines into the plugin\'s saved data, so they can be read here.'),
        h('button', { onclick: () => vscode.postMessage({ type: 'addLog' }) }, 'Add log capture…'));
    }
    const needle = S.filter.toLowerCase();
    const lines = p.log.filter(l => !needle || l.toLowerCase().includes(needle));
    const pane = h('pre', { class: 'log', onscroll: e => { S.follow = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 8; } }, lines.join('\n'));
    requestAnimationFrame(() => { if (S.follow) pane.scrollTop = pane.scrollHeight; });
    return h('div', { class: 'log-wrap' }, h('div', { class: 'bar' }, h('span', { class: 'muted' }, `${lines.length} lines`), h('span', { class: 'spacer' }), h('button', { onclick: () => vscode.postMessage({ type: 'copy', text: lines.join('\n') }) }, 'Copy')), pane);
  }
  let body;
  function renderBody() {
    const p = current();
    if (S.error) body.replaceChildren(h('p', { class: 'error' }, S.error));
    else if (!p) body.replaceChildren(h('p', { class: 'muted' }, S.plugins.length ? 'Pick a plugin.' : 'No plugin has saved anything yet.'));
    else body.replaceChildren(S.tab === 'log' ? logTab(p) : dataTab(p));
  }
  function render() {
    body = h('main', { class: 'body' });
    app.replaceChildren(toolbar(), h('div', { class: 'main' }, plugins(), body));
    renderBody();
  }

  window.addEventListener('message', ev => {
    const m = ev.data;
    if (m.type === 'error') { S.error = m.msg; render(); return; }
    if (m.type !== 'data') return;
    S.error = '';
    Object.assign(S, { plugins: m.plugins, file: m.file, read: m.read, dbs: m.dbs, db: m.db });
    if (!current()) S.plugin = m.plugins.length ? m.plugins[0].name : null;
    const typing = document.activeElement && document.activeElement.tagName === 'INPUT';
    if (typing) renderBody(); else render(); // keep the caret in the filter box
  });
  render();
  vscode.postMessage({ type: 'ready' });
})();
