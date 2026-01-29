import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-canvas')
export class EditorCanvas extends LitElement {
  @property({ type: Number })
  columns = 12;

  @property({ type: Number })
  gap = 16;

  static styles = css`
    :host {
      display: block;
      position: relative;
      min-height: 600px;
      background: #ffffff;
      box-sizing: border-box;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      min-height: 600px;
      padding: 16px;
      box-sizing: border-box;
      position: relative;
      background-image: 
        repeating-linear-gradient(
          to right,
          transparent,
          transparent calc((100% - 11 * 16px) / 12 - 1px),
          #e0e0e0 calc((100% - 11 * 16px) / 12 - 1px),
          #e0e0e0 calc((100% - 11 * 16px) / 12),
          transparent calc((100% - 11 * 16px) / 12),
          transparent calc((100% - 11 * 16px) / 12 + 16px)
        );
      background-size: calc((100% - 11 * 16px) / 12 + 16px) 100%;
      background-position: 0 0;
    }

    /* Simpler grid visualization using CSS columns overlay */
    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      padding: 16px;
      box-sizing: border-box;
      pointer-events: none;
    }

    .grid-column {
      background: rgba(33, 150, 243, 0.05);
      border-left: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
    }

    .grid-content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      min-height: 600px;
    }
  `;

  render() {
    return html`
      <div class="grid-container">
        <div class="grid-overlay">
          ${Array.from({ length: this.columns }, () => html`<div class="grid-column"></div>`)}
        </div>
        <div class="grid-content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

