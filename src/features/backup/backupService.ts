import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

import { noteRepository } from '@/src/features/notes/noteRepository';
import { Attachment, NoteRecord } from '@/src/features/notes/types';
import {
  embedAttachmentData,
  materializeAttachmentFromData,
  sanitizeAttachmentId,
  AttachmentWithData,
} from '@/src/features/media/attachmentSerializer';
import { ATTACHMENT_DIR, ensureAttachmentDir, mediaService } from '@/src/features/media/mediaService';

const BASE_DIR = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
const BACKUP_DIR = `${BASE_DIR}backups`;

const ensureBackupDir = async () => {
  const info = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
};

type BackupPayload = {
  version: number;
  exportedAt: number;
  notes: (NoteRecord & { attachments: AttachmentWithData[] })[];
  encryptedFiles?: { path: string; data: string }[];
};

type DocumentPickerReturn = Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
type LegacyDocumentPickerResult =
  | { type: 'success'; uri: string; name?: string }
  | { type: 'cancel' };

const pickFirstAsset = (result: DocumentPickerReturn | LegacyDocumentPickerResult) => {
  if ('type' in result) {
    return result.type === 'success' ? { uri: result.uri, name: result.name } : null;
  }
  if (result.canceled) {
    return null;
  }
  return result.assets?.[0] ?? null;
};

const embedAttachmentForBackup = async (attachment: Attachment): Promise<AttachmentWithData> => {
  try {
    return await embedAttachmentData(attachment);
  } catch (error) {
    console.warn('Attachment konnte nicht gelesen werden, wird ohne Daten exportiert:', attachment.uri, error);
    return { ...attachment };
  }
};

export const backupService = {
  async createBackup(): Promise<{ path: string; filename: string }> {
    await ensureBackupDir();
    const notes = await noteRepository.list();
    const enriched = await Promise.all(
      notes.map(async (note) => ({
        ...note,
        attachments: await Promise.all(note.attachments.map(embedAttachmentForBackup)),
      }))
    );

    const encryptedFiles = await mediaService.dumpEncryptedAttachmentFiles();
    const payload: BackupPayload = {
      version: 1,
      exportedAt: Date.now(),
      notes: enriched,
      encryptedFiles,
    };

    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    const filename = `encrypted-notes-backup-${timestamp}.json`;
    const path = `${BACKUP_DIR}/${filename}`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload), { encoding: 'utf8' });
    return { path, filename };
  },

  async importBackup() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    const asset = pickFirstAsset(result as DocumentPickerReturn);
    if (!asset?.uri) return false;

    const raw = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'utf8' });
    const payload = JSON.parse(raw) as BackupPayload;
    if (!payload.notes) {
      throw new Error('Backup file ist ungueltig');
    }

    for (const note of payload.notes) {
      const attachments = await Promise.all(
        note.attachments.map(async (attachment) => {
          if (attachment.data) {
            return materializeAttachmentFromData(attachment);
          }

          const safeId = sanitizeAttachmentId(attachment.id);
          await ensureAttachmentDir();
          const extension = attachment.name?.split('.').pop() ?? 'bin';
          const target = `${ATTACHMENT_DIR}/${safeId}.${extension}`;
          if (attachment.uri) {
            await FileSystem.copyAsync({ from: attachment.uri, to: target });
          }
          return { ...attachment, id: safeId, uri: target };
        })
      );
      await noteRepository.upsert({
        id: note.id,
        title: note.title,
        content: note.content,
        plainText: note.plain_text,
        tags: note.tags,
        checklist: note.checklist,
        attachments,
        links: note.links ?? [],
        color: note.color,
        pinned: note.pinned,
        isLocked: note.is_locked,
        lockPayload: note.lock_payload ?? null,
        lockVersion: note.lock_version ?? null,
        createdAt: note.created_at,
      });
    }

    if (payload.encryptedFiles?.length) {
      for (const file of payload.encryptedFiles) {
        if (!file.path || !file.data) continue;
        await mediaService.restoreEncryptedAttachmentFile(file.path, file.data);
      }
    }

    return true;
  },
};


