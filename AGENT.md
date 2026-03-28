# wc-tables-kit — Agent Documentation

> This document is intended for AI coding assistants working on this repository.
> It describes the architecture, file structure, key patterns, and coding conventions.

---

## 1. Project Overview

**`wc-tables-kit`** is a vanilla JavaScript Web Component library that renders data tables with zero dependencies. It is framework-agnostic by design, working with plain HTML, Alpine.js, React, Next.js, and any other front-end stack.

**Package name:** `wc-tables-kit`  
**Entry point:** `src/wc-table.js`  
**Dev server:** `npm run dev` or `yarn dev` (http-server on port 8080)  
**Tests:** `npm test` (Vitest unit tests), `npm run test:e2e` (Playwright)

---

## 2. Directory Structure

```
wc-tables/
├── src/
│   ├── wc-table.js          # Core Web Component (<wc-table>)
│   ├── wc-table.css         # Shadow DOM styles for the component
│   ├── wc-table-row.js      # Column config element (<wc-table-row>)
│   ├── wc-paginate.js       # Standalone pagination component (<wc-paginate>)
│   ├── config.js            # Global Config: i18n, plugin registry
│   ├── bus.js               # Bus(target, handlers) → disconnect(); event map helper
│   ├── react.js             # React/Next.js adapter (no JSX, pure ESM)
│   ├── wc-table-head.js     # <wc-table-head> host (extra thead content)
│   ├── wc-table-footer.js   # <wc-table-footer> host (tfoot content)
│   └── plugins/
│       ├── badge.js         # Colored badge/pill
│       ├── button.js        # Action button
│       ├── currency.js      # Currency formatting (Intl)
│       ├── date.js          # Date formatting (Intl or custom tokens)
│       ├── expression.js    # Template string evaluator
│       ├── image.js         # <img> renderer
│       ├── link.js          # <a> renderer
│       ├── object.js        # Nested property accessor
│       └── tags.js          # Chip/tag list renderer
├── examples/
│   ├── menus.html           # Demonstrates row actions and toolbars
│   ├── placeholder.html     # Demonstrates server-side mode
│   ├── plugins.html         # Demonstrates all column plugins
│   ├── react.html           # React adapter demo (React via CDN)
│   └── wc-nav.js            # Shared navigation component for examples
├── tests/                   # Vitest and Playwright test files
├── index.html               # Main demo page
└── package.json
```

---

## 3. Core Components

### `<wc-table>` — `src/wc-table.js`

The main component. Registered as `customElements.define('wc-table', WcTable)`.

**Key internal state:**
| Property | Type | Description |
|---|---|---|
| `_data` | `Array` | Source data array |
| `_filteredData` | `Array` | Filtered/sorted view |
| `_sortConfig` | `Object` | `{ key, direction }` |
| `_filterText` | `string` | Current search string |
| `_selectedRows` | `Set` | Currently selected items |
| `_columnConfigs` | `Object` | Parsed from child `<wc-table-row>` elements |
| `_plugins` | `Object` | Merged built-in + custom plugins |
| `_currentPage` | `number` | Active page index (1-based). Managed by pagination logic |

**Setting data:**  
Preferred approach — set as a JS property:
```js
document.getElementById('myTable').data = [{ id: 1, name: 'Alice' }];
```
Alternatively, pass a JSON array as an HTML attribute (useful for static/SSR content):
```html
<wc-table data='[{"id":1,"name":"Alice"}]'></wc-table>
```
The JS property takes priority over the attribute when both are present.

**Observed attributes:** `server-side`, `data`, `page-size`, `hidden-cols`, `hide-search`

**Public filter API:** `filterQuery` get/set — same pipeline as the default search (`before-filter` → apply → `after-filter`). Use with `hide-search` for a custom filter UI.

