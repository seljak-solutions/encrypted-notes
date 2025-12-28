import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';

import { palette } from '@/src/theme/palette';

const dusk = palette.dusk;

export const InitialSplash = () => {
  return (
    <ImageBackground
      source={require('@/assets/images/loadingscreen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={dusk.accent} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
