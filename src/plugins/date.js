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

            const format = config.format || 'locale';
            
            if (format === 'locale') {
                const locale = config.locale || 'pt-BR';
                return new Intl.DateTimeFormat(locale).format(date);
            }

            // Simple tokens replacement
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            return format
                .replace('DD', day)
                .replace('MMM', monthsNames[date.getMonth()])
                .replace('MM', month)
                .replace('YYYY', year);
        } catch (e) {
            return value;
        }
    }
}
