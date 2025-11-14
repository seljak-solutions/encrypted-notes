import { create } from 'zustand';
import { settingsRepository } from '@/src/features/settings/settingsRepository';
import type { ThemeName } from '@/src/theme/palette';

const THEME_KEY = 'app_theme';
const isThemeName = (value?: string | null): value is ThemeName =>
  value === 'light' || value === 'dark' || value === 'dusk';

const storedTheme = settingsRepository.getSync(THEME_KEY);
export const initialTheme: ThemeName = isThemeName(storedTheme) ? storedTheme : 'dusk';
const initialInitialized = isThemeName(storedTheme);

export type ThemeState = {
  theme: ThemeName;
  initialized: boolean;
  init: () => Promise<void>;
  setTheme: (theme: ThemeName) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  initialized: initialInitialized,
  init: async () => {
    if (get().initialized) return;
    const stored = await settingsRepository.get(THEME_KEY);
    if (isThemeName(stored)) {
      set({ theme: stored, initialized: true });
    } else {
      set({ initialized: true });
    }
  },
  setTheme: async (theme) => {
    await settingsRepository.set(THEME_KEY, theme);
    set({ theme });
  },
}));
