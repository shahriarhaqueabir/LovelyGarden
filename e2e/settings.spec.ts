import { test, expect } from "./fixtures";

test.describe("Settings Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens settings and developer diagnostics panel", async ({ page }) => {
    await page.getByRole("tab", { name: /Settings/i }).click();

    await expect(page.getByText("Deck Controller")).toBeVisible();
    await expect(page.getByRole("button", { name: /Locale/i })).toBeVisible();

    await page.getByRole("button", { name: /Developer/i }).click();
    await expect(page.getByText("System Metrics")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Export System JSON/i }),
    ).toBeVisible();
  });
});
