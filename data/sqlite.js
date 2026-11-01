// Reads rows out of a SQLite file. Read-only and dependency-free, because which SQLite Node offers
// depends on the VS Code version. Handles what PluginData.db needs: ordinary rowid tables, large
// values that spill onto overflow pages, UTF-8 text. No WAL (the client uses a delete journal).
'use strict';

function varint(buf, at) {
  let value = 0n;
  for (let i = 0; i < 8; i += 1) {
    const b = buf[at + i];
    value = (value << 7n) | BigInt(b & 0x7f);
    if (b < 0x80) return { value, size: i + 1 };
  }
  return { value: (value << 8n) | BigInt(buf[at + 8]), size: 9 };
}

function decodeRecord(payload) {
  const head = varint(payload, 0);
  const headerEnd = Number(head.value);
  let at = head.size, body = headerEnd;
  const out = [];
  while (at < headerEnd) {
    const t = varint(payload, at);
    at += t.size;
    const type = Number(t.value);
    if (type === 0) out.push(null);
    else if (type >= 1 && type <= 6) {
      const size = [0, 1, 2, 3, 4, 6, 8][type];
      let n = 0n;
      for (let i = 0; i < size; i += 1) n = (n << 8n) | BigInt(payload[body + i]);
      const value = BigInt.asIntN(size * 8, n);
      out.push(value >= -9007199254740991n && value <= 9007199254740991n ? Number(value) : value);
      body += size;
    } else if (type === 7) { out.push(payload.readDoubleBE(body)); body += 8; }
    else if (type === 8) out.push(0);
    else if (type === 9) out.push(1);
    else if (type >= 12) {
      const size = Math.floor((type - (type % 2 ? 13 : 12)) / 2);
      const bytes = payload.subarray(body, body + size);
      out.push(type % 2 ? bytes.toString('utf8') : Buffer.from(bytes));
      body += size;
    } else throw new Error('Unsupported SQLite value type ' + type);
  }
  return out;
}

class Database {
  constructor(buffer) {
    if (buffer.length < 100 || buffer.toString('latin1', 0, 15) !== 'SQLite format 3') throw new Error('Not a SQLite database.');
    const raw = buffer.readUInt16BE(16);
    this.buf = buffer;
    this.pageSize = raw === 1 ? 65536 : raw;
    this.usable = this.pageSize - buffer[20];
    if (buffer.readUInt32BE(56) !== 1) throw new Error('Only UTF-8 databases are supported.');
    this.pages = Math.floor(buffer.length / this.pageSize);
    this.schema = [...this.rows(1)].map(r => ({ type: r[0], name: r[1], table: r[2], root: r[3], sql: r[4] }));
  }

  page(n) {
    if (!Number.isInteger(n) || n < 1 || n > this.pages) throw new Error('The database file is damaged, or changed while being read.');
    return (n - 1) * this.pageSize;
  }

  /** A cell's payload, gathered from its overflow pages if it has any. */
  payload(start, size) {
    const X = this.usable - 35;
    if (size <= X) return this.buf.subarray(start, start + size);
    const M = Math.floor(((this.usable - 12) * 32) / 255) - 23;
    const K = M + ((size - M) % (this.usable - 4));
    const local = K <= X ? K : M;
    const parts = [this.buf.subarray(start, start + local)];
    let left = size - local;
    let next = this.buf.readUInt32BE(start + local);
    let guard = this.pages + 1;
    while (left > 0) {
      if (!next || guard-- <= 0) throw new Error('The database file is damaged, or changed while being read.');
      const at = this.page(next);
      const take = Math.min(left, this.usable - 4);
      parts.push(this.buf.subarray(at + 4, at + 4 + take));
      left -= take;
      next = this.buf.readUInt32BE(at);
    }
    return Buffer.concat(parts);
  }

  * rows(root, seen = new Set()) {
    if (seen.has(root)) throw new Error('The database file is damaged, or changed while being read.');
    seen.add(root);
    const base = this.page(root);
    const head = root === 1 ? base + 100 : base;
    const kind = this.buf[head];
    const cells = this.buf.readUInt16BE(head + 3);
    if (kind === 0x05) {
      for (let i = 0; i < cells; i += 1) {
        const cell = base + this.buf.readUInt16BE(head + 12 + i * 2);
        yield* this.rows(this.buf.readUInt32BE(cell), seen);
      }
      yield* this.rows(this.buf.readUInt32BE(head + 8), seen);
    } else if (kind === 0x0d) {
      for (let i = 0; i < cells; i += 1) {
        let at = base + this.buf.readUInt16BE(head + 8 + i * 2);
        const size = varint(this.buf, at);
        at += size.size;
        at += varint(this.buf, at).size; // the rowid
        yield decodeRecord(this.payload(at, Number(size.value)));
      }
    } else throw new Error('Unsupported SQLite page type ' + kind);
  }

  /** Every row of a table, as objects keyed by column name. */
  table(name) {
    const entry = this.schema.find(s => s.type === 'table' && s.name === name);
    if (!entry) throw new Error(`There's no ${name} table in this database.`);
    const open = entry.sql.indexOf('(');
    const columns = entry.sql.slice(open + 1).split(',').map(c => c.trim().split(/\s+/)[0].replace(/["`[\]]/g, ''))
      .filter(c => !/^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)$/i.test(c) && c && !/[()]/.test(c));
    return [...this.rows(entry.root)].map(r => Object.fromEntries(columns.map((c, i) => [c, r[i] === undefined ? null : r[i]])));
  }
}

module.exports = { Database, varint, decodeRecord };
