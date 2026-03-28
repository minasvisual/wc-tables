import { describe, it, expect, beforeEach } from 'vitest';
import '../src/wc-table.js';
import { Config } from '../src/config.js';

describe('wc-table attribute features', () => {
  let el;

  beforeEach(() => {
    document.body.innerHTML = '<wc-table id="test-table"></wc-table>';
    el = document.getElementById('test-table');
  });

  it('should parse and set data from data attribute', () => {
    const jsonData = JSON.stringify([
      { id: 1, name: 'Test 1' },
      { id: 2, name: 'Test 2' }
    ]);
    
    el.setAttribute('data', jsonData);
    // Data is set as a property
    expect(el.data).toHaveLength(2);
    expect(el.data[0].name).toBe('Test 1');
  });

  it('should handle invalid JSON gracefully', () => {
    // Should not crash, just warn and keep old data (empty)
    el.setAttribute('data', '{ invalid json }');
    expect(el._data).toHaveLength(0);
  });

  it('should compute _hiddenCols from comma-separated attribute', () => {
    el.setAttribute('hidden-cols', 'id,age,status');
    const hidden = el._hiddenCols;
    expect(hidden.has('id')).toBe(true);
    expect(hidden.has('age')).toBe(true);
    expect(hidden.has('status')).toBe(true);
    expect(hidden.has('name')).toBe(false);
  });

  it('should compute _hiddenCols from JSON array attribute', () => {
    el.setAttribute('hidden-cols', '["id", "company"]');
    const hidden = el._hiddenCols;
    expect(hidden.has('id')).toBe(true);
    expect(hidden.has('company')).toBe(true);
  });
  
  it('should disable pagination if page-size is missing or 0', () => {
    // Current setup: page-size missing
    expect(el._pageSize).toBe(0);
    
    el.setAttribute('page-size', '5');
    expect(el._pageSize).toBe(5);

    el.setAttribute('page-size', '0');
    expect(el._pageSize).toBe(0);
  });

  it('should use col-label for column header text when set', () => {
    document.body.innerHTML = `
      <wc-table id="labeled-table">
        <wc-table-row col="price" col-label="Preço"></wc-table-row>
      </wc-table>`;
    const table = document.getElementById('labeled-table');
    table.data = [{ price: 10 }];
    const th = table.shadowRoot.querySelector('th[data-key="price"]');
    expect(th).toBeTruthy();
    expect(th.textContent).toContain('Preço');
  });
  it('should clone wc-table-head and wc-table-footer rows into the shadow table', () => {
    document.body.innerHTML = `
      <wc-table id="hf-table">
        <wc-table-row col="a"></wc-table-row>
        <wc-table-head>
          <template>
            <tr><th colspan="2">Group header</th></tr>
          </template>
        </wc-table-head>
        <wc-table-footer>
          <template>
            <tr><td colspan="2">Footer line</td></tr>
          </template>
        </wc-table-footer>
      </wc-table>`;
    const t = document.getElementById('hf-table');
    t.data = [{ a: 1 }];
    const theadRows = t.shadowRoot.querySelectorAll('thead tr');
    expect(theadRows.length).toBe(2);
    expect(theadRows[0].querySelector('th[data-key]')).toBeTruthy();
    expect(theadRows[1].textContent).toContain('Group header');
    const tfoot = t.shadowRoot.querySelector('tfoot');
    expect(tfoot).toBeTruthy();
    expect(tfoot.textContent).toContain('Footer line');
  });

  it('should pass first filtered row to plugins in declarative wc-table-head (expression)', () => {
    document.body.innerHTML = `
      <wc-table id="expr-head-table">
        <wc-table-row col="a"></wc-table-row>
        <wc-table-row col="b"></wc-table-row>
        <wc-table-head>
          <wc-table-row col="a" type="expression" expr="\${a} / \${b}"></wc-table-row>
        </wc-table-head>
      </wc-table>`;
    const t = document.getElementById('expr-head-table');
    t.data = [{ a: 'one', b: 'two' }];
    const extra = t.shadowRoot.querySelector('thead tr.wc-thead-extra');
    expect(extra).toBeTruthy();
    const cells = extra.querySelectorAll('th');
    expect(cells[1].textContent.trim()).toBe('one / two');
  });

  it('should build declarative wc-table-head row from wc-table-row children', () => {
    class UpperPlugin {
      static render(value) {
        return String(value).toUpperCase();
      }
    }
    Config.registerPlugin('uppercase', UpperPlugin);
    document.body.innerHTML = `
      <wc-table id="decl-head-table">
        <wc-table-row col="x" col-label="My X"></wc-table-row>
        <wc-table-head>
          <wc-table-row col="x" type="uppercase" header-text="hello"></wc-table-row>
        </wc-table-head>
      </wc-table>`;
    const t = document.getElementById('decl-head-table');
    t.data = [{ x: 42 }];
    const extra = t.shadowRoot.querySelector('thead tr.wc-thead-extra');
    expect(extra).toBeTruthy();
    const cells = extra.querySelectorAll('th');
    expect(cells.length).toBe(2);
    expect(cells[1].textContent).toBe('HELLO');
  });

  it('should not render thead/tfoot extras when there is no data', () => {
    document.body.innerHTML = `
      <wc-table id="empty-hf">
        <wc-table-head><template><tr><th>X</th></tr></template></wc-table-head>
        <wc-table-footer><template><tr><td>Y</td></tr></template></wc-table-footer>
      </wc-table>`;
    const t = document.getElementById('empty-hf');
    const wrap = t.shadowRoot.querySelector('#tableContent');
    expect(wrap.textContent).toContain('Waiting');
    expect(t.shadowRoot.querySelector('table')).toBeNull();
  });

  it('should omit default search when hide-search is set', () => {
    el.setAttribute('hide-search', '');
    el.data = [{ id: 1, name: 'A' }];
    expect(el.shadowRoot.querySelector('.search-input')).toBeNull();
    expect(el.shadowRoot.querySelector('.search-container')).toBeNull();
  });

  it('should emit action-click only once per button click after multiple full renders', () => {
    document.body.innerHTML = `
      <wc-table id="multi-render-table">
        <wc-table-row col="x" type="button" action="view" label="Go"></wc-table-row>
      </wc-table>`;
    const t = document.getElementById('multi-render-table');
    t.data = [{ x: '' }];
    let fires = 0;
    t.addEventListener('action-click', () => { fires += 1; });
    t.setAttribute('hide-search', '');
    t.removeAttribute('hide-search');
    const btn = t.shadowRoot.querySelector('button[data-action]');
    expect(btn).toBeTruthy();
    btn.click();
    expect(fires).toBe(1);
  });

  it('should fire before-filter and after-filter when setting filterQuery with hide-search', () => {
    el.setAttribute('hide-search', '');
    el.data = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' }
    ];
    let before = 0;
    let after = 0;
    el.addEventListener('before-filter', () => { before += 1; });
    el.addEventListener('after-filter', () => { after += 1; });
    el.filterQuery = 'Banana';
    expect(before).toBe(1);
    expect(after).toBe(1);
    const rows = el.shadowRoot.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Banana');
  });

});
