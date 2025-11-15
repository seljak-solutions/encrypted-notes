import { useThemeStore } from '@/src/stores/useThemeStore';
import { palette } from '@/src/theme/palette';

export const useAppTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const colors = palette[theme];
  return { colors, theme };
};
