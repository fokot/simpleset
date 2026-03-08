import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DashboardWidget } from '../types/dashboard-types.js';

@customElement('widget-config-panel')
export class WidgetConfigPanel extends LitElement {
  @property({ type: Object })
  widget: DashboardWidget | null = null;

  static styles = css`
    :host {
      display: block;
      font-size: 0.85rem;
    }

    .empty {
      color: #999;
      text-align: center;
      padding: 24px 0;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f0f0f0;
    }

    .field {
      margin-bottom: 10px;
    }

    .field-label {
      display: block;
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 3px;
    }

    input[type="text"],
    input[type="number"],
    input[type="color"],
    textarea,
    select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.8rem;
      font-family: inherit;
      box-sizing: border-box;
      background: white;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #4a90d9;
      box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.15);
    }

    textarea {
      min-height: 60px;
      resize: vertical;
    }

    .row {
      display: flex;
      gap: 8px;
    }

    .row .field {
      flex: 1;
    }

    .delete-btn {
      width: 100%;
      padding: 8px;
      background: #fff5f5;
      color: #c62828;
      border: 1px solid #ffcdd2;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      margin-top: 16px;
    }

    .delete-btn:hover {
      background: #ffebee;
    }
  `;

  private _emit(field: string, value: any) {
    this.dispatchEvent(new CustomEvent('config-change', {
      detail: { field, value },
      bubbles: true,
      composed: true,
    }));
  }

  private _emitPosition(field: string, value: number) {
    this.dispatchEvent(new CustomEvent('position-change', {
      detail: { field, value },
      bubbles: true,
      composed: true,
    }));
  }

  private _emitTitle(value: string) {
    this.dispatchEvent(new CustomEvent('title-change', {
      detail: { value },
      bubbles: true,
      composed: true,
    }));
  }

