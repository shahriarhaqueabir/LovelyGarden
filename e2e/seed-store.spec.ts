import { test, expect } from "@playwright/test";

test.describe("Seed Store", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should open seed store", async ({ page }) => {
    await page.click('[title="Seed Store"]');
    await expect(page.locator("text=Seed Store")).toBeVisible();
  });
});