**Computed getters (pagination):**
- `_pageSize` → parses `page-size` attribute as integer; returns `0` if absent (pagination off)
- `_totalPages` → `Math.ceil(_filteredData.length / _pageSize)`
- `_getPagedData()` → slices `_filteredData` for the current page

**Computed getters (column visibility):**
- `_hiddenCols` → parses `hidden-cols` attribute; returns a `Set<string>` of keys to exclude. Accepts comma-separated (`id,phone`) or JSON array (`["id","phone"]`) format. Returns empty `Set` if attribute is absent.

**Lifecycle methods:**
- `connectedCallback()` → calls `render()`, sets up a `MutationObserver` on child `<wc-table-row>` elements
- `disconnectedCallback()` → disconnects the observer
- `constructor()` → **`shadowRoot.addEventListener('click', …)` for `action-click` delegation** — register here only; **never** attach the same listener inside `render()` or each full re-render will stack handlers and duplicate `action-click`.
- `render()` → replaces shadow `innerHTML` (toolbar + `#tableContent`); runs on mount, `hide-search` changes, and `server-side` sort header refresh. Does **not** re-bind row action clicks (handled in constructor).
- `renderContent()` → replaces only `#tableContent` innerHTML (table + pagination); called after filter/sort/pagination and most data updates

**CSS:** Injected via `<link>` pointing to `./wc-table.css` resolved with `import.meta.url`.

---

### `<wc-table-row>` — `src/wc-table-row.js`

A lightweight declarative element used as a child of `<wc-table>` to configure column display.  
Registered as `wc-table-row` using a guard: `if (!customElements.get('wc-table-row'))`.

**Attributes:**
| Attribute | Description |
|---|---|
| `col` | **Required.** The data object key this column maps to |
| `type` | Plugin name: `date`, `currency`, `badge`, `link`, `image`, `object`, `tags`, `button`, `expression` |
| `format` | Plugin-specific format config (e.g. `en-US` for date, `USD` for currency) |
| `label` | Override display label for link/button plugins |
| `action` | Action name emitted by button plugin |
| `target` | Link `target` attribute |
| `item` | Dot-path for object plugin (e.g. `address.city`) |
| `expr` | Template string for expression plugin (e.g. `${name} (${role})`) |
| `class` | Extra CSS class forwarded to the plugin renderer |
| `rounded`, `width`, `height` | Image plugin options |
| `col-label` | Overrides the sortable header label for that column (`Config.t(key)` fallback) |
| `header-text` | Declarative `wc-table-head` only: static text for that column’s extra header cell |

---

### `<wc-table-head>` / `<wc-table-footer>` — `wc-table-head.js`, `wc-table-footer.js`

Light-DOM hosts; content is read when the table builds `<thead>` / `<tfoot>`.

**Modes (see `_collectSectionRows` / `_appendDeclarativeHeadRow` in `wc-table.js`):**

1. **Manual:** `<template>` (or `<table>`) containing `<tr>…</tr>`. Rows are **cloned** into the real table. Host is responsible for column alignment (checkbox + optional action cols + one cell per data key in key order).
2. **Declarative:** No template/table, but `:scope > wc-table-row` children. One synthetic `<tr class="wc-thead-extra">` is built; each `col` maps to a `<th>`. Merged config = global column `<wc-table-row>` + head row attributes. Plugins run with **`item` = `_filteredData[0] ?? {}`** so `type="expression"` and `${field}` work using the **first visible filtered row** (not an arbitrary row index).

Extra thead rows use CSS `thead tr:not(:first-child) th` so sort cursor/hover does not apply.

---

### `Bus` — `src/bus.js`

**Export:** `wc-tables-kit/bus`  
`Bus(target, handlers)` where `target` is an `Element` or selector string; `handlers` maps event type → function. Returns **`disconnect()`** (idempotent): `AbortController.abort()` or `removeEventListener` per pair. Use for grouping `action-click`, `sort-changed`, `updated`, etc., and call `disconnect()` on SPA teardown or `pagehide`.

---

