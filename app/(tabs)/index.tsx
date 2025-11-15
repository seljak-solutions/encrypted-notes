import { useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TextInput, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { NoteCard } from '@/src/components/NoteCard';
import { useNotesStore } from '@/src/stores/useNotesStore';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { TagChips } from '@/src/components/TagChips';
import { useTranslation } from '@/src/hooks/useTranslation';

export default function NotesScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const notes = useNotesStore((state) => state.notes);
  const loading = useNotesStore((state) => state.loading);
  const init = useNotesStore((state) => state.init);
  const refresh = useNotesStore((state) => state.refresh);
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const setSearch = useNotesStore((state) => state.setSearch);
  const tagFilter = useNotesStore((state) => state.tagFilter);
  const setTagFilter = useNotesStore((state) => state.setTagFilter);

  useFocusEffect(
    useCallback(() => {
      init();
    }, [init])
  );

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((note) => note.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [notes]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.search, { borderColor: colors.border }]}> 
          <TextInput
            placeholder={t('common.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearch}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        <View style={styles.tagsTop}>
          <TagChips tags={tagOptions} activeTag={tagFilter} onSelect={setTagFilter} />
        </View>
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard note={item} onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })} />
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('notes.list.emptyTitle')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>{t('notes.list.emptySubtitle')}</Text>
            </View>
          )}
          contentContainerStyle={notes.length ? { paddingBottom: 12 } : { flex: 1, justifyContent: 'center' }}
        />
        <Pressable style={[styles.fab, { backgroundColor: colors.accent }]} onPress={() => router.push('/note/new')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  search: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  input: {
    height: 44,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
  },
  empty: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  tagsTop: {
    marginBottom: 12,
  },
});

