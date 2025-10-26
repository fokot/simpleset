import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TableWidgetConfig } from '../types/dashboard-types.js';

export interface TableData {
  rows: Record<string, any>[];
  totalCount?: number;
}

@customElement('table-widget')
export class TableWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .table-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .table-wrapper {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--table-border-color, #e0e0e0);
      border-radius: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    th {
      background: var(--table-header-bg, #f5f5f5);
      color: var(--table-header-color, #333);
      font-weight: 600;
      padding: 12px 8px;
      text-align: left;
      border-bottom: 2px solid var(--table-border-color, #e0e0e0);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    th.sortable {
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    th.sortable:hover {
      background: var(--table-header-hover-bg, #eeeeee);
    }

    .sort-indicator {
      margin-left: 4px;
      font-size: 0.8rem;
      opacity: 0.6;
    }

    .sort-indicator.active {
      opacity: 1;
    }

    td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--table-border-color, #e0e0e0);
      vertical-align: top;
    }

    .striped tbody tr:nth-child(even) {
      background: var(--table-stripe-bg, #f9f9f9);
    }

    .bordered {
      border: 1px solid var(--table-border-color, #e0e0e0);
    }

    .bordered th,
    .bordered td {
      border-right: 1px solid var(--table-border-color, #e0e0e0);
    }

    .bordered th:last-child,
    .bordered td:last-child {
      border-right: none;
    }

    .hoverable tbody tr:hover {
      background: var(--table-hover-bg, #f0f0f0);
    }

    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-top: 1px solid var(--table-border-color, #e0e0e0);
      margin-top: 8px;
      font-size: 0.9rem;
    }

    .pagination-info {
      color: var(--table-text-secondary, #666);
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .pagination-button {
      padding: 6px 12px;
      border: 1px solid var(--table-border-color, #e0e0e0);
      background: white;
      cursor: pointer;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .pagination-button:hover:not(:disabled) {
      background: var(--table-hover-bg, #f0f0f0);
    }

    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-input {
      width: 50px;
      padding: 4px 8px;
      border: 1px solid var(--table-border-color, #e0e0e0);
      border-radius: 4px;
      text-align: center;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--table-text-secondary, #666);
      font-style: italic;
    }
  `;

  @property({ type: Object })
  config!: TableWidgetConfig;

  @property({ type: Object })
  data!: TableData;

  @state()
  private _currentPage = 1;

  @state()
  private _sortColumn?: string;

  @state()
  private _sortDirection: 'asc' | 'desc' = 'asc';

  private get _pageSize(): number {
    return this.config.pagination?.pageSize || 10;
  }

  private get _totalPages(): number {
    if (!this.data?.rows) return 0;
    return Math.ceil(this.data.rows.length / this._pageSize);
  }

  private get _paginatedData(): Record<string, any>[] {
    if (!this.data?.rows) return [];
    
    let sortedData = [...this.data.rows];
    
    // Apply sorting
    if (this._sortColumn) {
      sortedData.sort((a, b) => {
        const aVal = a[this._sortColumn!];
        const bVal = b[this._sortColumn!];
        
        if (aVal === bVal) return 0;
        
        let result = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          result = aVal - bVal;
        } else {
          result = String(aVal).localeCompare(String(bVal));
        }
        
        return this._sortDirection === 'desc' ? -result : result;
      });
    }
    
    // Apply pagination
    if (this.config.pagination?.enabled) {
      const startIndex = (this._currentPage - 1) * this._pageSize;
      return sortedData.slice(startIndex, startIndex + this._pageSize);
    }
    
    return sortedData;
  }

  private _handleSort(columnKey: string): void {
    const column = this.config.columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (this._sortColumn === columnKey) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = columnKey;
      this._sortDirection = 'asc';
    }
  }

  private _formatCellValue(value: any, format?: string): string {
    if (value == null) return '';
    
    if (format) {
      if (format.includes('%') && typeof value === 'number') {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (format.includes(',') && typeof value === 'number') {
        return value.toLocaleString();
      }
      if (format === 'currency' && typeof value === 'number') {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
      }
    }
    
    return String(value);
  }

  private _goToPage(page: number): void {
    if (page >= 1 && page <= this._totalPages) {
      this._currentPage = page;
    }
  }

  private _renderTableHeader() {
    return html`
      <thead>
        <tr>
          ${this.config.columns.map(column => html`
            <th 
              class="${column.sortable ? 'sortable' : ''} text-${column.align}"
              style="${column.width ? `width: ${column.width}px` : ''}"
              @click="${column.sortable ? () => this._handleSort(column.key) : null}"
            >
              ${column.title}
              ${column.sortable ? html`
                <span class="sort-indicator ${this._sortColumn === column.key ? 'active' : ''}">
                  ${this._sortColumn === column.key 
                    ? (this._sortDirection === 'asc' ? '↑' : '↓')
                    : '↕'
                  }
                </span>
              ` : ''}
            </th>
          `)}
        </tr>
      </thead>
    `;
  }

  private _renderTableBody() {
    const data = this._paginatedData;
    
    if (data.length === 0) {
      return html`
        <tbody>
          <tr>
            <td colspan="${this.config.columns.length}" class="empty-state">
              No data available
            </td>
          </tr>
        </tbody>
      `;
    }

    return html`
      <tbody>
        ${data.map(row => html`
          <tr>
            ${this.config.columns.map(column => html`
              <td class="text-${column.align}">
                ${this._formatCellValue(row[column.key], column.format)}
              </td>
            `)}
          </tr>
        `)}
      </tbody>
    `;
  }

  private _renderPagination() {
    if (!this.config.pagination?.enabled || this._totalPages <= 1) {
      return '';
    }

    const startItem = (this._currentPage - 1) * this._pageSize + 1;
    const endItem = Math.min(this._currentPage * this._pageSize, this.data.rows.length);

    return html`
      <div class="pagination">
        <div class="pagination-info">
          Showing ${startItem}-${endItem} of ${this.data.rows.length} items
        </div>
        <div class="pagination-controls">
          <button 
            class="pagination-button"
            ?disabled="${this._currentPage === 1}"
            @click="${() => this._goToPage(this._currentPage - 1)}"
          >
            Previous
          </button>
          
          <span>Page</span>
          <input 
            type="number" 
            class="page-input"
            .value="${this._currentPage}"
            min="1" 
            max="${this._totalPages}"
            @change="${(e: Event) => {
              const target = e.target as HTMLInputElement;
              this._goToPage(parseInt(target.value) || 1);
            }}"
          />
          <span>of ${this._totalPages}</span>
          
          <button 
            class="pagination-button"
            ?disabled="${this._currentPage === this._totalPages}"
            @click="${() => this._goToPage(this._currentPage + 1)}"
          >
            Next
          </button>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.config || !this.data) {
      return html`
        <div class="table-container">
          <div class="empty-state">Invalid table configuration or data</div>
        </div>
      `;
    }

    const tableClasses = [
      this.config.striped ? 'striped' : '',
      this.config.bordered ? 'bordered' : '',
      this.config.hoverable ? 'hoverable' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="table-container">
        <div class="table-wrapper">
          <table class="${tableClasses}">
            ${this._renderTableHeader()}
            ${this._renderTableBody()}
          </table>
        </div>
        ${this._renderPagination()}
      </div>
    `;
  }
}
