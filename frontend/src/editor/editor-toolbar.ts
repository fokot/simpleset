import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('editor-toolbar')
export class EditorToolbar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      box-sizing: border-box;
    }

    .toolbar-left {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }

    button {
      padding: 6px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: white;
      color: #666;
      font-size: 0.875rem;
      cursor: not-allowed;
      transition: all 0.2s ease;
    }

    button:disabled {
      opacity: 0.6;
    }
  `;

  render() {
    return html`
      <div class="toolbar-left">Dashboard Editor</div>
      <div class="toolbar-right">
        <button disabled>Save</button>
        <button disabled>Undo</button>
        <button disabled>Redo</button>
      </div>
    `;
  }
}

