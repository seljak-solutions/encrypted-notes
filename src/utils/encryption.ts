import 'react-native-get-random-values';
import { scrypt } from '@noble/hashes/scrypt';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import type { ChecklistItem, LinkItem } from '@/src/features/notes/types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SCRYPT_PARAMS = {
  N: 2 ** 9,
  r: 8,
  p: 1,
  dkLen: 32,
};

const BINARY_VERSION = 1;

export type SecureNotePayload = {
  content: string;
  plainText: string;
  checklist: ChecklistItem[];
  links: LinkItem[];
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

export const encryptBinaryPayload = async (
  password: string,
  data: Uint8Array
): Promise<{ version: number; salt: string; nonce: string; ciphertext: Uint8Array }> => {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  const nonce = randomBytes(12);
  const cipher = chacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(data);
  return {
    version: BINARY_VERSION,
    salt: bytesToHex(salt),
    nonce: bytesToHex(nonce),
    ciphertext,
  };
};

export const decryptBinaryPayload = async (
  password: string,
  payload: { salt: string; nonce: string; ciphertext: Uint8Array }
): Promise<Uint8Array> => {
  const salt = hexToBytes(payload.salt);
  const nonce = hexToBytes(payload.nonce);
  const key = await deriveKey(password, salt);
  const cipher = chacha20poly1305(key, nonce);
  return cipher.decrypt(payload.ciphertext);
};

