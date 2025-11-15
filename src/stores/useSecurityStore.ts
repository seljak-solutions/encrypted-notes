import { create } from 'zustand';
import { pinManager } from '@/src/features/security/pinManager';

export type SecurityState = {
  hasPin: boolean | null;
  locked: boolean;
  checkPin: () => Promise<void>;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
};

export const useSecurityStore = create<SecurityState>((set) => ({
  hasPin: null,
  locked: true,
  checkPin: async () => {
    try {
      const hasPin = await pinManager.isPinSet();
      set({ hasPin, locked: hasPin });
    } catch (error) {
      console.error('PIN check failed', error);
      set({ hasPin: false, locked: false });
    }
  },
  enablePin: async (pin: string) => {
    await pinManager.setPin(pin);
    set({ hasPin: true, locked: true });
  },
  disablePin: async () => {
    await pinManager.clearPin();
    set({ hasPin: false, locked: false });
  },
  unlock: async (pin: string) => {
    const ok = await pinManager.verifyPin(pin);
    if (ok) {
      set({ locked: false });
    }
    return ok;
  },
}));
