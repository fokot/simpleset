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
      background: var(--ed-overlay, rgba(0, 0, 0, 0.45));
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: fade-in 0.2s ease;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slide-up {
      from { opacity: 0; transform: translate(-50%, -46%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    .dialog {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--ed-bg-primary, #ffffff);
      border-radius: var(--ed-radius-lg, 12px);
      border: 1px solid var(--ed-border, #d4d7dd);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
      width: 500px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slide-up 0.25s ease;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      border-bottom: 1px solid var(--ed-border-subtle, #e8eaed);
    }

    .dialog-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--ed-text-primary, #1a1d23);
      letter-spacing: -0.01em;
    }

    .close-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: var(--ed-bg-tertiary, #ebedf0);
      border-radius: var(--ed-radius-sm, 6px);
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--ed-text-secondary, #5f6672);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: var(--ed-bg-secondary, #f4f5f7);
      color: var(--ed-text-primary, #1a1d23);
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--ed-border-subtle, #e8eaed);
      padding: 0 22px;
      gap: 2px;
    }

    .tab {
      padding: 10px 14px;
      border: none;
      background: none;
      font-size: 0.82rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-weight: 500;
      color: var(--ed-text-tertiary, #8c919a);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.15s ease;
    }

    .tab.active {
      color: var(--ed-accent, #0ea5e9);
      border-bottom-color: var(--ed-accent, #0ea5e9);
    }

    .tab:hover:not(.active) {
      color: var(--ed-text-primary, #1a1d23);
    }

    .dialog-body {
      padding: 22px;
      overflow-y: auto;
      flex: 1;
    }

    .field {
      margin-bottom: 14px;
    }

    .field-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--ed-text-secondary, #5f6672);
      margin-bottom: 5px;
    }

    input[type="text"],
    input[type="number"],
    input[type="color"],
    textarea,
    select {
      width: 100%;
      padding: 8px 11px;
      border: 1px solid var(--ed-border, #d4d7dd);
      border-radius: var(--ed-radius-sm, 6px);
      font-size: 0.82rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      box-sizing: border-box;
      background: var(--ed-input-bg, #ffffff);
      color: var(--ed-text-primary, #1a1d23);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: var(--ed-accent, #0ea5e9);
      box-shadow: 0 0 0 2px var(--ed-accent-glow, rgba(14, 165, 233, 0.25));
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
      gap: 12px;
      flex-wrap: wrap;
    }

    .color-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .color-field input[type="color"] {
      width: 40px;
      height: 40px;
      padding: 3px;
      border-radius: var(--ed-radius-md, 8px);
      cursor: pointer;
      border: 2px solid var(--ed-border, #d4d7dd);
      transition: border-color 0.15s ease;
    }

    .color-field input[type="color"]:hover {
      border-color: var(--ed-accent, #0ea5e9);
    }

    .color-field label {
      font-family: 'DM Mono', 'SF Mono', monospace;
      font-size: 0.62rem;
      color: var(--ed-text-tertiary, #8c919a);
      letter-spacing: 0.03em;
    }

    .dialog-footer {
      padding: 14px 22px;
      border-top: 1px solid var(--ed-border-subtle, #e8eaed);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn {
      padding: 8px 18px;
      border-radius: var(--ed-radius-sm, 6px);
      font-size: 0.82rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--ed-border, #d4d7dd);
      background: var(--ed-bg-primary, #ffffff);
      color: var(--ed-text-secondary, #5f6672);
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: var(--ed-bg-tertiary, #ebedf0);
      color: var(--ed-text-primary, #1a1d23);
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
        <select .value=${theme.fontFamily || 'DM Sans, system-ui, sans-serif'}
          @change=${(e: Event) => this._emit({ theme: { ...theme, fontFamily: (e.target as HTMLSelectElement).value } })}>
          <option value="DM Sans, system-ui, sans-serif">DM Sans</option>
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
            <input type="color" .value=${theme.primaryColor || '#0ea5e9'}
              @change=${(e: Event) => this._emit({ theme: { ...theme, primaryColor: (e.target as HTMLInputElement).value } })} />
            <label>Primary</label>
          </div>
          <div class="color-field">
            <input type="color" .value=${theme.accentColor || '#f59e0b'}
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