### `<wc-paginate>` — `src/wc-paginate.js`

A standalone pagination control, independent of `<wc-table>`. Ideal for server-side pagination scenarios where the host app controls data fetching.

Registered as `customElements.define('wc-paginate', WcPaginate)`.
Package export: `wc-tables-kit/paginate`.

**Attributes:**
| Attribute | Type | Default | Description |
|---|---|---|---|
| `total` | `number` | `0` | Total number of records. **Required** for page count calculation |
| `page` | `number` | `1` | Current active page (1-based). Setting this attribute re-renders |
| `page-size`| `number` | `10` | Records per page |
| `delta` | `number` | `2` | Number of page buttons shown each side of the active page |
| `hide-info`| `boolean`| — | Hides the `X–Y / Z` info counter when present |

**Computed getters:**
- `_currentPage` → internal mutable `_page` (survives attribute updates)
- `_pageSize` → parses `page-size`
- `_total` → parses `total`
- `_totalPages` → `Math.ceil(_total / _pageSize)`
- `_delta` → parses `delta`
- `_buildRange()` → computes the visible page number window

**Public method:**
- `goToPage(n)` → navigates to page `n` without firing `page-changed`; use `setAttribute('page', n)` if you want the event.

**Event:**
| Event | `detail` | When |
|---|---|---|
| `page-changed` | `{ page, totalPages, pageSize }` | User clicks a page button |

**Internal design notes:**
- Styles are inlined in the JS (`const CSS = ...`) — no external CSS file dependency.
- `_render()` rebuilds the entire shadow DOM on each change (simple, ~10 DOM nodes).
- Does **not** manage data fetching — the host reacts to `page-changed` and updates `<wc-table>.data`.
- Changing `page` attribute externally re-renders but does **not** fire `page-changed` (prevents loops).

---

## 4. Plugin System

### Plugin Contract

Every plugin is a class with a static `render` method:

```js
export class MyPlugin {
    /**
     * @param {any} value     - The raw cell value from the data row
     * @param {Object} config - All attributes from the <wc-table-row> element
     * @param {Object} item   - The full row data object
     * @returns {string}      - HTML string to inject into the <td>
     */
    static render(value, config, item) {
        return `<span>${value}</span>`;
    }
}
```

### Built-in Plugins

| Plugin | Key values for `type` | Notes |
|---|---|---|
| `BadgePlugin` | `badge` | Auto-colors by value: active→green, pending→yellow, inactive→red |
| `ButtonPlugin` | `button` | Emits `action-click` with `data-action` attribute |
| `ColumnFilterPlugin` | `col-filter` | Thead filter input; table emits `column-filter` on `input` |
| `CurrencyPlugin` | `currency` | Uses `Intl.NumberFormat`. `format` = ISO code (USD, BRL) |
| `DatePlugin` | `date` | `format` = locale string OR custom tokens (DD, MM, YYYY, etc.) |
| `ExpressionPlugin` | `expression` | `expr` = template like `${name} – ${id}` |
| `ImagePlugin` | `image` | `width`, `height`, `rounded` (boolean) |
| `LinkPlugin` | `link` | `label` prop overrides cell value as link text |
| `ObjectPlugin` | `object` | `item` = dot.path.to.nested.value |
| `TagsPlugin` | `tags` | Accepts arrays or comma-separated strings |

### Registering a Custom Plugin

```js
import { Config } from 'wc-tables-kit/src/config.js';

class UpperPlugin {
    static render(value) {
        return String(value).toUpperCase();
    }
}
Config.registerPlugin('uppercase', UpperPlugin);
```

---

## 5. Global Config — `src/config.js`

The `Config` singleton controls language and custom plugin registration.

```js
import { Config } from 'wc-tables-kit/src/config.js';

Config.setLanguage('pt-br');         // Switch language
Config.registerPlugin('my', MyPlugin); // Register custom plugin
Config.t('searchPlaceholder');        // Translate a key
```