  private _emitDelete() {
    this.dispatchEvent(new CustomEvent('widget-delete', {
      detail: { widgetId: this.widget?.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _renderPositionFields() {
    const pos = this.widget!.position;
    return html`
      <div class="section">
        <div class="section-title">Position & Size</div>
        <div class="row">
          <div class="field">
            <label class="field-label">Column (X)</label>
            <input type="number" min="0" max="11" .value=${String(pos.x)}
              @change=${(e: Event) => this._emitPosition('x', Number((e.target as HTMLInputElement).value))} />
          </div>
          <div class="field">
            <label class="field-label">Row (Y)</label>
            <input type="number" min="0" .value=${String(pos.y)}
              @change=${(e: Event) => this._emitPosition('y', Number((e.target as HTMLInputElement).value))} />
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="field-label">Width</label>
            <input type="number" min="1" max="12" .value=${String(pos.width)}
              @change=${(e: Event) => this._emitPosition('width', Number((e.target as HTMLInputElement).value))} />
          </div>
          <div class="field">
            <label class="field-label">Height</label>
            <input type="number" min="1" .value=${String(pos.height)}
              @change=${(e: Event) => this._emitPosition('height', Number((e.target as HTMLInputElement).value))} />
          </div>
        </div>
      </div>
    `;
  }

  private _renderChartConfig() {
    const config = this.widget!.config as any;
    const dataBinding = config.dataBinding || {};
    return html`
      <div class="section">
        <div class="section-title">Chart Settings</div>
        <div class="field">
          <label class="field-label">Data Source ID</label>
          <input type="text" .value=${dataBinding.dataSourceId || ''}
            @change=${(e: Event) => this._emit('dataBinding.dataSourceId', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">SQL Query</label>
          <textarea .value=${dataBinding.sql || ''}
            @change=${(e: Event) => this._emit('dataBinding.sql', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
      </div>
    `;
  }

  private _renderTextConfig() {
    const config = (this.widget!.config as any).config || {};
    return html`
      <div class="section">
        <div class="section-title">Text Settings</div>
        <div class="field">
          <label class="field-label">Content</label>
          <textarea .value=${config.content || ''}
            @change=${(e: Event) => this._emit('config.content', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
        <div class="row">
          <div class="field">
            <label class="field-label">Font Size</label>
            <input type="number" min="8" max="72" .value=${String(config.fontSize || 16)}
              @change=${(e: Event) => this._emit('config.fontSize', Number((e.target as HTMLInputElement).value))} />
          </div>
          <div class="field">
            <label class="field-label">Align</label>
            <select .value=${config.textAlign || 'left'}
              @change=${(e: Event) => this._emit('config.textAlign', (e.target as HTMLSelectElement).value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Color</label>
          <input type="color" .value=${config.color || '#000000'}
            @change=${(e: Event) => this._emit('config.color', (e.target as HTMLInputElement).value)} />
        </div>
      </div>
    `;
  }

  private _renderMetricConfig() {
    const config = (this.widget!.config as any).config || {};
    return html`
      <div class="section">
        <div class="section-title">Metric Settings</div>
        <div class="field">
          <label class="field-label">Title</label>
          <input type="text" .value=${config.title || ''}
            @change=${(e: Event) => this._emit('config.title', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="row">
          <div class="field">
            <label class="field-label">Value</label>
            <input type="text" .value=${String(config.value ?? '')}
              @change=${(e: Event) => this._emit('config.value', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">Format</label>
            <select .value=${config.format || ''}
              @change=${(e: Event) => this._emit('config.format', (e.target as HTMLSelectElement).value)}>
              <option value="">None</option>
              <option value="%">Percentage</option>
              <option value=",">,###</option>
              <option value="#.##">#.##</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="field-label">Prefix</label>
            <input type="text" .value=${config.prefix || ''}
              @change=${(e: Event) => this._emit('config.prefix', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">Suffix</label>
            <input type="text" .value=${config.suffix || ''}
              @change=${(e: Event) => this._emit('config.suffix', (e.target as HTMLInputElement).value)} />
          </div>
        </div>
      </div>
    `;
  }

  private _renderTableConfig() {
    return html`
      <div class="section">
        <div class="section-title">Table Settings</div>
        <div class="field">
          <label class="field-label">Striped</label>
          <select .value=${(this.widget!.config as any).config?.striped ? 'true' : 'false'}
            @change=${(e: Event) => this._emit('config.striped', (e.target as HTMLSelectElement).value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Bordered</label>
          <select .value=${(this.widget!.config as any).config?.bordered ? 'true' : 'false'}
            @change=${(e: Event) => this._emit('config.bordered', (e.target as HTMLSelectElement).value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
    `;
  }

  private _renderMarkdownConfig() {
    const config = (this.widget!.config as any).config || {};
    return html`
      <div class="section">
        <div class="section-title">Markdown Settings</div>
        <div class="field">
          <label class="field-label">Content</label>
          <textarea style="min-height:120px" .value=${config.content || ''}
            @change=${(e: Event) => this._emit('config.content', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
      </div>
    `;
  }

  private _renderImageConfig() {
    const config = (this.widget!.config as any).config || {};
    return html`
      <div class="section">
        <div class="section-title">Image Settings</div>
        <div class="field">
          <label class="field-label">Image URL</label>
          <input type="text" .value=${config.src || ''}
            @change=${(e: Event) => this._emit('config.src', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">Alt Text</label>
          <input type="text" .value=${config.alt || ''}
            @change=${(e: Event) => this._emit('config.alt', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">Fit</label>
          <select .value=${config.fit || 'contain'}
            @change=${(e: Event) => this._emit('config.fit', (e.target as HTMLSelectElement).value)}>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
    `;
  }

  private _renderIframeConfig() {
    const config = (this.widget!.config as any).config || {};
    return html`
      <div class="section">
        <div class="section-title">Embed Settings</div>
        <div class="field">
          <label class="field-label">URL</label>
          <input type="text" .value=${config.src || ''}
            @change=${(e: Event) => this._emit('config.src', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">Title</label>
          <input type="text" .value=${config.title || ''}
            @change=${(e: Event) => this._emit('config.title', (e.target as HTMLInputElement).value)} />
        </div>
      </div>
    `;
  }

  private _renderFilterConfig() {
    const config = (this.widget!.config as any).config || {};
    return html`
      <div class="section">
        <div class="section-title">Filter Settings</div>
        <div class="field">
          <label class="field-label">Label</label>
          <input type="text" .value=${config.label || ''}
            @change=${(e: Event) => this._emit('config.label', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">Parameter</label>
          <input type="text" .value=${config.parameter || ''}
            @change=${(e: Event) => this._emit('config.parameter', (e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">Type</label>
          <select .value=${config.type || 'dropdown'}
            @change=${(e: Event) => this._emit('config.type', (e.target as HTMLSelectElement).value)}>
            <option value="dropdown">Dropdown</option>
            <option value="multiselect">Multi-select</option>
            <option value="daterange">Date Range</option>
            <option value="slider">Slider</option>
            <option value="input">Text Input</option>
          </select>
        </div>
      </div>
    `;
  }

  private _renderTypeConfig() {
    if (!this.widget) return nothing;
    switch (this.widget.config.type) {
      case 'chart': return this._renderChartConfig();
      case 'text': return this._renderTextConfig();
      case 'metric': return this._renderMetricConfig();
      case 'table': return this._renderTableConfig();
      case 'markdown': return this._renderMarkdownConfig();
      case 'image': return this._renderImageConfig();
      case 'iframe': return this._renderIframeConfig();
      case 'filter': return this._renderFilterConfig();
      default: return nothing;
    }
  }

  render() {
    if (!this.widget) {
      return html`<div class="empty">Select a widget to configure</div>`;
    }

    return html`
      <div class="section">
        <div class="section-title">General</div>
        <div class="field">
          <label class="field-label">Title</label>
          <input type="text" .value=${this.widget.title || ''}
            @change=${(e: Event) => this._emitTitle((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label">Type</label>
          <input type="text" .value=${this.widget.config.type} disabled />
        </div>
      </div>

      ${this._renderPositionFields()}
      ${this._renderTypeConfig()}

      <button class="delete-btn" @click=${this._emitDelete}>Delete Widget</button>
    `;
  }
}
