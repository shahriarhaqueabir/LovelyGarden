import { test, expect } from "./fixtures";

const flows = [
  { tab: /Sowing Calendar/i, marker: "Sowing Calendar" },
  { tab: /Knowledgebase/i, marker: "Plant Knowledgebase" },
  { tab: /Seed Vault/i, marker: "Seed Vault" },
  { tab: /Weather/i, marker: "Weather Forecast" },
  { tab: /Logbook/i, marker: "Gardener's Logbook" },
  { tab: /Harvest/i, marker: "Harvest Manifest" },
  { tab: /Settings/i, marker: "Deck Controller" },
] as const;

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Garden Deck Command")).toBeVisible({
      timeout: 45_000,
    });
  });

  for (const flow of flows) {
    test(`switches to ${flow.marker}`, async ({ page }) => {
      const tab = page.getByRole("tab", { name: flow.tab });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByText(flow.marker)).toBeVisible();
    });
  }
});
