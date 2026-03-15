import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DashboardWidget, WidgetType } from '../types/dashboard-types.js';

@customElement('editor-property-panel')
export class EditorPropertyPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .panel-section {
      padding: 20px;
      border-bottom: 1px solid var(--cream-dark, #e8e3db);
    }

    .panel-section:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted, #8a8279);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 16px;
      color: var(--text-dim, #b5ada4);
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--cream, #f5f2ed);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .empty-icon svg {
      width: 24px;
      height: 24px;
      color: var(--text-dim, #b5ada4);
    }

    .empty-state p {
      font-size: 0.82rem;
      line-height: 1.5;
      margin: 0;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .field label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted, #8a8279);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .field input, .field select, .field textarea {
      padding: 6px 10px;
      border: 1px solid var(--cream-dark, #e8e3db);
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.82rem;
      color: var(--charcoal, #2a2520);
      background: var(--surface, #ffffff);
      outline: none;
      transition: border-color 0.15s;
    }

    .field input:focus, .field select:focus, .field textarea:focus {
      border-color: var(--amber, #d4a04a);
      box-shadow: 0 0 0 3px var(--amber-glow, rgba(212, 160, 74, 0.15));
    }

    .field input[type="number"] {
      width: 100%;
      box-sizing: border-box;
    }

    .field textarea {
      min-height: 60px;
      resize: vertical;
    }

    .field input[type="color"] {
      width: 100%;
      height: 32px;
      padding: 2px;
      cursor: pointer;
    }

    .widget-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--charcoal, #2a2520);
      padding: 6px 10px;
      background: var(--cream, #f5f2ed);
      border-radius: 6px;
      margin-bottom: 12px;
      text-transform: capitalize;
    }

    .multi-select-info {
      font-size: 0.78rem;
      color: var(--text-muted, #8a8279);
      padding: 6px 10px;
      background: var(--cream, #f5f2ed);
      border-radius: 6px;
      margin-bottom: 12px;
    }
  `;

  @property({ attribute: false }) widgets: DashboardWidget[] = [];
  @property({ type: Boolean }) multiSelect = false;

  render() {
    if (this.widgets.length === 0) {
      return this._renderEmpty();
    }

    if (this.widgets.length > 1) {
      return this._renderMultiSelect();
    }

    return this._renderSingle(this.widgets[0]);
  }

  private _renderEmpty() {
    return html`
      <div class="panel-section">
        <div class="section-title">Properties</div>
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>
            </svg>
          </div>
          <p>Select a widget on the canvas to edit its properties</p>
        </div>
      </div>
    `;
  }

  private _renderSingle(widget: DashboardWidget) {
    return html`
      <div class="panel-section">
        <div class="section-title">Properties</div>
        <div class="widget-type-badge">${widget.config.type}</div>
        <div class="field-group">
          ${this._renderPositionFields(widget)}
          ${this._renderTypeConfig(widget)}
          ${this._renderStyleFields(widget)}
        </div>
      </div>
    `;
  }

  private _renderMultiSelect() {
    return html`
      <div class="panel-section">
        <div class="section-title">Properties</div>
        <div class="multi-select-info">${this.widgets.length} widgets selected</div>
        <div class="field-group">
          ${this._renderSharedStyleFields()}
        </div>
      </div>
    `;
  }

  private _renderPositionFields(widget: DashboardWidget) {
    const pos = widget.position;
    return html`
      <div class="field-row">
        <div class="field">
          <label>X</label>
          <input type="number" min="0" max="11" .value=${String(pos.x)}
            @change=${(e: Event) => this._emitChange(widget.id, 'position.x', Number((e.target as HTMLInputElement).value))} />
        </div>
        <div class="field">
          <label>Y</label>
          <input type="number" min="0" .value=${String(pos.y)}
            @change=${(e: Event) => this._emitChange(widget.id, 'position.y', Number((e.target as HTMLInputElement).value))} />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Width</label>
          <input type="number" min="1" max="12" .value=${String(pos.width)}
            @change=${(e: Event) => this._emitChange(widget.id, 'position.width', Number((e.target as HTMLInputElement).value))} />
        </div>
        <div class="field">
          <label>Height</label>
          <input type="number" min="1" .value=${String(pos.height)}
            @change=${(e: Event) => this._emitChange(widget.id, 'position.height', Number((e.target as HTMLInputElement).value))} />
        </div>
      </div>
    `;
  }

  private _renderTypeConfig(widget: DashboardWidget) {
    const cfg = widget.config;
    switch (cfg.type) {
      case 'text':
        return html`
          <div class="field">
            <label>Content</label>
            <textarea .value=${cfg.config.content || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.content', (e.target as HTMLTextAreaElement).value)}></textarea>
          </div>
          <div class="field">
            <label>Font Size</label>
            <input type="number" min="8" max="72" .value=${String(cfg.config.fontSize || 14)}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.fontSize', Number((e.target as HTMLInputElement).value))} />
          </div>
          <div class="field">
            <label>Text Align</label>
            <select .value=${cfg.config.textAlign || 'left'}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.textAlign', (e.target as HTMLSelectElement).value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        `;
      case 'metric':
        return html`
          <div class="field">
            <label>Title</label>
            <input type="text" .value=${cfg.config.title || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.title', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Value</label>
            <input type="text" .value=${String(cfg.config.value ?? '')}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.value', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Prefix</label>
            <input type="text" .value=${cfg.config.prefix || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.prefix', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Suffix</label>
            <input type="text" .value=${cfg.config.suffix || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.suffix', (e.target as HTMLInputElement).value)} />
          </div>
        `;
      case 'image':
        return html`
          <div class="field">
            <label>Image URL</label>
            <input type="text" .value=${cfg.config.src || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.src', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Alt Text</label>
            <input type="text" .value=${cfg.config.alt || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.alt', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Fit</label>
            <select .value=${cfg.config.fit || 'contain'}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.fit', (e.target as HTMLSelectElement).value)}>
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
            </select>
          </div>
        `;
      case 'iframe':
        return html`
          <div class="field">
            <label>URL</label>
            <input type="text" .value=${cfg.config.src || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.src', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Title</label>
            <input type="text" .value=${cfg.config.title || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.title', (e.target as HTMLInputElement).value)} />
          </div>
        `;
      case 'markdown':
        return html`
          <div class="field">
            <label>Content</label>
            <textarea .value=${cfg.config.content || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.content', (e.target as HTMLTextAreaElement).value)}></textarea>
          </div>
        `;
      case 'chart':
        return html`
          <div class="field">
            <label>Chart Type</label>
            <select @change=${(e: Event) => this._emitChange(widget.id, 'title', (e.target as HTMLSelectElement).value)}>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
              <option value="scatter">Scatter</option>
            </select>
          </div>
        `;
      case 'filter':
        return html`
          <div class="field">
            <label>Label</label>
            <input type="text" .value=${cfg.config.label || ''}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.label', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label>Type</label>
            <select .value=${cfg.config.type || 'dropdown'}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.type', (e.target as HTMLSelectElement).value)}>
              <option value="dropdown">Dropdown</option>
              <option value="multiselect">Multi-select</option>
              <option value="input">Input</option>
              <option value="slider">Slider</option>
              <option value="daterange">Date Range</option>
            </select>
          </div>
        `;
      case 'table':
        return html`
          <div class="field">
            <label>Striped</label>
            <select .value=${cfg.config.striped ? 'true' : 'false'}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.striped', (e.target as HTMLSelectElement).value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div class="field">
            <label>Bordered</label>
            <select .value=${cfg.config.bordered ? 'true' : 'false'}
              @change=${(e: Event) => this._emitChange(widget.id, 'config.config.bordered', (e.target as HTMLSelectElement).value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        `;
      default:
        return nothing;
    }
  }

  private _renderStyleFields(widget: DashboardWidget) {
    const style = widget.style || {};
    return html`
      <div class="field">
        <label>Background Color</label>
        <input type="color" .value=${style.backgroundColor || '#ffffff'}
          @change=${(e: Event) => this._emitChange(widget.id, 'style.backgroundColor', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="field">
        <label>Border Radius</label>
        <input type="number" min="0" max="32" .value=${String(style.borderRadius ?? 8)}
          @change=${(e: Event) => this._emitChange(widget.id, 'style.borderRadius', Number((e.target as HTMLInputElement).value))} />
      </div>
    `;
  }

  private _renderSharedStyleFields() {
    return html`
      <div class="field">
        <label>Background Color</label>
        <input type="color" .value=${this._getSharedValue('style.backgroundColor') || '#ffffff'}
          @change=${(e: Event) => this._emitMultiChange('style.backgroundColor', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="field">
        <label>Border Radius</label>
        <input type="number" min="0" max="32" .value=${this._getSharedValue('style.borderRadius') ?? '8'}
          @change=${(e: Event) => this._emitMultiChange('style.borderRadius', Number((e.target as HTMLInputElement).value))} />
      </div>
    `;
  }

  private _getSharedValue(path: string): any {
    if (this.widgets.length === 0) return undefined;
    const parts = path.split('.');
    const values = this.widgets.map(w => {
      let obj = w as any;
      for (const p of parts) {
        obj = obj?.[p];
      }
      return obj;
    });
    const first = values[0];
    return values.every(v => v === first) ? first : undefined;
  }

  private _emitChange(widgetId: string, path: string, value: any): void {
    this.dispatchEvent(new CustomEvent('property-change', {
      detail: { widgetId, path, value },
      bubbles: true, composed: true,
    }));
  }

  private _emitMultiChange(path: string, value: any): void {
    for (const w of this.widgets) {
      this._emitChange(w.id, path, value);
    }
  }
}
