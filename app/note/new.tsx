import { router } from 'expo-router';
import { NoteComposer } from '@/src/components/NoteComposer';
import { useNotesStore } from '@/src/stores/useNotesStore';

export default function NewNoteScreen() {
  const saveNote = useNotesStore((state) => state.saveNote);

  return (
    <NoteComposer
      onPersist={async (payload) => {
        await saveNote(payload);
        router.back();
      }}
    />
  );
}
