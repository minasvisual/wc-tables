export class ExpressionPlugin {
    static render(value, config = {}, item = {}) {
        const template = config.expr || '';
        if (!template) return value;
        
        // Simple template replacement ${field}
        return template.replace(/\${(.*?)}/g, (_, key) => {
            const k = key.trim();
            return item[k] !== undefined ? item[k] : '';
        });
    }
}
