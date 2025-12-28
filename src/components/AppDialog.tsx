import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { useAppTheme } from '@/src/hooks/useAppTheme';

export type DialogAction = {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'destructive';
};

export type DialogConfig = {
  title: string;
  message?: string;
  actions?: DialogAction[];
};

interface Props {
  config: DialogConfig | null;
  visible: boolean;
  fallbackActionLabel?: string;
  onClose: () => void;
}

export const AppDialog = ({ config, visible, fallbackActionLabel = 'OK', onClose }: Props) => {
  const { colors } = useAppTheme();

  const actions = useMemo(() => {
    if (!config || !config.actions?.length) {
      return [{ label: fallbackActionLabel }];
    }

    return config.actions;
  }, [config, fallbackActionLabel]);

  if (!config) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
          {config.message ? <Text style={[styles.message, { color: colors.text }]}>{config.message}</Text> : null}
          <View style={styles.actionRow}>
            {actions.map((action, index) => {
              const variant = action.variant ?? 'default';
              const buttonStyle = [
                styles.button,
                variant === 'primary'
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : variant === 'destructive'
                    ? { borderColor: '#b22639' }
                    : { borderColor: colors.border },
              ];
              const textStyle = [
                styles.buttonText,
                variant === 'primary'
                  ? { color: '#fff' }
                  : variant === 'destructive'
                    ? { color: '#b22639' }
                    : { color: colors.text },
              ];
              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  style={buttonStyle}
                  onPress={() => {
                    action.onPress?.();
                    onClose();
                  }}
                >
                  <Text style={textStyle}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '600',
  },
});

