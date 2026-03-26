/**
 * BadgePlugin
 * Renders value inside a styled badge/pill.
 */
export class BadgePlugin {
    /**
     * @param {any} value 
     * @param {Object} config { class: 'custom-class' }
     * @returns {string}
     */
    static render(value, config = {}) {
        if (!value) return '';
        
        const className = config.class || 'badge-default';
        const colorClass = this._getColorClass(value);
        
        return `<span class="badge ${className} ${colorClass}">${value}</span>`;
    }

    static _getColorClass(value) {
        const v = String(value).toLowerCase();
        if (['ativo', 'active', 'pago', 'paid', 'concluido', 'done'].includes(v)) return 'badge-success';
        if (['pendente', 'pending', 'aguardando', 'waiting'].includes(v)) return 'badge-warning';
        if (['inativo', 'inactive', 'cancelado', 'canceled', 'erro', 'error'].includes(v)) return 'badge-danger';
        return 'badge-info';
    }
}
