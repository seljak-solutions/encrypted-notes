import { memo } from 'react';
import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';

interface Props {
  tags: string[];
  activeTag?: string;
  onSelect: (tag?: string) => void;
}

const TagChipsComponent = ({ tags, activeTag, onSelect }: Props) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  if (!tags.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.row}
    >
      <Pressable onPress={() => onSelect(undefined)} style={[styles.chip, { borderColor: colors.border, backgroundColor: !activeTag ? colors.accent : 'transparent' }]}>
        <Text style={[styles.label, { color: !activeTag ? '#fff' : colors.text }]}>{t('common.all')}</Text>
      </Pressable>
      {tags.map((tag) => {
        const isActive = activeTag === tag;
        return (
          <Pressable
            key={tag}
            onPress={() => onSelect(isActive ? undefined : tag)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.accent : 'transparent',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: isActive ? '#fff' : colors.text }]}>{tag}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export const TagChips = memo(TagChipsComponent);



