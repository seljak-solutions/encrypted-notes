import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useNotesStore } from '@/src/stores/useNotesStore';
import { AppDialog, type DialogConfig } from '@/src/components/AppDialog';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useSecurityStore } from '@/src/stores/useSecurityStore';
import { useThemeStore } from '@/src/stores/useThemeStore';
import { useLanguageStore, type LanguageCode } from '@/src/stores/useLanguageStore';
import { backupService } from '@/src/features/backup/backupService';
import { noteRepository } from '@/src/features/notes/noteRepository';
import { mediaService } from '@/src/features/media/mediaService';
import { runQuery } from '@/src/db';
import type { ThemeName } from '@/src/theme/palette';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';



export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const selectedLanguage = useLanguageStore((state) => state.language);
  const setAppLanguage = useLanguageStore((state) => state.setLanguage);
  const hasPin = useSecurityStore((state) => state.hasPin);
  const enablePin = useSecurityStore((state) => state.enablePin);
  const disablePin = useSecurityStore((state) => state.disablePin);
  const unlockPin = useSecurityStore((state) => state.unlock);
  const notes = useNotesStore((state) => state.notes);
  const refreshNotes = useNotesStore((state) => state.refresh);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [pinModal, setPinModal] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [wipePin, setWipePin] = useState('');
  const [wipePinError, setWipePinError] = useState<string | null>(null);
  const [wipePinVisible, setWipePinVisible] = useState(false);
  const [wipeConfirmVisible, setWipeConfirmVisible] = useState(false);
  const [wipeBusy, setWipeBusy] = useState(false);
  const [storageBytes, setStorageBytes] = useState<number | null>(null);

  const storageUsageLabel =
    storageBytes === null
      ? t('settings.storage.calculating')
      : t('settings.storage.usage', { value: ((storageBytes / (1024 * 1024)).toFixed(2)) });
  const themeOptions = useMemo(
    () => [
      { label: t('settings.theme.light'), description: t('settings.theme.lightDescription'), value: 'light' as ThemeName },
      { label: t('settings.theme.dusk'), description: t('settings.theme.duskDescription'), value: 'dusk' as ThemeName },
      { label: t('settings.theme.dark'), description: t('settings.theme.darkDescription'), value: 'dark' as ThemeName },
    ],
    [t]
  );

  const languageOptions = useMemo(
    () => [
      { label: t('settings.language.german'), value: 'de' as LanguageCode },
      { label: t('settings.language.english'), value: 'en' as LanguageCode },
      { label: t('settings.language.russian'), value: 'ru' as LanguageCode },
    ],
    [t]
  );

  const showPinModal = (message: string) => setPinModal({ visible: true, message });
  const closeDialog = () => setDialogConfig(null);
  const openDialog = (config: DialogConfig) => setDialogConfig(config);

  const loadStorageUsage = useCallback(async () => {
    try {
      const attachmentBytes = await mediaService.getAttachmentsSize();
      const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
      const sqliteDir = `${baseDir}SQLite`;
      const trackedDbPrefixes = ['encrypted-notes', 'noticeapp'];
      let dbBytes = 0;
      try {
        const entries = await FileSystem.readDirectoryAsync(sqliteDir);
        for (const entry of entries) {
          if (!trackedDbPrefixes.some((prefix) => entry.startsWith(prefix))) continue;
          const info = await FileSystem.getInfoAsync(`${sqliteDir}/${entry}`);
          if (info.exists) dbBytes += info.size ?? 0;
        }
      } catch {
        // ignore missing sqlite dir
      }
      setStorageBytes(attachmentBytes + dbBytes);
    } catch {
      setStorageBytes(null);
    }
  }, []);

  useEffect(() => {
    loadStorageUsage();
  }, [loadStorageUsage]);

  useEffect(() => {
    loadStorageUsage();
  }, [notes, loadStorageUsage]);

  useFocusEffect(
    useCallback(() => {
      loadStorageUsage();
    }, [loadStorageUsage])
  );

  const handlePinToggle = async () => {
    if (hasPin) {
      if (currentPin.length < 4) {
        showPinModal(t('settings.pin.feedback.enterCurrent'));
        return;
      }
      const ok = await unlockPin(currentPin);
      if (!ok) {
        showPinModal(t('settings.pin.feedback.invalid'));
        return;
      }
      await disablePin();
      setCurrentPin('');
      showPinModal(t('settings.pin.feedback.disabled'));
    } else {
      if (newPin.length < 4) {
        showPinModal(t('settings.pin.feedback.tooShort'));
        return;
      }
      if (newPin !== confirmPin) {
        showPinModal(t('settings.pin.feedback.mismatch'));
        return;
      }
      await enablePin(newPin);
      setNewPin('');
      setConfirmPin('');
      showPinModal(t('settings.pin.feedback.enabled'));
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const { path } = await backupService.createBackup();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        openDialog({ title: t('settings.backup.exportSuccess'), message: path });
      }
    } catch (error) {
      openDialog({ title: t('settings.backup.exportError'), message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const ok = await backupService.importBackup();
      if (ok) {
        await refreshNotes();
        openDialog({ title: t('settings.backup.importSuccess') });
      }
    } catch (error) {
      openDialog({ title: t('settings.backup.importError'), message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleThemeChange = async (value: ThemeName) => {
    await setTheme(value);
  };

  const handleLanguageChange = async (value: LanguageCode) => {
    await setAppLanguage(value);
  };

  const closePinModal = () => setPinModal({ visible: false, message: '' });
  const closeWipePinModal = () => {
    setWipePin('');
    setWipePinError(null);
    setWipePinVisible(false);
  };
  const closeWipeConfirm = () => setWipeConfirmVisible(false);

  const requestDataDeletion = () => {
    if (hasPin) {
      setWipePinVisible(true);
    } else {
      setWipeConfirmVisible(true);
    }
  };

  const verifyDataDeletionPin = async () => {
    if (wipePin.length < 4) {
      setWipePinError(t('settings.wipe.errors.tooShort'));
      return;
    }
    const ok = await unlockPin(wipePin);
    if (!ok) {
      setWipePinError(t('settings.wipe.errors.invalid'));
      return;
    }
    closeWipePinModal();
    setWipeConfirmVisible(true);
  };

  const handleConfirmDataDeletion = async () => {
    setWipeBusy(true);
    try {
      await runQuery('UPDATE notes SET lock_payload = NULL');
      await noteRepository.removeAll();
      await mediaService.clearAllAttachments();
      await runQuery('PRAGMA wal_checkpoint(TRUNCATE)');
      await runQuery('VACUUM');
      await refreshNotes();
      await loadStorageUsage();
      setPinModal({ visible: true, message: t('settings.wipe.success') });
    } catch (error) {
      openDialog({ title: t('settings.wipe.error'), message: (error as Error).message });
    } finally {
      setWipeBusy(false);
      setWipeConfirmVisible(false);
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://github.com/seljak-solutions/encrypted-notes/blob/master/privacy.html');
    } catch (error) {
      openDialog({ title: 'Error', message: (error as Error).message });
    }
  };

  const backdropColor = theme === 'light' ? 'rgba(15, 16, 25, 0.35)' : 'rgba(0, 0, 0, 0.55)';

  return (
    <>
      <ScrollView
        style={[styles.containerScroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.container}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.pin.title')}</Text>
          {hasPin ? (
            <TextInput
              placeholder={t('settings.pin.currentPlaceholder')}
              placeholderTextColor={colors.muted}
              value={currentPin}
              onChangeText={setCurrentPin}
              keyboardType="number-pad"
              secureTextEntry
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            />
          ) : (
            <>
              <TextInput
                placeholder={t('settings.pin.newPlaceholder')}
                placeholderTextColor={colors.muted}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              />
              <TextInput
                placeholder={t('settings.pin.confirmPlaceholder')}
                placeholderTextColor={colors.muted}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              />
      <AppDialog
        config={dialogConfig}
        visible={Boolean(dialogConfig)}
        fallbackActionLabel={t('common.ok')}
        onClose={closeDialog}
      />
            </>
          )}
          <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={handlePinToggle}>
            <Text style={styles.buttonText}>{hasPin ? t('settings.pin.disable') : t('settings.pin.enable')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.backup.title')}</Text>
          <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleExport} disabled={busy}>
            <Text style={styles.buttonText}>{t('settings.backup.exportAction')}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondary, styles.importButton]}
            onPress={handleImport}
            disabled={busy}
          >
            <Text style={[styles.importButtonText, { color: colors.text }]}>{t('settings.backup.importAction')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.theme.title')}</Text>
          {themeOptions.map((option) => {
            const active = option.value === theme;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.themeRow,
                  {
                    backgroundColor: active ? colors.background : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange(option.value)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.themeLabel, { color: colors.text }]}>{option.label}</Text>
                </View>
                <View
                  style={[
                    styles.themeIndicator,
                    {
                      borderColor: colors.border,
                      backgroundColor: active ? colors.accent : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.language.title')}</Text>
          <Text style={[styles.warningText, { color: colors.muted }]}>{t('settings.language.subtitle')}</Text>
          {languageOptions.map((option) => {
            const active = option.value === selectedLanguage;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.themeRow,
                  {
                    backgroundColor: active ? colors.background : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange(option.value)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.themeLabel, { color: colors.text }]}>{option.label}</Text>
                </View>
                <View
                  style={[
                    styles.themeIndicator,
                    {
                      borderColor: colors.border,
                      backgroundColor: active ? colors.accent : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.wipe.title')}</Text>
          <Text style={[styles.warningText, { color: colors.muted }]}>{t('settings.wipe.warning')}</Text>
          <Text style={[styles.storageText, { color: colors.text }]}>{storageUsageLabel}</Text>
          <Pressable
            style={[styles.button, styles.destructiveButton, {
              borderColor: colors.border,
              backgroundColor: theme === 'light' ? '#ffe8ec' : '#3a0c17'
            }]}
            onPress={requestDataDeletion}
            disabled={wipeBusy}
          >
            <Text style={[styles.destructiveText, { color: theme === 'light' ? '#b22639' : '#ff607b' }]}>{t('settings.wipe.deleteButton')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.privacy.title')}</Text>
          <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.buttonText}>{t('settings.privacy.viewPolicy')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal transparent visible={pinModal.visible} animationType="fade" onRequestClose={closePinModal}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: backdropColor }]} onPress={closePinModal}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{pinModal.message}</Text>
            <Pressable style={[styles.button, { backgroundColor: colors.accent, marginTop: 16 }]} onPress={closePinModal}>
              <Text style={styles.buttonText}>{t('common.ok')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={wipePinVisible} animationType="fade" onRequestClose={closeWipePinModal}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: backdropColor }]} onPress={closeWipePinModal}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.wipe.pinTitle')}</Text>
            <TextInput
              placeholder={t('settings.wipe.pinPlaceholder')}
              placeholderTextColor={colors.muted}
              value={wipePin}
              onChangeText={(text) => {
                setWipePin(text);
                setWipePinError(null);
              }}
              keyboardType="number-pad"
              secureTextEntry
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            />
            {wipePinError ? <Text style={styles.errorText}>{wipePinError}</Text> : null}
            <View style={styles.modalActionRow}>
              <Pressable style={[styles.button, styles.secondary]} onPress={closeWipePinModal}>
                <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={verifyDataDeletionPin}>
                <Text style={styles.buttonText}>{t('settings.common.continue')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={wipeConfirmVisible} animationType="fade" onRequestClose={closeWipeConfirm}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: backdropColor }]} onPress={closeWipeConfirm}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.wipe.confirmTitle')}</Text>
            <Text style={[styles.warningText, { color: colors.muted }]}>{t('settings.wipe.confirmWarning')}</Text>
            <View style={styles.modalActionRow}>
              <Pressable style={[styles.button, styles.secondary]} onPress={closeWipeConfirm} disabled={wipeBusy}>
                <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.destructiveButton, theme === 'light' ? styles.destructiveButtonLight : null, { opacity: wipeBusy ? 0.7 : 1 }]}
                onPress={handleConfirmDataDeletion}
                disabled={wipeBusy}
              >
                <Text style={[styles.destructiveText, theme === 'light' ? styles.destructiveTextLight : null]}>{wipeBusy ? t('settings.wipe.deleting') : t('settings.wipe.confirmDelete')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  containerScroll: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'transparent',
  },
  importButton: {
    borderColor: '#b2b7c8',
    borderWidth: 1,
  },
  importButtonText: {
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#3a0c17',
    borderWidth: 1,
    borderColor: '#b22639',
  },
  destructiveText: {
    color: '#ff607b',
    fontWeight: '600',
  },
  destructiveButtonLight: {
    backgroundColor: '#ffe8ec',
    borderColor: '#ffc8d0',
  },
  destructiveTextLight: {
    color: '#b22639',
  },
  warningText: {
    fontSize: 13,
    marginBottom: 12,
  },
  themeRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeDescription: {
    fontSize: 13,
  },
  themeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff5c5c',
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});


























