import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-widget-toolbar')
export class EditorWidgetToolbar extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      display: flex;
      gap: 4px;
      background: #ffffff;
      border-radius: 8px;
      padding: 4px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
      z-index: 100;
      transform: translateX(-50%);
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #8a8279;
      cursor: pointer;
      transition: all 0.15s;
    }

    button:hover {
      background: #f5f2ed;
      color: #2a2520;
    }

    button.delete:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    button svg {
      width: 14px;
      height: 14px;
    }
  `;

  @property({ type: String }) widgetId = '';

  render() {
    return html`
      <button title="Duplicate" @click=${this._onDuplicate}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      </button>
      <button class="delete" title="Delete" @click=${this._onDelete}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    `;
  }

  private _onDuplicate(): void {
    this.dispatchEvent(new CustomEvent('duplicate-widget', {
      detail: { widgetId: this.widgetId },
      bubbles: true, composed: true,
    }));
  }

  private _onDelete(): void {
    this.dispatchEvent(new CustomEvent('delete-widget', {
      detail: { widgetId: this.widgetId },
      bubbles: true, composed: true,
    }));
  }
}
