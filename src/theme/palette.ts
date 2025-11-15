export type ThemeName = 'light' | 'dusk' | 'dark';

export type ThemePalette = {
  background: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
};

export const palette: Record<ThemeName, ThemePalette> = {
  light: {
    background: '#f9f9fb',
    card: '#ffffff',
    text: '#131316',
    muted: '#6b6b75',
    accent: '#4c8bf5',
    border: '#e1e1e6',
  },
  dusk: {
    background: '#161922',
    card: '#212534',
    text: '#f2f4ff',
    muted: '#b3bad4',
    accent: '#b58afe',
    border: '#2f3342',
  },
  dark: {
    background: '#0f1013',
    card: '#1b1d23',
    text: '#f4f4f7',
    muted: '#a0a0af',
    accent: '#7da4ff',
    border: '#2d2f36',
  },
};
