import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/src/hooks/useTranslation';
import { NoteRecord } from '@/src/features/notes/types';
import { formatRelativeTime } from '@/src/utils/date';
import { useAppTheme } from '@/src/hooks/useAppTheme';

interface Props {
  note: NoteRecord;
  onPress?: () => void;
}

const NoteCardComponent = ({ note, onPress }: Props) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const preview = note.is_locked ? t('notes.card.lockedPreview') : note.plain_text;
  const truncatedPreview =
    preview.length > 20 ? `${preview.slice(0, 20).trimEnd()}...` : preview;
  const attachments = note.attachments ?? [];
  const imageCount = attachments.filter((att) => att.type === 'image').length;
  const audioCount = attachments.filter((att) => att.type === 'audio').length;
  const videoCount = attachments.filter((att) => att.type === 'video').length;
  const hasAttachmentSummary = !note.is_locked && (imageCount > 0 || audioCount > 0 || videoCount > 0);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      android_ripple={{ color: colors.border }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {note.title || t('notes.card.untitled')}
        </Text>
        <View style={styles.badges}>
          {note.is_locked ? <Text style={[styles.badge, { color: colors.muted }]}>LOCK</Text> : null}
          {note.pinned ? <Text style={[styles.badge, { color: colors.accent }]}>PINNED</Text> : null}
        </View>
      </View>
      <View style={styles.contentRow}>
        <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={1}>
          {truncatedPreview}
        </Text>
        {hasAttachmentSummary ? (
          <View style={styles.attachmentRow}>
            {imageCount ? (
              <View
                style={[styles.attachmentChip, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Ionicons name="image-outline" size={14} color={colors.muted} />
                <Text style={[styles.attachmentText, { color: colors.muted }]}>
                  {imageCount.toString()}
                </Text>
              </View>
            ) : null}
            {audioCount ? (
              <View
                style={[styles.attachmentChip, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Ionicons name="mic-outline" size={14} color={colors.muted} />
                <Text style={[styles.attachmentText, { color: colors.muted }]}>
                  {audioCount.toString()}
                </Text>
              </View>
            ) : null}
            {videoCount ? (
              <View
                style={[styles.attachmentChip, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Ionicons name="videocam-outline" size={14} color={colors.muted} />
                <Text style={[styles.attachmentText, { color: colors.muted }]}>
                  {videoCount.toString()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.updatedAt, { color: colors.muted }]}>{formatRelativeTime(note.updated_at)}</Text>
        <View style={styles.tagRow}>
          {note.tags.slice(0, 3).map((tag, index) => (
            <View
              key={tag}
              style={[styles.tag, { borderColor: colors.border, marginLeft: index === 0 ? 0 : 6 }]}
            >
              <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginRight: 12,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },
  attachmentChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updatedAt: {
    fontSize: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
  },
});

export const NoteCard = memo(NoteCardComponent);



