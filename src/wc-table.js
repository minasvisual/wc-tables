import { Config } from './config.js';
import { DatePlugin } from './plugins/date.js';
import { CurrencyPlugin } from './plugins/currency.js';
import { BadgePlugin } from './plugins/badge.js';
import { LinkPlugin } from './plugins/link.js';
import { ImagePlugin } from './plugins/image.js';
import { ObjectPlugin } from './plugins/object.js';
import { TagsPlugin } from './plugins/tags.js';
import { ButtonPlugin } from './plugins/button.js';
import { ExpressionPlugin } from './plugins/expression.js';
import './wc-table-row.js';

const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

class WcTable extends _HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._data = [];
        this._filteredData = [];
        this._sortConfig = { key: null, direction: 'asc' };
        this._filterText = '';
        this._selectedRows = new Set();
        this._columnConfigs = {};
        this._isFirstLoad = true;
        
        this._plugins = {
            'date': DatePlugin,
            'currency': CurrencyPlugin,
            'badge': BadgePlugin,
            'link': LinkPlugin,
            'image': ImagePlugin,
            'object': ObjectPlugin,
            'tags': TagsPlugin,
            'button': ButtonPlugin,
            'expression': ExpressionPlugin,
            ...Config.plugins // Merge custom plugins
        };
    }

    set data(value) {
        const isFirst = this._isFirstLoad;
        this._data = Array.isArray(value) ? value : [];
        this._applyFilters();

        if (!isFirst) {
            this.dispatchEvent(new CustomEvent('updated', {
                detail: { data: this._data },
                bubbles: true,
                composed: true
            }));
        }
        this._isFirstLoad = false;
    }

    get data() {
        return this._data;
    }

    connectedCallback() {
        this._upgradeProperty('data');
        this._updateColumnConfigs();
        this.dispatchEvent(new CustomEvent('before-mount', { bubbles: true, composed: true }));
        this.render();
        this.dispatchEvent(new CustomEvent('after-mount', { bubbles: true, composed: true }));

        // Watch for dynamic configuration changes
        this._observer = new MutationObserver(() => {
            this._updateColumnConfigs();
            this.renderContent();
        });
        this._observer.observe(this, { childList: true });
    }

    _upgradeProperty(prop) {
        if (Object.prototype.hasOwnProperty.call(this, prop)) {
            const value = this[prop];
            delete this[prop];
            this[prop] = value;
        }
    }

    disconnectedCallback() {
        if (this._observer) this._observer.disconnect();
    }

    _updateColumnConfigs() {
        this._columnConfigs = {};
        const rows = this.querySelectorAll('wc-table-row');
        rows.forEach(row => {
            const config = {};
            // Collect all attributes
            Array.from(row.attributes).forEach(attr => {
                config[attr.name] = attr.value;
            });
            
            if (config.col) {
                this._columnConfigs[config.col] = config;
            }
        });
    }

    static get observedAttributes() {
        return ['server-side'];
    }

    _applyFilters() {
        if (this.hasAttribute('server-side')) {
            this._filteredData = [...this._data];
            this._applySort();
            return;
        }

        const query = this._filterText.toLowerCase();
        this._filteredData = this._data.filter(item => {
            return Object.values(item).some(val => 
                String(val).toLowerCase().includes(query)
            );
        });
        
        this._applySort();
        
        this.dispatchEvent(new CustomEvent('after-filter', { 
            detail: { results: this._filteredData },
            bubbles: true, 
            composed: true 
        }));
    }

    _handleSelection(e, item) {
        const isSelected = e.target.checked;
        if (isSelected) {
            this._selectedRows.add(item);
        } else {
            this._selectedRows.delete(item);
        }
        
        this._updateSelectAllState();
        
        this.dispatchEvent(new CustomEvent('row-selected', {
            detail: { item, isSelected, selectedRows: Array.from(this._selectedRows) },
            bubbles: true,
            composed: true
        }));
    }

    _handleSelectAll(e) {
        const isChecked = e.target.checked;
        const checkboxes = this.shadowRoot.querySelectorAll('.row-checkbox');
        
        checkboxes.forEach((cb, index) => {
            if (cb.checked !== isChecked) {
                cb.checked = isChecked;
                const item = this._filteredData[index];
                if (isChecked) {
                    this._selectedRows.add(item);
                } else {
                    this._selectedRows.delete(item);
                }
            }
        });

        this.dispatchEvent(new CustomEvent('selection-changed', {
            detail: { selectedRows: Array.from(this._selectedRows), allSelected: isChecked },
            bubbles: true,
            composed: true
        }));
    }

    _updateSelectAllState() {
        const selectAll = this.shadowRoot.getElementById('selectAll');
        if (!selectAll) return;
        
        const visibleCheckboxes = this.shadowRoot.querySelectorAll('.row-checkbox');
        const checkedVisible = Array.from(visibleCheckboxes).filter(cb => cb.checked);
        
        selectAll.checked = visibleCheckboxes.length > 0 && checkedVisible.length === visibleCheckboxes.length;
        selectAll.indeterminate = checkedVisible.length > 0 && checkedVisible.length < visibleCheckboxes.length;
    }

    _sort(key) {
        const direction = this._sortConfig.key === key && this._sortConfig.direction === 'asc' ? 'desc' : 'asc';
        this._sortConfig = { key, direction };
        
        if (this.hasAttribute('server-side')) {
            this.dispatchEvent(new CustomEvent('sort-changed', {
                detail: this._sortConfig,
                bubbles: true,
                composed: true
            }));
            this.render(); // Redraw headers with correct sort icons
        } else {
            this._applySort();
        }
    }

    _applySort() {
        if (!this.hasAttribute('server-side')) {
            const { key, direction } = this._sortConfig;
            if (key) {
                this._filteredData.sort((a, b) => {
                    const valA = a[key] ?? '';
                    const valB = b[key] ?? '';
                    
                    if (valA < valB) return direction === 'asc' ? -1 : 1;
                    if (valA > valB) return direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        }
        this.renderContent();
    }

    _handleSearch(e) {
        this._filterText = e.target.value;
        this.dispatchEvent(new CustomEvent('before-filter', { 
            detail: { query: this._filterText },
            bubbles: true, 
            composed: true 
        }));
        this._applyFilters();
    }

    render() {
        const cssPath = new URL('./wc-table.css', import.meta.url).href;
        
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="${cssPath}">
            <div class="table-wrapper">
                <slot name="before"></slot>
                <slot></slot> <!-- Used for wc-table-row elements -->
                
                <div class="toolbar" id="toolbar">
                    <div class="toolbar-left">
                        <slot name="toolbar-left"></slot>
                    </div>
                    <div class="toolbar-center">
                        <slot name="toolbar-center"></slot>
                    </div>
                    <div class="toolbar-right">
                        <div class="search-container">
                            <input type="text" class="search-input" placeholder="${Config.t('searchPlaceholder')}" id="searchInput">
                        </div>
                        <slot name="toolbar-right"></slot>
                    </div>
                </div>

                <div class="table-container">
                    <div id="tableContent">
                        ${this._renderTable()}
                    </div>
                </div>

                <slot name="after"></slot>
            </div>
        `;

        this.shadowRoot.getElementById('searchInput').addEventListener('input', (e) => this._handleSearch(e));
        
        // Action delegation (Added only once)
        this.shadowRoot.addEventListener('click', (e) => this._handleActionClick(e));

        this._setupEventListeners();
    }

    renderContent() {
        const container = this.shadowRoot.getElementById('tableContent');
        if (container) {
            container.innerHTML = this._renderTable();
            this._setupEventListeners();
        }
    }

    _setupEventListeners() {
        // Headers sorting
        const headers = this.shadowRoot.querySelectorAll('th[data-key]');
        headers.forEach(th => {
            th.addEventListener('click', () => this._sort(th.dataset.key));
        });

        // Row selection
        const checkboxes = this.shadowRoot.querySelectorAll('.row-checkbox');
        checkboxes.forEach((cb, index) => {
            cb.addEventListener('change', (e) => {
                this._handleSelection(e, this._filteredData[index]);
            });
        });

        // Select all
        const selectAll = this.shadowRoot.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this._handleSelectAll(e));
        }
    }

    _handleActionClick(e) {
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            const tr = actionTarget.closest('tr');
            if (tr && tr.dataset.index !== undefined) {
                const index = tr.dataset.index;
                const item = this._filteredData[index];
                if (item) {
                    this.dispatchEvent(new CustomEvent('action-click', {
                        detail: { 
                            action: actionTarget.dataset.action,
                            item: item,
                            originalEvent: e 
                        },
                        bubbles: true,
                        composed: true
                    }));
                }
            }
        }
    }

    _renderValue(item, key) {
        const value = item[key] ?? '';
        const config = this._columnConfigs[key];

        const plugins = { ...this._plugins, ...Config.plugins };
        if (config && config.type && plugins[config.type]) {
            return plugins[config.type].render(value, config, item);
        }

        return value;
    }

    _renderTable() {
        if (this._filteredData.length === 0 && this._data.length > 0) {
            return `<div class="no-results">${Config.t('noResults')}</div>`;
        }

        if (this._data.length === 0) {
            return `<div class="no-results">${Config.t('waitingData')}</div>`;
        }

        const keys = Object.keys(this._data[0]);
        const hasLeftActions = this.querySelector('[slot="left-actions"]');
        const hasRightActions = this.querySelector('[slot="right-actions"]');

        // Create the basic structure
        const table = document.createElement('table');
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Checkbox column
        const thCheck = document.createElement('th');
        thCheck.className = 'checkbox-col';
        thCheck.innerHTML = '<input type="checkbox" id="selectAll">';
        headerRow.appendChild(thCheck);

        // Left Actions column
        if (hasLeftActions) {
            const th = document.createElement('th');
            th.className = 'actions-col';
            headerRow.appendChild(th);
        }

        // Data columns
        keys.forEach(key => {
            const th = document.createElement('th');
            th.dataset.key = key;
            if (this._sortConfig.key === key) {
                th.className = 'sort-' + this._sortConfig.direction;
            }
            th.innerHTML = `${Config.t(key)} <span class="sort-icon"></span>`;
            headerRow.appendChild(th);
        });

        // Right Actions column
        if (hasRightActions) {
            const th = document.createElement('th');
            th.className = 'actions-col';
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        this._filteredData.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.dataset.index = index;

            // Checkbox
            const tdCheck = document.createElement('td');
            tdCheck.className = 'checkbox-col';
            tdCheck.innerHTML = `<input type="checkbox" class="row-checkbox" ${this._selectedRows.has(item) ? 'checked' : ''}>`;
            tr.appendChild(tdCheck);

            // Left Actions
            if (hasLeftActions) {
                const td = document.createElement('td');
                td.className = 'actions-col';
                td.appendChild(this._cloneActionContent(hasLeftActions));
                tr.appendChild(td);
            }

            // Data
            keys.forEach(key => {
                const td = document.createElement('td');
                td.innerHTML = this._renderValue(item, key);
                tr.appendChild(td);
            });

            // Right Actions
            if (hasRightActions) {
                const td = document.createElement('td');
                td.className = 'actions-col';
                td.appendChild(this._cloneActionContent(hasRightActions));
                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // Return the HTML string (for innerHTML compatibility in renderContent)
        return table.outerHTML;
    }

    _cloneActionContent(element) {
        if (element.tagName === 'TEMPLATE') {
            return element.content.cloneNode(true);
        }
        return element.cloneNode(true);
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('wc-table')) {
    customElements.define('wc-table', WcTable);
}
