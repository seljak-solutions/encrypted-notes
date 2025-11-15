import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { Attachment } from "@/src/features/notes/types";
import { v4 as uuidv4 } from "uuid";

const BASE_DIR =
  FileSystem.documentDirectory ??
  FileSystem.cacheDirectory ??
  "";
export const ATTACHMENT_DIR = `${BASE_DIR}attachments`;
let activeRecording: Audio.Recording | null = null;

const getDirectorySize = async (dir: string): Promise<number> => {
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
};

export const ensureAttachmentDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(ATTACHMENT_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ATTACHMENT_DIR, { intermediates: true });
  }
};

const persistFile = async (
  sourceUri: string,
  extension: string,
  type: Attachment["type"],
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
      type === "image"
        ? `image/${extension}`
        : type === "video"
          ? `video/${extension}`
          : `audio/${extension}`,
  };
};

export const mediaService = {
  async pickImageFromLibrary(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Zugriff auf deine Galerie ist erforderlich.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.9,
      base64: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split(".").pop() ?? "jpg";
    return persistFile(asset.uri, extension, "image", asset.fileName);
  },

  async captureImage(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Kamerazugriff ist erforderlich.");
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: false,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split(".").pop() ?? "jpg";
    return persistFile(asset.uri, extension, "image", asset.fileName);
  },

  async pickAudioFile(): Promise<Attachment | undefined> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
    });

    if (result.type !== "success") return;
    const extension = result.name?.split(".").pop() ?? "m4a";
    return persistFile(result.uri, extension, "audio", result.name);
  },

  async startAudioRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Audioaufnahme erfordert Mikrofonrechte.");
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
    return persistFile(uri, "m4a", "audio");
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
    if (permission.status !== "granted") {
      throw new Error("Zugriff auf deine Galerie ist erforderlich.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
      videoMaxDuration: 300,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split(".").pop() ?? "mp4";
    return persistFile(asset.uri, extension, "video", asset.fileName);
  },

  async captureVideo(): Promise<Attachment | undefined> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Kamerazugriff ist erforderlich.");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 300,
      quality: ImagePicker.UIImagePickerControllerQualityType.High,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const extension = asset.fileName?.split(".").pop() ?? "mp4";
    return persistFile(asset.uri, extension, "video", asset.fileName);
  },
};
