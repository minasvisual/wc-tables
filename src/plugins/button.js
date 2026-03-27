export class ButtonPlugin {
    static render(value, config = {}) {
        const action = config.action || 'view';
        const label = value || config.label || 'Action';
        const className = config.class || '';
        return `<button class="wc-table-btn ${className}" data-action="${action}">${label}</button>`;
    }
}
