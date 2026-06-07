import { test, expect } from "./fixtures";

test.describe("Smoke", () => {
  test("boots auth-first entry flow", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Transition from Landing Page to Auth Screen
    const landingBtn = page
      .getByRole("button", { name: /Get Started|Sign In/i })
      .first();
    await landingBtn
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {});
    if (await landingBtn.isVisible()) {
      await landingBtn.click();
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
