# wc-tables-kit

A flexible, slot-based, and modular **Vanilla Web Component Table**. Built with native JS and CSS, no dependencies.

## Features
- **Slots Everywhere**: Header, footer, toolbar, and column actions.
- **Modular Plugins**: Separate classes for formatting types (`date`, `currency`, `badge`, `link`, `image`, `object`, `tags`, `button`, `expression`).
- **Custom Plugin Registry**: Register your own formatting logic.
- **Row Actions**: Add 'Edit', 'Delete', or custom buttons to every row with full data context.
- **Bulk Selection**: Integrated checkbox system with event reporting.
- **Dynamic Sorting & Filtering**: Local data management out of the box; optional `hide-search` keeps events while you supply your own filter UI.
- **Client-Side Pagination**: Add `page-size` attribute to paginate large datasets without any server interaction.
- **Inline JSON Data**: Pass initial data directly via the `data` HTML attribute — no JavaScript required for static datasets.
- **Hidden Columns**: Use `hidden-cols` to hide specific columns without removing them from the data, via a comma-separated list or JSON array.
- **`<wc-paginate>`**: Standalone pagination control component — use it with server-side mode or any custom data list.
- **`<wc-table-head>` / `<wc-table-footer>`**: Extra `<thead>` / `<tfoot>` rows via `<template>` (manual `<tr>`) or declarative child `<wc-table-row>` rows; optional `col-label` / `header-text` on columns.
- **`Bus` helper** (`wc-tables-kit/bus`): Map of event names → handlers with a single `disconnect()` for teardown (SPA / `pagehide`).

## Demo

