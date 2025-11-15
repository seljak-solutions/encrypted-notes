import { getFirstAsync, runQuery, getDatabase } from '@/src/db';

export const settingsRepository = {
  async get(key: string) {
    const record = await getFirstAsync<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key]);
    return record?.value ?? null;
  },
  async set(key: string, value: string) {
    await runQuery(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  },
  getSync(key: string) {
    try {
      const db = getDatabase();
      const record = db.getFirstSync<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key]);
      return record?.value ?? null;
    } catch {
      return null;
    }
  },
};