**Supported languages:** `en` (default), `pt-br`

**How column headers are translated:** `Config.t(key)` is called with the object key name. If no translation exists, the key is returned as-is.

**Adding translations:** Add entries to `Config.translations['en']` for recognized field names.

---

## 6. Slots (Light DOM)

| Slot name | Location |
|---|---|
| `before` | Above the toolbar |
| `after` | Below the table |
| `toolbar-left` | Left side of toolbar |
| `toolbar-center` | Center of toolbar |
| `toolbar-right` | Right of toolbar (next to search) |
| `left-actions` | First column of every row |
| `right-actions` | Last column of every row |

Action slots accept a `<template>` or any element. Use `data-action="value"` on buttons inside action slots to trigger `action-click` events.

---

## 7. Events

All events bubble and are composed (cross-shadow-DOM).

| Event | `detail` payload | When |
|---|---|---|
| `before-mount` | `{}` | Before first render |
| `after-mount` | `{}` | After first render |
| `updated` | `{ data }` | When `.data` is set (skips first load) |
| `before-filter` | `{ query }` | Before search filter is applied |
| `after-filter` | `{ results }` | After filter is applied |
| `sort-changed` | `{ key, direction }` | Column header clicked |
| `page-changed` | `{ page, totalPages }` | Active page changes (client-side pagination only) |
| `action-click` | `{ action, item, originalEvent }` | `data-action` button clicked |
| `row-selected` | `{ item, isSelected, selectedRows }` | Single row checkbox toggled |
| `selection-changed` | `{ selectedRows, allSelected }` | "Select all" toggled |
| `column-filter` | `{ column, value, query, originalEvent }` | `.wc-col-filter-input` `input` (delegated on shadow root) |

**Empty external filter + thead filters:** pass `tableDataWithEmptyFilterShell(filtered, all)` from `wc-tables-kit/helpers/column-filter`, or `useWcTableColumnFilters` from `wc-tables-kit/react-column-filters` in React (sentinel row `__wcEmptyFilter`).

---

## 8. Client-Side Pagination

Add `page-size="N"` to the `<wc-table>` element to enable automatic pagination.

```html
<wc-table page-size="10">...</wc-table>
```

**How it works internally:**
1. `_getPagedData()` slices `_filteredData` from `(page-1)*pageSize` to `page*pageSize`.
2. `_renderTable()` iterates over the paged slice instead of the full filtered set.
3. `_renderPagination()` produces a `<div class="wc-pagination">` with prev/next/numbered buttons.
4. `renderContent()` always appends the result of both methods: `_renderTable() + _renderPagination()`.
5. `_setupPaginationListeners()` binds click events on `[data-page]` buttons via `_goToPage(n)`.

**Reset behaviour:** `_currentPage` resets to `1` on every filter, sort, and `page-size` attribute change.

**Changing page size at runtime:**
```js
table.setAttribute('page-size', '25'); // triggers attributeChangedCallback → reset + re-render
```

**Navigating programmatically:**
```js
table._goToPage(3); // internal method; use event listeners to react to page changes
```

---

## 9. Server-Side Mode

Add the `server-side` attribute to disable local filtering/sorting.
> **Note:** Client-side pagination (`page-size`) and server-side mode are independent. In server-side mode the host app manages slicing, so `page-size` should not be combined with `server-side`.  
The component then only renders what's in `.data` and emits events for the host to respond to.

```html
<wc-table id="t" server-side>...</wc-table>
<script type="module">
    const t = document.getElementById('t');
    t.addEventListener('before-filter', ({ detail }) => {
        fetch(`/api?q=${detail.query}`).then(r => r.json()).then(d => t.data = d);
    });
    t.addEventListener('sort-changed', ({ detail }) => {
        fetch(`/api?sort=${detail.key}&dir=${detail.direction}`)
            .then(r => r.json()).then(d => t.data = d);
    });
</script>
```

