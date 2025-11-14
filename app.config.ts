import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Encrypted Notes',
  slug: 'encrypted-notes',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'encryptednotes',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Notizen koennen Bilder aus deiner Galerie anhaengen.',
      NSMicrophoneUsageDescription: 'Audioaufnahmen werden genutzt, um Sprachaufnahmen lokal zu speichern.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ['READ_MEDIA_IMAGES', 'READ_MEDIA_AUDIO', 'RECORD_AUDIO'],
    androidNavigationBar: {
      backgroundColor: '#0f1013',
      barStyle: 'light',
      visible: 'leanback',
    },
    package: 'com.encryptednotes.app',
    versionCode: 1,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    'expo-sqlite',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 24,
          buildToolsVersion: '36.0.0',
          kotlinVersion: '2.1.20',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '56382197-3902-491f-904a-ba89bbda6949',
    },
  },
});
