import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PIN_KEY = 'encrypted-notes-pin-hash';
const SESSION_KEY = 'encrypted-notes-session-token';
const LEGACY_PIN_KEYS = ['noticeapp-pin-hash'];
const LEGACY_SESSION_KEYS = ['noticeapp-session-token'];

const hashPin = async (pin: string) => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin.trim());
};

const getFirstStoredValue = async (keys: string[]) => {
  for (const key of keys) {
    const value = await SecureStore.getItemAsync(key);
    if (value) {
      return { key, value };
    }
  }
  return null;
};

const deleteKeys = async (keys: string[]) => {
  await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key).catch(() => undefined)));
};

export const pinManager = {
  async isPinSet() {
    const stored = await getFirstStoredValue([PIN_KEY, ...LEGACY_PIN_KEYS]);
    return Boolean(stored?.value);
  },

  async setPin(pin: string) {
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_KEY, hash, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
    // reset session token
    await deleteKeys([SESSION_KEY, ...LEGACY_SESSION_KEYS]);
    await deleteKeys(LEGACY_PIN_KEYS);
  },

  async clearPin() {
    await deleteKeys([PIN_KEY, ...LEGACY_PIN_KEYS]);
    await deleteKeys([SESSION_KEY, ...LEGACY_SESSION_KEYS]);
  },

  async verifyPin(pin: string) {
    const hash = await hashPin(pin);
    const stored = await getFirstStoredValue([PIN_KEY, ...LEGACY_PIN_KEYS]);
    if (stored?.value && stored.value === hash) {
      const token = await hashPin(`${hash}-${Date.now()}`);
      await SecureStore.setItemAsync(SESSION_KEY, token);
      if (stored.key !== PIN_KEY) {
        await SecureStore.setItemAsync(PIN_KEY, stored.value);
      }
      await deleteKeys(LEGACY_SESSION_KEYS);
      return true;
    }
    return false;
  },
};
