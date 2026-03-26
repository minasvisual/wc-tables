# wc-tables-kit

A flexible, slot-based, and modular **Vanilla Web Component Table**. Built with native JS and CSS, no dependencies.

## Features
- **Slots Everywhere**: Header, footer, toolbar, and column actions.
- **Modular Plugins**: Separate classes for formatting types (`date`, `currency`, `badge`).
- **Custom Plugin Registry**: Register your own formatting logic.
- **Row Actions**: Add 'Edit', 'Delete', or custom buttons to every row with full data context.
- **Bulk Selection**: Integrated checkbox system with event reporting.
- **Dynamic Sorting & Filtering**: Local data management out of the box.

## Installation
```bash
npm install wc-tables-kit
```

## Quick Start
```html
<wc-table id="myTable">
    <!-- Configure columns -->
    <wc-table-row col="created_at" type="date" format="pt-BR"></wc-table-row>
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
    import 'wc-tables-kit';
    
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
- `before`: Content above the table.
- `after`: Content below the table.
- `toolbar-left`, `toolbar-center`, `toolbar-right`: Inner toolbar positions.
- `left-actions`: Actions column at the start of each row.
- `right-actions`: Actions column at the end of each row.

## License
MIT
