/**
 * WcTableRow
 * Lightweight component for declarative column configuration.
 */
export class WcTableRow extends HTMLElement {
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

if (!customElements.get('wc-table-row')) {
    customElements.define('wc-table-row', WcTableRow);
}
