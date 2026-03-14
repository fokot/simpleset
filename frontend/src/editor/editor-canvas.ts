import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-canvas')
export class EditorCanvas extends LitElement {
  @property({ type: Number })
  columns = 12;

  @property({ type: Number })
  gap = 16;

  @property({ type: Number })
  cellSize = 80;

  static styles = css`
    :host {
      display: block;
      position: relative;
      min-height: 100%;
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid rgba(0,0,0,0.06);
      box-sizing: border-box;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      --cell-size: 20px;
      --grid-color: #e8e3db;
      background-image:
        linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
        linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
      background-size: var(--cell-size) var(--cell-size);
      background-position: -1px -1px;
    }

    .grid-content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      padding: 20px;
      min-height: 100%;
      box-sizing: border-box;
    }
  `;

  render() {
    return html`
      <div class="grid-content">
        <slot></slot>
      </div>
    `;
  }
}

