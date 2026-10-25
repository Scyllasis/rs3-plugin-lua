// Drag-to-move in the UI preview: rewrite the numbers that position a component in the plugin source.
'use strict';

const NUM = '(-?\\d+(?:\\.\\d+)?)';

/** The call starting at `line` (0-based), up to where its brackets close: [{ line, text }]. */
function statement(lines, line) {
  const out = [];
  let depth = 0, opened = false;
  for (let i = line; i < Math.min(lines.length, line + 40); i++) {
    const text = lines[i];
    out.push({ line: i, text });
    for (const ch of text.replace(/--.*$/, '').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""')) {
      if (ch === '(' || ch === '{') { depth++; opened = true; }
      else if (ch === ')' || ch === '}') depth--;
    }
    if (opened && depth <= 0) break;
    if (!opened && i > line) break;
  }
  return out;
}

const fmt = v => String(Math.round(v * 100) / 100);

/**
 * Plan the edits that move a component by (dx, dy) interface units.
 * `line` is the 1-based line that last set its position (SetPos / SetX / SetY / position = ... or a
 * library call with x = / y = options). Returns { ok, edits: [{ line, start, end, text }], msg }.
 */
function planMove(source, line, dx, dy) {
  const lines = String(source).split(/\r?\n/);
  const stmt = statement(lines, line - 1);
  if (!stmt.length) return { ok: false, msg: 'That line is not in the file any more.' };
  const edits = [];
  const replaceNum = (entry, m, groupIndex, delta) => {
    // position of the captured number inside the line
    const before = m[0].slice(0, m[0].lastIndexOf(m[groupIndex]));
    const start = m.index + before.length;
    edits.push({ line: entry.line, start, end: start + m[groupIndex].length, text: fmt(Number(m[groupIndex]) + delta) });
  };
  // 1) :SetPos(x, y, ...)
  for (const e of stmt) {
    const m = new RegExp(`:SetPos\\s*\\(\\s*${NUM}\\s*,\\s*${NUM}`).exec(e.text);
    if (m) {
      const open = m[0].indexOf('('), comma = m[0].indexOf(',', open);
      const xOff = m.index + m[0].indexOf(m[1], open);
      const yOff = m.index + m[0].indexOf(m[2], comma);
      if (dx) edits.push({ line: e.line, start: xOff, end: xOff + m[1].length, text: fmt(Number(m[1]) + dx) });
      if (dy) edits.push({ line: e.line, start: yOff, end: yOff + m[2].length, text: fmt(Number(m[2]) + dy) });
      return { ok: true, edits, how: 'SetPos' };
    }
  }
  // 2) :SetX(x) / :SetY(y) on this statement
  let sx = null, sy = null;
  for (const e of stmt) {
    const mx = new RegExp(`:SetX\\s*\\(\\s*${NUM}`).exec(e.text);
    if (mx && !sx) sx = { e, m: mx };
    const my = new RegExp(`:SetY\\s*\\(\\s*${NUM}`).exec(e.text);
    if (my && !sy) sy = { e, m: my };
  }
  if (sx || sy) {
    if (dx && !sx) return { ok: false, msg: `Line ${line} only sets Y with a plain number, so it can only move up and down.` };
    if (dy && !sy) return { ok: false, msg: `Line ${line} only sets X with a plain number, so it can only move sideways.` };
    if (dx) replaceNum(sx.e, sx.m, 1, dx);
    if (dy) replaceNum(sy.e, sy.m, 1, dy);
    return { ok: true, edits, how: 'SetX/SetY' };
  }
  // 3) options table: x = 80, y = 80 (PrettyUI Window.new / Panel.new and similar)
  let hasX = null, hasY = null;
  for (const e of stmt) {
    const code = e.text.replace(/--.*$/, '');
    const mx = new RegExp(`(?:^|[{,\\s])x\\s*=\\s*${NUM}\\s*(?=[,}\\s]|$)`).exec(code);
    if (mx && !hasX) hasX = { e, m: mx };
    const my = new RegExp(`(?:^|[{,\\s])y\\s*=\\s*${NUM}\\s*(?=[,}\\s]|$)`).exec(code);
    if (my && !hasY) hasY = { e, m: my };
  }
  if (hasX || hasY) {
    if (dx && !hasX) return { ok: false, msg: 'The options set y but not x. Add x = 0 to move it sideways.' };
    if (dy && !hasY) return { ok: false, msg: 'The options set x but not y. Add y = 0 to move it up or down.' };
    if (dx) replaceNum(hasX.e, hasX.m, 1, dx);
    if (dy) replaceNum(hasY.e, hasY.m, 1, dy);
    return { ok: true, edits, how: 'options' };
  }
  const text = stmt.map(e => e.text).join(' ');
  if (/:(SetPos|SetX|SetY)\s*\(/.test(text) || /\b[xy]\s*=/.test(text))
    return { ok: false, msg: `The position at line ${line} is computed (variables or maths), so it can't be moved automatically.` };
  return { ok: false, msg: `Line ${line} doesn't set a position with plain numbers (it may be laid out automatically, e.g. by PrettyUI's flow layout: use marginTop/offsetY, or absolute = true with x/y).` };
}

module.exports = { planMove, statement };
