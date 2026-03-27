export class TagsPlugin {
    static render(value) {
        if (!value) return '';
        let tags = [];
        if (Array.isArray(value)) {
            tags = value;
        } else if (typeof value === 'string') {
            try {
                tags = JSON.parse(value);
            } catch (e) {
                tags = value.split(',').map(t => t.trim());
            }
        }

        return `<div class="wc-table-tags">` + 
               tags.map(tag => `<span class="wc-table-tag">${tag}</span>`).join('') + 
               `</div>`;
    }
}
