/**
 * <wc-paginate> — Standalone pagination control web component.
 *
 * Attributes:
 *   page       {number}  Current page (1-based). Default: 1
 *   total      {number}  Total number of records. Required.
 *   page-size  {number}  Records per page. Default: 10
 *   delta      {number}  Page buttons shown around the active page. Default: 2
 *   hide-info  {boolean} When present, hides the "X–Y / Z" info counter.
 *
 * Events:
 *   page-changed  →  detail: { page, totalPages, pageSize }
 *
 * Usage:
 *   <wc-paginate total="100" page-size="10" page="1"></wc-paginate>
 *
 *   document.querySelector('wc-paginate')
 *     .addEventListener('page-changed', e => console.log(e.detail));
 */

const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

const CSS = `
  :host {
    display: block;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .wc-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
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
    user-select: none;
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
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
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
`;

class WcPaginate extends _HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Internal mutable page (mirrors the "page" attribute but also
        // updated internally when user clicks navigation buttons).
        this._page = 1;
    }

    // ─── Observed Attributes ─────────────────────────────────────────────────

    static get observedAttributes() {
        return ['page', 'total', 'page-size', 'delta', 'hide-info'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) return;
        if (name === 'page') {
            const p = parseInt(newValue, 10);
            if (p > 0) this._page = p;
        }
        this._render();
    }

    // ─── Computed getters ─────────────────────────────────────────────────────

    get _currentPage() { return this._page; }

    get _pageSize() {
        const v = parseInt(this.getAttribute('page-size'), 10);
        return v > 0 ? v : 10;
    }

    get _total() {
        const v = parseInt(this.getAttribute('total'), 10);
        return v > 0 ? v : 0;
    }

    get _totalPages() {
        return Math.max(1, Math.ceil(this._total / this._pageSize));
    }

    get _delta() {
        const v = parseInt(this.getAttribute('delta'), 10);
        return v > 0 ? v : 2;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    connectedCallback() {
        const attrPage = parseInt(this.getAttribute('page'), 10);
        if (attrPage > 0) this._page = attrPage;
        this._render();
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Navigate to a specific page programmatically. */
    goToPage(page) {
        this._navigate(page);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    _navigate(page) {
        const clamped = Math.min(Math.max(1, page), this._totalPages);
        if (clamped === this._page) return;
        this._page = clamped;
        this._render();
        this.dispatchEvent(new CustomEvent('page-changed', {
            detail: {
                page: this._page,
                totalPages: this._totalPages,
                pageSize: this._pageSize,
            },
            bubbles: true,
            composed: true,
        }));
    }

    _buildRange() {
        const { _delta: delta, _currentPage: cur, _totalPages: total } = this;
        const range = [];
        for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
            range.push(i);
        }
        return range;
    }

    _render() {
        const cur       = this._currentPage;
        const total     = this._totalPages;
        const pageSize  = this._pageSize;
        const hideInfo  = this.hasAttribute('hide-info');

        const start = (cur - 1) * pageSize + 1;
        const end   = Math.min(cur * pageSize, this._total);
        const range = this._buildRange();

        const pageButtons = range.map(p => `
            <button class="pg-btn${p === cur ? ' pg-active' : ''}" data-page="${p}" aria-label="Page ${p}" aria-current="${p === cur ? 'page' : 'false'}">${p}</button>
        `).join('');

        const firstBtn = range[0] > 1
            ? `<button class="pg-btn" data-page="1" aria-label="First page">1</button><span class="pg-ellipsis" aria-hidden="true">…</span>`
            : '';

        const lastBtn = range[range.length - 1] < total
            ? `<span class="pg-ellipsis" aria-hidden="true">…</span><button class="pg-btn" data-page="${total}" aria-label="Last page">${total}</button>`
            : '';

        this.shadowRoot.innerHTML = `
            <style>${CSS}</style>
            <nav class="wc-pagination" aria-label="Pagination">
                ${!hideInfo && this._total > 0
                    ? `<span class="pg-info">${start}–${end} / ${this._total}</span>`
                    : '<span></span>'
                }
                <div class="pg-controls" role="list">
                    <button class="pg-btn" data-page="prev" aria-label="Previous page" ${cur === 1 ? 'disabled' : ''}>&#8249;</button>
                    ${firstBtn}
                    ${pageButtons}
                    ${lastBtn}
                    <button class="pg-btn" data-page="next" aria-label="Next page" ${cur === total ? 'disabled' : ''}>&#8250;</button>
                </div>
            </nav>
        `;

        this.shadowRoot.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.page;
                if (target === 'prev') this._navigate(this._page - 1);
                else if (target === 'next') this._navigate(this._page + 1);
                else this._navigate(parseInt(target, 10));
            });
        });
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('wc-paginate')) {
    customElements.define('wc-paginate', WcPaginate);
}

export { WcPaginate };
