// Tiny SQL adapter so the same queries run on Supabase Postgres (DATABASE_URL set) or local SQLite (development).
// Queries use `?` placeholders and SQL that both engines accept.
import path from 'node:path';
import fs from 'node:fs';

export async function connect({ url, dataDir }) {
  if (url) {
    const { default: postgres } = await import('postgres');
    const pg = postgres(url, { ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require', max: +process.env.DATABASE_POOL_MAX || 5, idle_timeout: 30, prepare: false, onnotice: () => {} }); // prepare:false works with every Supabase pooler mode
    const toPg = (q) => { let n = 0; return q.replace(/\?/g, () => `$${++n}`); };
    return {
      kind: 'postgres',
      all: (q, ...p) => pg.unsafe(toPg(q), p),
      get: async (q, ...p) => (await pg.unsafe(toPg(q), p))[0],
      run: async (q, ...p) => { await pg.unsafe(toPg(q), p); },
      exec: (q) => pg.unsafe(q).simple(),
      close: () => pg.end(),
    };
  }
  const { DatabaseSync } = await import('node:sqlite');
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'restore.sqlite'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return {
    kind: 'sqlite',
    all: async (q, ...p) => db.prepare(q).all(...p),
    get: async (q, ...p) => db.prepare(q).get(...p),
    run: async (q, ...p) => { db.prepare(q).run(...p); },
    exec: async (q) => db.exec(q),
    close: async () => db.close(),
  };
}
