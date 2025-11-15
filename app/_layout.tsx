import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-reanimated';

import { PinGate } from '@/src/components/PinGate';
import { InitialSplash } from '@/src/components/InitialSplash';
import { useSecurityStore } from '@/src/stores/useSecurityStore';
import { initialTheme, useThemeStore } from '@/src/stores/useThemeStore';
import { palette, ThemeName } from '@/src/theme/palette';
import { useLanguageStore } from '@/src/stores/useLanguageStore';

if (Platform.OS === 'android') {
  const startupColor = palette[initialTheme].background;
  const startupButtonStyle = initialTheme === 'light' ? 'dark' : 'light';
  NavigationBar.setBackgroundColorAsync(startupColor).catch(() => undefined);
  NavigationBar.setButtonStyleAsync(startupButtonStyle).catch(() => undefined);
}

export const unstable_settings = {
  anchor: '(tabs)',
};

const buildNavigationTheme = (theme: ThemeName) => {
  if (theme === 'dark') {
    return DarkTheme;
  }

  const scheme = theme === 'dusk' ? palette.dusk : palette.light;
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: scheme.background,
      card: scheme.card,
      border: scheme.border,
      text: scheme.text,
      primary: scheme.accent,
    },
  };
};

export default function RootLayout() {
  const checkPin = useSecurityStore((state) => state.checkPin);
  const theme = useThemeStore((state) => state.theme);
  const initialized = useThemeStore((state) => state.initialized);
  const languageInitialized = useLanguageStore((state) => state.initialized);
  const initTheme = useThemeStore((state) => state.init);
  const initLanguage = useLanguageStore((state) => state.init);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    checkPin();
  }, [checkPin]);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  useEffect(() => {
    if (!initialized || !languageInitialized) {
      return;
    }

    const timer = setTimeout(() => setSplashVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [initialized, languageInitialized]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const color = palette[theme].background;
    const buttonStyle = theme === 'light' ? 'dark' : 'light';

    const applyNavigationBar = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync(color);
      } catch (error) {
        console.warn('NavigationBar color failed', error);
      }

      try {
        await NavigationBar.setButtonStyleAsync(buttonStyle);
      } catch (error) {
        console.warn('NavigationBar button style failed', error);
      }
    };

    applyNavigationBar();
  }, [theme]);

  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);
  const statusBarStyle = theme === 'light' ? 'dark' : 'light';
  if (!initialized || !languageInitialized || splashVisible) {
    return <InitialSplash />;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="note/new" options={{ headerShown: false }} />
        <Stack.Screen name="note/[id]" options={{ headerShown: false }} />
      </Stack>
      <PinGate />
      <StatusBar style={statusBarStyle} />
    </ThemeProvider>
  );
}







