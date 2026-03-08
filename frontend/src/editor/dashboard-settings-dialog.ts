import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Dashboard, DashboardTheme } from '../types/dashboard-types.js';

@customElement('dashboard-settings-dialog')
export class DashboardSettingsDialog extends LitElement {
  @property({ type: Object })
  dashboard!: Dashboard;

  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private _tab: 'general' | 'layout' | 'theme' = 'general';

  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
    }

    .dialog {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 10px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      width: 480px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }

    .dialog-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .close-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .close-btn:hover {
      background: #e0e0e0;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      padding: 0 20px;
    }

    .tab {
      padding: 10px 16px;
      border: none;
      background: none;
      font-size: 0.85rem;
      color: #888;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .tab.active {
      color: #4a90d9;
      border-bottom-color: #4a90d9;
      font-weight: 500;
    }

    .tab:hover:not(.active) {
      color: #555;
    }

    .dialog-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .field {
      margin-bottom: 14px;
    }

    .field-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: #666;
      margin-bottom: 4px;
    }

    input[type="text"],
    input[type="number"],
    input[type="color"],
    textarea,
    select {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 0.85rem;
      font-family: inherit;
      box-sizing: border-box;
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
      gap: 12px;
    }

    .row .field {
      flex: 1;
    }

    .color-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .color-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .color-field input[type="color"] {
      width: 36px;
      height: 36px;
      padding: 2px;
      border-radius: 6px;
      cursor: pointer;
    }

    .color-field label {
      font-size: 0.65rem;
      color: #999;
    }

    .dialog-footer {
      padding: 12px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 5px;
      font-size: 0.85rem;
      cursor: pointer;
      border: 1px solid #ddd;
      background: white;
      color: #555;
    }

    .btn:hover {
      background: #f5f5f5;
    }

    .btn-primary {
      background: #4a90d9;
      color: white;
      border-color: #4a90d9;
    }

    .btn-primary:hover {
      background: #3a7fc8;
    }
  `;

  private _emit(changes: Record<string, any>) {
    this.dispatchEvent(new CustomEvent('settings-change', {
      detail: changes,
      bubbles: true,
      composed: true,
    }));
  }

  private _close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private _renderGeneral() {
    return html`
      <div class="field">
        <label class="field-label">Dashboard Name</label>
        <input type="text" .value=${this.dashboard.name || ''}
          @change=${(e: Event) => this._emit({ name: (e.target as HTMLInputElement).value })} />
      </div>
      <div class="field">
        <label class="field-label">Description</label>
        <textarea .value=${this.dashboard.description || ''}
          @change=${(e: Event) => this._emit({ description: (e.target as HTMLTextAreaElement).value })}></textarea>
      </div>
    `;
  }

  private _renderLayout() {
    const layout = this.dashboard.layout;
    return html`
      <div class="row">
        <div class="field">
          <label class="field-label">Columns</label>
          <input type="number" min="1" max="24" .value=${String(layout.columns ?? 12)}
            @change=${(e: Event) => this._emit({ layout: { ...layout, columns: Number((e.target as HTMLInputElement).value) } })} />
        </div>
        <div class="field">
          <label class="field-label">Row Height</label>
          <input type="number" min="20" max="200" .value=${String(layout.rowHeight ?? 80)}
            @change=${(e: Event) => this._emit({ layout: { ...layout, rowHeight: Number((e.target as HTMLInputElement).value) } })} />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label class="field-label">Gap X</label>
          <input type="number" min="0" max="40" .value=${String(layout.margin?.[0] ?? 16)}
            @change=${(e: Event) => this._emit({ layout: { ...layout, margin: [Number((e.target as HTMLInputElement).value), layout.margin?.[1] ?? 16] } })} />
        </div>
        <div class="field">
          <label class="field-label">Gap Y</label>
          <input type="number" min="0" max="40" .value=${String(layout.margin?.[1] ?? 16)}
            @change=${(e: Event) => this._emit({ layout: { ...layout, margin: [layout.margin?.[0] ?? 16, Number((e.target as HTMLInputElement).value)] } })} />
        </div>
      </div>
    `;
  }

  private _renderTheme() {
    const theme: DashboardTheme = this.dashboard.theme || {};
    return html`
      <div class="field">
        <label class="field-label">Font Family</label>
        <select .value=${theme.fontFamily || 'Inter, system-ui, sans-serif'}
          @change=${(e: Event) => this._emit({ theme: { ...theme, fontFamily: (e.target as HTMLSelectElement).value } })}>
          <option value="Inter, system-ui, sans-serif">Inter</option>
          <option value="'SF Mono', monospace">SF Mono</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="system-ui, sans-serif">System UI</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">Colors</label>
        <div class="color-row">
          <div class="color-field">
            <input type="color" .value=${theme.backgroundColor || '#f5f5f5'}
              @change=${(e: Event) => this._emit({ theme: { ...theme, backgroundColor: (e.target as HTMLInputElement).value } })} />
            <label>Background</label>
          </div>
          <div class="color-field">
            <input type="color" .value=${theme.textColor || '#1a1a1a'}
              @change=${(e: Event) => this._emit({ theme: { ...theme, textColor: (e.target as HTMLInputElement).value } })} />
            <label>Text</label>
          </div>
          <div class="color-field">
            <input type="color" .value=${theme.primaryColor || '#4a90d9'}
              @change=${(e: Event) => this._emit({ theme: { ...theme, primaryColor: (e.target as HTMLInputElement).value } })} />
            <label>Primary</label>
          </div>
          <div class="color-field">
            <input type="color" .value=${theme.accentColor || '#f5a623'}
              @change=${(e: Event) => this._emit({ theme: { ...theme, accentColor: (e.target as HTMLInputElement).value } })} />
            <label>Accent</label>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label class="field-label">Border Radius</label>
          <input type="number" min="0" max="24" .value=${String(theme.borderRadius ?? 8)}
            @change=${(e: Event) => this._emit({ theme: { ...theme, borderRadius: Number((e.target as HTMLInputElement).value) } })} />
        </div>
        <div class="field">
          <label class="field-label">Spacing</label>
          <input type="number" min="0" max="40" .value=${String(theme.spacing ?? 16)}
            @change=${(e: Event) => this._emit({ theme: { ...theme, spacing: Number((e.target as HTMLInputElement).value) } })} />
        </div>
      </div>
    `;
  }

  render() {
    if (!this.dashboard) return html``;
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">Dashboard Settings</span>
          <button class="close-btn" @click=${this._close}>✕</button>
        </div>
        <div class="tabs">
          <button class="tab ${this._tab === 'general' ? 'active' : ''}" @click=${() => this._tab = 'general'}>General</button>
          <button class="tab ${this._tab === 'layout' ? 'active' : ''}" @click=${() => this._tab = 'layout'}>Layout</button>
          <button class="tab ${this._tab === 'theme' ? 'active' : ''}" @click=${() => this._tab = 'theme'}>Theme</button>
        </div>
        <div class="dialog-body">
          ${this._tab === 'general' ? this._renderGeneral() : ''}
          ${this._tab === 'layout' ? this._renderLayout() : ''}
          ${this._tab === 'theme' ? this._renderTheme() : ''}
        </div>
        <div class="dialog-footer">
          <button class="btn" @click=${this._close}>Close</button>
        </div>
      </div>
    `;
  }
}
