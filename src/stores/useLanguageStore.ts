import { create } from 'zustand';
import { settingsRepository } from '@/src/features/settings/settingsRepository';

const LANGUAGE_KEY = 'app_language';

export type LanguageCode = 'de' | 'en' | 'ru';

const isLanguageCode = (value?: string | null): value is LanguageCode => value === 'de' || value === 'en' || value === 'ru';

const storedLanguage = settingsRepository.getSync(LANGUAGE_KEY);
export const initialLanguage: LanguageCode = isLanguageCode(storedLanguage) ? storedLanguage : 'en';
const initialInitialized = isLanguageCode(storedLanguage);

export type LanguageState = {
  language: LanguageCode;
  initialized: boolean;
  init: () => Promise<void>;
  setLanguage: (language: LanguageCode) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: initialLanguage,
  initialized: initialInitialized,
  init: async () => {
    if (get().initialized) return;
    const stored = await settingsRepository.get(LANGUAGE_KEY);
    if (isLanguageCode(stored)) {
      set({ language: stored, initialized: true });
    } else {
      set({ initialized: true });
    }
  },
  setLanguage: async (language) => {
    await settingsRepository.set(LANGUAGE_KEY, language);
    set({ language });
  },
}));

