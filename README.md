# wc-tables-kit

A flexible, slot-based, and modular **Vanilla Web Component Table**. Built with native JS and CSS, no dependencies.

## Features
- **Slots Everywhere**: Header, footer, toolbar, and column actions.
- **Modular Plugins**: Separate classes for formatting types (`date`, `currency`, `badge`, `link`, `image`, `object`, `tags`, `button`, `expression`).
- **Custom Plugin Registry**: Register your own formatting logic.
- **Row Actions**: Add 'Edit', 'Delete', or custom buttons to every row with full data context.
- **Bulk Selection**: Integrated checkbox system with event reporting.
- **Dynamic Sorting & Filtering**: Local data management out of the box.

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
<wc-table id="myTable">
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
| `updated` | `{ data }` | **New!** Fired when the `data` array is modified (skips first load). |
| `action-click` | `{ action, item, originalEvent }` | Fired when a button with `data-action` inside a slot is clicked. |
| `row-selected` | `{ item, isSelected, selectedRows }` | Fired when a single row is toggled. |
| `selection-changed` | `{ selectedRows, allSelected }` | Fired when "Select All" is toggled. |
| `sort-changed` | `{ key, direction }` | Fired when sorting changes (useful for server-side). |

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

## React & Next.js Integration

To use `wc-table` in a React or Next.js environment, you can use the provided adapter that handles property mapping (essential for the `data` property) and event listeners.

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
