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

  @property({ type: Boolean, attribute: 'dark-mode' })
  darkMode = false;

  @property({ type: String, attribute: 'dashboard-name' })
  dashboardName = 'Untitled Dashboard';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--ed-toolbar-height, 52px);
      padding: 0 18px;
      background: var(--ed-bg-primary, #ffffff);
      border-bottom: 1px solid var(--ed-border, #d4d7dd);
      box-sizing: border-box;
      transition: background-color 0.3s ease, border-color 0.3s ease;
      -webkit-app-region: drag;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      -webkit-app-region: no-drag;
    }

    .logo-mark {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--ed-accent, #0ea5e9), #a78bfa);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-mark svg {
      width: 14px;
      height: 14px;
    }

    .dashboard-name {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--ed-text-primary, #1a1d23);
      letter-spacing: -0.01em;
    }

    .dirty-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--ed-warning, #f59e0b);
      flex-shrink: 0;
      box-shadow: 0 0 6px var(--ed-warning, #f59e0b);
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .toolbar-center {
      display: flex;
      gap: 2px;
      -webkit-app-region: no-drag;
    }

    .toolbar-right {
      display: flex;
      gap: 6px;
      align-items: center;
      -webkit-app-region: no-drag;
    }

    button {
      padding: 6px 12px;
      border: 1px solid var(--ed-border, #d4d7dd);
      border-radius: var(--ed-radius-sm, 6px);
      background: var(--ed-bg-primary, #ffffff);
      color: var(--ed-text-secondary, #5f6672);
      font-size: 0.78rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      background: var(--ed-bg-tertiary, #ebedf0);
      border-color: var(--ed-text-muted, #adb1b8);
      color: var(--ed-text-primary, #1a1d23);
    }

    button:active:not(:disabled) {
      transform: scale(0.97);
    }

    button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn-icon {
      padding: 6px 9px;
      font-size: 0.85rem;
      min-width: 30px;
      justify-content: center;
    }

    .btn-primary {
      background: var(--ed-accent, #0ea5e9);
      color: white;
      border-color: var(--ed-accent, #0ea5e9);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--ed-accent-hover, #0284c7);
      border-color: var(--ed-accent-hover, #0284c7);
      color: white;
    }

    .btn-ghost {
      border-color: transparent;
      background: transparent;
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--ed-bg-tertiary, #ebedf0);
      border-color: transparent;
    }

    .separator {
      width: 1px;
      height: 20px;
      background: var(--ed-border, #d4d7dd);
      margin: 0 6px;
      transition: background-color 0.3s ease;
    }

    .theme-toggle {
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--ed-border, #d4d7dd);
      border-radius: var(--ed-radius-sm, 6px);
      background: var(--ed-bg-primary, #ffffff);
      color: var(--ed-text-secondary, #5f6672);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .theme-toggle:hover {
      background: var(--ed-bg-tertiary, #ebedf0);
      color: var(--ed-text-primary, #1a1d23);
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
        <div class="logo-mark">
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
            <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
            <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
            <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <span class="dashboard-name">${this.dashboardName}</span>
        ${this.isDirty ? html`<span class="dirty-indicator" title="Unsaved changes"></span>` : ''}
      </div>

      <div class="toolbar-center">
        <button class="btn-icon btn-ghost" ?disabled=${!this.canUndo} @click=${() => this._emit('undo')} title="Undo (Cmd+Z)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
        <button class="btn-icon btn-ghost" ?disabled=${!this.canRedo} @click=${() => this._emit('redo')} title="Redo (Cmd+Shift+Z)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <div class="separator"></div>
        <button class="btn-ghost" @click=${() => this._emit('settings')} title="Dashboard settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </button>
        <button class="btn-ghost" @click=${() => this._emit('preview')} title="Preview dashboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Preview
        </button>
      </div>

      <div class="toolbar-right">
        <button class="btn-ghost" @click=${() => this._emit('export')} title="Export JSON">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button class="btn-ghost" @click=${() => this._emit('import')} title="Import JSON">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
        </button>
        <div class="separator"></div>
        <button class="theme-toggle" @click=${() => this._emit('toggle-dark')} title="Toggle dark mode">
          ${this.darkMode ? html`
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ` : html`
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          `}
        </button>
        <button class="btn-primary" ?disabled=${!this.isDirty} @click=${() => this._emit('save')}>Save</button>
      </div>
    `;
  }
}
