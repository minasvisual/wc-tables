import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWcTableColumnFilters } from '../src/react-column-filters.js';

describe('useWcTableColumnFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initialises colFilters from filterKeys and exposes full rows as tableData', () => {
    const ref = { current: null };
    const all = [
      { id: 1, n: 'alpha' },
      { id: 2, n: 'beta' },
    ];
    const filterFn = (rows, f) =>
      rows.filter((r) => !f.n || String(r.n).includes(f.n));

    const { result } = renderHook(() =>
      useWcTableColumnFilters(ref, all, filterFn, {
        filterKeys: ['n'],
        debounceMs: 50,
        enabled: true,
      }),
    );

    expect(result.current.colFilters).toEqual({ n: '' });
    expect(result.current.filteredRows).toHaveLength(2);
    expect(result.current.tableData).toEqual(all);
  });

  it('after debounce, uses placeholder row when filter matches nothing', () => {
    const ref = { current: null };
    const all = [{ id: 1, n: 'alpha' }];
    const filterFn = (rows, f) =>
      rows.filter((r) => !f.n || String(r.n).includes(f.n));

    const { result } = renderHook(() =>
      useWcTableColumnFilters(ref, all, filterFn, {
        filterKeys: ['n'],
        debounceMs: 50,
        enabled: true,
      }),
    );

    const inp = document.createElement('input');
    inp.className = 'wc-col-filter-input';

    act(() => {
      result.current.onColumnFilter({
        detail: {
          column: 'n',
          value: 'nomatch',
          originalEvent: { target: inp },
        },
      });
    });

    expect(result.current.colFilters.n).toBe('nomatch');

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.filteredRows).toHaveLength(0);
    expect(result.current.tableData).toHaveLength(1);
    expect(result.current.tableData[0].__wcEmptyFilter).toBe(true);
    expect(result.current.tableData[0].n).toBe('');
  });

  it('parseColumnFilter-style: clearing filter restores data rows in tableData', () => {
    const ref = { current: null };
    const all = [{ id: 1, n: 'hi' }];
    const filterFn = (rows, f) =>
      rows.filter((r) => !f.n || String(r.n).includes(f.n));

    const { result } = renderHook(() =>
      useWcTableColumnFilters(ref, all, filterFn, {
        filterKeys: ['n'],
        debounceMs: 30,
        enabled: true,
      }),
    );

    const inp = document.createElement('input');
    inp.className = 'wc-col-filter-input';

    act(() => {
      result.current.onColumnFilter({
        detail: { column: 'n', value: 'x', originalEvent: { target: inp } },
      });
    });
    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(result.current.tableData[0].__wcEmptyFilter).toBe(true);

    act(() => {
      result.current.onColumnFilter({
        detail: { column: 'n', value: '', originalEvent: { target: inp } },
      });
    });
    act(() => {
      vi.advanceTimersByTime(30);
    });

    expect(result.current.tableData).toEqual(all);
  });
});
