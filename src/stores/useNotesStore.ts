import { create } from 'zustand';
import { noteRepository } from '@/src/features/notes/noteRepository';
import { mediaService } from '@/src/features/media/mediaService';
import { parseLockPayload } from '@/src/features/notes/lockPayload';
import { runQuery } from '@/src/db';
import { NoteInput, NoteRecord } from '@/src/features/notes/types';

export type NotesState = {
  notes: NoteRecord[];
  loading: boolean;
  searchQuery: string;
  tagFilter?: string;
  initialized: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  setSearch: (value: string) => void;
  setTagFilter: (value?: string) => void;
  saveNote: (note: NoteInput & { id?: string; createdAt?: number }) => Promise<NoteRecord | undefined>;
  deleteNote: (id: string) => Promise<void>;
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  searchQuery: '',
  tagFilter: undefined,
  initialized: false,
  init: async () => {
    if (get().initialized) return;
    await get().refresh();
    set({ initialized: true });
  },
  refresh: async () => {
    set({ loading: true });
    try {
      const { searchQuery, tagFilter } = get();
      const notes = await noteRepository.list(
        searchQuery.trim() || undefined,
        tagFilter?.trim() || undefined
      );
      set({ notes });
    } catch (error) {
      console.error('Failed to refresh notes', error);
    } finally {
      set({ loading: false });
    }
  },
  setSearch: (value: string) => {
    set({ searchQuery: value });
    get().refresh();
  },
  setTagFilter: (value?: string) => {
    set({ tagFilter: value });
    get().refresh();
  },
  saveNote: async (note) => {
    const saved = await noteRepository.upsert(note);
    await get().refresh();
    return saved ?? undefined;
  },
  deleteNote: async (id: string) => {
    const existing = await noteRepository.findById(id);
    if (existing?.attachments?.length) {
      await Promise.all(existing.attachments.map((attachment) => mediaService.removeAttachment(attachment.uri)));
    }
    const existingLockPayload = parseLockPayload(existing?.lock_payload ?? null);
    if (existingLockPayload?.attachments?.length) {
      await mediaService.removeEncryptedAttachments(existingLockPayload.attachments);
    }
    await noteRepository.remove(id);
    await runQuery('PRAGMA wal_checkpoint(TRUNCATE)');
    await runQuery('VACUUM');
    await get().refresh();
  },
}));
