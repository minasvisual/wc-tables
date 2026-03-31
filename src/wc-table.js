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
import { ColumnFilterPlugin } from './plugins/column-filter.js';
import './wc-table-row.js';
import './wc-table-head.js';
import './wc-table-footer.js';

const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

class WcTable extends _HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // One delegation listener on the shadow root — render() resets innerHTML but must not stack listeners.
        this.shadowRoot.addEventListener('click', (e) => this._handleActionClick(e));
        this.shadowRoot.addEventListener('input', (e) => this._handleColumnFilterInput(e));
        this._data = [];
        this._filteredData = [];
        this._sortConfig = { key: null, direction: 'asc' };
        this._filterText = '';
        this._selectedRows = new Set();
        this._columnConfigs = {};
        this._isFirstLoad = true;
        this._currentPage = 1;
        this._columnFilters = {};
        this._columnFilterFocus = { key: null, start: 0, end: 0 };
        
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
            'col-filter': ColumnFilterPlugin,
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

    /** Current filter text (same as the built-in search when visible). */
    get filterQuery() {
        return this._filterText;
    }

    /**
     * Sets the filter string, dispatches `before-filter`, then applies filtering (`after-filter`).
     * Use with `hide-search` and your own controls for custom filter UIs.
     */
    set filterQuery(value) {
        this._setFilterQueryAndApply(String(value ?? ''));
    }

    connectedCallback() {
        this._upgradeProperty('data');

        // Load initial data from the "data" attribute if no JS property was set
        if (this._data.length === 0 && this.hasAttribute('data')) {
            try {
                const parsed = JSON.parse(this.getAttribute('data'));
                if (Array.isArray(parsed)) {
                    this.data = parsed;
                }
            } catch (e) {
                console.warn('[wc-table] Failed to parse "data" attribute as JSON:', e.message);
            }
        }

        this._updateColumnConfigs();
        this.dispatchEvent(new CustomEvent('before-mount', { bubbles: true, composed: true }));
        this.render();
        this.dispatchEvent(new CustomEvent('after-mount', { bubbles: true, composed: true }));

        // Watch for dynamic configuration changes (head/footer subtree + top-level config nodes)
        this._observer = new MutationObserver((mutations) => {
            if (this._mutationAffectsTableStructure(mutations)) {
                this._updateColumnConfigs();
                this.renderContent();
            }
        });
        this._observer.observe(this, { childList: true, subtree: true });
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

    /** @param {MutationRecord[]} mutations */
    _mutationAffectsTableStructure(mutations) {
        for (const m of mutations) {
            if (m.type !== 'childList') continue;
            const inHeadFootSubtree = (el) => {
                if (!el || el.nodeType !== 1) return false;
                return el.matches?.('wc-table-head, wc-table-footer')
                    || !!el.closest?.('wc-table-head')
                    || !!el.closest?.('wc-table-footer');
            };
            const topConfig = (el) => {
                if (!el || el.nodeType !== 1) return false;
                return el.parentElement === this
                    && el.matches?.('wc-table-row, wc-table-head, wc-table-footer');
            };
            for (const n of m.addedNodes) {
                if (topConfig(n) || inHeadFootSubtree(n)) return true;
            }
            for (const n of m.removedNodes) {
                if (topConfig(n) || inHeadFootSubtree(n)) return true;
            }
            const t = m.target;
            if (t && t.nodeType === 1 && inHeadFootSubtree(t)) return true;
        }
        return false;
    }

    _updateColumnConfigs() {
        this._columnConfigs = {};
        const rows = this.querySelectorAll(':scope > wc-table-row');
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
        return ['server-side', 'data', 'page-size', 'hidden-cols', 'hide-search', 'stylesheet-url', 'column-filters'];
    }

    /** Returns a Set of column keys that should be hidden. */
    get _hiddenCols() {
        const raw = this.getAttribute('hidden-cols');
        if (!raw) return new Set();
        // Accept both JSON array (["id","phone"]) and comma-separated (id,phone)
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return new Set(parsed.map(String));
        } catch (_) { /* not JSON — fall through */ }
        return new Set(raw.split(',').map(s => s.trim()).filter(Boolean));
    }

    get _pageSize() {
        const val = parseInt(this.getAttribute('page-size'), 10);
        return val > 0 ? val : 0; // 0 = pagination disabled
    }

    /** Rows actually rendered in tbody (excludes `__wcEmptyFilter` layout-only rows). */
    get _displayRowCount() {
        return this._filteredData.reduce(
            (n, item) => n + (this._isLayoutOnlyRow(item) ? 0 : 1),
            0,
        );
    }

    get _totalPages() {
        if (!this._pageSize) return 1;
        const n = this._displayRowCount;
        if (n <= 0) return 1;
        return Math.ceil(n / this._pageSize);
    }

    _goToPage(page) {
        const clamped = Math.min(Math.max(1, page), this._totalPages);
        if (clamped === this._currentPage) return;
        this._currentPage = clamped;
        this.dispatchEvent(new CustomEvent('page-changed', {
            detail: { page: this._currentPage, totalPages: this._totalPages },
            bubbles: true,
            composed: true
        }));
        this.renderContent();
    }

    _getPagedData() {
        if (!this._pageSize) return this._filteredData;
        const start = (this._currentPage - 1) * this._pageSize;
        return this._filteredData.slice(start, start + this._pageSize);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data' && newValue !== oldValue) {
            try {
                const parsed = JSON.parse(newValue);
                if (Array.isArray(parsed)) {
                    this.data = parsed;
                } else {
                    console.warn('[wc-table] The "data" attribute must be a JSON array.');
                }
            } catch (e) {
                console.warn('[wc-table] Failed to parse "data" attribute as JSON:', e.message);
            }
        }
        if (name === 'page-size' && newValue !== oldValue) {
            this._currentPage = 1;
            this.renderContent();
        }
        if (name === 'hidden-cols' && newValue !== oldValue) {
            this.renderContent();
        }
        if (name === 'hide-search' && newValue !== oldValue) {
            this.render();
        }
        if (name === 'stylesheet-url' && newValue !== oldValue) {
            this.render();
        }
        if (name === 'column-filters' && newValue !== oldValue) {
            // Toggling column-filters on/off resets internal map and reapplies filters.
            this._columnFilters = {};
            this._applyFilters();
        }
    }

    _setFilterQueryAndApply(query) {
        this._filterText = query;
        this.dispatchEvent(new CustomEvent('before-filter', {
            detail: { query: this._filterText },
            bubbles: true,
            composed: true
        }));
        this._applyFilters();
        const input = this.shadowRoot?.getElementById('searchInput');
        if (input) input.value = this._filterText;
    }

    _applyFilters() {
        this._currentPage = 1; // reset to first page on filter change

        if (this.hasAttribute('server-side')) {
            this._filteredData = [...this._data];
            this._applySort();
            return;
        }

        const query = this._filterText.toLowerCase();
        const useColumnFilters = this.hasAttribute('column-filters');
        const activeColumnFilters = useColumnFilters ? this._columnFilters : {};

        this._filteredData = this._data.filter(item => {
            // Layout-only rows (e.g. empty-filter sentinel) are kept regardless of filters.
            if (this._isLayoutOnlyRow(item)) return true;

            // Global text query (search box / filterQuery).
            if (query) {
                const matchesText = Object.values(item).some(val =>
                    String(val).toLowerCase().includes(query)
                );
                if (!matchesText) return false;
            }

            if (!useColumnFilters) {
                return true;
            }

            // Column-level filters: each non-empty value must match the corresponding field.
            for (const [col, rawFilter] of Object.entries(activeColumnFilters)) {
                const f = String(rawFilter ?? '').trim().toLowerCase();
                if (!f) continue;
                const v = item[col];
                if (v == null) return false;
                let haystack;
                if (typeof v === 'object') {
                    // Flatten simple object values (e.g. company.name) for basic matching.
                    try {
                        haystack = Object.values(v).join(' ').toLowerCase();
                    } catch {
                        haystack = String(v).toLowerCase();
                    }
                } else {
                    haystack = String(v).toLowerCase();
                }
                if (!haystack.includes(f)) {
                    return false;
                }
            }

            return true;
        });
        
        this._applySort();

        if (useColumnFilters && !this.hasAttribute('server-side')) {
            this._syncColumnFilterInputsAndFocus();
        }

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
        
        checkboxes.forEach((cb) => {
            if (cb.checked !== isChecked) {
                cb.checked = isChecked;
                const tr = cb.closest('tr');
                const idx = tr?.dataset?.index;
                const item = idx !== undefined ? this._filteredData[Number(idx)] : undefined;
                if (item === undefined) return;
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
        this._currentPage = 1; // reset to first page on sort change
        
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
        this._setFilterQueryAndApply(e.target.value);
    }

    /**
     * Stylesheet for shadow DOM. Default: `./wc-table.css` next to this module (`import.meta.url`).
     * Bundlers (Vite, etc.) often break that URL — set `stylesheet-url="/path/to/wc-table.css"` to load a static asset.
     */
    _resolveStylesheetHref() {
        const override = this.getAttribute('stylesheet-url');
        if (override != null && override !== '') {
            const base =
                typeof document !== 'undefined' && document.baseURI
                    ? document.baseURI
                    : typeof location !== 'undefined'
                      ? location.href
                      : 'http://localhost/';
            try {
                return new URL(override, base).href;
            } catch {
                return override;
            }
        }
        return new URL('./wc-table.css', import.meta.url).href;
    }

    render() {
        const cssPath = this._resolveStylesheetHref();
        const hideSearch = this.hasAttribute('hide-search');
        const searchBlock = hideSearch
            ? ''
            : `
                        <div class="search-container">
                            <input type="text" class="search-input" placeholder="${Config.t('searchPlaceholder')}" id="searchInput">
                        </div>`;

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
                        ${searchBlock}
                        <slot name="toolbar-right"></slot>
                    </div>
                </div>

                <div class="table-container">
                    <div id="tableContent">
                        ${this._renderTable()}${this._renderPagination()}
                    </div>
                </div>

                <slot name="after"></slot>
            </div>
        `;

        const searchInput = this.shadowRoot.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = this._filterText;
            searchInput.addEventListener('input', (e) => this._handleSearch(e));
        }

        this._setupEventListeners();
    }

    renderContent() {
        const container = this.shadowRoot.getElementById('tableContent');
        if (container) {
            container.innerHTML = this._renderTable() + this._renderPagination();
            this._setupEventListeners();
            this._setupPaginationListeners();
        }
    }

    _setupEventListeners() {
        // Headers sorting
        const headers = this.shadowRoot.querySelectorAll('th[data-key]');
        headers.forEach(th => {
            th.addEventListener('click', () => this._sort(th.dataset.key));
        });

        // Row selection — map checkbox to global row index (skips layout-only rows in DOM)
        const checkboxes = this.shadowRoot.querySelectorAll('.row-checkbox');
        checkboxes.forEach((cb) => {
            cb.addEventListener('change', (e) => {
                const tr = cb.closest('tr');
                const idx = tr?.dataset?.index;
                const item = idx !== undefined ? this._filteredData[Number(idx)] : undefined;
                if (item !== undefined) this._handleSelection(e, item);
            });
        });

        // Select all
        const selectAll = this.shadowRoot.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this._handleSelectAll(e));
        }
    }

    _setupPaginationListeners() {
        const pg = this.shadowRoot.getElementById('wc-pagination');
        if (!pg) return;
        pg.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.page;
                if (target === 'prev') this._goToPage(this._currentPage - 1);
                else if (target === 'next') this._goToPage(this._currentPage + 1);
                else this._goToPage(parseInt(target, 10));
            });
        });
    }

    _renderPagination() {
        if (!this._pageSize || this._totalPages <= 1) return '';

        const current = this._currentPage;
        const total = this._totalPages;
        const n = this._displayRowCount;
        const start = n === 0 ? 0 : (current - 1) * this._pageSize + 1;
        const end = Math.min(current * this._pageSize, n);

        // Show up to 5 page buttons around current page
        const range = [];
        const delta = 2;
        for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
            range.push(i);
        }

        const pageButtons = range.map(p => `
            <button class="pg-btn ${p === current ? 'pg-active' : ''}" data-page="${p}">${p}</button>
        `).join('');

        return `
            <div class="wc-pagination" id="wc-pagination">
                <span class="pg-info">${start}–${end} / ${n}</span>
                <div class="pg-controls">
                    <button class="pg-btn" data-page="prev" ${current === 1 ? 'disabled' : ''}>&#8249;</button>
                    ${range[0] > 1 ? '<button class="pg-btn" data-page="1">1</button><span class="pg-ellipsis">…</span>' : ''}
                    ${pageButtons}
                    ${range[range.length - 1] < total ? '<span class="pg-ellipsis">…</span><button class="pg-btn" data-page="' + total + '">' + total + '</button>' : ''}
                    <button class="pg-btn" data-page="next" ${current === total ? 'disabled' : ''}>&#8250;</button>
                </div>
            </div>
        `;
    }

    _handleColumnFilterInput(e) {
        const input = e.target?.closest?.('.wc-col-filter-input');
        if (!input || !this.shadowRoot.contains(input)) return;

        const column = input.dataset.colFilter || input.getAttribute('data-col-filter');
        if (!column) return;

        const value = input.value ?? '';
        this.dispatchEvent(new CustomEvent('column-filter', {
            detail: {
                column,
                value,
                query: value,
                originalEvent: e
            },
            bubbles: true,
            composed: true
        }));

        // Optional native column filtering when `column-filters` attribute is present and not server-side.
        if (!this.hasAttribute('column-filters')) return;
        if (this.hasAttribute('server-side')) return;

        // Capture caret/focus state before filters re-render the table.
        this._columnFilterFocus = {
            key: column,
            start: input.selectionStart ?? value.length,
            end: input.selectionEnd ?? value.length,
        };

        this._columnFilters = {
            ...this._columnFilters,
            [column]: value,
        };
        this._applyFilters();
    }

    _syncColumnFilterInputsAndFocus() {
        const root = this.shadowRoot;
        if (!root) return;

        // Sync input values from internal _columnFilters map.
        root.querySelectorAll('.wc-col-filter-input[data-col-filter]').forEach((el) => {
            const key = el.dataset.colFilter;
            if (!key) return;
            const v = this._columnFilters[key] ?? '';
            if (el.value !== v) el.value = v;
        });

        const focus = this._columnFilterFocus;
        if (!focus || !focus.key) return;

        const inp = root.querySelector(`.wc-col-filter-input[data-col-filter="${focus.key}"]`);
        if (!inp || document.activeElement === inp) return;
        inp.focus();
        if (typeof inp.setSelectionRange === 'function') {
            try {
                const len = inp.value.length;
                const a = Math.min(focus.start, len);
                const b = Math.min(focus.end, len);
                inp.setSelectionRange(a, b);
            } catch {
                // ignore selection errors
            }
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

    /**
     * Sentinel row: keep table shell (thead + column filters) when the host passes zero visible rows
     * but still needs column keys (e.g. external filters). Not rendered as a data row.
     */
    _isLayoutOnlyRow(item) {
        return item != null && item.__wcEmptyFilter === true;
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

    /** @param {Element} el */
    _configFromWcTableRow(el) {
        const config = {};
        if (!el || !el.attributes) return config;
        Array.from(el.attributes).forEach(attr => {
            config[attr.name] = attr.value;
        });
        return config;
    }

    /** Same visible label logic as the primary header cell (without sort UI). */
    _headerTitleText(key) {
        const colCfg = this._columnConfigs[key];
        const colLabel = colCfg && typeof colCfg['col-label'] === 'string'
            ? colCfg['col-label'].trim()
            : '';
        return colLabel || Config.t(key);
    }

    /**
     * One extra thead row from :scope > wc-table-row inside wc-table-head (no template/table).
     */
    _appendDeclarativeHeadRow(thead, headHost, keys, hasLeftActions, hasRightActions) {
        const headByCol = {};
        headHost.querySelectorAll(':scope > wc-table-row').forEach(row => {
            const cfg = this._configFromWcTableRow(row);
            if (cfg.col) headByCol[cfg.col] = cfg;
        });

        const plugins = { ...this._plugins, ...Config.plugins };
        const tr = document.createElement('tr');
        tr.className = 'wc-thead-extra';

        const thCheck = document.createElement('th');
        thCheck.className = 'checkbox-col';
        tr.appendChild(thCheck);

        if (hasLeftActions) {
            const th = document.createElement('th');
            th.className = 'actions-col';
            tr.appendChild(th);
        }

        const itemForHeadPlugins = this._filteredData.find(item => !this._isLayoutOnlyRow(item)) ?? {};

        keys.forEach(key => {
            const th = document.createElement('th');
            const headCfg = headByCol[key];
            if (headCfg) {
                const globalCfg = this._columnConfigs[key] || {};
                const merged = { ...globalCfg, ...headCfg };
                const rawHeaderText = typeof merged['header-text'] === 'string'
                    ? merged['header-text'].trim()
                    : '';
                const value = rawHeaderText || this._headerTitleText(key);
                if (merged.type && plugins[merged.type]) {
                    th.innerHTML = plugins[merged.type].render(value, merged, itemForHeadPlugins);
                } else {
                    th.textContent = value;
                }
            }
            tr.appendChild(th);
        });

        if (hasRightActions) {
            const th = document.createElement('th');
            th.className = 'actions-col';
            tr.appendChild(th);
        }

        thead.appendChild(tr);
    }

    _renderTable() {
        if (this._data.length === 0) {
            return `<div class="no-results">${Config.t('waitingData')}</div>`;
        }

        const hiddenCols = this._hiddenCols;
        const keys = Object.keys(this._data[0]).filter(k => !hiddenCols.has(k) && k !== '__wcEmptyFilter');
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
            const colCfg = this._columnConfigs[key];
            const colLabel = colCfg && typeof colCfg['col-label'] === 'string'
                ? colCfg['col-label'].trim()
                : '';
            const headerText = colLabel || Config.t(key);
            th.innerHTML = `${headerText} <span class="sort-icon"></span>`;
            headerRow.appendChild(th);
        });

        // Right Actions column
        if (hasRightActions) {
            const th = document.createElement('th');
            th.className = 'actions-col';
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        const headHost = this.querySelector(':scope > wc-table-head');
        const manualHeadRows = this._collectSectionRows(headHost);
        if (manualHeadRows.length) {
            manualHeadRows.forEach(tr => thead.appendChild(tr.cloneNode(true)));
        } else if (headHost) {
            const declRows = headHost.querySelectorAll(':scope > wc-table-row');
            if (declRows.length) {
                this._appendDeclarativeHeadRow(thead, headHost, keys, hasLeftActions, hasRightActions);
            }
        }
        table.appendChild(thead);

        // Body — only render current page slice
        const pagedData = this._getPagedData();
        const pageOffset = this._pageSize ? (this._currentPage - 1) * this._pageSize : 0;
        const tbody = document.createElement('tbody');
        let bodyRowCount = 0;
        pagedData.forEach((item, sliceIndex) => {
            if (this._isLayoutOnlyRow(item)) return;

            bodyRowCount += 1;
            const tr = document.createElement('tr');
            // Store the GLOBAL index so _handleActionClick resolves the right item
            tr.dataset.index = pageOffset + sliceIndex;

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

        if (bodyRowCount === 0) {
            const tr = document.createElement('tr');
            tr.className = 'wc-no-data-row';
            const td = document.createElement('td');
            const colspan = 1 + (hasLeftActions ? 1 : 0) + keys.length + (hasRightActions ? 1 : 0);
            td.colSpan = colspan;
            td.className = 'no-results';
            td.textContent = Config.t('noResults');
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);

        const footHost = this.querySelector(':scope > wc-table-footer');
        const footRows = this._collectSectionRows(footHost);
        if (footRows.length) {
            const tfoot = document.createElement('tfoot');
            footRows.forEach(tr => tfoot.appendChild(tr.cloneNode(true)));
            table.appendChild(tfoot);
        }

        // Return the HTML string (for innerHTML compatibility in renderContent)
        return table.outerHTML;
    }

    _collectSectionRows(host) {
        if (!host) return [];
        const tpl = host.querySelector(':scope > template');
        if (tpl) return Array.from(tpl.content.querySelectorAll('tr'));
        const tbl = host.querySelector(':scope > table');
        if (tbl) return Array.from(tbl.querySelectorAll('tr'));
        return Array.from(host.querySelectorAll(':scope > tr'));
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
