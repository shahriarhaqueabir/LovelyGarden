import { test, expect } from "./fixtures";

test.describe("Seed Store", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens seed store and handles search states", async ({ page }) => {
    await page.getByTitle("Open Seed Store").click();
    await expect(
      page.getByRole("heading", { name: "Seed Store" }),
    ).toBeVisible();

    const searchBox = page.getByPlaceholder(/Search .* species/i);
    await expect(searchBox).toBeVisible();
    await expect(page.getByText(/Showing \d+\/\d+/)).toBeVisible();

    await searchBox.fill("unlikely-query-zzzz");
    await expect(page.getByText("No species match your search.")).toBeVisible();

    await page.getByTitle("Close").click();
    await expect(
      page.getByRole("heading", { name: "Seed Store" }),
    ).toBeHidden();
  });
});
