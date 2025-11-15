import { scrypt } from '@noble/hashes/scrypt';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import type { ChecklistItem } from '@/src/features/notes/types';
import type { AttachmentWithData } from '@/src/features/media/attachmentSerializer';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SCRYPT_PARAMS = {
  N: 2 ** 9,
  r: 8,
  p: 1,
  dkLen: 32,
};

export type SecureNotePayload = {
  content: string;
  plainText: string;
  checklist: ChecklistItem[];
  attachments: AttachmentWithData[];
};

export type EncryptedPayloadInput = {
  version: number;
  salt: string;
  nonce: string;
  ciphertext: string;
};

const deriveKey = async (password: string, salt: Uint8Array) => {
  return scrypt(encoder.encode(password), salt, SCRYPT_PARAMS);
};

export const encryptNotePayload = async (password: string, payload: SecureNotePayload): Promise<EncryptedPayloadInput> => {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  const nonce = randomBytes(12);
  const cipher = chacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(encoder.encode(JSON.stringify(payload)));
  return {
    version: 1,
    salt: bytesToHex(salt),
    nonce: bytesToHex(nonce),
    ciphertext: bytesToHex(ciphertext),
  };
};

export const decryptNotePayload = async (password: string, payload: EncryptedPayloadInput): Promise<SecureNotePayload> => {
  const salt = hexToBytes(payload.salt);
  const nonce = hexToBytes(payload.nonce);
  const ciphertext = hexToBytes(payload.ciphertext);
  const key = await deriveKey(password, salt);
  const cipher = chacha20poly1305(key, nonce);
  const plaintext = cipher.decrypt(ciphertext);
  return JSON.parse(decoder.decode(plaintext));
};
