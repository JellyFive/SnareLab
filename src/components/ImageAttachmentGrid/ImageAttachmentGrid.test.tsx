import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ImageAttachmentGrid } from "./ImageAttachmentGrid";

const attachment = {
  id: "image-1",
  blob: new Blob(["image"], { type: "image/jpeg" }),
  mimeType: "image/jpeg",
  fileName: "练习照片.jpg",
  size: 5,
  createdAt: new Date("2026-07-12T09:00:00.000Z"),
  sortOrder: 0,
};

describe("ImageAttachmentGrid", () => {
  it("selects image files and exposes Chinese delete controls", async () => {
    const user = userEvent.setup();
    const onAddFiles = vi.fn();
    const onRemove = vi.fn();
    render(<ImageAttachmentGrid attachments={[attachment]} onAddFiles={onAddFiles} onRemove={onRemove} />);

    expect(screen.getByRole("img", { name: "附件：练习照片.jpg" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "删除练习照片.jpg" }));
    expect(onRemove).toHaveBeenCalledWith("image-1");

    fireEvent.change(screen.getByLabelText("选择图片"), { target: { files: [new File(["next"], "next.jpg", { type: "image/jpeg" })] } });
    expect(onAddFiles).toHaveBeenCalledWith([expect.objectContaining({ name: "next.jpg" })]);
  });

  it("disables additions with a Chinese reason at the six-image limit", () => {
    const attachments = Array.from({ length: 6 }, (_, index) => ({ ...attachment, id: `image-${index}`, sortOrder: index }));
    render(<ImageAttachmentGrid attachments={attachments} onAddFiles={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByRole("button", { name: "最多添加 6 张图片" })).toBeDisabled();
    expect(screen.getByText("已达到 6 张图片上限")).toBeInTheDocument();
  });
});
