import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-toolbar')
export class EditorToolbar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 20px;
      background: #ffffff;
      border-bottom: 1px solid #e8e3db;
      box-sizing: border-box;
      flex-shrink: 0;
      position: relative;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }

    .toolbar-title {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      color: #2a2520;
      letter-spacing: -0.01em;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 4px 8px;
      background: transparent;
      outline: none;
      min-width: 120px;
      max-width: 280px;
      transition: all 0.2s;
    }

    .toolbar-title:hover {
      border-color: #e8e3db;
      background: #f5f2ed;
    }

    .toolbar-title:focus {
      border-color: #d4a04a;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(212, 160, 74, 0.15);
    }

    .toolbar-badge {
      font-family: 'Source Code Pro', monospace;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 5px;
      background: rgba(212, 160, 74, 0.15);
      color: #a07830;
      flex-shrink: 0;
    }

    .toolbar-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 2px;
      background: #f5f2ed;
      border-radius: 8px;
      padding: 3px;
    }

    .tool-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #8a8279;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tool-btn:hover:not(:disabled) {
      background: #e8e3db;
      color: #2a2520;
    }

    .tool-btn[data-active] {
      background: #ffffff;
      color: #2a2520;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .tool-btn:disabled {
      opacity: 0.35;
      cursor: default;
    }

    .tool-btn svg {
      width: 16px;
      height: 16px;
    }

    .divider-h {
      width: 1px;
      height: 20px;
      background: #e8e3db;
      margin: 6px 2px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-primary {
      padding: 6px 16px;
      border: none;
      border-radius: 8px;
      background: #2a2520;
      color: #ffffff;
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: not-allowed;
      transition: all 0.2s;
    }

    .btn-primary:disabled {
      opacity: 0.4;
    }
  `;

  @property({ type: String }) dashboardName = 'Untitled Dashboard';
  @property({ type: Boolean }) canUndo = false;
  @property({ type: Boolean }) canRedo = false;

  private _onNameInput(e: Event) {
    this.dashboardName = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('name-change', {
      detail: this.dashboardName,
      bubbles: true, composed: true,
    }));
  }

  private _onUndo() {
    this.dispatchEvent(new CustomEvent('undo', { bubbles: true, composed: true }));
  }

  private _onRedo() {
    this.dispatchEvent(new CustomEvent('redo', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="toolbar-left">
        <input class="toolbar-title"
          .value=${this.dashboardName}
          @input=${this._onNameInput}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="Dashboard name" />
        <span class="toolbar-badge">Draft</span>
      </div>
      <div class="toolbar-center">
        <button class="tool-btn" ?disabled=${!this.canUndo} title="Undo (Ctrl+Z)" @click=${this._onUndo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <button class="tool-btn" ?disabled=${!this.canRedo} title="Redo (Ctrl+Shift+Z)" @click=${this._onRedo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
        </button>
        <div class="divider-h"></div>
        <button class="tool-btn" data-active title="Select">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
        </button>
      </div>
      <div class="toolbar-right">
        <button class="btn-primary" disabled>Save</button>
      </div>
    `;
  }
}