---

## 9. React / Next.js Adapter — `src/react.js` (`wc-tables-kit/react`)

This file wraps `<wc-table>` and `<wc-table-row>` as React components.

**Important:** The file uses `React.createElement` (no JSX) so it can be loaded as a plain native ES Module in the browser without Babel. It is safe to import in bundler environments (Vite, Next.js) where `import('react')` will succeed.

### React auto-detection

```js
// Tries bundler import first, falls back to window.React (UMD CDN)
let _React;
try { _React = (await import('react')).default ?? mod; }
catch { _React = globalThis.React; }
```

### Usage in Next.js (App Router)

```jsx
'use client';
import 'wc-tables-kit'; // registers the custom elements
import { WcTable, WcTableRow } from 'wc-tables-kit/react';

export default function Page() {
    const data = [{ id: 1, name: 'Alice', status: 'active' }];
    return (
        <WcTable data={data} onActionClick={(e) => console.log(e.detail)}>
            <WcTableRow col="name" />
            <WcTableRow col="status" type="badge" />
        </WcTable>
    );
}
```

### Usage in Browser (CDN / no build step)

```html
<!-- 1. React UMD (sets window.React) -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<!-- 2. Babel Standalone (for JSX in your app script) -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<!-- 3. Web component + adapter -->
<script type="module" src="./src/wc-table.js"></script>
<script type="module" src="./src/react.js"></script> <!-- or window.WcTableReact via CDN -->
<!-- 4. Your app (Babel transpiles JSX, adapter is already loaded) -->
<script type="text/babel">
    function initApp() {
        const { WcTable, WcTableRow } = window.WcTableReact;
        // ... build your React app
    }
    // Race-condition-safe bootstrap
    if (window.WcTableReact) initApp();
    else window.addEventListener('wc-table-react-ready', initApp);
</script>
```

**Why the `wc-table-react-ready` event?** `type="module"` scripts are deferred and run async. Babel's `type="text/babel"` scripts may execute before or after. The adapter dispatches this event and exposes `window.WcTableReact` after it's fully initialized. Always use the check-first pattern above.

### Adapter prop mapping

| React prop | DOM equivalent |
|---|---|
| `data` | `.data` property (set via `useEffect`) |
| `filterQuery` | `.filterQuery` property when prop is passed (omit prop to avoid overwriting table filter state) |
| `className` | `class` attribute |
| `onActionClick` | `addEventListener('action-click', ...)` |
| `onRowSelected` | `addEventListener('row-selected', ...)` |
| `onSelectionChanged` | `addEventListener('selection-changed', ...)` |
| `onSortChanged` | `addEventListener('sort-changed', ...)` |
| `onPageChanged` | `addEventListener('page-changed', ...)` |
| `onBeforeFilter` | `addEventListener('before-filter', ...)` |
| `onAfterFilter` | `addEventListener('after-filter', ...)` |
| `onUpdated` | `addEventListener('updated', ...)` |
| Any other prop | Forwarded as HTML attribute |

---

## 10. Styling

The component uses Shadow DOM, so global CSS does not penetrate it by default.

### What CAN be styled from outside:
1. **The host element:** `wc-table { margin: 2rem; }` — controls layout/spacing.
2. **Inherited CSS:** `font-family`, `color`, `font-size` are inherited by the shadow root.
3. **Slot content (Light DOM):** `[slot="toolbar-left"] h2 { color: red; }` — full control.

### What CANNOT be styled from outside (without changing source):
- Internal `th`, `td`, `table`, `.badge`, `.toolbar`, `.search-input`, etc. (they live in Shadow DOM).

### To customize internal styles:
Edit `src/wc-table.css`. To make it themeable, convert hardcoded values to CSS variables with fallbacks:
```css
/* In wc-table.css */
th { background: var(--wc-table-header-bg, #f1f5f9); }
td { color: var(--wc-table-text-color, #475569); }
```
Then callers can override: `wc-table { --wc-table-header-bg: #1e293b; }`.

