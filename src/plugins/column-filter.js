/**
 * Extra thead row filter input — use inside `<wc-table-head>` with declarative `<wc-table-row>`.
 *
 * Attributes on `<wc-table-row>` (merged with global column config):
 * - `col` (required) — data key; becomes `data-col-filter` on the input
 * - `placeholder` — input placeholder (falls back to `header-text`, then column label value passed to `render`)
 * - `input-type` — `text` | `search` | `email` | `tel` (default `search`)
 * - `aria-label` — a11y label (default `Filter {col}`)
 *
 * On `input`, `<wc-table>` dispatches `column-filter` with `{ column, value, query, originalEvent }`.
 * Manual `<template>` rows can use the same hook: `<input class="wc-col-filter-input" data-col-filter="fieldKey" />`.
 */

const ALLOWED_TYPES = new Set(['text', 'search', 'email', 'tel']);

function escAttr(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

export class ColumnFilterPlugin {
    /**
     * @param {string} value — header label / header-text passed from wc-table
     * @param {Record<string, string>} config — merged wc-table-row attributes
     */
    static render(value, config = {}) {
        const col = config.col;
        if (!col) return '';

        const rawType = (config['input-type'] || 'search').toLowerCase();
        const inputType = ALLOWED_TYPES.has(rawType) ? rawType : 'search';

        const placeholder = config.placeholder != null && String(config.placeholder).trim() !== ''
            ? config.placeholder
            : (value != null && String(value).trim() !== '' ? value : col);

        const aria = config['aria-label'] != null && String(config['aria-label']).trim() !== ''
            ? config['aria-label']
            : `Filter ${col}`;

        return `<input type="${escAttr(inputType)}" class="wc-col-filter-input" data-col-filter="${escAttr(col)}" placeholder="${escAttr(placeholder)}" autocomplete="off" aria-label="${escAttr(aria)}" />`;
    }
}
