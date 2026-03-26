/**
 * CurrencyPlugin
 * Formats numeric values as currency.
 */
export class CurrencyPlugin {
    /**
     * @param {any} value 
     * @param {Object} config { format: 'BRL', ... }
     * @returns {string}
     */
    static render(value, config = {}) {
        const val = parseFloat(value);
        if (isNaN(val)) return value;

        const currency = config.format || 'BRL';
        const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(val);
    }
}
