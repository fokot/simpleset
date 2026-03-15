import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface GuideLine {
  orientation: 'horizontal' | 'vertical';
  position: number; // grid units
}

@customElement('alignment-guides')
export class AlignmentGuides extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
    }

    .guide-line {
      position: absolute;
      background: rgba(212, 160, 74, 0.5);
    }

    .guide-line.horizontal {
      left: 0;
      right: 0;
      height: 1px;
    }

    .guide-line.vertical {
      top: 0;
      bottom: 0;
      width: 1px;
    }
  `;

  @property({ attribute: false }) guides: GuideLine[] = [];
  @property({ type: Number }) cellWidth = 80;
  @property({ type: Number }) cellHeight = 80;
  @property({ type: Number }) offsetX = 20; // grid padding
  @property({ type: Number }) offsetY = 20;
  @property({ type: Number }) gap = 16;

  render() {
    return html`
      ${this.guides.map(g => {
        if (g.orientation === 'horizontal') {
          const top = this.offsetY + g.position * (this.cellHeight + this.gap);
          return html`<div class="guide-line horizontal" style="top: ${top}px"></div>`;
        } else {
          const left = this.offsetX + g.position * (this.cellWidth + this.gap);
          return html`<div class="guide-line vertical" style="left: ${left}px"></div>`;
        }
      })}
    `;
  }
}
