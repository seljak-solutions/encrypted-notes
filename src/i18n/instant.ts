import { translateByLanguage, TranslationKey } from '@/src/i18n/translations';
import { useLanguageStore } from '@/src/stores/useLanguageStore';

export const translateInstant = (key: TranslationKey, params?: Record<string, string | number>) => {
  const language = useLanguageStore.getState().language;
  return translateByLanguage(language, key, params);
};
