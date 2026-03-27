export class ExpressionPlugin {
    static render(value, config = {}, item = {}) {
        const template = config.expr || '';
        if (!template) return value;

        // Template replacement supporting dot notation: ${address.city}
        return template.replace(/\${(.*?)}/g, (_, key) => {
            const val = key.trim().split('.').reduce((obj, k) => (obj != null ? obj[k] : undefined), item);
            return val !== undefined && val !== null ? val : '';
        });
    }
}
