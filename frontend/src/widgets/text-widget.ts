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
      box-sizing: border-box;
      overflow: hidden;
    }

    .text-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  `;

  @property({ type: Object })
  config?: TextWidgetConfig;

  @property({ type: Boolean })
  editable = false;

  private _handleInput(e: Event) {
    const target = e.target as HTMLElement;
    this.dispatchEvent(new CustomEvent('text-change', {
      detail: { content: target.innerText },
      bubbles: true,
      composed: true
    }));
  }

  private _handleBlur() {
    this.dispatchEvent(new CustomEvent('edit-blur', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.config) {
      return html`<div>No configuration</div>`;
    }

    const style = `
      font-size: ${this.config.fontSize || 16}px;
      font-weight: ${this.config.fontWeight || 'normal'};
      text-align: ${this.config.textAlign || 'left'};
      color: ${this.config.color || 'inherit'};
      outline: ${this.editable ? '2px dashed #4dabf7' : 'none'};
      cursor: ${this.editable ? 'text' : 'inherit'};
    `;

    return html`
      <div 
        class="text-content" 
        style="${style}"
        ?contenteditable="${this.editable}"
        @input="${this._handleInput}"
        @blur="${this._handleBlur}"
        @mousedown="${(e: Event) => e.stopPropagation()}"
      >
        ${this.config.content}
      </div>
    `;
  }
}
