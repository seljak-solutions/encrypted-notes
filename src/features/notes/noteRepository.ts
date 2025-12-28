import { getAllAsync, getFirstAsync, runQuery } from '@/src/db';
import { stripHtml } from '@/src/utils/text';
import { ChecklistItem, LinkItem, NoteInput, NoteRecord } from './types';
import { v4 as uuidv4 } from 'uuid';

const serialize = (value?: any) => JSON.stringify(value ?? []);
const parse = <T = any>(value?: string | null): T => {
  if (!value) return [] as unknown as T;
  try {
    return JSON.parse(value);
  } catch {
    return [] as unknown as T;
  }
};

const mapRow = (row: any): NoteRecord => ({
  ...row,
  tags: parse<string[]>(row.tags),
  checklist: parse<ChecklistItem[]>(row.checklist),
  attachments: parse(row.attachments),
  links: parse<LinkItem[]>(row.links),
  color: row.color ?? null,
  pinned: Boolean(row.pinned),
  is_locked: Boolean(row.is_locked),
});

export const noteRepository = {
  async list(search?: string, tagFilter?: string) {
    let query = 'SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC';
    const params: (string | number)[] = [];

    if (search && tagFilter) {
      query =
        'SELECT * FROM notes WHERE (plain_text LIKE ? OR title LIKE ?) AND tags LIKE ? ORDER BY pinned DESC, updated_at DESC';
      params.push(`%${search}%`, `%${search}%`, `%"${tagFilter}"%`);
    } else if (search) {
      query = 'SELECT * FROM notes WHERE plain_text LIKE ? OR title LIKE ? ORDER BY pinned DESC, updated_at DESC';
      params.push(`%${search}%`, `%${search}%`);
    } else if (tagFilter) {
      query = 'SELECT * FROM notes WHERE tags LIKE ? ORDER BY pinned DESC, updated_at DESC';
      params.push(`%"${tagFilter}"%`);
    }

    const rows = await getAllAsync(query, params);
    return rows.map(mapRow);
  },

  async findById(id: string) {
    const row = await getFirstAsync('SELECT * FROM notes WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  },

  async upsert(note: NoteInput & { id?: string; createdAt?: number }) {
    const id = note.id ?? uuidv4();
    const now = Date.now();
    const createdAt = note.createdAt ?? now;
    const plainText = note.plainText ?? stripHtml(note.content);

    await runQuery(
      `INSERT INTO notes (id, title, content, plain_text, tags, checklist, attachments, links, color, pinned, is_locked, lock_payload, lock_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        plain_text = excluded.plain_text,
        tags = excluded.tags,
        checklist = excluded.checklist,
        attachments = excluded.attachments,
        links = excluded.links,
        color = excluded.color,
        pinned = excluded.pinned,
        is_locked = excluded.is_locked,
        lock_payload = excluded.lock_payload,
        lock_version = excluded.lock_version,
        updated_at = excluded.updated_at`,
      [
        id,
        note.title,
        note.content,
        plainText,
        serialize(note.tags ?? []),
        serialize(note.checklist ?? []),
        serialize(note.attachments ?? []),
        serialize(note.links ?? []),
        note.color ?? null,
        note.pinned ? 1 : 0,
        note.isLocked ? 1 : 0,
        note.lockPayload ?? null,
        note.lockVersion ?? null,
        createdAt,
        now,
      ]
    );

    return this.findById(id);
  },

  async remove(id: string) {
    await runQuery('DELETE FROM notes WHERE id = ?', [id]);
  },
  async removeAll() {
    await runQuery('DELETE FROM notes');
  },
};
