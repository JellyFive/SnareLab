import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Category, PracticeSession, Tag } from "../../types";
import { RecordBottomSheet } from "./RecordBottomSheet";

const session: PracticeSession = {
  id: "session-1",
  startTime: new Date(2026, 6, 4, 9),
  endTime: new Date(2026, 6, 4, 9, 10),
  duration: 600,
  categoryId: "fundamentals",
  tagIds: [],
  createdAt: new Date(2026, 6, 4, 9),
  updatedAt: new Date(2026, 6, 4, 9),
};

const categories: Category[] = [{ id: "fundamentals", name: "Fundamentals", icon: "drum", color: "#4C7FE8", isSystem: false, createdAt: new Date(), updatedAt: new Date() }];
const tags: Tag[] = [];

describe("RecordBottomSheet accessibility", () => {
  it("moves initial keyboard focus to the sheet close control", async () => {
    render(<RecordBottomSheet categories={categories} onClose={vi.fn()} onDelete={vi.fn()} onSave={vi.fn()} session={session} tags={tags} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
  });
});
