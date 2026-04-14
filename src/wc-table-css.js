export const defaultStyles = `
/* 
  wc-table.css 
  Modern, premium styling for the wc-table component.
*/

:host {
    display: block;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #334155;
    margin: 2rem 0;
}

.table-wrapper {
    display: flex;
    flex-direction: column;
}

::slotted([slot="before"]),
::slotted([slot="after"]),
::slotted([slot^="toolbar"]) {
    display: block;
}

.table-container {
    overflow-x: auto;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    padding: 0.5rem;
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem 0;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.toolbar-center {
    flex-grow: 1;
    justify-content: center;
}

.toolbar-right {
    justify-content: flex-end;
}

.search-container {
    position: relative;
}

.search-input {
    width: 300px;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.search-input:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    text-align: left;
}

th {
    padding: .5rem;
    background: #f1f5f9;
    font-weight: 600;
    font-size: 0.80rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s ease;
    vertical-align: middle;
    white-space: nowrap;
}

th:first-child {
    border-top-left-radius: 8px;
}

th:last-child {
    border-top-right-radius: 8px;
}

th:hover {
    background: #e2e8f0;
}

/* Extra thead rows (wc-table-head declarative or manual clones): not sortable */
thead tr:not(:first-child) th {
    cursor: default;
    user-select: auto;
}

thead tr:not(:first-child) th:hover {
    background: #f1f5f9;
}

.wc-col-filter-input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #fff;
    text-transform: none;
    letter-spacing: normal;
    font-weight: 500;
    outline: none;
}

.wc-col-filter-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

th .sort-icon {
    display: inline-block;
    vertical-align: middle;
    margin-left: 0.35rem;
    opacity: 0.5;
    line-height: 1;
}

th.sort-asc .sort-icon::after {
    content: "↓";
}

th.sort-desc .sort-icon::after {
    content: "↑";
}

td {
    padding: .5rem;
    border-bottom: 1px solid #f1f5f9;
}

tr:last-child td {
    border-bottom: none;
}

tr:hover td {
    background: rgba(241, 245, 249, 0.5);
}

tr.wc-no-data-row:hover td {
    background: transparent;
}

.no-results {
    padding: 2rem;
    text-align: center;
    color: #94a3b8;
    font-style: italic;
}

.checkbox-col {
    width: 40px;
    text-align: center;
}

.row-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3b82f6;
}

/* Badges */
.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
}

.badge-success {
    background: #dcfce7;
    color: #15803d;
}

.badge-warning {
    background: #fef9c3;
    color: #a16207;
}

.badge-danger {
    background: #fee2e2;
    color: #b91c1c;
}

.badge-info {
    background: #e0f2fe;
    color: #0369a1;
}

.badge-default {
    background: #f1f5f9;
    color: #475569;
}

.actions-col {
    width: 100px;
    text-align: center;
    white-space: nowrap;
}

.actions-col button {
    padding: 4px 8px;
    margin: 0 2px;
    font-size: 0.8rem;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    background: white;
}

.actions-col button:hover {
    background: #f8fafc;
}

.actions-col .delete-btn {
    color: #ef4444;
}

.wc-table-link {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
}

.wc-table-link:hover {
    text-decoration: underline;
}

.wc-table-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.wc-table-tag {
    background: #f1f5f9;
    color: #475569;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid #e2e8f0;
}

.wc-table-btn {
    padding: 6px 12px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.wc-table-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

/* Pagination */
.wc-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0.25rem 0.25rem;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.pg-info {
    font-size: 0.8rem;
    color: #94a3b8;
}

.pg-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.pg-ellipsis {
    font-size: 0.85rem;
    color: #94a3b8;
    padding: 0 0.15rem;
}

.pg-btn {
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    color: #475569;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1;
}

.pg-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
}

.pg-btn.pg-active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
    font-weight: 600;
}

.pg-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

tr {
    animation: fadeIn 0.3s ease forwards;
}
::slotted(wc-table-head),
::slotted(wc-table-footer) {
    display: none;
}

tfoot th,
tfoot td {
    padding: .5rem;
    border-top: 2px solid #e2e8f0;
    background: #f8fafc;
    font-size: 0.85rem;
    font-weight: 600;
}

tfoot th {
    cursor: default;
    text-transform: none;
}

tfoot th:hover,
tfoot td:hover {
    background: #f8fafc;
}

`;