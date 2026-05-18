import { test, expect } from "./fixtures";

test.describe("Smoke", () => {
  test("boots app shell and core navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Garden Deck Command")).toBeVisible({
      timeout: 45_000,
    });
    await expect(
      page.getByRole("tab", { name: /Virtual Garden/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Knowledgebase/i }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /Settings/i })).toBeVisible();
  });
});
