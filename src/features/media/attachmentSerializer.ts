import * as FileSystem from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';

import { Attachment } from '@/src/features/notes/types';
import { ATTACHMENT_DIR, ensureAttachmentDir } from '@/src/features/media/mediaService';

const ATTACHMENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const getDefaultExtension = (type: Attachment['type']) => {
  if (type === 'image') return 'jpg';
  if (type === 'video') return 'mp4';
  return 'm4a';
};

export const sanitizeAttachmentId = (value?: string) => {
  if (value && ATTACHMENT_ID_PATTERN.test(value)) {
    return value;
  }
  return uuidv4();
};

export type AttachmentWithData = Attachment & { data?: string };

const normalizeFileUri = (uri: string) => {
  if (!uri) {
    throw new Error('Attachment URI missing');
  }

  if (uri.startsWith('file://')) {
    return uri;
  }

  if (/^\w+:\/\//.test(uri)) {
    return uri;
  }

  if (/^[A-Za-z]:/.test(uri)) {
    const normalized = uri.replace(/\\/g, '/');
    return `file:///${normalized}`;
  }

  return uri;
};

export const embedAttachmentData = async (attachment: Attachment): Promise<AttachmentWithData> => {
  const attemptedUris = [attachment.uri];
  const normalized = normalizeFileUri(attachment.uri);
  if (normalized !== attachment.uri) {
    attemptedUris.push(normalized);
  }

  let lastError: unknown;
  for (const uri of attemptedUris) {
    if (!uri) continue;
    try {
      const data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return { ...attachment, data };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Attachment could not be read');
};

export const materializeAttachmentFromData = async (
  attachment: AttachmentWithData
): Promise<Attachment> => {
  if (!attachment.data) {
    throw new Error('Attachment payload is missing data');
  }

  const safeId = sanitizeAttachmentId(attachment.id);
  const extension = attachment.name?.split('.').pop() ?? getDefaultExtension(attachment.type);
  await ensureAttachmentDir();
  const target = `${ATTACHMENT_DIR}/${safeId}.${extension}`;

  await FileSystem.writeAsStringAsync(target, attachment.data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    ...attachment,
    id: safeId,
    uri: target,
    data: undefined,
    name: attachment.name ?? `${attachment.type}-${safeId}.${extension}`,
    mimeType:
      attachment.mimeType ??
      (attachment.type === 'image'
        ? `image/${extension}`
        : attachment.type === 'video'
          ? `video/${extension}`
          : `audio/${extension}`),
  };
};
