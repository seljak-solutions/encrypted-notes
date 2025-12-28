import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';

import { Attachment } from '@/src/features/notes/types';
import { encryptBinaryPayload, decryptBinaryPayload } from '@/src/utils/encryption';
import { base64ToBytes, bytesToBase64 } from '@/src/utils/base64';
import type { LockedAttachmentDescriptor } from '@/src/features/notes/lockPayload';

const ensureTrailingSlash = (value: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value : `${value}/`;
};

const BASE_DIR = ensureTrailingSlash(
  FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ''
);
const ATTACHMENT_ROOT = 'attachments';
const ENCRYPTED_ATTACHMENT_SUBDIR = `${ATTACHMENT_ROOT}/enc`;
const TEMP_ATTACHMENT_SUBDIR = `${ATTACHMENT_ROOT}/tmp`;

export const ATTACHMENT_DIR = `${BASE_DIR}${ATTACHMENT_ROOT}`;
const ENCRYPTED_ATTACHMENT_DIR = `${BASE_DIR}${ENCRYPTED_ATTACHMENT_SUBDIR}`;
const TEMP_ATTACHMENT_DIR = `${BASE_DIR}${TEMP_ATTACHMENT_SUBDIR}`;
let activeRecording: Audio.Recording | null = null;

const getDirectorySize = async (dir: string): Promise<number> => {
  try {
    const entries = await FileSystem.readDirectoryAsync(dir);
    let total = 0;
    for (const entry of entries) {
      const path = `${dir}/${entry}`;
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) continue;
      if (info.isDirectory) {
        total += await getDirectorySize(path);
      } else {
        total += info.size ?? 0;
      }
    }
    return total;
  } catch {
    return 0;
  }
};

const ensureDir = async (dir: string) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

export const ensureAttachmentDir = async () => {
  await ensureDir(ATTACHMENT_DIR);
  await ensureDir(ENCRYPTED_ATTACHMENT_DIR);
  await ensureDir(TEMP_ATTACHMENT_DIR);
};

const persistFile = async (
  sourceUri: string,
  extension: string,
  type: Attachment['type'],
  name?: string
): Promise<Attachment> => {
  await ensureAttachmentDir();
  const id = uuidv4();
  const target = `${ATTACHMENT_DIR}/${id}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return {
    id,
    type,
    uri: target,
    name: name ?? `${type}-${id}.${extension}`,
    mimeType:
      type === 'image'
        ? `image/${extension}`
        : type === 'video'
          ? `video/${extension}`
          : `audio/${extension}`,
  };
};

const toRelativeAttachmentPath = (uri: string) => {
  if (!uri) return '';
  if (uri.startsWith(BASE_DIR)) {
    return uri.slice(BASE_DIR.length);
  }
  if (uri.startsWith('file://')) {
    return uri.replace(BASE_DIR, '');
  }
  return uri;
};

const toAbsoluteAttachmentPath = (relative: string) => {
  if (!relative) return '';
  if (relative.startsWith('file://')) return relative;
  const clean = relative.startsWith('/') ? relative.slice(1) : relative;
  return `${BASE_DIR}${clean}`;
};

const getDefaultExtension = (type: Attachment['type']) => {
  if (type === 'image') return 'jpg';
  if (type === 'video') return 'mp4';
  return 'm4a';
};




const writeBytesToFile = async (target: string, bytes: Uint8Array) => {
  await FileSystem.writeAsStringAsync(target, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
};

const normalizeFileUri = (uri: string) => {
  if (!uri) {
    throw new Error('Attachment URI missing');
  }
  if (uri.startsWith('file://')) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
};


const readBytesFromFile = async (uri: string) => {
  const normalized = normalizeFileUri(uri);
  try {
    const response = await fetch(normalized);
    if (!response.ok) {
      throw new Error(`Failed to load attachment: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    const base64Fallback = await FileSystem.readAsStringAsync(normalized, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToBytes(base64Fallback);
  }
};

