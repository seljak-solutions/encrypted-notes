import { useCallback } from 'react';
import { useLanguageStore } from '@/src/stores/useLanguageStore';
import { translateByLanguage, TranslationKey } from '@/src/i18n/translations';

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translateByLanguage(language, key, params),
    [language]
  );

  return { t, language, setLanguage };
};
