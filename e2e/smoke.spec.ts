import { test, expect } from "./fixtures";

test.describe("Smoke", () => {
  test("boots auth-first entry flow", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Handle Landing Page if it appears
    const getStartedBtn = page.getByRole("button", {
      name: "Get Started Free",
    });
    if (await getStartedBtn.isVisible()) {
      await getStartedBtn.click();
    }

    await expect(
      page.getByRole("heading", { name: "Lovely Garden" }),
    ).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
