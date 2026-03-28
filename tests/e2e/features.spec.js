import { test, expect } from '@playwright/test';

test.describe('wc-table and wc-paginate new features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/e2e/fixtures/features.html');
        // Wait for web components to be registered
        await page.waitForFunction(() => customElements.get('wc-table'));
        await page.waitForFunction(() => customElements.get('wc-paginate'));
    });

    test('should support inline JSON data and hidden-cols', async ({ page }) => {
        const dataHeaders = page.locator('#tableAttributes >> thead th[data-key]');
        const tbodyTr = page.locator('#tableAttributes >> tbody tr');

        await expect(dataHeaders).toHaveCount(2);
        await expect(tbodyTr).toHaveCount(2);

        const headers = await dataHeaders.allTextContents();
        expect(headers.map(h => h.trim())).not.toContain('ID');
        expect(headers.map(h => h.trim())).toContain('Name');
        expect(headers.map(h => h.trim())).toContain('val');

        await page.evaluate(() => {
            const t = document.getElementById('tableAttributes');
            t.setAttribute('hidden-cols', 'id,val');
        });
        await expect(dataHeaders).toHaveCount(1);
    });

    test('should support client-side pagination', async ({ page }) => {
        await page.evaluate(() => {
            const t = document.getElementById('tablePagination');
            t.data = [
                { name: 'Item 1' }, { name: 'Item 2' },
                { name: 'Item 3' }, { name: 'Item 4' },
                { name: 'Item 5' }
            ];
        });

        const rows = page.locator('#tablePagination >> tbody tr');
        await expect(rows).toHaveCount(2);
        await expect(rows.first()).toContainText('Item 1');

        const nextBtn = page.locator('#tablePagination >> .pg-controls [data-page="next"]');
        await nextBtn.click();

        await expect(rows).toHaveCount(2);
        await expect(rows.first()).toContainText('Item 3');

        const pg3Btn = page.locator('#tablePagination >> .pg-controls [data-page="3"]');
        await pg3Btn.click();
        await expect(rows).toHaveCount(1);
        await expect(rows.first()).toContainText('Item 5');
    });

    test('should show col-label as column header text', async ({ page }) => {
        await expect(page.locator('#tableColLabel >> th[data-key="code"]')).toContainText('Código');
        await expect(page.locator('#tableColLabel >> th[data-key="amount"]')).toContainText('Valor (R$)');
    });


    test('should render declarative wc-table-head from wc-table-row', async ({ page }) => {
        const extra = page.locator('#tableDeclHead >> thead tr.wc-thead-extra');
        await expect(extra).toBeVisible();
        await expect(extra.locator('.badge')).toContainText('Active');
    });

    test('should inject wc-table-head and wc-table-footer rows', async ({ page }) => {
        await expect(page.locator('#tableHeadFoot >> thead tr').nth(1)).toContainText('Band');
        await expect(page.locator('#tableHeadFoot >> tfoot')).toContainText('Foot note');
    });

    test('should work as standalone wc-paginate', async ({ page }) => {
        const pgButtons = page.locator('#standalonePaginate >> .pg-btn:not([data-page="prev"]):not([data-page="next"])');
        // Page 1, delta 2, 5 pages → numeric buttons 1,2,3,5 (window + last)
        await expect(pgButtons).toHaveCount(4);

        const info = page.locator('#standalonePaginate >> .pg-info');
        await expect(info).toContainText('1–10 / 50');

        await page.locator('#standalonePaginate >> [data-page="2"]').click();
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
