import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { WidgetType } from '../types/dashboard-types.js';

export interface WidgetPaletteItem {
  type: WidgetType;
  label: string;
  icon: string;
  description: string;
  category: 'data' | 'content' | 'interactive';
}

const PALETTE_ITEMS: WidgetPaletteItem[] = [
  { type: 'chart', label: 'Chart', icon: '📊', description: 'Bar, line, pie charts', category: 'data' },
  { type: 'metric', label: 'Metric', icon: '🔢', description: 'KPI with trend', category: 'data' },
  { type: 'table', label: 'Table', icon: '📋', description: 'Data table with sorting', category: 'data' },
  { type: 'text', label: 'Text', icon: 'Aa', description: 'Plain text block', category: 'content' },
  { type: 'markdown', label: 'Markdown', icon: 'M↓', description: 'Rich markdown content', category: 'content' },
  { type: 'image', label: 'Image', icon: '🖼', description: 'Image from URL', category: 'content' },
  { type: 'iframe', label: 'Embed', icon: '⧉', description: 'Embedded iframe', category: 'content' },
  { type: 'filter', label: 'Filter', icon: '⏚', description: 'Interactive filter', category: 'data' },
];

const CATEGORIES = [
  { key: 'data', label: 'Data' },
  { key: 'content', label: 'Content' },
];

@customElement('widget-palette')
export class WidgetPalette extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .category-label {
      font-family: 'DM Mono', 'SF Mono', monospace;
      font-size: 0.62rem;
      font-weight: 500;
      color: var(--ed-text-tertiary, #8c919a);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 18px 0 8px 0;
    }

    .category-label:first-child {
      margin-top: 0;
    }

    .palette-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: 1px solid var(--ed-border-subtle, #e8eaed);
      border-radius: var(--ed-radius-sm, 6px);
      background: var(--ed-bg-secondary, #f4f5f7);
      cursor: grab;
      margin-bottom: 5px;
      transition: all 0.18s ease;
      user-select: none;
    }

    .palette-item:hover {
      border-color: var(--ed-accent, #0ea5e9);
      background: var(--ed-accent-subtle, rgba(14, 165, 233, 0.1));
      box-shadow: 0 0 0 1px var(--ed-accent-subtle, rgba(14, 165, 233, 0.1));
      transform: translateX(2px);
    }

    .palette-item:active {
      cursor: grabbing;
      transform: scale(0.97);
    }

    .palette-item-icon {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ed-bg-primary, #ffffff);
      border-radius: var(--ed-radius-sm, 6px);
      border: 1px solid var(--ed-border-subtle, #e8eaed);
      font-size: 0.9rem;
      flex-shrink: 0;
      transition: all 0.18s ease;
    }

    .palette-item:hover .palette-item-icon {
      border-color: var(--ed-accent, #0ea5e9);
    }

    .palette-item-info {
      flex: 1;
      min-width: 0;
    }

    .palette-item-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--ed-text-primary, #1a1d23);
      letter-spacing: -0.01em;
    }

    .palette-item-desc {
      font-size: 0.68rem;
      color: var(--ed-text-tertiary, #8c919a);
      margin-top: 1px;
    }
  `;

  private _handleDragStart(e: DragEvent, item: WidgetPaletteItem) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('application/widget-type', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  }

  private _handleClick(item: WidgetPaletteItem) {
    this.dispatchEvent(new CustomEvent('widget-add', {
      detail: { type: item.type },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      ${CATEGORIES.map(cat => {
        const items = PALETTE_ITEMS.filter(i => i.category === cat.key);
        return html`
          <div class="category-label">${cat.label}</div>
          ${items.map(item => html`
            <div
              class="palette-item"
              draggable="true"
              @dragstart=${(e: DragEvent) => this._handleDragStart(e, item)}
              @click=${() => this._handleClick(item)}
            >
              <div class="palette-item-icon">${item.icon}</div>
              <div class="palette-item-info">
                <div class="palette-item-label">${item.label}</div>
                <div class="palette-item-desc">${item.description}</div>
              </div>
            </div>
          `)}
        `;
      })}
    `;
  }
}
