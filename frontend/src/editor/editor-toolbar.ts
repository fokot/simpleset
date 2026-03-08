import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-toolbar')
export class EditorToolbar extends LitElement {
  @property({ type: Boolean, attribute: 'can-undo' })
  canUndo = false;

  @property({ type: Boolean, attribute: 'can-redo' })
  canRedo = false;

  @property({ type: Boolean, attribute: 'is-dirty' })
  isDirty = false;

  @property({ type: String, attribute: 'dashboard-name' })
  dashboardName = 'Untitled Dashboard';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 16px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
      box-sizing: border-box;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dashboard-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .dirty-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f5a623;
      flex-shrink: 0;
    }

    .toolbar-center {
      display: flex;
      gap: 4px;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }

    button {
      padding: 6px 12px;
      border: 1px solid #d8d8d8;
      border-radius: 5px;
      background: white;
      color: #555;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    button:hover:not(:disabled) {
      background: #f5f5f5;
      border-color: #bbb;
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-icon {
      padding: 6px 8px;
    }

    .btn-primary {
      background: #4a90d9;
      color: white;
      border-color: #4a90d9;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3a7fc8;
    }

    .separator {
      width: 1px;
      height: 24px;
      background: #e0e0e0;
      margin: 0 4px;
    }
  `;

  private _emit(action: string) {
    this.dispatchEvent(new CustomEvent('toolbar-action', {
      detail: { action },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="toolbar-left">
        <span class="dashboard-name">${this.dashboardName}</span>
        ${this.isDirty ? html`<span class="dirty-indicator" title="Unsaved changes"></span>` : ''}
      </div>

      <div class="toolbar-center">
        <button class="btn-icon" ?disabled=${!this.canUndo} @click=${() => this._emit('undo')} title="Undo">↩</button>
        <button class="btn-icon" ?disabled=${!this.canRedo} @click=${() => this._emit('redo')} title="Redo">↪</button>
        <div class="separator"></div>
        <button @click=${() => this._emit('settings')} title="Dashboard settings">Settings</button>
        <button @click=${() => this._emit('preview')} title="Preview dashboard">Preview</button>
      </div>

      <div class="toolbar-right">
        <button @click=${() => this._emit('export')}>Export JSON</button>
        <button @click=${() => this._emit('import')}>Import</button>
        <button class="btn-primary" ?disabled=${!this.isDirty} @click=${() => this._emit('save')}>Save</button>
      </div>
    `;
  }
}
