import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Bus } from '../src/bus.js';

describe('Bus', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<div id="t"></div>';
    el = document.getElementById('t');
  });

  it('should attach handlers and return disconnect', () => {
    const a = vi.fn();
    const b = vi.fn();
    const off = Bus(el, {
      'action-click': a,
      'updated': b,
    });
    el.dispatchEvent(new CustomEvent('action-click', { bubbles: true }));
    el.dispatchEvent(new CustomEvent('updated', { bubbles: true }));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(typeof off).toBe('function');
    off();
    el.dispatchEvent(new CustomEvent('action-click', { bubbles: true }));
    expect(a).toHaveBeenCalledTimes(1);
  });

  it('should resolve string selector', () => {
    const fn = vi.fn();
    const off = Bus('#t', { foo: fn });
    el.dispatchEvent(new CustomEvent('foo', { bubbles: true }));
    expect(fn).toHaveBeenCalledTimes(1);
    off();
  });

  it('should skip non-function values', () => {
    const off = Bus(el, { x: null, y: 'nope', z: () => {} });
    expect(typeof off).toBe('function');
    off();
  });

  it('should return noop disconnect when target missing', () => {
    const off = Bus('#does-not-exist', { x: vi.fn() });
    expect(() => off()).not.toThrow();
  });

  it('disconnect should be idempotent', () => {
    const off = Bus(el, { e: vi.fn() });
    off();
    off();
  });
});
