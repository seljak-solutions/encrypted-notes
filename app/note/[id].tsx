import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { NoteComposer } from '@/src/components/NoteComposer';
import { useNotesStore } from '@/src/stores/useNotesStore';
import { Attachment, NoteRecord } from '@/src/features/notes/types';
import { noteRepository } from '@/src/features/notes/noteRepository';
import { decryptNotePayload, type EncryptedPayloadInput } from '@/src/utils/encryption';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { materializeAttachmentFromData } from '@/src/features/media/attachmentSerializer';
import { mediaService } from '@/src/features/media/mediaService';

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
    try {
      const payload = JSON.parse(note.lock_payload) as EncryptedPayloadInput;
      const decrypted = await decryptNotePayload(password, payload);
      const decryptedAttachments = decrypted.attachments ?? [];
      if (hydratedAttachmentsRef.current.length) {
        await Promise.all(
          hydratedAttachmentsRef.current.map((attachment) => mediaService.removeAttachment(attachment.uri))
        );
        hydratedAttachmentsRef.current = [];
      }
      const hydratedAttachments = await Promise.all(
        decryptedAttachments.map((attachment) => materializeAttachmentFromData(attachment))
      );
      hydratedAttachmentsRef.current = hydratedAttachments;
      setEditableNote({
        ...note,
        content: decrypted.content,
        plain_text: decrypted.plainText,
        checklist: decrypted.checklist,
        attachments: hydratedAttachments,
      });
      setSessionLockPassword(password);
      setUnlockPassword('');
      setUnlockError(null);
      setUnlockVisible(false);
    } catch (error) {
      console.warn('Failed to decrypt note', error);
      setUnlockError(t('note.unlock.error'));
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
              <Text style={[styles.dialogTitle, { color: colors.text }]}>{t('note.unlock.title')}</Text>
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
              {unlockError ? <Text style={styles.error}>{unlockError}</Text> : null}
              <View style={styles.dialogActions}>
                <Pressable style={[styles.dialogButton, { borderColor: colors.border }]} onPress={() => router.back()}>
                  <Text style={[styles.dialogButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogButton, styles.dialogPrimary, { backgroundColor: colors.accent }]}
                  onPress={() => void applyDecryptedNote(unlockPassword)}
                >
                  <Text style={styles.dialogPrimaryText}>{t('common.unlock')}</Text>
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



