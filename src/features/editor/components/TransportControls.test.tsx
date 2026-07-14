import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransportControls } from "./TransportControls";

function renderTransport(overrides: Partial<React.ComponentProps<typeof TransportControls>> = {}) {
  const props = {
    status: "ready" as const,
    bpm: 120,
    loop: false,
    volume: 0.8,
    playheadTick: 0,
    error: undefined,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStop: vi.fn(),
    onBpmChange: vi.fn(),
    onLoopChange: vi.fn(),
    onVolumeChange: vi.fn(),
    ...overrides,
  };
  render(<TransportControls {...props} />);
  return props;
}

describe("TransportControls", () => {
  it("exposes accessible play, stop, BPM, loop, and volume controls", () => {
    renderTransport();

    expect(screen.getByRole("button", { name: "播放" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "停止" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "速度 BPM" })).toHaveValue(120);
    expect(screen.getByRole("checkbox", { name: "循环播放" })).not.toBeChecked();
    expect(screen.getByRole("slider", { name: "主音量" })).toHaveValue("0.8");
    expect(screen.getByText("120 BPM")).toBeVisible();
    expect(screen.getByText("80%")).toBeVisible();
  });

  it("replaces play with pause while playing and enables stop away from tick zero", () => {
    renderTransport({ status: "playing", playheadTick: 120 });

    expect(screen.queryByRole("button", { name: "播放" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "暂停" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "停止" })).toBeEnabled();
  });

  it("clamps BPM and forwards loop and volume changes", async () => {
    const user = userEvent.setup();
    const props = renderTransport();

    await user.clear(screen.getByRole("spinbutton", { name: "速度 BPM" }));
    await user.type(screen.getByRole("spinbutton", { name: "速度 BPM" }), "300");
    await user.tab();
    expect(props.onBpmChange).toHaveBeenLastCalledWith(240);
    await user.click(screen.getByRole("checkbox", { name: "循环播放" }));
    expect(props.onLoopChange).toHaveBeenCalledWith(true);
    fireEvent.change(screen.getByRole("slider", { name: "主音量" }), { target: { value: "0.5" } });
    expect(props.onVolumeChange).toHaveBeenCalledWith(0.5);
  });

  it("disables play while loading and identifies a failed sample", () => {
    const { rerender } = render(<TransportControls status="loading" bpm={120} loop={false} volume={1} playheadTick={0}
      onPlay={vi.fn()} onPause={vi.fn()} onStop={vi.fn()} onBpmChange={vi.fn()} onLoopChange={vi.fn()} onVolumeChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "播放" })).toBeDisabled();

    rerender(<TransportControls status="error" bpm={120} loop={false} volume={1} playheadTick={0} error="无法加载军鼓 Snare 采样。"
      onPlay={vi.fn()} onPause={vi.fn()} onStop={vi.fn()} onBpmChange={vi.fn()} onLoopChange={vi.fn()} onVolumeChange={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("军鼓 Snare");
  });
});
