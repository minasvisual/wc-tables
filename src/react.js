/**
 * React Adapter for wc-table
 *
 * This adapter wraps the wc-table Web Component for use in React and Next.js.
 *
 * No JSX – uses React.createElement so this file can run as a plain ES Module
 * in the browser without Babel transpilation.
 *
 * Two modes of operation:
 *
 * 1. BUNDLER (Vite, Next.js, webpack)
 *    import { WcTable, WcTableRow } from 'wc-tables-kit/src/react.js';
 *    React must be available as a peer dependency.
 *
 * 2. BROWSER CDN
 *    Load React UMD first (sets window.React), then load this script:
 *    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
 *    <script type="module" src="../src/react.js"></script>
 *    Components are then available on window.WcTableReact.
 */

// Support both bundler (ESM import) and browser CDN (global React)
let _React;
try {
    // Dynamic import works in bundlers; fails gracefully in plain browser ESM
    const mod = await import('react');
    _React = mod.default ?? mod;
} catch {
    // Fall back to global – set by React UMD CDN script
    _React = globalThis.React;
}

if (!_React) {
    throw new Error('[wc-tables-kit] React not found. Load React UMD before this script, or install react as a peer dependency.');
}

const { useEffect, useRef, useImperativeHandle, forwardRef, createElement } = _React;

const eventMapping = {
    'actionclick':      'action-click',
    'rowselected':      'row-selected',
    'selectionchanged': 'selection-changed',
    'sortchanged':      'sort-changed',
    'beforefilter':     'before-filter',
    'afterfilter':      'after-filter',
    'beforemount':      'before-mount',
    'aftermount':       'after-mount',
    'updated':          'updated',
};

/**
 * WcTable – React wrapper for <wc-table>
 *
 * Props:
 *   data             Array   Rows to display (passed as DOM property, not attribute)
 *   onActionClick    fn      'action-click' custom event
 *   onRowSelected    fn      'row-selected' custom event
 *   onSelectionChanged fn    'selection-changed' custom event
 *   onSortChanged    fn      'sort-changed' custom event
 *   onBeforeFilter   fn      'before-filter' custom event
 *   onAfterFilter    fn      'after-filter' custom event
 *   onUpdated        fn      'updated' custom event
 *   className        string  forwarded as 'class' attribute
 *   ...rest                  any other attribute forwarded to <wc-table>
 */
export const WcTable = forwardRef(function WcTable({ data, children, className, style, ...props }, ref) {
    const innerRef = useRef(null);

    useImperativeHandle(ref, () => innerRef.current);

    // Set data as a DOM property (arrays/objects cannot be serialized as attributes)
    useEffect(() => {
        if (innerRef.current) {
            innerRef.current.data = data ?? [];
        }
    }, [data]);

    // Map onXxx props to native custom-event listeners
    useEffect(() => {
        const node = innerRef.current;
        if (!node) return;

        const attached = [];
        for (const [prop, value] of Object.entries(props)) {
            if (prop.startsWith('on') && typeof value === 'function') {
                const key = prop.slice(2).toLowerCase();
                const eventName = eventMapping[key] ?? key;
                const handler = (e) => value(e);
                node.addEventListener(eventName, handler);
                attached.push({ eventName, handler });
            }
        }

        return () => {
            for (const { eventName, handler } of attached) {
                node.removeEventListener(eventName, handler);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, Object.values(props));

    // Strip event props before forwarding to the DOM element
    const domProps = {};
    for (const [key, value] of Object.entries(props)) {
        if (!key.startsWith('on')) {
            domProps[key] = value;
        }
    }

    return createElement(
        'wc-table',
        { ref: innerRef, class: className, style, ...domProps },
        children
    );
});

WcTable.displayName = 'WcTable';

/**
 * WcTableRow – React wrapper for <wc-table-row>
 * Used to configure column types inside <WcTable>.
 */
export function WcTableRow({ children, ...props }) {
    return createElement('wc-table-row', props, children);
}

WcTableRow.displayName = 'WcTableRow';

// Expose to window for CDN browser usage
if (typeof window !== 'undefined') {
    window.WcTableReact = { WcTable, WcTableRow };
    window.dispatchEvent(new CustomEvent('wc-table-react-ready'));
}
