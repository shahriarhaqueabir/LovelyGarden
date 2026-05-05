import { test, expect } from "@playwright/test";

test.describe("Settings Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display settings tab", async ({ page }) => {
    await expect(page.locator('[title="Settings"]')).toBeVisible();
  });
});