- [Examples](https://minasvisual.github.io/wc-tables/) 
- [JsFiddle](https://jsfiddle.net/mantovaniartes/bcs9pdyf/4/)

## Installation
```bash
npm install wc-tables-kit
```

or use it via CDN
```html
<script type="module" src="https://unpkg.com/wc-tables-kit@1.0.5/src/wc-table.js"></script>
```

## Quick Start
```html
<wc-table id="myTable" page-size="10">
    <!-- Configure columns -->
    <wc-table-row col="created_at" type="date" format="en-US"></wc-table-row>
    <wc-table-row col="salary" type="currency" format="USD"></wc-table-row>
    <wc-table-row col="status" type="badge"></wc-table-row>

    <!-- Toolbar actions -->
    <h2 slot="toolbar-left">Users List</h2>

    <!-- Row actions -->
    <template slot="right-actions">
        <button data-action="edit">✏️</button>
        <button data-action="delete">🗑️</button>
    </template>
</wc-table>

<script type="module">
    import 'wc-tables-kit'; // for npm package
    
    const table = document.getElementById('myTable');
    table.data = [
        { id: 1, name: 'John Doe', created_at: '2023-01-01', salary: 5000, status: 'Active' },
        // ...
    ];

    table.addEventListener('action-click', (e) => {
        const { action, item } = e.detail;
        console.log(`Action: ${action} on item:`, item);
    });
</script>
```

## Default Plugins
The library includes several built-in plugins for common data types:

| Type | Attributes | Description |
| --- | --- | --- |
| `date` | `format` | Native `Intl` locale OR custom tokens like `DD on MMM, YYYY`. |
| `currency`| `format` | Intl.NumberFormat Currency code (USD, BRL, EUR, ..). |
| `badge` | - | Renders the value as a colored badge. |
| `link` | `label`, `target` | Renders an `<a>` tag. |
| `image` | `width`, `height`, `rounded` | Renders an `<img>` tag. |
| `object` | `item` | Access nested properties (e.g., `address.city`). |
| `tags` | - | Renders an array or CSV string as chips. |
| `button` | `label`, `action`, `class`| Renders a button that emits `action-click`. |
| `expression`| `expr` | Evaluates a template string like `${name} - ${id}`. |

## Global Configuration
You can change the language or register new plugins globally:
```javascript
import { Config } from 'wc-tables-kit/config.js';

// Change language
Config.setLanguage('en');

// Register custom plugin
class UpperPlugin {
    static render(value) {
        return String(value).toUpperCase();
    }
}
Config.registerPlugin('uppercase', UpperPlugin);
```

## Slots
| Name | Description |
| --- | --- |
| `before` | Content rendered before the table component. |
| `after` | Content rendered after the table component. |
| `toolbar-left` | Left area of the toolbar. |
| `toolbar-center`| Center area of the toolbar. |
| `toolbar-right` | Right area of the toolbar (next to search). |
| `left-actions` | A column at the far left of each row (use for icons/buttons). |
| `right-actions`| A column at the far right of each row (use for icons/buttons). |

## Events
The component emits several custom events for deep integration:

| Event Name | Detail Payload | Description |
| --- | --- | --- |
| `before-mount` | `{}` | Fired before the component renders for the first time. |
| `after-mount` | `{}` | Fired after the component is fully rendered. |
| `before-filter`| `{ query }` | Fired before local filtering starts. |
| `after-filter` | `{ results }` | Fired after local filtering is finished. |
| `updated` | `{ data }` | Fired when the `data` array is modified (skips first load). |
| `action-click` | `{ action, item, originalEvent }` | Fired when a button with `data-action` inside a slot is clicked. |
| `row-selected` | `{ item, isSelected, selectedRows }` | Fired when a single row is toggled. |
| `selection-changed` | `{ selectedRows, allSelected }` | Fired when "Select All" is toggled. |
| `sort-changed` | `{ key, direction }` | Fired when sorting changes (useful for server-side). |
| `page-changed` | `{ page, totalPages }` | Fired when the active page changes (client-side pagination). |

## Server-Side Mode
To handle large datasets via API, add the `server-side` attribute. This disables local filtering/sorting and relies on events:

```html
<wc-table id="myTable" server-side>
    ...
</wc-table>

<script type="module">
    const table = document.getElementById('myTable');
    
    table.addEventListener('before-filter', (e) => {
        const { query } = e.detail;
        fetchDataFromAPI(query).then(data => table.data = data);
    });

    table.addEventListener('sort-changed', (e) => {
        const { key, direction } = e.detail;
        fetchSortedData(key, direction).then(data => table.data = data);
    });
</script>
```

## Client-Side Pagination

Add the `page-size` attribute to enable automatic pagination without any server interaction:

```html
<wc-table id="myTable" page-size="10">
    ...
</wc-table>
```

The component will:
- Slice the data automatically, showing only `page-size` rows at a time.
- Render a pagination bar below the table with **Previous / Next** buttons and numbered page buttons.
- Display a `1–10 / 100` info counter on the left.
- Reset to page 1 automatically when the user filters or sorts.

**Changing the page size at runtime:**
```js
document.getElementById('myTable').setAttribute('page-size', '25');
```

**Listening to page changes:**
```js
table.addEventListener('page-changed', (e) => {
    const { page, totalPages } = e.detail;
    console.log(`Page ${page} of ${totalPages}`);
});
```

> **Note:** `page-size` is a client-side feature and is independent of `server-side` mode (which manages its own data slicing via the API).

## Hiding the default search (`hide-search`)

Add the boolean attribute **`hide-search`** to remove the built-in toolbar search field. Filtering events still run when you update the query from code:

| Mechanism | Behavior |
| --- | --- |
| `before-filter` | `detail.query` — same as when using the default input |
| `after-filter` | `detail.results` — filtered row array (or full data in `server-side` mode) |

**Programmatic query (custom filter UI):**

```html
<wc-table id="t" hide-search>
    ...
</wc-table>
<input type="search" id="q" />
<script type="module">
    const table = document.getElementById('t');
    document.getElementById('q').addEventListener('input', (e) => {
        table.filterQuery = e.target.value;
    });
</script>
```

- **`table.filterQuery`** (get/set) mirrors the built-in search: setting it dispatches `before-filter`, applies the client filter (unless `server-side` is set), then dispatches `after-filter`.
- With **`server-side`**, the table does not narrow rows locally; use `before-filter` / `after-filter` to load data from an API as in [Server-Side Mode](#server-side-mode).

## Event helper — `Bus`

Import: `import { Bus } from 'wc-tables-kit/bus'`.

Registers several listeners on a `<wc-table>` (or any element) from one object. Returns **`disconnect()`** — call it when leaving the route or on `pagehide` to remove every handler (`AbortController` when available).

```javascript
import { Bus } from 'wc-tables-kit/bus';

const off = Bus(document.getElementById('myTable'), {
  'action-click': (e) => console.log(e.detail.action, e.detail.item),
  'sort-changed': (e) => console.log(e.detail),
  'updated': (e) => console.log(e.detail.data),
});

window.addEventListener('pagehide', off, { once: true });
```

The first argument may be a **CSS selector** (passed to `document.querySelector`) or an **element**. Non-function values in the map are ignored.

## Extra header & footer rows (`wc-table-head` / `wc-table-footer`)

Optional children of `<wc-table>` add rows **below** the main sort header (`<thead>`) or inside `<tfoot>`.

**1. Manual row(s)** — put a `<template>` (or `<table>`) inside `wc-table-head` / `wc-table-footer` with one or more `<tr>` elements. Cloned rows must align with the table: checkbox column, optional action columns, then one `<th>` or `<td>` per visible data key (same order as `Object.keys(data[0])` minus `hidden-cols`). See [examples/plugins.html](./examples/plugins.html) for per-column filter inputs in an extra header row.

**2. Declarative row** — if the section has **no** `<template>`/`<table>` but has direct child `<wc-table-row col="...">` elements, one extra `<tr class="wc-thead-extra">` is built automatically. Attributes on those rows merge with global column config; use `header-text` for static cell text, or `type` + plugin (e.g. `expression`) for rich cells.

**Column header label:** on any top-level `<wc-table-row>`, set **`col-label="Displayed title"`** to override the default header text for that column.

**`expression` in declarative `wc-table-head`:** `${field}` placeholders resolve using the **first visible row** after filtering (`_filteredData[0]`), not a dedicated row index.

## Inline JSON Data (HTML Attribute)

For static content or server-rendered pages, you can pass the initial data directly via the `data` attribute — no JavaScript required:

```html
<wc-table data='[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]'>
    <wc-table-row col="id"></wc-table-row>
    <wc-table-row col="name"></wc-table-row>
</wc-table>
```

- The value must be a **valid JSON array** string.
- If a JS `.data` property is set before mount, it takes priority over the attribute.
- Changing the attribute dynamically via `setAttribute` triggers a live update.

## Hiding Columns

Use the `hidden-cols` attribute to hide specific columns from the rendered table — the data itself is not affected.

**Comma-separated (recommended for static HTML):**
```html
<wc-table hidden-cols="id,phone,company">
```

**JSON array (useful when generated server-side or set via JS):**
```html
<wc-table hidden-cols='["id","phone"]'>
```

**Changing at runtime:**
```js
table.setAttribute('hidden-cols', 'id,phone');
// the table re-renders automatically
```

**In React / Next.js:**
```jsx
<WcTable data={users} hidden-cols="id,phone,address">
```

> Columns not present in the data object are silently ignored.

## `<wc-paginate>` — Standalone Pagination Component

A separate, reusable pagination control that can be used alongside `<wc-table>` in server-side mode or with any other data list.

### Installation / Import

```html
<!-- CDN -->
<script type="module" src="https://unpkg.com/wc-tables-kit/src/wc-paginate.js"></script>
```

```js
// npm
import 'wc-tables-kit/paginate';
```

### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `total` | number | `0` | **Required.** Total number of records |
| `page` | number | `1` | Current active page (1-based) |
| `page-size` | number | `10` | Records per page |
| `delta` | number | `2` | Page buttons shown around the active page |
| `hide-info` | boolean | — | When present, hides the `X–Y / Z` counter |

### Event

```js
element.addEventListener('page-changed', (e) => {
    const { page, totalPages, pageSize } = e.detail;
});
```

### Basic Usage

```html
<wc-paginate total="100" page-size="10" page="1"></wc-paginate>

<script type="module">
    document.querySelector('wc-paginate')
        .addEventListener('page-changed', e => {
            console.log('Go to page', e.detail.page);
        });
</script>
```

### Programmatic Navigation

```js
const pg = document.querySelector('wc-paginate');
pg.goToPage(3); // does not fire page-changed, just re-renders
pg.setAttribute('total', '200'); // live update
```

### Integration with `<wc-table>` in Server-Side Mode

```html
<wc-table id="table" server-side>...</wc-table>
<wc-paginate id="pg" total="0" page-size="10"></wc-paginate>

<script type="module">
    const table = document.getElementById('table');
    const pg    = document.getElementById('pg');

    async function load({ page = 1 } = {}) {
        const res  = await fetch(`/api/users?page=${page}&limit=10`);
        const json = await res.json();
        table.data = json.data;
        pg.setAttribute('total', json.total);
        pg.setAttribute('page', page);
    }

    pg.addEventListener('page-changed', e => load({ page: e.detail.page }));
    load();
</script>
```

## React & Next.js Integration

To use `wc-table` in a React or Next.js environment, you can use the provided adapter that maps **`data`** and **`filterQuery`** to DOM properties, wires **`onPageChanged`** to `page-changed` (client-side pagination), and attaches other `on*` handlers to the matching custom events. Use **`hide-search`** (or `hide-search=""`) like any forwarded attribute together with **`filterQuery`** for a controlled custom filter.

### Using the Adapter

Install the package and import the adapter:

```bash
npm install wc-tables-kit
```

```jsx
import 'wc-tables-kit';
import { WcTable, WcTableRow } from 'wc-tables-kit/react';

const MyComponent = () => {
    const data = [
        { id: 1, name: 'John Doe', status: 'active' },
        { id: 2, name: 'Jane Smith', status: 'inactive' }
    ];

    const handleAction = (e) => {
        const { action, item } = e.detail;
        console.log(`Action ${action} on`, item);
    };

    return (
        <WcTable 
            data={data} 
            onActionClick={handleAction}
            className="my-custom-table"
        >
            <WcTableRow col="name" />
            <WcTableRow col="status" type="badge" />
            
            <div slot="right-actions">
                <button data-action="edit">Edit</button>
            </div>
        </WcTable>
    );
};
```

### Next.js Compatibility

The adapter is compatible with the Next.js App Router. Since Web Components are client-side only, ensure you add the `'use client'` directive to the top of your file.

For a complete working example using React via CDN, see [examples/react.html](./examples/react.html).

## Customizing Styles

The `wc-table` is designed to be visually premium out of the box, but it can be customized in several ways:

### 1. Global Inheritance
The component inherits several properties from its parent:
- `font-family`: Change the typography by setting it on the `wc-table` tag or its parent.
- `color`: Changes the default text color.

### 2. Slot Styling
Content placed in slots (like `toolbar-left`, `before`, `after`, or row actions) is part of the Light DOM and can be styled exactly like any other element in your application.

```css
/* Styling content inside the toolbar slot */
[slot="toolbar-left"] h2 {
    color: #4f46e5;
    font-size: 1.5rem;
    letter-spacing: -0.025em;
}
```

### 3. Host Styling
You can style the `wc-table` element itself to control its layout and spacing:

```css
wc-table {
    margin: 4rem 0;
    --table-bg: #ffffff; /* Example variable */
}
```

### 4. Deep Customization (Internal)
The internal table elements are encapsulated in the Shadow DOM. To change internal colors (like the header background), you should ideally use CSS variables. 

If you want to modify the core appearance, you can edit `src/wc-table.css` and use variables for theme consistency:

```css
/* inside wc-table.css */
th {
    background: var(--wc-table-header-bg, #f1f5f9);
}
```

## License
MIT
