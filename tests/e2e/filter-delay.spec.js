import { test, expect } from '@playwright/test';

test.describe('wc-table filter-delay', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/e2e/fixtures/filter-delay.html');
        await page.waitForFunction(() => customElements.get('wc-table'));
    });

    test('debounces the built-in search input', async ({ page }) => {
        const searchTable = page.locator('#searchTable');
        const searchInput = searchTable.locator('#searchInput');
        const rows = searchTable.locator('tbody tr');

        await expect(rows).toHaveCount(3);
        await searchInput.fill('Ada');

        await expect(rows).toHaveCount(3);
        await page.waitForTimeout(300);
        await expect(rows).toHaveCount(3);

        await page.waitForTimeout(650);
        await expect(rows).toHaveCount(1);
        await expect(rows.first()).toContainText('Ada Lovelace');
    });

    test('debounces native column filters', async ({ page }) => {
        const table = page.locator('#columnFilterTable');
        const columnInput = table.locator('.wc-col-filter-input[data-col-filter="name"]');
        const rows = table.locator('tbody tr');

        await expect(rows).toHaveCount(3);
        await columnInput.fill('Grace');

        await expect(rows).toHaveCount(3);
        await page.waitForTimeout(300);
        await expect(rows).toHaveCount(3);

        await page.waitForTimeout(650);
        await expect(rows).toHaveCount(1);
        await expect(rows.first()).toContainText('Grace Hopper');
    });
});
