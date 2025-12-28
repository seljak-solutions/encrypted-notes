import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  Switch,
  GestureResponderEvent,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { NoteInput, NoteRecord, ChecklistItem, Attachment, LinkItem } from '@/src/features/notes/types';
import { AppDialog, type DialogConfig } from '@/src/components/AppDialog';
import { LOCK_PAYLOAD_VERSION, parseLockPayload, type LockedAttachmentDescriptor } from '@/src/features/notes/lockPayload';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { mediaService } from '@/src/features/media/mediaService';
import { stripHtml } from '@/src/utils/text';
import { v4 as uuidv4 } from 'uuid';
import { encryptNotePayload, type SecureNotePayload } from '@/src/utils/encryption';
import { Image } from 'expo-image';
import { Audio, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
interface Props {
  note?: NoteRecord | null;
  onPersist: (payload: NoteInput & { id?: string; createdAt?: number }) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialLockPassword?: string | null;
}
const QuickActionButton = ({
  icon,
  label,
  onPress,
  colors,
  showLabel = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: { accent: string; border: string; card: string; text: string; muted: string };
  showLabel?: boolean;
}) => (
  <Pressable
    style={[styles.quickAction, { borderColor: colors.border }, !showLabel && styles.quickActionIconOnly]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={16} color={colors.text} />
    {showLabel ? (
      <Text style={[styles.quickActionText, { color: colors.text }]}>{label}</Text>
    ) : null}
  </Pressable>
);
const AttachmentCard = ({
  attachment,
  onRemove,
  onPress,
  onMenu,
  colors,
  playbackState,
  audioPlayingLabel,
}: {
  attachment: Attachment;
  onRemove: () => void;
  onPress: () => void;
  onMenu: () => void;
  colors: { border: string; background: string; text: string; muted: string };
  audioPlayingLabel: string;
  playbackState?: 'playing' | 'paused' | null;
}) => (
  <Pressable
    style={[styles.attachmentCard, { borderColor: colors.border, backgroundColor: colors.background }]}
    onPress={onPress}
  >
    <View style={styles.attachmentInfo}>
      <Ionicons
        name={
          attachment.type === 'image'
            ? 'image-outline'
            : attachment.type === 'video'
              ? 'videocam-outline'
              : playbackState === 'playing'
                ? 'pause'
                : 'musical-notes-outline'
        }
        size={20}
        color={colors.text}
      />
      <View style={styles.attachmentTextWrap}>
        <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
          {attachment.name ?? attachment.id}
        </Text>
        <Text style={[styles.attachmentMeta, { color: colors.muted }]}>
          {attachment.type === 'audio' && playbackState === 'playing'
            ? audioPlayingLabel
            : attachment.type.toUpperCase()}
        </Text>
      </View>
    </View>
    <Pressable
      onPress={(event: GestureResponderEvent) => {
        event.stopPropagation();
        onMenu();
      }}
      style={styles.attachmentMenuButton}
    >
      <Ionicons name="reorder-three-outline" size={18} color={colors.text} />
    </Pressable>
  </Pressable>
);
type ActionSheetAction = {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'accent' | 'destructive';
};
type ActionSheetConfig = {
  title: string;
  message?: string;
  actions: ActionSheetAction[];
};
export const NoteComposer = ({ note, onPersist, onDelete, initialLockPassword }: Props) => {
  const { colors } = useAppTheme();
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';
  const { width } = useWindowDimensions();
  const showAttachmentLabels = width >= 420;
  const showChecklistLabel = !isRussian;
  const editorRef = useRef<RichEditor>(null);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '<p></p>');
  const [tagsInput, setTagsInput] = useState(note?.tags?.join(', ') ?? '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist ?? []);
  const [attachments, setAttachments] = useState<Attachment[]>(note?.attachments ?? []);
  const [links, setLinks] = useState<LinkItem[]>(note?.links ?? []);
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [isLocked, setIsLocked] = useState(note?.is_locked ?? false);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lockPassword, setLockPassword] = useState<string | null>(initialLockPassword ?? null);
  const [lockPromptVisible, setLockPromptVisible] = useState(false);
  const [lockWarningVisible, setLockWarningVisible] = useState(false);
  const [lockDraft, setLockDraft] = useState({ password: '', confirm: '' });
  const [lockError, setLockError] = useState<string | null>(null);
  const [actionSheet, setActionSheet] = useState<ActionSheetConfig | null>(null);
  const [statusModal, setStatusModal] = useState<{ message: string; variant?: 'success' | 'warning' } | null>(null);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [lockProcessing, setLockProcessing] = useState(false);
  const [lockProcessingProgress, setLockProcessingProgress] = useState(0);
  const closeDialog = () => setDialogConfig(null);
  const openDialog = (config: DialogConfig) => setDialogConfig(config);
  const [imagePreview, setImagePreview] = useState<Attachment | null>(null);
  const [videoPreview, setVideoPreview] = useState<Attachment | null>(null);
  const audioPlayerRef = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioPlaybackState, setAudioPlaybackState] = useState<'playing' | 'paused' | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '<p></p>');
    setTagsInput(note?.tags?.join(', ') ?? '');
    setChecklist(note?.checklist ?? []);
    setAttachments(note?.attachments ?? []);
    setLinks(note?.links ?? []);
    setPinned(note?.pinned ?? false);
    setIsLocked(note?.is_locked ?? false);
  }, [note]);
  useEffect(() => {
    setLockPassword(initialLockPassword ?? null);
  }, [initialLockPassword]);
  useEffect(() => () => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
  }, []);
  useEffect(() => () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.unloadAsync();
    }
  }, []);
  const headingIconMap = useMemo(
    () => ({
      [actions.heading1]: () => <Text style={[styles.toolbarHeading, { color: colors.text }]}>H1</Text>,
      [actions.heading2]: () => <Text style={[styles.toolbarHeading, { color: colors.text }]}>H2</Text>,
    }),
    [colors.text]
  );
  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput]
  );
  const handleAddChecklistItem = () => {
    setChecklist((prev) => [...prev, { id: uuidv4(), text: t('noteComposer.checklist.newItem'), done: false }]);
  };
  const updateChecklistText = (id: string, text: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  };
  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };
  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };
  const handleAddLink = () => {
    setLinks((prev) => [...prev, { id: uuidv4(), label: t('noteComposer.links.defaultDescription'), url: '' }]);
  };
  const updateLinkField = (id: string, field: 'label' | 'url', value: string) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)));
  };
  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };
  const openLink = async (link: LinkItem) => {
    const rawUrl = link.url.trim();
    if (!rawUrl) {
      openDialog({ title: t('noteComposer.links.openErrorTitle'), message: t('noteComposer.links.openMissingUrl') });
      return;
    }
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
      const supported = await Linking.canOpenURL(normalizedUrl);
      if (!supported) {
        openDialog({ title: t('noteComposer.links.openErrorTitle'), message: t('noteComposer.links.openUnsupported') });
        return;
      }
      await Linking.openURL(normalizedUrl);
    } catch (error) {
      openDialog({ title: t('noteComposer.links.openErrorTitle'), message: (error as Error).message });
    }
  };
  const removeAttachment = async (id: string, uri: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    await mediaService.removeAttachment(uri);
  };
  const appendAttachment = (attachment?: Attachment) => {
    if (!attachment) return;
    setAttachments((prev) => [...prev, attachment]);
  };
  const handleLockToggle = (value: boolean) => {
    if (value) {
      if (lockPassword) {
        setIsLocked(true);
        setLockWarningVisible(true);
        return;
      }
      setIsLocked(true);
      setLockPromptVisible(true);
      return;
    }
    setIsLocked(false);
    setLockPassword(null);
  };
  const resetLockDraft = () => {
    setLockDraft({ password: '', confirm: '' });
    setLockError(null);
  };
  const closeLockPrompt = () => {
    setLockPromptVisible(false);
    if (!lockPassword) {
      setIsLocked(false);
    }
    resetLockDraft();
  };
  const confirmLockPassword = () => {
    if (lockDraft.password.length < 6) {
      setLockError(t('noteComposer.lock.errorLength'));
      return;
    }
    if (lockDraft.password !== lockDraft.confirm) {
      setLockError(t('noteComposer.lock.errorMismatch'));
      return;
    }
    setLockPassword(lockDraft.password);
    setLockPromptVisible(false);
    resetLockDraft();
    setLockWarningVisible(true);
  };
  const showStatusModal = (message: string, variant: 'success' | 'warning' = 'success') => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatusModal({ message, variant });
    statusTimerRef.current = setTimeout(() => {
      setStatusModal(null);
      statusTimerRef.current = null;
    }, 1600);
  };
  const dismissActionSheet = () => setActionSheet(null);
  const stopAudioPlayback = async () => {
    if (audioPlayerRef.current) {
      try {
        await audioPlayerRef.current.stopAsync();
      } catch {
        // ignore
      }
      await audioPlayerRef.current.unloadAsync();
      audioPlayerRef.current = null;
    }
    setActiveAudioId(null);
    setAudioPlaybackState(null);
  };
  const handleAudioAttachment = async (attachment: Attachment) => {
    try {
      if (activeAudioId === attachment.id) {
        if (audioPlaybackState === 'playing') {
          await audioPlayerRef.current?.pauseAsync();
          setAudioPlaybackState('paused');
        } else {
          await audioPlayerRef.current?.playAsync();
          setAudioPlaybackState('playing');
        }
        return;
      }
      await stopAudioPlayback();
      const { sound } = await Audio.Sound.createAsync({ uri: attachment.uri });
      audioPlayerRef.current = sound;
      setActiveAudioId(attachment.id);
      setAudioPlaybackState('playing');
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          stopAudioPlayback();
        }
      });
      await sound.playAsync();
    } catch (error) {
      openDialog({ title: t('noteComposer.audio.playbackError'), message: (error as Error).message });
      await stopAudioPlayback();
    }
  };
  const handleAttachmentPress = (attachment: Attachment) => {
    if (attachment.type === 'image') {
      setImagePreview(attachment);
      return;
    }
    if (attachment.type === 'video') {
      setVideoPreview(attachment);
      return;
    }
    void handleAudioAttachment(attachment);
  };
  const shareAttachment = async (attachment: Attachment) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
    openDialog({ title: t('noteComposer.share.unavailable'), message: t('noteComposer.share.unsupported') });
        return;
      }
      await Sharing.shareAsync(attachment.uri, {
        mimeType: attachment.mimeType,
        dialogTitle: t('noteComposer.share.dialogTitle'),
      });
    } catch (error) {
      openDialog({ title: t('noteComposer.share.failed'), message: (error as Error).message });
    }
  };
  const exportAttachment = async (attachment: Attachment) => {
    try {
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
      openDialog({ title: t('noteComposer.export.noFolderTitle'), message: t('noteComposer.export.noFolderMessage') });
          return;
        }
        const extension = attachment.name?.split('.').pop() ?? (attachment.type === 'image' ? 'jpg' : 'm4a');
        const targetName = attachment.name ?? `${attachment.type}-${attachment.id}.${extension}`;
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          targetName,
          attachment.mimeType ?? 'application/octet-stream'
        );
        const data = await FileSystem.readAsStringAsync(attachment.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        showStatusModal(t('noteComposer.export.copySaved'));
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
    openDialog({ title: t('noteComposer.export.unavailable'), message: t('noteComposer.export.unsupported') });
        return;
      }
      await Sharing.shareAsync(attachment.uri, {
        mimeType: attachment.mimeType,
        dialogTitle: t('noteComposer.export.dialogTitle'),
      });
    } catch (error) {
      openDialog({ title: t('noteComposer.export.failed'), message: (error as Error).message });
    }
  };
  const withAttachmentHandling = async (
    action: () => Promise<Attachment | undefined>,
    errorTitle: string
  ) => {
    try {
      const attachment = await action();
      appendAttachment(attachment);
    } catch (error) {
      openDialog({ title: errorTitle, message: (error as Error).message });
    }
  };
  const handleImageAction = () => {
    setActionSheet({
      title: t('noteComposer.actions.image.title'),
      message: t('noteComposer.actions.image.message'),
      actions: [
        { label: t('common.cancel') },
        {
          label: t('noteComposer.actions.gallery'),
          onPress: () => void withAttachmentHandling(mediaService.pickImageFromLibrary, t('noteComposer.actions.imageLoadError')),
        },
        {
          label: t('noteComposer.actions.camera'),
          variant: 'accent',
          onPress: () => void withAttachmentHandling(mediaService.captureImage, t('noteComposer.media.captureUnavailable')),
        },
      ],
    });
  };
  const startRecording = async () => {
    try {
      await mediaService.startAudioRecording();
      setIsRecording(true);
    } catch (error) {
      openDialog({ title: t('noteComposer.audio.startError'), message: (error as Error).message });
    }
  };
  const stopRecording = async () => {
    try {
      const attachment = await mediaService.stopAudioRecording();
      appendAttachment(attachment);
    } catch (error) {
      openDialog({ title: t('noteComposer.audio.recordingSaveError'), message: (error as Error).message });
    } finally {
      setIsRecording(false);
    }
  };
  const handleAudioAction = () => {
    if (isRecording) {
      void stopRecording();
      return;
    }
    setActionSheet({
      title: t('noteComposer.actions.audio.title'),
      message: t('noteComposer.actions.audio.message'),
      actions: [
        { label: t('common.cancel') },
        {
          label: t('noteComposer.actions.audioPick'),
          onPress: () =>
            void withAttachmentHandling(mediaService.pickAudioFile, t('noteComposer.actions.audioLoadError')),
        },
        {
          label: t('noteComposer.actions.audioRecord'),
          variant: 'accent',
          onPress: () => void startRecording(),
        },
      ],
    });
  };
  const handleVideoAction = () => {
    setActionSheet({
      title: t('noteComposer.actions.video.title'),
      message: t('noteComposer.actions.video.message'),
      actions: [
        { label: t('common.cancel') },
        {
          label: t('noteComposer.actions.videoGallery'),
          onPress: () => void withAttachmentHandling(mediaService.pickVideoFromLibrary, t('noteComposer.actions.videoLoadError')),
        },
        {
          label: t('noteComposer.actions.videoRecord'),
          variant: 'accent',
          onPress: () => void withAttachmentHandling(mediaService.captureVideo, t('noteComposer.media.captureUnavailable')),
        },
      ],
    });
  };
  const handleSave = async () => {
    if (!title.trim()) {
      showStatusModal(t('noteComposer.titleMissing'), 'warning');
      return;
    }
    setSaving(true);
    const existingLockPayload = parseLockPayload(note?.lock_payload ?? null);
    const newEncryptedAttachments: LockedAttachmentDescriptor[] = [];
    let attachmentsToCleanUp: Attachment[] = [];
    let encryptedToCleanUp: LockedAttachmentDescriptor[] = [];
    try {
      let nextContent = content;
      let nextPlain = stripHtml(content);
      let nextChecklist = checklist;
      let nextAttachments = attachments;
      const normalizedLinks = links
        .map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() }))
        .filter((link) => link.label || link.url);
      let nextLinks = normalizedLinks;
      let lockPayload: string | null = note?.lock_payload ?? null;
      let lockVersion: number | null = note?.lock_version ?? null;
      if (isLocked) {
        if (!lockPassword) {
          showStatusModal(t('noteComposer.lock.setPasswordPrompt'), 'warning');
          return;
        }
        if (attachments.length) {
          setLockProcessing(true);
          setLockProcessingProgress(0);
        }
        try {
          for (let idx = 0; idx < attachments.length; idx++) {
            const descriptor = await mediaService.encryptAttachmentForLock(attachments[idx], lockPassword);
            newEncryptedAttachments.push(descriptor);
            if (attachments.length) {
              setLockProcessingProgress((idx + 1) / attachments.length);
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        } catch {
          await mediaService.removeEncryptedAttachments(newEncryptedAttachments);
          throw new Error('LOCK_ATTACHMENT_ENCRYPT_FAILED');
        }
        const securePayload: SecureNotePayload = {
          content,
          plainText: nextPlain,
          checklist,
          links: normalizedLinks,
        };
        const encrypted = await encryptNotePayload(lockPassword, securePayload);
        const envelope = {
          version: LOCK_PAYLOAD_VERSION,
          payload: encrypted,
          attachments: newEncryptedAttachments,
        };
        lockPayload = JSON.stringify(envelope);
        lockVersion = envelope.version;
        nextContent = t('noteComposer.lock.encryptedHtml');
        nextPlain = t('noteComposer.lock.encryptedPreview');
        nextChecklist = [];
        nextAttachments = [];
        nextLinks = [];
        encryptedToCleanUp = existingLockPayload?.attachments ?? [];
        attachmentsToCleanUp = attachments;
      } else {
        lockPayload = null;
        lockVersion = null;
        encryptedToCleanUp = existingLockPayload?.attachments ?? [];
      }
      await onPersist({
        id: note?.id,
        title: title.trim(),
        content: nextContent,
        plainText: nextPlain,
        tags,
        checklist: nextChecklist,
        attachments: nextAttachments,
        links: nextLinks,
        pinned,
        isLocked,
        lockPayload,
        lockVersion,
        createdAt: note?.created_at,
      });
      setLinks(nextLinks);
      if (attachmentsToCleanUp.length) {
        await Promise.all(
          attachmentsToCleanUp.map((attachment) => mediaService.removeAttachment(attachment.uri))
        );
      }
      if (encryptedToCleanUp.length) {
        await mediaService.removeEncryptedAttachments(encryptedToCleanUp);
      }
      showStatusModal(t('noteComposer.status.saved'));
    } catch (error) {
      if (newEncryptedAttachments.length) {
        await mediaService.removeEncryptedAttachments(newEncryptedAttachments);
      }
      if ((error as Error).message === 'LOCK_ATTACHMENT_ENCRYPT_FAILED') {
        setDialogConfig({ title: t('noteComposer.lock.attachmentEncryptionFailed') });
      } else {
        setDialogConfig({ title: t('noteComposer.error.saveFailed'), message: (error as Error).message });
      }
    } finally {
      setLockProcessing(false);
      setLockProcessingProgress(0);
      setSaving(false);
    }
  };
  const handleDelete = () => {
    if (!onDelete || !note?.id) return;
    openDialog({
      title: t('noteComposer.delete.title'),
      message: t('noteComposer.delete.message'),
      actions: [
        { label: t('common.cancel') },
        { label: t('common.delete'), variant: 'destructive', onPress: () => onDelete && onDelete() },
      ],
    });
  };
  const openAttachmentMenu = (attachment: Attachment) => {
    setActionSheet({
      title: attachment.name ?? t('noteComposer.attachmentMenu.titleFallback'),
      actions: [
        {
          label: t('noteComposer.attachmentMenu.export'),
          onPress: () => void exportAttachment(attachment),
        },
        {
          label: t('noteComposer.attachmentMenu.share'),
          onPress: () => void shareAttachment(attachment),
        },
        {
          label: t('common.delete'),
          variant: 'destructive',
          onPress: () => void removeAttachment(attachment.id, attachment.uri),
        },
        { label: t('common.cancel') },
      ],
    });
  };
  const encryptingStatusRaw = t('noteComposer.lock.encryptingStatus');
  const encryptingStatusLabel =
    encryptingStatusRaw === 'noteComposer.lock.encryptingStatus'
      ? (() => {
          const loadingText = t('common.loading');
          return loadingText === 'common.loading' ? 'Encrypting attachments…' : loadingText;
        })()
      : encryptingStatusRaw;
  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.pageHeader}>
          <Pressable style={styles.headerBack} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            {note?.id ? t('noteComposer.screen.editTitle') : t('noteComposer.screen.newTitle')}
          </Text>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.sectionSpacing, styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.heroCardInner}>
                <TextInput
                  placeholder={t('noteComposer.titlePlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={title}
                  onChangeText={setTitle}
                  style={[styles.titleInput, { color: colors.text }]}
                />
                <View style={styles.metaRow}>
                  <View style={[styles.metaToggle, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>{t('noteComposer.meta.pinned')}</Text>
                    <Switch value={pinned} onValueChange={setPinned} />
                  </View>
                  <View style={[styles.metaToggle, { borderColor: colors.border }]}
                  >
                <Text style={[styles.metaLabel, { color: colors.muted }]}>{t('noteComposer.meta.lock')}</Text>
                    <Switch value={isLocked} onValueChange={handleLockToggle} />
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.sectionSpacing, styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardInner}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('noteComposer.sections.content.title')}</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{t('noteComposer.sections.content.subtitle')}</Text>
                  </View>
                </View>
                <RichToolbar
                  editor={editorRef}
                  selectedIconTint={colors.accent}
                  iconTint={colors.muted}
                  selectedButtonStyle={{ backgroundColor: colors.background }}
                  iconMap={headingIconMap}
                  actions={[
                    actions.heading1,
                    actions.heading2,
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.checkboxList,
                    actions.blockquote,
                    actions.code,
                  ]}
                  style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}
                />
                <View style={[styles.editorSurface, { borderColor: colors.border }]}>
                  <RichEditor
                    ref={editorRef}
                    initialContentHTML={content}
                    onChange={setContent}
                    editorStyle={{
                      backgroundColor: colors.card,
                      color: colors.text,
                      placeholderColor: colors.muted,
                    }}
                    style={{ minHeight: 220 }}
                  />
                </View>
              </View>
            </View>
            <View style={[styles.sectionSpacing, styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardInner}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('noteComposer.sections.attachments.title')}</Text>
                </View>
                <View style={styles.quickActionsRow}>
                  <QuickActionButton icon="image-outline" label={t('noteComposer.quickActions.image')} onPress={handleImageAction} colors={colors} showLabel={showAttachmentLabels} />
                  <QuickActionButton icon="videocam-outline" label={t('noteComposer.quickActions.video')} onPress={handleVideoAction} colors={colors} showLabel={showAttachmentLabels} />
                  <QuickActionButton
                    icon={isRecording ? 'stop-circle-outline' : 'mic-outline'}
                    label={isRecording ? t('noteComposer.quickActions.stop') : t('noteComposer.quickActions.audio')}
                    onPress={handleAudioAction}
                    colors={colors}
                    showLabel={showAttachmentLabels}
                  />
                </View>
                {attachments.length ? (
                  <View style={styles.attachmentList}>
                    {attachments.map((att) => (
                      <AttachmentCard
                        key={att.id}
                        attachment={att}
                        colors={colors}
                        onRemove={() => removeAttachment(att.id, att.uri)}
                        onPress={() => handleAttachmentPress(att)}
                        onMenu={() => openAttachmentMenu(att)}
                        playbackState={activeAudioId === att.id ? audioPlaybackState : null}
                        audioPlayingLabel={t('noteComposer.audio.nowPlaying')}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.hintText, { color: colors.muted }]}>{t('noteComposer.sections.attachments.empty')}</Text>
                )}
              </View>
            </View>
            <View style={[styles.sectionSpacing, styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardInner}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('noteComposer.sections.links.title')}</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{t('noteComposer.sections.links.subtitle')}</Text>
                  </View>
                  <Pressable style={[styles.outlineButton, { borderColor: colors.border }]} onPress={handleAddLink}>
                    <Ionicons name="add" size={16} color={colors.text} />
                    <Text style={[styles.outlineButtonText, { color: colors.text }]}>{t('noteComposer.sections.links.addButton')}</Text>
                  </Pressable>
                </View>
                {links.length ? (
                  <View style={styles.linkList}>
                    {links.map((link) => (
                      <View key={link.id} style={[styles.linkRow, { borderColor: colors.border }]}>
                        <View style={styles.linkFields}>
                          <TextInput
                            value={link.label}
                            onChangeText={(text) => updateLinkField(link.id, 'label', text)}
                            placeholder={t('noteComposer.sections.links.descriptionPlaceholder')}
                            placeholderTextColor={colors.muted}
                            style={[styles.linkInput, { borderColor: colors.border, color: colors.text }]}
                          />
                          <View style={styles.linkUrlRow}>
                            <TextInput
                              value={link.url}
                              onChangeText={(text) => updateLinkField(link.id, 'url', text)}
                              placeholder={t('noteComposer.sections.links.urlPlaceholder')}
                              placeholderTextColor={colors.muted}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                              style={[styles.linkInput, styles.linkUrlInput, { borderColor: colors.border, color: colors.text, flex: 1 }]}
                            />
                            <Pressable
                              style={[styles.linkOpenButton, { borderColor: colors.border }]}
                              onPress={() => void openLink(link)}
                              accessibilityHint={t('noteComposer.links.openHint')}
                            >
                              <Ionicons name="link-outline" size={16} color={colors.accent} />
                            </Pressable>
                          </View>
                        </View>
                        <Pressable style={styles.linkRemoveButton} onPress={() => removeLink(link.id)}>
                          <Ionicons name="close" size={18} color={colors.muted} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.hintText, { color: colors.muted }]}>{t('noteComposer.sections.links.empty')}</Text>
                )}
              </View>
            </View>

            <View style={[styles.sectionSpacing, styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardInner}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('noteComposer.sections.checklist.title')}</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{t('noteComposer.sections.checklist.subtitle')}</Text>
                  </View>
                  <Pressable
                    style={[styles.outlineButton, { borderColor: colors.border }]}
                    onPress={handleAddChecklistItem}
                    accessibilityLabel={showChecklistLabel ? undefined : t('noteComposer.sections.checklist.addButton')}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                    {showChecklistLabel ? (
                      <Text style={[styles.outlineButtonText, { color: colors.text }]}>{t('noteComposer.sections.checklist.addButton')}</Text>
                    ) : null}
                  </Pressable>
                </View>
                {checklist.length ? (
                  checklist.map((item) => (
                    <View key={item.id} style={[styles.checkRow, { borderColor: colors.border }]}>
                      <Pressable
                        onPress={() => toggleChecklistItem(item.id)}
                        style={[styles.checkbox, { borderColor: colors.border, backgroundColor: item.done ? colors.accent : 'transparent' }]}
                      >
                        {item.done ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                      </Pressable>
                      <TextInput
                        value={item.text}
                        onChangeText={(text) => updateChecklistText(item.id, text)}
                        style={[styles.checkInput, { color: colors.text }]}
                      />
                      <Pressable onPress={() => removeChecklistItem(item.id)}>
                        <Ionicons name="close" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.hintText, { color: colors.muted }]}>{t('noteComposer.sections.checklist.empty')}</Text>
                )}
              </View>
            </View>

          <View style={[styles.sectionSpacing, styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionCardInner}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('noteComposer.sections.tags.title')}</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{t('noteComposer.sections.tags.subtitle')}</Text>
                </View>
              </View>
              <TextInput
                placeholder={t('noteComposer.sections.tags.placeholder')}
                placeholderTextColor={colors.muted}
                value={tagsInput}
                onChangeText={setTagsInput}
                style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
              />
              {tags.length ? (
                <View style={styles.tagPreviewRow}>
                  {tags.map((tag) => (
                    <View key={tag} style={[styles.tagPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.tagPillText, { color: colors.text }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.hintText, { color: colors.muted }]}>{t('noteComposer.sections.tags.empty')}</Text>
              )}
            </View>
          </View>
            <View style={[styles.sectionSpacing, styles.footerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.footerCardInner}>
                {note?.id ? (
                  <Pressable
                    style={[styles.footerButton, styles.deleteButton, { borderColor: colors.border }]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.muted} />
                    <Text style={[styles.deleteText, { color: colors.text }]}>{t('common.delete')}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.footerSpacer} />
                )}
                <Pressable
                  style={[styles.footerButton, styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveText}>{saving ? t('noteComposer.saveButton.saving') : t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
      {actionSheet ? (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={dismissActionSheet}
        >
          <Pressable style={styles.modalBackdrop} onPress={dismissActionSheet}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{actionSheet.title}</Text>
              {actionSheet.message ? (
                <Text style={[styles.modalMessage, { color: colors.muted }]}>{actionSheet.message}</Text>
              ) : null}
              <View style={styles.modalActions}>
                {actionSheet.actions.map((action, index) => {
                  const isAccent = action.variant === 'accent';
                  const isDestructive = action.variant === 'destructive';
                  return (
                    <Pressable
                      key={`${action.label}-${index}`}
                      style={[
                        styles.modalButton,
                        {
                          borderColor: isDestructive ? '#f56c6c' : colors.border,
                          backgroundColor: isAccent ? colors.accent : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        dismissActionSheet();
                        action.onPress?.();
                      }}
                    >
                      <Text
                        style={[
                          styles.modalButtonText,
                          { color: isAccent ? '#fff' : isDestructive ? '#f56c6c' : colors.text },
                        ]}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {lockProcessing ? (
        <Modal transparent visible animationType="fade">
          <View style={styles.lockProgressOverlay}>
            <View style={[styles.lockProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[styles.lockProgressTitle, { color: colors.text }]}>{encryptingStatusLabel}</Text>
              <View style={[styles.lockProgressBar, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.lockProgressFill,
                    { backgroundColor: colors.accent, width: `${Math.max(10, lockProcessingProgress * 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {statusModal ? (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setStatusModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setStatusModal(null)}>
            <View style={[styles.statusModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons
                name={statusModal.variant === 'warning' ? 'alert-circle' : 'checkmark-circle'}
                size={28}
                color={statusModal.variant === 'warning' ? '#f4b63f' : colors.accent}
              />
              <Text style={[styles.statusModalText, { color: colors.text }]}>{statusModal.message}</Text>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {videoPreview ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setVideoPreview(null)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.closeOverlay} onPress={() => setVideoPreview(null)}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            <View style={[styles.imagePreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onStartShouldSetResponder={() => true}>
              <Video
                ref={videoRef}
                source={{ uri: videoPreview.uri }}
                useNativeControls
                resizeMode="contain"
                style={styles.videoPreview}
              />
              <Text style={[styles.imagePreviewLabel, { color: colors.text }]} numberOfLines={2}>
                {videoPreview.name ?? t('noteComposer.preview.videoFallback')}
              </Text>
            </View>
          </View>
        </Modal>
      ) : null}
      {lockPromptVisible ? (
        <Modal transparent animationType="fade" visible onRequestClose={closeLockPrompt}>
          <Pressable style={styles.modalBackdrop} onPress={closeLockPrompt}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('noteComposer.lock.promptTitle')}</Text>
              <Text style={[styles.modalHint, { color: colors.muted }]}>{t('noteComposer.lock.promptHint')}</Text>
              <TextInput
                placeholder={t('common.password')}
                placeholderTextColor={colors.muted}
                secureTextEntry
                value={lockDraft.password}
                onChangeText={(text) => {
                  setLockDraft((prev) => ({ ...prev, password: text }));
                  setLockError(null);
                }}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                placeholder={t('noteComposer.lock.confirmPlaceholder')}
                placeholderTextColor={colors.muted}
                secureTextEntry
                value={lockDraft.confirm}
                onChangeText={(text) => {
                  setLockDraft((prev) => ({ ...prev, confirm: text }));
                  setLockError(null);
                }}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              />
              {lockError ? <Text style={styles.modalError}>{lockError}</Text> : null}
              <View style={styles.modalActions}>
                <Pressable style={[styles.modalButton, { borderColor: colors.border }]} onPress={closeLockPrompt}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: colors.accent }]}
                  onPress={confirmLockPassword}
                >
                  <Text style={styles.modalPrimaryText}>{t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {lockWarningVisible ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setLockWarningVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLockWarningVisible(false)}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('noteComposer.lock.warningTitle')}</Text>
              <Text style={[styles.modalHint, { color: colors.muted }]}>{t('noteComposer.lock.warningBody')}</Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: colors.accent }]}
                  onPress={() => setLockWarningVisible(false)}
                >
                  <Text style={styles.modalPrimaryText}>{t('common.ok')}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {imagePreview ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setImagePreview(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setImagePreview(null)}>
            <View style={[styles.imagePreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image source={{ uri: imagePreview.uri }} style={styles.imagePreview} contentFit="contain" />
              <Text style={[styles.imagePreviewLabel, { color: colors.text }]} numberOfLines={2}>
                {imagePreview.name ?? t('noteComposer.preview.imageFallback')}
              </Text>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      <AppDialog
        config={dialogConfig}
        visible={Boolean(dialogConfig)}
        fallbackActionLabel={t('common.ok')}
        onClose={closeDialog}
      />
    </>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  sectionSpacing: {
    marginBottom: 18,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  heroCardInner: {
    gap: 12,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  sectionCardInner: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaToggle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaLabel: {
    fontSize: 13,
    flexShrink: 1,
    lineHeight: 16,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  editorSurface: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  toolbar: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toolbarInner: {},
  toolbarHeading: {
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
  },
  tagPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 13,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  outlineButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInput: {
    flex: 1,
    fontSize: 15,
  },
  quickActionsRow: {
    flexDirection: 'row',
    columnGap: 8,
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  quickAction: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexGrow: 1,
    flexBasis: 0,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  quickActionIconOnly: {
    gap: 0,
    paddingHorizontal: 10,
  },
  quickActionText: {
    fontWeight: '600',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  closeOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 999,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalHint: {
    fontSize: 13,
  },
  modalMessage: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalButton: {
    flexGrow: 1,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    borderWidth: 0,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalError: {
    color: '#f56c6c',
    fontSize: 13,
  },
  linkList: {
    gap: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  linkFields: {
    flex: 1,
    gap: 8,
  },
  linkInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  linkUrlInput: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  linkUrlRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  linkOpenButton: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 8,
  },
  linkRemoveButton: {
    padding: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  attachmentList: {
    gap: 10,
  },
  attachmentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentMenuButton: {
    padding: 6,
    borderRadius: 999,
  },
  attachmentTextWrap: {
    maxWidth: '75%',
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentMeta: {
    fontSize: 12,
  },
  footerCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  footerCardInner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerSpacer: {
    flex: 1,
  },
  deleteButton: {
    borderWidth: 1,
  },
  saveButton: {
    borderWidth: 0,
  },
  deleteText: {
    fontWeight: '600',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  lockProgressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockProgressCard: {
    width: '90%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
  },
  lockProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockProgressBar: {
    width: '100%',
    height: 10,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  lockProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statusModalCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusModalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
    alignItems: 'center',
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  videoPreview: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: '#000',
  },
  imagePreviewLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
});



