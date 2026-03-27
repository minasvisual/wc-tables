export class ObjectPlugin {
    static render(value, config = {}) {
        if (!value || typeof value !== 'object') return value;
        const path = config.item || '';
        if (!path) return JSON.stringify(value);
        
        return path.split('.').reduce((obj, key) => obj?.[key], value) || '';
    }
}
