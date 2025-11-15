import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { palette } from '@/src/theme/palette';

const dusk = palette.dusk;

export const InitialSplash = () => {
  return (
    <View style={[styles.container, { backgroundColor: dusk.background }]}> 
      <Image source={require('@/assets/images/icon.png')} style={styles.icon} resizeMode="contain" />
      <ActivityIndicator size="large" color={dusk.accent} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 120,
    height: 120,
  },
  loader: {
    marginTop: 32,
  },
});
