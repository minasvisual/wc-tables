/**
 * WcTableRow
 * Lightweight component for declarative column configuration.
 */
const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class WcTableRow extends _HTMLElement {
    constructor() {
        super();
    }

    get config() {
        return {
            col: this.getAttribute('col'),
            type: this.getAttribute('type'),
            format: this.getAttribute('format'),
            class: this.getAttribute('class')
        };
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('wc-table-row')) {
    customElements.define('wc-table-row', WcTableRow);
}
