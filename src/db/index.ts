import * as SQLite from 'expo-sqlite';
import { schema } from './schema';

let database: SQLite.SQLiteDatabase | null = null;

const ensureColumnExists = (db: SQLite.SQLiteDatabase, table: string, column: string, definition: string) => {
  const info = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (info.some((col) => col.name === column)) return;
  db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};

export const getDatabase = () => {
  if (database) {
    return database;
  }

  const db = SQLite.openDatabaseSync('noticeapp.db');
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync(schema);
  try {
    ensureColumnExists(db, 'notes', 'lock_payload', 'TEXT');
  } catch (error) {
    console.warn('Failed to add lock_payload column', error);
  }
  try {
    ensureColumnExists(db, 'notes', 'lock_version', 'INTEGER DEFAULT 0');
  } catch (error) {
    console.warn('Failed to add lock_version column', error);
  }
  try {
    ensureColumnExists(db, 'notes', 'links', "TEXT DEFAULT '[]'");
  } catch (error) {
    console.warn('Failed to add links column', error);
  }
  database = db;
  return db;
};

export const runQuery = (query: string, params: (string | number | null)[] = []) => {
  const db = getDatabase();
  return db.runAsync(query, params);
};

export const getAllAsync = async <T = any>(query: string, params: (string | number | null)[] = []) => {
  const db = getDatabase();
  const result = await db.getAllAsync<T>(query, params);
  return result;
};

export const getFirstAsync = async <T = any>(query: string, params: (string | number | null)[] = []) => {
  const records = await getAllAsync<T>(query, params);
  return records[0] ?? null;
};

