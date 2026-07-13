export interface ImageAttachment {
  id: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  size: number;
  createdAt: Date;
  sortOrder: number;
}

export interface PracticeSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  categoryId: string;
  tagIds: string[];
  attachments: ImageAttachment[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  isPreset: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingSessionDraft {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  categoryId?: string;
  tagIds?: string[];
  attachments: ImageAttachment[];
  note?: string;
  createdAt: Date;
}

export interface LogFilter {
  categoryIds?: string[];
  tagIds?: string[];
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
}

export * from "./rhythm";
