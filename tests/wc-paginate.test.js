import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../src/wc-paginate.js';

describe('wc-paginate component', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<wc-paginate id="test-pg"></wc-paginate>';
    el = document.getElementById('test-pg');
  });

  it('should have correct default attributes', () => {
    expect(el._currentPage).toBe(1);
    expect(el._pageSize).toBe(10);
    expect(el._total).toBe(0);
    expect(el._totalPages).toBe(1);
  });

  it('should calculate total pages correctly', () => {
    el.setAttribute('total', '100');
    el.setAttribute('page-size', '10');
    expect(el._totalPages).toBe(10);

    el.setAttribute('total', '105');
    expect(el._totalPages).toBe(11);
  });

  it('should navigate via goToPage', () => {
    el.setAttribute('total', '100');
    el.goToPage(3);
    expect(el._currentPage).toBe(3);
    
    // Test boundaries
    el.goToPage(999);
    expect(el._currentPage).toBe(10); // max
    el.goToPage(-1);
    expect(el._currentPage).toBe(1); // min
  });

  it('should sync _page when page attribute changes', () => {
    el.setAttribute('total', '100');
    el.setAttribute('page', '5');
    expect(el._currentPage).toBe(5);
  });

  it('should dispatch page-changed event when clicking buttons', () => {
    const handler = vi.fn();
    el.setAttribute('total', '50');
    el.addEventListener('page-changed', handler);
    
    // Simulate navigation click via internal method or triggering click on shadow DOM
    // For unit tests, we primarily test that navigate dispatches the event
    el._navigate(2);
    
    expect(handler).toHaveBeenCalled();
    const eventDetail = handler.mock.calls[0][0].detail;
    expect(eventDetail.page).toBe(2);
    expect(eventDetail.totalPages).toBe(5);
  });

  it('should build correct range based on delta', () => {
    el.setAttribute('total', '100');
    el.setAttribute('page-size', '10'); // 10 pages
    el.setAttribute('page', '5');
    el.setAttribute('delta', '1');
    
    // Delta 1 around page 5 should show [4, 5, 6]
    const range = el._buildRange();
    expect(range).toEqual([4, 5, 6]);
  });
});
