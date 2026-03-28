import { describe, it, expect, beforeEach } from 'vitest';
import '../src/wc-table.js';

describe('wc-table attribute features', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<wc-table id="test-table"></wc-table>';
    el = document.getElementById('test-table');
  });

  it('should parse and set data from data attribute', () => {
    const jsonData = JSON.stringify([
      { id: 1, name: 'Test 1' },
      { id: 2, name: 'Test 2' }
    ]);
    
    el.setAttribute('data', jsonData);
    // Data is set as a property
    expect(el.data).toHaveLength(2);
    expect(el.data[0].name).toBe('Test 1');
  });

  it('should handle invalid JSON gracefully', () => {
    // Should not crash, just warn and keep old data (empty)
    el.setAttribute('data', '{ invalid json }');
    expect(el._data).toHaveLength(0);
  });

  it('should compute _hiddenCols from comma-separated attribute', () => {
    el.setAttribute('hidden-cols', 'id,age,status');
    const hidden = el._hiddenCols;
    expect(hidden.has('id')).toBe(true);
    expect(hidden.has('age')).toBe(true);
    expect(hidden.has('status')).toBe(true);
    expect(hidden.has('name')).toBe(false);
  });

  it('should compute _hiddenCols from JSON array attribute', () => {
    el.setAttribute('hidden-cols', '["id", "company"]');
    const hidden = el._hiddenCols;
    expect(hidden.has('id')).toBe(true);
    expect(hidden.has('company')).toBe(true);
  });
  
  it('should disable pagination if page-size is missing or 0', () => {
    // Current setup: page-size missing
    expect(el._pageSize).toBe(0);
    
    el.setAttribute('page-size', '5');
    expect(el._pageSize).toBe(5);

    el.setAttribute('page-size', '0');
    expect(el._pageSize).toBe(0);
  });
});
