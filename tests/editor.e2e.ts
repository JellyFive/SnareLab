import { expect, test } from "@playwright/test";

test("opens the fourth 编辑 tab and keeps Grid overflow isolated on every viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "编辑" }).click();

  await expect(page.getByRole("heading", { name: "节奏编辑器" })).toBeVisible();
  await expect(page.getByRole("link", { name: "编辑" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("grid", { name: "鼓组节奏网格" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const dimensions = await page.evaluate(() => {
    const scroll = document.querySelector(".editor-grid-scroll") as HTMLElement;
    const tracks = document.querySelector(".track-controls") as HTMLElement;
    return { gridScrolls: scroll.scrollWidth > scroll.clientWidth, trackWidth: tracks.getBoundingClientRect().width };
  });
  if (page.viewportSize()?.width === 390) expect(dimensions.gridScrolls).toBe(true);
  expect(dimensions.trackWidth).toBeLessThanOrEqual(page.viewportSize()?.width ?? 1440);
});

test("persists Grid edits and mixer state across reload", async ({ page }) => {
  await page.goto("/editor");
  const grid = page.getByRole("grid", { name: "鼓组节奏网格" });
  await expect(grid).toBeVisible();
  const canvas = grid.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Grid canvas is not measurable.");
  await page.mouse.click(box.x + 16, box.y + 58);
  await page.getByRole("button", { name: /底鼓 Kick.*静音/ }).click();
  await expect(page.getByText("已保存")).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: /底鼓 Kick.*静音/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("gridcell")).toHaveAccessibleName(/有音符/);
});

test("starts, pauses, stops, and leaves playback stopped after navigation", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "播放" }).click();
  await expect(page.getByRole("button", { name: "暂停" })).toBeVisible();
  await page.getByRole("button", { name: "暂停" }).click();
  await expect(page.getByRole("button", { name: "播放" })).toBeVisible();
  await page.getByRole("button", { name: "停止" }).click();
  await expect(page.getByTestId("rhythm-grid-playhead")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page.getByRole("link", { name: "今日" }).click();
  await page.getByRole("link", { name: "编辑" }).click();
  await expect(page.getByRole("button", { name: "播放" })).toBeVisible();
});

test("keeps the editor and local samples available after service-worker offline reload", async ({ page, context }) => {
  await page.goto("/editor");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("grid", { name: "鼓组节奏网格" })).toBeVisible();
  await expect(page.getByRole("button", { name: "播放" })).toBeVisible();
  await context.setOffline(false);
});
