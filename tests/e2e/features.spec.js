import { test, expect } from '@playwright/test';

test.describe('wc-table and wc-paginate new features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/e2e/fixtures/features.html');
        // Wait for web components to be registered
        await page.waitForFunction(() => customElements.get('wc-table'));
        await page.waitForFunction(() => customElements.get('wc-paginate'));
    });

    test('should support inline JSON data and hidden-cols', async ({ page }) => {
        const table = page.locator('#tableAttributes');
        
        // Wait for initial render of inline data
        await expect(table.locator('>> thead th')).toHaveCount(2); // ID is hidden, so only name and val
        await expect(table.locator('>> tbody tr')).toHaveCount(2);

        // Check columns
        const headers = await table.locator('>> thead th').allTextContents();
        expect(headers.map(h => h.trim())).not.toContain('ID');
        expect(headers.map(h => h.trim())).toContain('NAME');
        expect(headers.map(h => h.trim())).toContain('VAL');

        // Dynamic update of hidden-cols
        await page.evaluate(() => {
            const t = document.getElementById('tableAttributes');
            t.setAttribute('hidden-cols', 'id,val');
        });
        await expect(table.locator('>> thead th')).toHaveCount(1); // only name
    });

    test('should support client-side pagination', async ({ page }) => {
        const table = page.locator('#tablePagination');

        // Setup data with 5 items, page-size is 2
        await page.evaluate(() => {
            const t = document.getElementById('tablePagination');
            t.data = [
                { name: 'Item 1' }, { name: 'Item 2' },
                { name: 'Item 3' }, { name: 'Item 4' },
                { name: 'Item 5' }
            ];
        });

        const rows = table.locator('>> tbody tr');
        await expect(rows).toHaveCount(2);
        await expect(rows.first()).toContainText('Item 1');

        // Check pagination controls
        const nextBtn = table.locator('>> .pg-controls [data-page="next"]');
        await nextBtn.click();
        
        await expect(rows).toHaveCount(2);
        await expect(rows.first()).toContainText('Item 3');

        // Click page 3
        const pg3Btn = table.locator('>> .pg-controls [data-page="3"]');
        await pg3Btn.click();
        await expect(rows).toHaveCount(1);
        await expect(rows.first()).toContainText('Item 5');
    });

    test('should work as standalone wc-paginate', async ({ page }) => {
        const paginate = page.locator('#standalonePaginate');
        
        // Initial state: total 50, page-size 10 -> 5 pages
        const pgButtons = paginate.locator('>> .pg-btn:not([data-page="prev"]):not([data-page="next"])');
        await expect(pgButtons).toHaveCount(5);

        const info = paginate.locator('>> .pg-info');
        await expect(info).toContainText('1–10 / 50');

        // Interaction
        await paginate.locator('>> [data-page="2"]').click();
        await expect(info).toContainText('11–20 / 50');

        // Verify event
        const pageChanged = await page.evaluate(() => {
            const pg = document.getElementById('standalonePaginate');
            let received = null;
            pg.addEventListener('page-changed', (e) => {
                received = e.detail;
            });
            // Click next programmatically doesn't fire event (internal logic)
            // But let's click via UI to trigger dispatch
            return new Promise((resolve) => {
              pg.addEventListener('page-changed', (e) => resolve(e.detail));
              pg.shadowRoot.querySelector('[data-page="3"]').click();
            });
        });

        expect(pageChanged.page).toBe(3);
        expect(pageChanged.totalPages).toBe(5);
    });
});
