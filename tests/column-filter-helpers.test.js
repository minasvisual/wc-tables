import { describe, it, expect } from 'vitest';
import {
  emptyFilterPlaceholderRow,
  tableDataWithEmptyFilterShell,
  parseColumnFilterEvent,
} from '../src/helpers/column-filter-helpers.js';

describe('column-filter-helpers', () => {
  const sample = {
    id: 1,
    name: 'Ada',
    meta: { city: 'London', zip: 'E1' },
    tags: ['a', 'b'],
  };

  it('emptyFilterPlaceholderRow copies shape and sets __wcEmptyFilter', () => {
    const row = emptyFilterPlaceholderRow(sample);
    expect(row.__wcEmptyFilter).toBe(true);
    expect(row.id).toBe('');
    expect(row.name).toBe('');
    expect(row.meta).toEqual({ city: '', zip: '' });
    expect(row.tags).toEqual([]);
  });

  it('emptyFilterPlaceholderRow returns null for null sample', () => {
    expect(emptyFilterPlaceholderRow(null)).toBeNull();
  });

  it('tableDataWithEmptyFilterShell returns filtered when non-empty', () => {
    const all = [sample, { ...sample, id: 2 }];
    const filtered = [sample];
    expect(tableDataWithEmptyFilterShell(filtered, all)).toBe(filtered);
  });

  it('tableDataWithEmptyFilterShell uses placeholder when filtered empty', () => {
    const all = [sample];
    const out = tableDataWithEmptyFilterShell([], all);
    expect(out).toHaveLength(1);
    expect(out[0].__wcEmptyFilter).toBe(true);
    expect(out[0].name).toBe('');
  });

  it('tableDataWithEmptyFilterShell returns [] when allRows empty', () => {
    expect(tableDataWithEmptyFilterShell([], [])).toEqual([]);
  });

  it('parseColumnFilterEvent reads column and value', () => {
    expect(parseColumnFilterEvent({ column: 'email', value: 'x' })).toEqual({
      column: 'email',
      value: 'x',
    });
    expect(parseColumnFilterEvent({})).toEqual({ column: '', value: '' });
  });
});
