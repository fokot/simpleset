import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface FilterOption {
  label: string;
  value: any;
}

export interface FilterWidgetConfig {
  filterType: 'dropdown' | 'multiselect' | 'daterange' | 'slider' | 'input';
  label: string;
  parameter: string;
  options?: FilterOption[];
  defaultValue?: any;
  required?: boolean;
  targetWidgetIds?: string[];
}

@customElement('filter-widget')
export class FilterWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .filter-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .filter-label {
      font-weight: 500;
      color: var(--filter-label-color, #333);
      min-width: 100px;
    }

    .filter-control {
      flex: 1;
      max-width: 300px;
    }

    select, input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--filter-border-color, #ddd);
      border-radius: 4px;
      font-size: 0.9rem;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    select:hover, input:hover {
      border-color: var(--filter-border-hover-color, #999);
    }

    select:focus, input:focus {
      outline: none;
      border-color: var(--filter-border-focus-color, #667eea);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  `;

  @property({ type: Object })
  config!: FilterWidgetConfig;

  @property({ type: Object })
  data?: any;

  private _handleChange(event: Event) {
    const target = event.target as HTMLSelectElement | HTMLInputElement;
    const value = this.config.filterType === 'dropdown' 
      ? (target as HTMLSelectElement).value 
      : target.value;

    // Parse value to number if it looks like a number
    const parsedValue = !isNaN(Number(value)) ? Number(value) : value;

    // Dispatch custom event with the filter value
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: {
        parameter: this.config.parameter,
        value: parsedValue,
        targetWidgetIds: this.config.targetWidgetIds || []
      },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.config) {
      return html`<div>Invalid filter configuration</div>`;
    }

    const currentValue = this.data?.value ?? this.config.defaultValue;

    return html`
      <div class="filter-container">
        <label class="filter-label">${this.config.label}:</label>
        <div class="filter-control">
          ${this.config.filterType === 'dropdown' ? html`
            <select @change="${this._handleChange}" .value="${currentValue}">
              ${this.config.options?.map(option => html`
                <option value="${option.value}" ?selected="${option.value === currentValue}">
                  ${option.label}
                </option>
              `)}
            </select>
          ` : html`
            <input 
              type="text" 
              .value="${currentValue || ''}"
              @change="${this._handleChange}"
              placeholder="${this.config.label}"
            />
          `}
        </div>
      </div>
    `;
  }
}

