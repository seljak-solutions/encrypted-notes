import { NoteComposer } from '@/src/components/NoteComposer';
import { materializeAttachmentFromData, type AttachmentWithData } from '@/src/features/media/attachmentSerializer';
import { mediaService } from '@/src/features/media/mediaService';
import { parseLockPayload } from '@/src/features/notes/lockPayload';
import { noteRepository } from '@/src/features/notes/noteRepository';
import { Attachment, NoteRecord } from '@/src/features/notes/types';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useNotesStore } from '@/src/stores/useNotesStore';
import { decryptNotePayload } from '@/src/utils/encryption';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function NoteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const notes = useNotesStore((state) => state.notes);
  const saveNote = useNotesStore((state) => state.saveNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const [note, setNote] = useState<NoteRecord | null>(null);
  const [editableNote, setEditableNote] = useState<NoteRecord | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockVisible, setUnlockVisible] = useState(false);
  const [sessionLockPassword, setSessionLockPassword] = useState<string | null>(null);
  const hydratedAttachmentsRef = useRef<Attachment[]>([]);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const unlockBaseTitle = t('note.unlock.title');
  const unlockProgressTitle = t('note.unlock.progressTitle');
  const loadingLabel = t('common.loading');
  const unlockModalTitle =
    unlocking && unlockProgressTitle !== 'note.unlock.progressTitle'
      ? unlockProgressTitle
      : unlocking
        ? loadingLabel !== 'common.loading'
          ? loadingLabel
          : 'Decrypting'
        : unlockBaseTitle;

  useEffect(() => {
    const current = notes.find((n) => n.id === id);
    if (current) {
      setNote(current);
    } else if (id) {
      noteRepository.findById(id).then((record) => record && setNote(record));
    }
  }, [id, notes]);

  const noteIsLocked = note?.is_locked ?? false;
  const notePayload = note?.lock_payload ?? null;

  useEffect(() => {
    if (!note) return;
    if (noteIsLocked && notePayload) {
      if (!sessionLockPassword) {
        setUnlockVisible(true);
        setEditableNote(null);
      }
    } else if (!noteIsLocked) {
      setEditableNote(note);
      setSessionLockPassword(null);
      setUnlockVisible(false);
    }
  }, [note, noteIsLocked, notePayload, sessionLockPassword]);

  const applyDecryptedNote = useCallback(async (password: string) => {
    if (!note?.lock_payload) return;
    setUnlocking(true);
    setUnlockProgress(0);
    try {
      const envelope = parseLockPayload(note.lock_payload);
      if (!envelope) {
        throw new Error('LOCK_PAYLOAD_INVALID');
      }
      const decrypted = await decryptNotePayload(password, envelope.payload);
      const legacyAttachments = (decrypted as { attachments?: AttachmentWithData[] }).attachments ?? [];
      if (hydratedAttachmentsRef.current.length) {
        await Promise.all(
          hydratedAttachmentsRef.current.map((attachment) => mediaService.removeAttachment(attachment.uri))
        );
        hydratedAttachmentsRef.current = [];
      }
      let hydratedAttachments: Attachment[] = [];
      if (envelope.attachments?.length) {
        const total = envelope.attachments.length;
        hydratedAttachments = [];
        for (let idx = 0; idx < envelope.attachments.length; idx++) {
          const attachment = envelope.attachments[idx];
          const materialized = await mediaService.materializeLockedAttachment(attachment, password);
          hydratedAttachments.push(materialized);
          setUnlockProgress((idx + 1) / total);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      } else if (legacyAttachments.length) {
        hydratedAttachments = await Promise.all(
          legacyAttachments.map((attachment) => materializeAttachmentFromData(attachment))
        );
      }
      hydratedAttachmentsRef.current = hydratedAttachments;
      setEditableNote({
        ...note,
        content: decrypted.content,
        plain_text: decrypted.plainText,
        checklist: decrypted.checklist,
        attachments: hydratedAttachments,
        links: decrypted.links ?? [],
      });
      setSessionLockPassword(password);
      setUnlockPassword('');
      setUnlockError(null);
      setUnlockVisible(false);
    } catch (error) {
      console.warn('Failed to decrypt note', error);
      setUnlockError(t('note.unlock.error'));
    } finally {
      setUnlocking(false);
      setUnlockProgress(0);
    }
  }, [note, t]);

  useEffect(() => {
    return () => {
      if (note?.is_locked && hydratedAttachmentsRef.current.length) {
        hydratedAttachmentsRef.current.forEach((attachment) => {
          void mediaService.removeAttachment(attachment.uri);
        });
        hydratedAttachmentsRef.current = [];
      }
    };
  }, [note?.is_locked]);

  useEffect(() => {
    if (!noteIsLocked || !sessionLockPassword) return;
    void applyDecryptedNote(sessionLockPassword);
  }, [noteIsLocked, notePayload, sessionLockPassword, applyDecryptedNote]);

  if (!id) return null;

  return (
    <>
      {editableNote ? (
        <NoteComposer
          note={editableNote}
          initialLockPassword={sessionLockPassword}
          onPersist={async (payload) => {
            await saveNote({ ...payload, id });
            router.back();
          }}
          onDelete={async () => {
            await deleteNote(id);
            router.back();
          }}
        />
      ) : null}
      {note?.is_locked ? (
        <Modal transparent visible={unlockVisible} animationType="fade" onRequestClose={() => router.back()}>
          <View style={[styles.overlay, { backgroundColor: colors.background }]}> 
            <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.dialogTitle, { color: colors.text }]}>{unlockModalTitle}</Text>
              {unlocking ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator color={colors.accent} />
                  <View style={[styles.progressBar, { borderColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.accent, width: `${Math.max(10, unlockProgress * 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <TextInput
                  placeholder={t('common.password')}
                  placeholderTextColor={colors.muted}
                  value={unlockPassword}
                  onChangeText={(text) => {
                    setUnlockPassword(text);
                    setUnlockError(null);
                  }}
                  secureTextEntry
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                />
              )}
              {unlockError ? <Text style={styles.error}>{unlockError}</Text> : null}
              <View style={styles.dialogActions}>
                <Pressable
                  style={[styles.dialogButton, { borderColor: colors.border, opacity: unlocking ? 0.6 : 1 }]}
                  onPress={() => router.back()}
                  disabled={unlocking}
                >
                  <Text style={[styles.dialogButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogButton, styles.dialogPrimary, { backgroundColor: colors.accent, opacity: unlocking ? 0.6 : 1 }]}
                  onPress={() => void applyDecryptedNote(unlockPassword)}
                  disabled={unlocking}
                >
                  {unlocking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.dialogPrimaryText}>{t('common.unlock')}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: '#f56c6c',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogButtonText: {
    fontWeight: '600',
  },
  dialogPrimary: {
    borderWidth: 0,
  },
  dialogPrimaryText: {
    fontWeight: '600',
    color: '#fff',
  },
});




