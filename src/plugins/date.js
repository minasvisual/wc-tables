/**
 * DatePlugin
 * Formats date values.
 */
export class DatePlugin {
    /**
     * @param {any} value 
     * @param {Object} config { format: 'pt-BR', options: {...} }
     * @returns {string}
     */
    static render(value, config = {}) {
        if (!value) return '';
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            
            const locale = config.format || 'pt-BR';
            return new Intl.DateTimeFormat(locale).format(date);
        } catch (e) {
            return value;
        }
    }
}
