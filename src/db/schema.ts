export const schema = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  plain_text TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  checklist TEXT DEFAULT '[]',
  attachments TEXT DEFAULT '[]',
  links TEXT DEFAULT '[]',
  color TEXT,
  pinned INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  lock_payload TEXT,
  lock_version INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
`;
