import { expect, test } from "@playwright/test";

const routes = [
  ["/", "Today"],
  ["/records", "记录"],
  ["/statistics", "统计"],
] as const;

for (const [path, title] of routes) {
  test(`renders ${title} at ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  });
}

test("keeps the V0.3 Today layout within a mobile viewport", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "开始练习" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "本月练习" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("runs the V0.3 timer through pause and opens the Chinese save sheet", async ({ page }) => {
  await page.goto("/timer");

  await page.getByRole("button", { name: "开始练习计时" }).click();
  await expect(page.getByRole("button", { name: "暂停练习计时" })).toBeVisible();
  await page.getByRole("button", { name: "暂停练习计时" }).click();
  await expect(page.getByRole("button", { name: "继续练习计时" })).toBeVisible();
  await page.getByRole("button", { name: "结束本次练习" }).click();

  const dialog = page.getByRole("dialog", { name: "保存本次练习" });
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs((dialogBox?.x ?? 0) - ((viewport?.width ?? 0) - (dialogBox?.width ?? 0)) / 2)).toBeLessThanOrEqual(1);
  const saveButton = page.getByRole("button", { name: "保存记录" });
  await saveButton.scrollIntoViewIfNeeded();
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeDisabled();
  const addImageButton = page.getByRole("button", { name: "添加图片" });
  await addImageButton.scrollIntoViewIfNeeded();
  await expect(addImageButton).toBeVisible();
  await page.getByRole("button", { name: "选择练习分类" }).click();
  await page.getByRole("option", { name: "基本功" }).click();
  await expect(saveButton).toBeEnabled();
});

test("moves between primary tabs and exposes the active destination", async ({ page }) => {
  await page.goto("/");

  for (const [label, title] of [["记录", "记录"], ["统计", "统计"], ["今日", "Today"]]) {
    await page.getByRole("link", { name: label }).click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});
