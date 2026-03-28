/**
 * Subscribe to `<wc-table>` (or any element) custom events with a single map of handlers.
 * Returns `disconnect()` — call it when the view is torn down (SPA route leave, `pagehide`, etc.).
 *
 * @example
 * import { Bus } from 'wc-tables-kit/bus';
 * const off = Bus(document.getElementById('myTable'), {
 *   'action-click': (e) => console.log(e.detail),
 *   'sort-changed': (e) => console.log(e.detail),
 * });
 * window.addEventListener('pagehide', off, { once: true });
 *
 * @param {Element|string} target - DOM node or CSS selector (first `document.querySelector` match)
 * @param {Record<string, (evt: Event) => void>} handlers - event type → listener (non-functions skipped)
 * @returns {() => void} disconnect - removes all registered listeners (idempotent)
 */
export function Bus(target, handlers) {
    const el =
        typeof target === 'string'
            ? (typeof document !== 'undefined' ? document.querySelector(target) : null)
            : target;

    if (!el || typeof el.addEventListener !== 'function') {
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('[Bus] Target missing or invalid; no listeners attached.');
        }
        return () => {};
    }

    if (!handlers || typeof handlers !== 'object') {
        return () => {};
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const pairs = [];

    for (const [eventName, fn] of Object.entries(handlers)) {
        if (typeof fn !== 'function') continue;
        if (controller) {
            el.addEventListener(eventName, fn, { signal: controller.signal });
        } else {
            el.addEventListener(eventName, fn);
            pairs.push([eventName, fn]);
        }
    }

    let disconnected = false;
    return function disconnect() {
        if (disconnected) return;
        disconnected = true;
        if (controller) {
            controller.abort();
        } else {
            for (const [eventName, fn] of pairs) {
                el.removeEventListener(eventName, fn);
            }
        }
    };
}