---

## 11. Examples

| File | What it demonstrates |
|---|---|
| `index.html` | Basic table with most features enabled |
| `examples/plugins.html` | All column plugins, `hide-search`, `Bus`, extra thead filter row (manual template), local `../src/wc-table.js` import |
| `examples/menus.html` | Row actions, toolbar slots, `action-click` events |
| `examples/placeholder.html` | Server-side mode with async data fetching |
| `examples/react.html` | React adapter (no build step, CDN-based) |

---

## 12. Common Patterns & Gotchas

- **Prefer `.data` property over the attribute for dynamic data.** The `data` HTML attribute is supported and useful for static/SSR content, but the JS property setter is the idiomatic approach for dynamic datasets.
- **`data` attribute must be valid JSON array.** If the value is not parseable, a `console.warn` is emitted and the table stays empty. The JS property always takes priority.
- **`hidden-cols` hides columns, it does not remove data.** The underlying `_data` and `_filteredData` arrays are untouched — hidden keys are simply excluded from `keys` before rendering headers and cells. This means sorting, filtering, and `action-click` payloads still include the hidden fields.
- **`hidden-cols` supports both formats.** `id,phone` (comma-separated) and `["id","phone"]` (JSON array) are both accepted. Non-existent keys are silently ignored.
- **`page-size` interacts with row selection.** Selected rows are tracked by object reference in `_selectedRows`. Pagination changes visible rows but does not clear the selection set.
- **Do not combine `page-size` with `server-side`.** Server-side mode bypasses local data slicing — let the API handle pagination instead.
- **`wc-table-row` elements must be direct children.** The `MutationObserver` only watches `childList` of the `<wc-table>` itself.
- **Column keys are auto-detected** from `Object.keys(data[0])` on first render, unless hidden by `wc-table-row` config.
- **Adding a plugin does not auto-re-render.** You must set `.data` again after calling `Config.registerPlugin()`.
- **`import.meta.url`** is used to resolve the CSS file path. In bundlers that don't support this (older Next.js configs), the CSS path may break — handle with a `try/catch` or load CSS separately.
- **The `guard` in `wc-table-row.js`** (`if (!customElements.get('wc-table-row'))`) prevents double-registration errors if the module is imported multiple times.
- **`hide-search` + `filterQuery`:** Default toolbar search is omitted when the attribute is present; use `table.filterQuery = '…'` (or `before-filter` / `after-filter`) for custom UIs. Same pipeline as the built-in input.
- **Custom inputs inside cloned thead rows:** Assigning `table.data` triggers `renderContent()` and rebuilds the table; filter `<input>` nodes are recreated — restore focus/caret after render if the UX requires typing (see `examples/plugins.html`).
- **CDN vs local src:** Examples that rely on `hide-search`, `Bus`, or other unreleased bits should import `../src/wc-table.js` (or a published npm version that includes those changes), not an old unpkg pin.
- **Declarative `wc-table-head` + `expression`:** Placeholders use the first filtered row as data context; document this if product needs another row.

---

## 13. Adding a New Feature — Checklist

1. **New plugin:** Create `src/plugins/myplugin.js` with a static `render(value, config, item)` method. Import and register it in `wc-table.js` in the `_plugins` object.
2. **New attribute on `wc-table`:** Add to `observedAttributes` array and handle in `attributeChangedCallback`.
3. **New i18n key:** Add to both `en` and `pt-br` dictionaries in `config.js`.
4. **New event:** Dispatch via `this.dispatchEvent(new CustomEvent('event-name', { detail: {...}, bubbles: true, composed: true }))`.
5. **New public module:** Add `"./your-export": "./src/your-file.js"` under `package.json` → `exports`; document in `README.md` and this file.
6. **New example:** Add an `.html` file to `examples/` and link it in `examples/wc-nav.js`.
