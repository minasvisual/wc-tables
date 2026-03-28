/**
 * WcTableHead
 * Extra header rows appended after the auto-generated title/sort row.
 *
 * Two modes:
 * 1) Manual: a direct child `<template>` (or `<table>`) wrapping `<tr>` — rows are cloned into shadow `<thead>`.
 *    (`<tr>` cannot be a direct child of this element in valid HTML; use `<template>` or `<table>`.)
 * 2) Declarative: direct child `<wc-table-row col="…">` elements only (no `<template>` / `<table>`).
 *    One extra row is built with the same column layout as the main header; cells are empty except columns
 *    listed in `wc-table-head`, where `type`/`format`/… merge over the global column config.
 *    Optional `header-text` sets the value passed to the plugin; otherwise the main header label is used
 *    (`col-label` or i18n `Config.t(col)`).
 *    Plugins receive the **first visible data row** (`_filteredData[0]`) as `item` (e.g. `expression` with `${field}`).
 *    Use `type="col-filter"` on a `<wc-table-row>` to render a filter input; the table emits **`column-filter`**
 *    on `input` (`detail`: `column`, `value`, `query`, `originalEvent`). Manual `<template>` rows can use
 *    `<input class="wc-col-filter-input" data-col-filter="key" />` for the same event.
 */
const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class WcTableHead extends _HTMLElement {
    constructor() {
        super();
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('wc-table-head')) {
    customElements.define('wc-table-head', WcTableHead);
}
