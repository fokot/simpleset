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
      min-height: 600px;
      background: #ffffff;
      box-sizing: border-box;
    }

    .grid-container {
      min-height: 600px;
      padding: 16px;
      box-sizing: border-box;
      position: relative;
      /* Square grid pattern using CSS background */
      --cell-size: 20px;
      --grid-color: #e0e0e0;
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
      min-height: 568px; /* 600px - 2*16px padding */
    }
  `;

  render() {
    return html`
      <div class="grid-container">
        <div class="grid-content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

