export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type Attachment = {
  id: string;
  type: 'image' | 'audio' | 'video';
  uri: string;
  name?: string;
  mimeType?: string;
};

export type NoteRecord = {
  id: string;
  title: string;
  content: string;
  plain_text: string;
  tags: string[];
  checklist: ChecklistItem[];
  attachments: Attachment[];
  links: LinkItem[];
  color?: string | null;
  pinned: boolean;
  is_locked: boolean;
  lock_payload?: string | null;
  lock_version?: number | null;
  created_at: number;
  updated_at: number;
};

export type NoteInput = {
  title: string;
  content: string;
  plainText?: string;
  tags?: string[];
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
  links?: LinkItem[];
  color?: string | null;
  pinned?: boolean;
  isLocked?: boolean;
  lockPayload?: string | null;
  lockVersion?: number | null;
};
