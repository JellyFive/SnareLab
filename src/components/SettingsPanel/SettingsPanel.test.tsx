import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsPanel } from "./SettingsPanel";

describe("SettingsPanel", () => {
  it("shows the V0.3 management entries and keeps theme unavailable", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenCategoryManagement = vi.fn();
    const onOpenTagManagement = vi.fn();
    render(<SettingsPanel onClose={onClose} onOpenCategoryManagement={onOpenCategoryManagement} onOpenTagManagement={onOpenTagManagement} open />);

    expect(screen.getByRole("dialog", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "分类管理" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "标签管理" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "页面主题，即将开放" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "分类管理" }));
    expect(onOpenCategoryManagement).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "标签管理" }));
    expect(onOpenTagManagement).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "关闭设置" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
