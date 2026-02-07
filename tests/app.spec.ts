
import { test, expect } from '@playwright/test';

test.describe('Garden Application', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the app to load
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Sidebar Navigation works', async ({ page }) => {
    // 1. Verify Sidebar exists (InventoryTray)
    const sidebar = page.locator('.h-full.border-r'); // Assuming sidebar class
    await expect(sidebar).toBeVisible();

    // 2. Verify Store Button exists
    const storeButton = page.getByRole('button', { name: /Add Seeds/i });
    await expect(storeButton).toBeVisible();
    
    // 3. Open Seed Store
    await storeButton.click();
    
    // 4. Verify Store Modal opens
    const seedStoreHeader = page.locator('h2', { hasText: 'Seed Vault' });
    await expect(seedStoreHeader).toBeVisible();
    
    // 5. Verify Seeds Names displayed (fix check)
    // We expect some seeds from knowledge base to render (e.g. Tomato, Basil)
    // Wait for content (might load dynamically)
    await expect(page.locator('text=Tomato').first()).toBeVisible({ timeout: 5000 });
    
    // 6. Close Modal
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-x') }).click();
    await expect(seedStoreHeader).not.toBeVisible();
  });

  test('Grid Controls function', async ({ page }) => {
    // Wait for Grid Controls
    const plusButton = page.getByRole('button', { name: 'Add Row' });
    const rowCounter = page.locator('span.font-mono', { hasText: /3|4/ }).first(); // start with 3 rows

    await expect(plusButton).toBeVisible();
    const initialRows = await rowCounter.textContent();
    
    // Add Row
    await plusButton.click();
    
    // Verify increment
    // Note: Grid state is local, might reset on reload, but here we test dynamic
    const newRows = await rowCounter.textContent();
    expect(parseInt(newRows || '0')).toBeGreaterThan(parseInt(initialRows || '0'));
  });
});
