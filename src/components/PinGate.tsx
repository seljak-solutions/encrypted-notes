import { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSecurityStore } from '@/src/stores/useSecurityStore';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
export const PinGate = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const locked = useSecurityStore((state) => state.locked);
  const hasPin = useSecurityStore((state) => state.hasPin);
  const unlock = useSecurityStore((state) => state.unlock);
  const inputRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!locked) return null;

  if (hasPin === null) {
    return (
      <View style={[styles.overlay, { backgroundColor: colors.background }]}> 
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  const handleUnlock = async () => {
    const ok = await unlock(pin);
    if (!ok) {
      setError(t('pin.errorInvalid'));
    } else {
      setPin('');
      setError(null);
    }
  };

  const handleChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setPin(sanitized);
    setError(null);
  };

  const mask = pin.length ? '•'.repeat(pin.length) : '••••';

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}> 
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('pin.prompt')}</Text>
        <Pressable
          style={[styles.inputWrapper, { borderColor: colors.border }]}
          onPress={() => inputRef.current?.focus()}
        >
          <Text style={[styles.mask, { color: colors.text }]}>{mask}</Text>
          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={8}
            caretHidden
            autoFocus
            style={styles.hiddenInput}
          />
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleUnlock}>
          <Text style={styles.buttonText}>{t('common.unlock')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10,
    elevation: 10,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  hiddenInput: {
    opacity: 0,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mask: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: {
    color: '#ff5c5c',
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});

