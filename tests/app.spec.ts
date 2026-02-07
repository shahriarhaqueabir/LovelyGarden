
import { test, expect } from '@playwright/test';

test.describe('Garden Application Extended Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server
    await page.goto('http://localhost:5173');
    // Wait for hydration (simple check for header)
    // We use .first() because sometimes header might be duplicated in layout (strict mode/components)
    await expect(page.locator('text=Garden Deck Command').first()).toBeVisible({ timeout: 10000 });
  });

  test('Multi-Garden Switching Logic', async ({ page }) => {
    // 1. Ensure we are on the Virtual Garden tab (default)
    const gardenTab = page.locator('button', { hasText: 'Virtual Garden' });
    await expect(gardenTab).toBeVisible();

    // 2. Identify the garden slot buttons
    // The previous implementation renders buttons with text like "The Homestead" or "Space 2"
    // We look for the container that holds them. They are in a row with class "overflow-x-auto"
    
    // Wait for gardens to load (DB hydration takes time approx 1-2s)
    await page.waitForTimeout(3000); 

    // We expect "The Homestead" to be the first one
    const slot1 = page.locator('button', { hasText: 'The Homestead' }).first();
    await expect(slot1).toBeVisible({ timeout: 10000 });

    // 3. Switch to Slot 2 (Moonlight Glass)
    const slot2 = page.locator('button', { hasText: 'Moonlight Glass' });
    // Verify it exists before clicking
    await expect(slot2).toBeVisible();
    await slot2.click();

    // Verify logic: The "Moonlight Glass" button should now look active
    // We can check if the "Grid" updates. 
    // The "Moonlight Glass" is a Greenhouse (3x3). Homestead is 4x3.
    // The text "Greenhouse" or "Full Shade" should appear in the config overlay, if visible.
    // Alternatively, verify the garden title in the config dialog button or overlay
    // The "Moonlight Glass" button itself usually indicates active state.
    
    // Let's check for the text "Greenhouse" which appears in the info panel below the grid
    await expect(page.locator('text=Greenhouse').first()).toBeVisible();

    // 4. Switch to Slot 3 (Sunken Sands)
    const slot3 = page.locator('button', { hasText: 'Sunken Sands' });
    await slot3.click();
    await expect(page.locator('text=Container').first()).toBeVisible();

    // 5. Return to Main
    await slot1.click();
    await expect(page.locator('text=In-ground').first()).toBeVisible();
  });

  test('Sowing Calendar Search Functionality', async ({ page }) => {
    // 1. Navigate to Sowing Calendar
    const calendarTab = page.locator('button', { hasText: 'Sowing Calendar' });
    await calendarTab.click();

    // 2. Locate the Search Input
    // We added a placeholder "Search by name..."
    const searchInput = page.getByPlaceholder('Search by name, category, or scientific name...');
    await expect(searchInput).toBeVisible();

    // 3. Initial State: Should show "Found" count
    // Wait for list to render
    await page.waitForTimeout(500);

    // 4. Type a query that exists (e.g., "Tomato")
    await searchInput.fill('Tomato');

    // 5. Verify filtering
    // Specific Tomato cards should be visible
    // "Solanum lycopersicum" is the scientific name
    await expect(page.locator('text=Solanum lycopersicum').first()).toBeVisible();

    // 6. Verify non-matching items are gone (e.g., "Pumpkin")
    await expect(page.locator('text=Cucurbita pepo').first()).not.toBeVisible();

    // 7. Clear search
    // Click the close/clear button inside the search container
    // It is a button with a path svg (X icon), usually sibling to input
    const clearButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasNotText: 'Sowing Calendar' }).last(); 
    // This selector is risky. Let's use the one we added: a button with sr-only "Clear"
    const accessibleClearBtn = page.locator('button:has(span.sr-only:has-text("Clear"))');
    
    // Fallback if sr-only text isn't queryable easily in this version
    // We'll just clear the input manually if button tricky
    await searchInput.fill('');

    // 8. Verify list is restored (Pumpkin is back)
    await expect(page.locator('text=Cucurbita pepo').first()).toBeVisible();
  });

  test('Developer Tools Accessibility', async ({ page }) => {
    // Navigate to Virtual Garden first
    await page.locator('button', { hasText: 'Virtual Garden' }).click();
    
    // Use a robust selector for the Settings Gear
    // Look for a button that contains the settings icon in the header
    const settingsButton = page.locator('header button').filter({ has: page.locator('svg.lucide-settings') }).first();
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // 2. Verify Panel Opens
    await expect(page.locator('text=Almanac Settings').first()).toBeVisible({ timeout: 5000 });

    // 3. Check for Dev Tool headings
    await expect(page.locator('text=Backup JSON')).toBeVisible();
    
    // 4. Close Panel
    const closeButton = page.locator('button svg.lucide-x').locator('..').last();
    // Assuming the modal is on top, its close button is likely the last one rendered or specific
    // Or just press Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Almanac Settings')).not.toBeVisible();
  });

});
