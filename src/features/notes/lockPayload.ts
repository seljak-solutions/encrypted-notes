import type { EncryptedPayloadInput } from '@/src/utils/encryption';
import type { Attachment } from '@/src/features/notes/types';

export type LockedAttachmentDescriptor = {
  id: string;
  type: Attachment['type'];
  name?: string;
  mimeType?: string;
  file: string; // relative path within the document directory
  salt: string;
  nonce: string;
  version: number;
  size?: number;
};

export type NoteLockPayload = {
  version: number;
  payload: EncryptedPayloadInput;
  attachments: LockedAttachmentDescriptor[];
};

export const LOCK_PAYLOAD_VERSION = 2;

export const parseLockPayload = (raw?: string | null): NoteLockPayload | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'payload' in parsed && 'attachments' in parsed) {
      return parsed as NoteLockPayload;
    }
    if (parsed && typeof parsed === 'object' && 'ciphertext' in parsed) {
      return {
        version: parsed.version ?? 1,
        payload: parsed as EncryptedPayloadInput,
        attachments: [],
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse lock payload', error);
    return null;
  }
};
