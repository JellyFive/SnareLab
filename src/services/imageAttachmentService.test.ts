import { describe, expect, it, vi } from "vitest";

import {
  ImageAttachmentError,
  MAX_ATTACHMENTS_PER_RECORD,
  compressImageAttachment,
  moveAttachment,
  removeAttachment,
  validateAttachmentCapacity,
} from "./imageAttachmentService";

const file = (name = "practice.png", type = "image/png") => new File(["source image"], name, { type });
const attachment = (id: string, sortOrder: number) => ({
  id,
  blob: new Blob([id], { type: "image/jpeg" }),
  mimeType: "image/jpeg",
  fileName: `${id}.jpg`,
  size: id.length,
  createdAt: new Date("2026-07-12T09:00:00.000Z"),
  sortOrder,
});

describe("imageAttachmentService", () => {
  it("rejects files that are not images", async () => {
    await expect(compressImageAttachment(file("notes.txt", "text/plain"))).rejects.toMatchObject({
      name: "ImageAttachmentError",
      message: "请选择图片文件。",
    });
  });

  it("creates a compressed attachment with browser image output", async () => {
    const encode = vi.fn().mockResolvedValue(new Blob(["compressed"], { type: "image/jpeg" }));
    const result = await compressImageAttachment(file(), {
      compressor: {
        decode: vi.fn().mockResolvedValue({ close: vi.fn(), height: 800, source: {}, width: 1_200 }),
        encode,
      },
      createId: () => "attachment-1",
      now: () => new Date("2026-07-12T09:00:00.000Z"),
    });

    expect(result).toMatchObject({
      id: "attachment-1",
      fileName: "practice.jpg",
      mimeType: "image/jpeg",
      sortOrder: 0,
    });
    expect(result.blob.size).toBe(10);
    expect(encode).toHaveBeenCalledOnce();
  });

  it("rejects compression output that cannot reach the 2MB limit", async () => {
    await expect(compressImageAttachment(file(), {
      compressor: {
        decode: vi.fn().mockResolvedValue({ close: vi.fn(), height: 800, source: {}, width: 1_200 }),
        encode: vi.fn().mockResolvedValue(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: "image/jpeg" })),
      },
    })).rejects.toBeInstanceOf(ImageAttachmentError);
  });

  it("enforces six attachments and restores capacity after deletion", () => {
    const attachments = Array.from({ length: MAX_ATTACHMENTS_PER_RECORD }, (_, index) => attachment(`image-${index}`, index));

    expect(() => validateAttachmentCapacity(attachments, 1)).toThrow("每条记录最多添加 6 张图片。");
    expect(removeAttachment(attachments, "image-3")).toHaveLength(MAX_ATTACHMENTS_PER_RECORD - 1);
    expect(() => validateAttachmentCapacity(removeAttachment(attachments, "image-3"), 1)).not.toThrow();
  });

  it("moves attachments and normalizes their display order", () => {
    const result = moveAttachment([attachment("a", 0), attachment("b", 1), attachment("c", 2)], "c", 0);

    expect(result.map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(result.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });
});
