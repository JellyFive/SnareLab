import { expect, test } from "@playwright/test";

const routes = [
  ["/", "Today"],
  ["/timer", "Timer"],
  ["/log", "Log"],
  ["/category", "Category & Tags"],
  ["/statistics", "Statistics"],
] as const;

for (const [path, title] of routes) {
  test(`renders ${title} at ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  });
}

test("moves between primary tabs and exposes the active destination", async ({ page }) => {
  await page.goto("/");

  for (const [label, title] of [["Log", "Log"], ["Category", "Category & Tags"], ["Statistics", "Statistics"], ["Today", "Today"]]) {
    await page.getByRole("link", { name: label }).click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});
