import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories } from "../../database/seedDefaults";
import { SessionRepository } from "../../repositories/sessionRepository";
import { StatisticsPage } from "./StatisticsPage";

const databaseName = () => `snarelab-statistics-page-test-${crypto.randomUUID()}`;

describe("StatisticsPage", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    const sessions = new SessionRepository(database);
    await sessions.saveSession({ id: "fundamentals", startTime: new Date(2026, 6, 4, 9), endTime: new Date(2026, 6, 4, 9, 30), duration: 1_800, categoryId: "fundamentals", tagIds: ["timing"] });
    await sessions.saveSession({ id: "coordination", startTime: new Date(2026, 6, 5, 9), endTime: new Date(2026, 6, 5, 9, 20), duration: 1_200, categoryId: "coordination", tagIds: ["independence"] });
  });

  afterEach(async () => { cleanup(); await database.delete(); });

  it("renders category-only statistics and a non-interactive summary heatmap", async () => {
    render(<StatisticsPage database={database} now={new Date(2026, 6, 5, 15)} />);

    expect((await screen.findAllByText("50 min"))[0]).toBeVisible();
    expect(screen.getByText("2 days")).toBeVisible();
    expect(screen.getByText("Fundamentals")).toBeVisible();
    expect(screen.getByText("Coordination")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Practice activity" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /July 4, 2026/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/tag distribution/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Timing")).not.toBeInTheDocument();
  });
});
