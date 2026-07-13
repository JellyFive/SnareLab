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

test("keeps the V0.3 Records filter and empty state within a mobile viewport", async ({ page }) => {
  await page.goto("/records");

  await expect(page.getByText("还没有练习记录")).toBeVisible();
  await page.getByRole("button", { name: "筛选练习记录" }).click();
  await page.getByRole("checkbox", { name: "自由练习" }).check();
  await page.getByRole("button", { name: "应用筛选" }).click();
  await expect(page.getByText("没有符合当前筛选条件的练习记录")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("renders the annual statistics overview without overflow", async ({ page }) => {
  await page.goto("/statistics");

  await expect(page.getByRole("heading", { name: "年度练习热力图" })).toBeVisible();
  await expect(page.getByTestId("annual-heatmap-week")).toHaveCount(53);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("heading", { name: "年度练习热力图" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("switches between category and tag statistics without overflow", async ({ page }) => {
  await page.goto("/statistics");

  await page.getByRole("button", { name: "分类" }).click();
  await expect(page.getByRole("heading", { name: "分类时长分布" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "各月练习时长" })).toBeVisible();

  await page.getByRole("button", { name: "标签" }).click();
  await expect(page.getByRole("heading", { name: "标签时长排行" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "标签组合分析" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
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

test("edits and hard deletes a record through the Chinese detail sheet", async ({ page }) => {
  await page.goto("/timer");

  await page.getByRole("button", { name: "开始练习计时" }).click();
  await page.getByRole("button", { name: "结束本次练习" }).click();
  await page.getByRole("button", { name: "选择练习分类" }).click();
  await page.getByRole("option", { name: "基本功" }).click();
  await page.getByRole("button", { name: "保存记录" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();

  await page.getByRole("link", { name: "记录" }).click();
  await page.getByRole("button", { name: /基本功/ }).click();
  const dialog = page.getByRole("dialog", { name: "练习记录详情" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "编辑记录" }).click();
  await dialog.getByLabel("备注").fill("浏览器回归备注");
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await expect(dialog.getByText("浏览器回归备注")).toBeVisible();

  await dialog.getByRole("button", { name: "删除记录" }).click();
  await expect(dialog.getByText("删除后无法恢复这条练习记录。")).toBeVisible();
  await dialog.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByText("还没有练习记录")).toBeVisible();
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

test("manages classifications from settings and refreshes the timer selector", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "打开设置" }).click();
  await expect(page.getByRole("button", { name: "页面主题，即将开放" })).toBeDisabled();
  await page.getByRole("button", { name: "分类管理" }).click();
  await expect(page.getByRole("dialog", { name: "分类管理" })).toBeVisible();
  await page.getByRole("button", { name: "新建分类" }).click();
  await page.getByLabel("分类名称").fill("浏览器分类");
  await page.getByRole("button", { name: "保存分类" }).click();
  await expect(page.getByText("浏览器分类")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.getByRole("button", { name: "关闭分类管理" }).click();

  await page.getByRole("button", { name: "标签管理" }).click();
  await page.getByRole("button", { name: "新建标签" }).click();
  await page.getByLabel("标签名称").fill("浏览器标签");
  await page.getByRole("button", { name: "保存标签" }).click();
  await expect(page.getByText("浏览器标签")).toBeVisible();
  await page.getByRole("button", { name: "关闭标签管理" }).click();
  await page.getByRole("button", { name: "关闭设置" }).click();

  await page.goto("/timer");
  await page.getByRole("button", { name: "开始练习计时" }).click();
  await page.getByRole("button", { name: "结束本次练习" }).click();
  await page.getByRole("button", { name: "选择练习分类" }).click();
  await expect(page.getByRole("option", { name: "浏览器分类" })).toBeVisible();
});
