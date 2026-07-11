import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CalendarHeatMap } from "./CalendarHeatMap";

describe("CalendarHeatMap", () => {
  const data = [
    { date: "2026-07-04", duration: 600, sessionCount: 1 },
    { date: "2026-07-12", duration: 3_600, sessionCount: 2 },
  ];

  it("lets the Log navigation mode select a day", async () => {
    const onSelectDate = vi.fn();
    const user = userEvent.setup();

    render(
      <CalendarHeatMap
        data={data}
        mode="navigation"
        month={new Date(2026, 6, 1)}
        onSelectDate={onSelectDate}
        selectedDate="2026-07-04"
      />,
    );

    const selectedDay = screen.getByRole("button", { name: /July 4, 2026/i });
    expect(selectedDay).toHaveAttribute("aria-pressed", "true");
    expect(selectedDay).toHaveAttribute("data-intensity", "1");

    await user.click(screen.getByRole("button", { name: /July 12, 2026/i }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-07-12");
  });

  it("renders a non-interactive Statistics summary mode", () => {
    render(
      <CalendarHeatMap
        data={data}
        mode="summary"
        month={new Date(2026, 6, 1)}
      />,
    );

    expect(screen.queryByRole("button", { name: /July 4, 2026/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/July 4, 2026/i)).toHaveAttribute(
      "data-intensity",
      "1",
    );
  });
});
