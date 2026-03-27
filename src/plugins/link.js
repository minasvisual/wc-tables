export class LinkPlugin {
    static render(value, config = {}) {
        if (!value) return '';
        const target = config.target || '_blank';
        const label = config.label || value;
        return `<a href="${value}" target="${target}" class="wc-table-link">${label}</a>`;
    }
}
