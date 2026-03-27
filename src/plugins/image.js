export class ImagePlugin {
    static render(value, config = {}) {
        if (!value) return '';
        const width = config.width || '40px';
        const height = config.height || '40px';
        const rounded = config.rounded === 'true' ? 'border-radius: 50%' : 'border-radius: 4px';
        return `<img src="${value}" alt="" style="width: ${width}; height: ${height}; ${rounded}; object-fit: cover; display: block;">`;
    }
}
