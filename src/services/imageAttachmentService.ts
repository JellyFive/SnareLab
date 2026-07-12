import type { ImageAttachment } from "../types";

export const MAX_ATTACHMENTS_PER_RECORD = 6;
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

interface DecodedImage {
  close?: () => void;
  height: number;
  source: unknown;
  width: number;
}

export interface ImageCompressor {
  decode: (file: File) => Promise<DecodedImage>;
  encode: (image: DecodedImage, width: number, height: number, quality: number) => Promise<Blob | null>;
}

export interface CompressImageAttachmentOptions {
  compressor?: ImageCompressor;
  createId?: () => string;
  now?: () => Date;
  sortOrder?: number;
}

export class ImageAttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageAttachmentError";
  }
}

export async function compressImageAttachment(
  file: File,
  options: CompressImageAttachmentOptions = {},
): Promise<ImageAttachment> {
  if (!file.type.startsWith("image/")) {
    throw new ImageAttachmentError("请选择图片文件。");
  }

  const compressor = options.compressor ?? browserImageCompressor;
  const image = await compressor.decode(file);
  let width = Math.min(image.width, 1920);
  let height = Math.round(image.height * (width / image.width));

  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const quality = Math.max(0.5, 0.86 - attempt * 0.07);
      const blob = await compressor.encode(image, width, height, quality);

      if (blob && blob.size <= MAX_ATTACHMENT_BYTES) {
        return {
          id: (options.createId ?? crypto.randomUUID)(),
          blob,
          mimeType: blob.type || "image/jpeg",
          fileName: toJpegFileName(file.name),
          size: blob.size,
          createdAt: (options.now ?? (() => new Date()))(),
          sortOrder: options.sortOrder ?? 0,
        };
      }

      width = Math.max(320, Math.round(width * 0.78));
      height = Math.max(320, Math.round(height * 0.78));
    }
  } finally {
    image.close?.();
  }

  throw new ImageAttachmentError("图片压缩后仍超过 2MB，请选择更小的图片。");
}

export function validateAttachmentCapacity(attachments: ImageAttachment[], incomingCount: number): void {
  if (attachments.length + incomingCount > MAX_ATTACHMENTS_PER_RECORD) {
    throw new ImageAttachmentError(`每条记录最多添加 ${MAX_ATTACHMENTS_PER_RECORD} 张图片。`);
  }
}

export function removeAttachment(attachments: ImageAttachment[], attachmentId: string): ImageAttachment[] {
  return normalizeAttachmentOrder(
    [...attachments]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .filter((attachment) => attachment.id !== attachmentId),
  );
}

export function moveAttachment(attachments: ImageAttachment[], attachmentId: string, targetIndex: number): ImageAttachment[] {
  const ordered = [...attachments].sort((left, right) => left.sortOrder - right.sortOrder);
  const sourceIndex = ordered.findIndex((attachment) => attachment.id === attachmentId);
  if (sourceIndex < 0) return normalizeAttachmentOrder(ordered);

  const [attachment] = ordered.splice(sourceIndex, 1);
  ordered.splice(Math.max(0, Math.min(targetIndex, ordered.length)), 0, attachment);
  return normalizeAttachmentOrder(ordered);
}

function normalizeAttachmentOrder(attachments: ImageAttachment[]): ImageAttachment[] {
  return attachments.map((attachment, sortOrder) => ({ ...attachment, sortOrder }));
}

const browserImageCompressor: ImageCompressor = {
  async decode(file) {
    if (typeof createImageBitmap !== "function") {
      throw new ImageAttachmentError("当前浏览器不支持图片处理，请更新浏览器后重试。");
    }

    const bitmap = await createImageBitmap(file);
    return { close: () => bitmap.close(), height: bitmap.height, source: bitmap, width: bitmap.width };
  },
  async encode(image, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new ImageAttachmentError("无法处理该图片，请重试。");
    context.drawImage(image.source as CanvasImageSource, 0, 0, width, height);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  },
};

function toJpegFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "练习图片";
  return `${baseName}.jpg`;
}
