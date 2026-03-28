/**
 * React hook: debounced column-filter state, `tableData` shell for empty results, shadow input sync + focus.
 * Requires `ref` on `<wc-table>` and `WcTable` to set `.data` in useLayoutEffect (wc-tables-kit `./react`).
 */

import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { tableDataWithEmptyFilterShell } from './helpers/column-filter-helpers.js';

function useDebounced(value, ms) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return debounced;
}

function defaultFilterState(filterKeys) {
    if (!filterKeys?.length) return {};
    return Object.fromEntries(filterKeys.map((k) => [k, '']));
}

/**
 * @template T
 * @param {React.RefObject<HTMLElement | null>} tableRef — `<wc-table>` host
 * @param {T[]} allRows — full dataset (for shell shape when filtered is empty)
 * @param {(rows: T[], filters: Record<string, string>) => T[]} filterFn — applied with debounced filter map
 * @param {object} [options]
 * @param {number} [options.debounceMs=280]
 * @param {string[]} [options.filterKeys] — keys for initial `colFilters` (`''` each); omit for `{}`
 * @param {Record<string, string>} [options.initialState] — overrides `filterKeys` initial state
 * @param {boolean} [options.enabled=true] — when false, skips shadow sync / focusout (e.g. while loading)
 */
export function useWcTableColumnFilters(tableRef, allRows, filterFn, options = {}) {
    const {
        debounceMs = 280,
        filterKeys,
        initialState,
        enabled = true,
    } = options;

    const [colFilters, setColFilters] = useState(
        () => initialState ?? defaultFilterState(filterKeys),
    );

    const debouncedFilters = useDebounced(colFilters, debounceMs);
    const filterFocusRef = useRef({ key: null, start: 0, end: 0 });

    const filteredRows = useMemo(
        () => filterFn(allRows, debouncedFilters),
        [allRows, debouncedFilters, filterFn],
    );

    const tableData = useMemo(
        () => tableDataWithEmptyFilterShell(filteredRows, allRows),
        [filteredRows, allRows],
    );

    const onColumnFilter = useCallback((e) => {
        const { column, value, originalEvent } = e.detail;
        const inp = originalEvent?.target;
        if (inp?.matches?.('.wc-col-filter-input')) {
            filterFocusRef.current = {
                key: column,
                start: inp.selectionStart ?? value.length,
                end: inp.selectionEnd ?? value.length,
            };
        }
        setColFilters((prev) => (prev[column] === value ? prev : { ...prev, [column]: value }));
    }, []);

    useLayoutEffect(() => {
        if (!enabled) return;
        const el = tableRef.current;
        const root = el?.shadowRoot;
        if (!root) return;
        root.querySelectorAll('.wc-col-filter-input[data-col-filter]').forEach((inp) => {
            const k = inp.dataset.colFilter;
            if (k && colFilters[k] !== undefined && inp.value !== colFilters[k]) {
                inp.value = colFilters[k];
            }
        });
        const { key, start, end } = filterFocusRef.current;
        if (!key) return;
        const focusInp = root.querySelector(`.wc-col-filter-input[data-col-filter="${key}"]`);
        if (focusInp && document.activeElement !== focusInp) {
            focusInp.focus();
            try {
                const len = focusInp.value.length;
                focusInp.setSelectionRange(Math.min(start, len), Math.min(end, len));
            } catch {
                /* ignore */
            }
        }
    }, [tableData, colFilters, enabled, tableRef]);

    useEffect(() => {
        if (!enabled) return;
        const el = tableRef.current;
        const root = el?.shadowRoot;
        if (!root) return;
        const onFilterFocusOut = (ev) => {
            if (!ev.target.matches?.('.wc-col-filter-input')) return;
            requestAnimationFrame(() => {
                const active = root.activeElement;
                if (!active?.matches?.('.wc-col-filter-input')) {
                    filterFocusRef.current = { key: null, start: 0, end: 0 };
                }
            });
        };
        root.addEventListener('focusout', onFilterFocusOut, true);
        return () => root.removeEventListener('focusout', onFilterFocusOut, true);
    }, [enabled, tableData.length, tableRef]);

    return {
        colFilters,
        setColFilters,
        debouncedFilters,
        filteredRows,
        tableData,
        onColumnFilter,
    };
}
