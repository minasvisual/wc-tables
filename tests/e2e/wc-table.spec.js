import { test, expect } from '@playwright/test';

test.describe('wc-table core features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/e2e/fixtures/test.html');
        // Wait for the web component to be registered
        await page.waitForFunction(() => customElements.get('wc-table'));
    });

    test('should render slots correctly', async ({ page }) => {
        const table = page.locator('wc-table');
        
        // Check toolbar slot
        const toolbarItem = table.locator('#toolbarItem');
        await expect(toolbarItem).toBeVisible();

        // Set data and wait for render
        await page.evaluate(() => {
            const table = document.getElementById('testTable');
            table.data = [{ id: 1, name: 'Test 1', status: 'Active' }];
        });

        // Check action slots (cloned into shadow DOM)
        // Using '>>' to pierce shadow DOM
        const leftAction = page.locator('wc-table >> .actions-col >> #btnLeft').first();
        await expect(leftAction).toBeVisible();
        
        const rightAction = page.locator('wc-table >> .actions-col >> #btnRight').first();
        await expect(rightAction).toBeVisible();
    });

    test('should filter data locally', async ({ page }) => {
        await page.evaluate(() => {
            const table = document.getElementById('testTable');
            table.data = [
                { id: 1, name: 'Apple', status: 'A' },
                { id: 2, name: 'Banana', status: 'B' },
                { id: 3, name: 'Cherry', status: 'C' }
            ];
        });

        // Search input is in shadow DOM
        const searchInput = page.locator('wc-table >> .search-input');
        await searchInput.fill('Banana');

        const rows = page.locator('wc-table >> tbody tr');
        await expect(rows).toHaveCount(1);
        await expect(rows).toContainText('Banana');
    });

    test('should emit events correctly', async ({ page }) => {
        const eventsTriggered = await page.evaluate(async () => {
            const table = document.getElementById('testTable');
            const logs = [];
            
            table.addEventListener('updated', () => logs.push('updated'));
            
            // First load: should NOT trigger updated
            table.data = [{ id: 1, name: 'Init' }];
            
            // Second load: SHOULD trigger updated
            table.data = [{ id: 1, name: 'Updated' }];

            return logs;
        });

        expect(eventsTriggered).toEqual(['updated']);
    });
});
