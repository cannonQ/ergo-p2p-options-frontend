/**
 * Scanner state store — SQLite-backed persistence.
 * Tracks known boxes, retry counts, and last actions.
 */
import Database from 'better-sqlite3';
import { config } from './config.js';

let db: Database.Database;

export function initDb(): void {
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS scanner_state (
      box_id          TEXT PRIMARY KEY,
      contract_addr   TEXT NOT NULL,
      state           TEXT NOT NULL,
      first_seen_height INTEGER NOT NULL,
      retry_count     INTEGER DEFAULT 0,
      last_action     TEXT,
      last_action_at  TEXT,
      resolved        INTEGER DEFAULT 0
    )
  `);
}

function getDb(): Database.Database {
  if (!db) {
    initDb();
  }
  return db;
}

export function upsertBox(
  boxId: string,
  contractAddr: string,
  state: string,
  height: number,
) {
  const d = getDb();
  d.prepare(`
    INSERT INTO scanner_state (box_id, contract_addr, state, first_seen_height)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(box_id) DO UPDATE SET state = excluded.state
  `).run(boxId, contractAddr, state, height);
}

export function getRetryCount(boxId: string): number {
  const d = getDb();
  const row = d.prepare('SELECT retry_count FROM scanner_state WHERE box_id = ?').get(boxId) as any;
  return row?.retry_count ?? 0;
}

export function incrementRetry(boxId: string, action: string) {
  const d = getDb();
  d.prepare(`
    UPDATE scanner_state
    SET retry_count = retry_count + 1,
        last_action = ?,
        last_action_at = datetime('now')
    WHERE box_id = ?
  `).run(action, boxId);
}

export function markResolved(boxId: string) {
  const d = getDb();
  d.prepare('UPDATE scanner_state SET resolved = 1 WHERE box_id = ?').run(boxId);
}

export function getUnresolved(): any[] {
  const d = getDb();
  return d.prepare('SELECT * FROM scanner_state WHERE resolved = 0').all();
}
