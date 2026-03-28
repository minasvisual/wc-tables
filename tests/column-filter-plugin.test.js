import { describe, it, expect } from 'vitest';
import { ColumnFilterPlugin } from '../src/plugins/column-filter.js';

describe('ColumnFilterPlugin', () => {
  it('renders input with wc-col-filter-input and data-col-filter', () => {
    const html = ColumnFilterPlugin.render('Name', { col: 'name', type: 'col-filter' });
    expect(html).toContain('class="wc-col-filter-input"');
    expect(html).toContain('data-col-filter="name"');
    expect(html).toContain('type="search"');
    expect(html).toContain('placeholder="Name"');
  });

  it('respects input-type when allowed', () => {
    const html = ColumnFilterPlugin.render('x', { col: 'email', 'input-type': 'text' });
    expect(html).toContain('type="text"');
  });

  it('falls back to search for disallowed input-type', () => {
    const html = ColumnFilterPlugin.render('x', { col: 'x', 'input-type': 'password' });
    expect(html).toContain('type="search"');
  });

  it('returns empty string when col is missing', () => {
    expect(ColumnFilterPlugin.render('x', { type: 'col-filter' })).toBe('');
  });

  it('escapes attribute-breaking characters in col', () => {
    const html = ColumnFilterPlugin.render('x', { col: 'a"b' });
    expect(html).not.toContain('a"b');
    expect(html).toContain('a&quot;b');
  });
});