export const mediaService = {
  async pickImageFromLibrary(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Zugriff auf deine Galerie ist erforderlich.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.9,
      base64: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split('.').pop() ?? 'jpg';
    return persistFile(asset.uri, extension, 'image', asset.fileName);
  },

  async captureImage(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Kamerazugriff ist erforderlich.');
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: false,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split('.').pop() ?? 'jpg';
    return persistFile(asset.uri, extension, 'image', asset.fileName);
  },

  async pickAudioFile(): Promise<Attachment | undefined> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (result.type !== 'success') return;
    const extension = result.name?.split('.').pop() ?? 'm4a';
    return persistFile(result.uri, extension, 'audio', result.name);
  },

  async startAudioRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Audioaufnahme erfordert Mikrofonrechte.');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    activeRecording = new Audio.Recording();
    await activeRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await activeRecording.startAsync();
  },

  async stopAudioRecording(): Promise<Attachment | undefined> {
    if (!activeRecording) return;
    await activeRecording.stopAndUnloadAsync();
    const uri = activeRecording.getURI();
    activeRecording = null;
    if (!uri) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return persistFile(uri, 'm4a', 'audio');
  },

  async removeAttachment(uri: string) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // ignore cleanup errors
    }
  },
  async clearAllAttachments() {
    try {
      await FileSystem.deleteAsync(ATTACHMENT_DIR, { idempotent: true });
    } catch {
      // ignore
    } finally {
      await ensureAttachmentDir();
    }
  },
  async getAttachmentsSize() {
    await ensureAttachmentDir();
    return getDirectorySize(ATTACHMENT_DIR);
  },

  async pickVideoFromLibrary(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Zugriff auf deine Galerie ist erforderlich.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
      videoMaxDuration: 300,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split('.').pop() ?? 'mp4';
    return persistFile(asset.uri, extension, 'video', asset.fileName);
  },

  async captureVideo(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Kamerazugriff ist erforderlich.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 300,
      quality: ImagePicker.UIImagePickerControllerQualityType.High,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split('.').pop() ?? 'mp4';
    return persistFile(asset.uri, extension, 'video', asset.fileName);
  },

  async encryptAttachmentForLock(
    attachment: Attachment,
    password: string
  ): Promise<LockedAttachmentDescriptor> {
    await ensureAttachmentDir();
    const bytes = await readBytesFromFile(attachment.uri);
    const encrypted = await encryptBinaryPayload(password, bytes);
    const fileId = uuidv4();
    const target = `${ENCRYPTED_ATTACHMENT_DIR}/${fileId}.bin`;

    try {
      await writeBytesToFile(target, encrypted.ciphertext);
    } catch (error) {
      await this.removeAttachment(target);
      throw error;
    }


    return {
      id: attachment.id,
      type: attachment.type,
      name: attachment.name,
      mimeType: attachment.mimeType,
      file: `${ENCRYPTED_ATTACHMENT_SUBDIR}/${fileId}.bin`,
      salt: encrypted.salt,
      nonce: encrypted.nonce,
      version: encrypted.version,
      size: encrypted.ciphertext.length,
    };
  },

  async materializeLockedAttachments(
    descriptors: LockedAttachmentDescriptor[],
    password: string
  ): Promise<Attachment[]> {
    if (!descriptors?.length) return [];
    await ensureAttachmentDir();
    const hydrated = await Promise.all(
      descriptors.map((descriptor) => this.materializeLockedAttachment(descriptor, password))
    );
    return hydrated;
  },

  async materializeLockedAttachment(
    descriptor: LockedAttachmentDescriptor,
    password: string
  ): Promise<Attachment> {
    await ensureAttachmentDir();
    const absolutePath = toAbsoluteAttachmentPath(descriptor.file);
    const ciphertext = await readBytesFromFile(absolutePath);
    const plaintext = await decryptBinaryPayload(password, {
      salt: descriptor.salt,
      nonce: descriptor.nonce,
      ciphertext,
    });
    const tempId = uuidv4();
    const extension = descriptor.name?.split('.').pop() ?? getDefaultExtension(descriptor.type);
    const target = `${TEMP_ATTACHMENT_DIR}/${tempId}.${extension}`;
    await writeBytesToFile(target, plaintext);
    return {
      id: descriptor.id,
      type: descriptor.type,
      uri: target,
      name: descriptor.name ?? `${descriptor.type}-${descriptor.id}.${extension}`,
      mimeType:
        descriptor.mimeType ??
        (descriptor.type === 'image'
          ? `image/${extension}`
          : descriptor.type === 'video'
            ? `video/${extension}`
            : `audio/${extension}`),
    };
  },

  async removeEncryptedAttachments(descriptors: LockedAttachmentDescriptor[]) {
    if (!descriptors?.length) return;
    await Promise.all(
      descriptors.map(async (descriptor) => {
        const path = toAbsoluteAttachmentPath(descriptor.file);
        await this.removeAttachment(path);
      })
    );
  },

  async dumpEncryptedAttachmentFiles() {
    try {
      await ensureAttachmentDir();
      const entries = await FileSystem.readDirectoryAsync(ENCRYPTED_ATTACHMENT_DIR);
      const payload = await Promise.all(
        entries.map(async (entry) => {
          const absolute = `${ENCRYPTED_ATTACHMENT_DIR}/${entry}`;
          const data = await FileSystem.readAsStringAsync(absolute, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return { path: `${ENCRYPTED_ATTACHMENT_SUBDIR}/${entry}`, data };
        })
      );
      return payload;
    } catch {
      return [];
    }
  },

  async restoreEncryptedAttachmentFile(relativePath: string, data: string) {
    if (!relativePath) return;
    await ensureAttachmentDir();
    const absolute = toAbsoluteAttachmentPath(relativePath);
    await FileSystem.makeDirectoryAsync(absolute.substring(0, absolute.lastIndexOf('/')), {
      intermediates: true,
    }).catch(() => undefined);
    await FileSystem.writeAsStringAsync(absolute, data, {
      encoding: FileSystem.EncodingType.Base64,
    });
  },
};



