/**
 * WcTableFooter
 * Footer rows (cloned into shadow tfoot). Use template or table wrapping tr like wc-table-head.
 */
const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class WcTableFooter extends _HTMLElement {
    constructor() {
        super();
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('wc-table-footer')) {
    customElements.define('wc-table-footer', WcTableFooter);
}
