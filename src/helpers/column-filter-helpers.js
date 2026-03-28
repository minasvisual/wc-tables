/**
 * Helpers for thead `col-filter` + client-side filtering when `<wc-table>` rebuilds shadow DOM on `data` changes.
 *
 * @see `ColumnFilterPlugin` — `__wcEmptyFilter` rows are skipped in tbody but keep column keys for thead/filters.
 */

/** @typedef {{ column: string, value: string, query?: string, originalEvent?: Event }} ColumnFilterDetail */

/**
 * Builds a sentinel row recognised by `wc-table` (`_isLayoutOnlyRow`).
 * Keeps thead + `.wc-col-filter-input` when your filtered array is empty but you still have a shape sample.
 *
 * @param {Record<string, unknown>} sample — e.g. `allRows[0]`
 * @returns {Record<string, unknown> & { __wcEmptyFilter: true }} | null
 */
export function emptyFilterPlaceholderRow(sample) {
    if (!sample || typeof sample !== 'object') return null;
    const row = { __wcEmptyFilter: true };
    for (const k of Object.keys(sample)) {
        const v = sample[k];
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
            row[k] = Object.fromEntries(Object.keys(v).map((ik) => [ik, '']));
        } else if (Array.isArray(v)) {
            row[k] = [];
        } else {
            row[k] = '';
        }
    }
    return row;
}

/**
 * Pass this as `data` when using external filters: real rows if any, otherwise one placeholder from `allRows[0]`.
 *
 * @template T
 * @param {T[]} filteredRows
 * @param {T[]} allRows
 * @returns {T[] | Array<Record<string, unknown> & { __wcEmptyFilter: true }>}
 */
export function tableDataWithEmptyFilterShell(filteredRows, allRows) {
    if (filteredRows.length > 0) return filteredRows;
    if (!allRows.length) return [];
    const ph = emptyFilterPlaceholderRow(allRows[0]);
    return ph ? [ph] : [];
}

/**
 * @param {ColumnFilterDetail} detail — `e.detail` from `column-filter`
 * @returns {{ column: string, value: string }}
 */
export function parseColumnFilterEvent(detail) {
    const column = detail?.column ?? '';
    const value = detail?.value ?? '';
    return { column, value };
}
