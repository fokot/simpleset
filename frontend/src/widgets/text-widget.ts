import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TextWidgetConfig } from '../types/dashboard-types.js';

@customElement('text-widget')
export class TextWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .text-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 16px;
      overflow: auto;
    }

    .text-content {
      width: 100%;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  `;

  @property({ type: Object })
  config!: TextWidgetConfig;

  render() {
    if (!this.config) {
      return html`
        <div class="text-container">
          <div class="text-content">No configuration provided</div>
        </div>
      `;
    }

    const fontSize = this.config.fontSize || 16;
    const fontWeight = this.config.fontWeight || 'normal';
    const textAlign = this.config.textAlign || 'left';
    const color = this.config.color || '#1a1a1a';
    const content = this.config.content || '';

    return html`
      <div class="text-container">
        <div 
          class="text-content"
          style="
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            text-align: ${textAlign};
            color: ${color};
          "
        >
          ${content}
        </div>
      </div>
    `;
  }
}

