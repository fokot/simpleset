import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { WidgetType } from '../types/dashboard-types.js';
import { WIDGET_DEFAULTS } from './widget-defaults.js';

@customElement('editor-widget-palette')
export class EditorWidgetPalette extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .palette-section {
      padding: 20px;
    }

    .palette-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted, #8a8279);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }

    .widget-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .widget-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--cream, #f5f2ed);
      cursor: grab;
      transition: all 0.2s;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--charcoal, #2a2520);
      user-select: none;
      -webkit-user-select: none;
    }

    .widget-item:hover {
      background: var(--amber-glow, rgba(212, 160, 74, 0.15));
    }

    .widget-item:active {
      cursor: grabbing;
    }

    .widget-item[data-dragging] {
      opacity: 0.5;
    }

    .widget-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .widget-icon svg {
      width: 16px;
      height: 16px;
    }

    .widget-icon.chart { background: linear-gradient(135deg, #e3f2fd, #bbdefb); color: #1565c0; }
    .widget-icon.table { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); color: #2e7d32; }
    .widget-icon.metric { background: linear-gradient(135deg, #fff3e0, #ffe0b2); color: #e65100; }
    .widget-icon.text { background: linear-gradient(135deg, #f3e5f5, #e1bee7); color: #7b1fa2; }
    .widget-icon.image { background: linear-gradient(135deg, #fce4ec, #f8bbd0); color: #c62828; }
    .widget-icon.iframe { background: linear-gradient(135deg, #e0f7fa, #b2ebf2); color: #00838f; }
    .widget-icon.filter { background: linear-gradient(135deg, #f1f8e9, #dcedc8); color: #558b2f; }
    .widget-icon.markdown { background: linear-gradient(135deg, #efebe9, #d7ccc8); color: #4e342e; }
  `;

  private _icons: Record<string, () => TemplateResult> = {
    chart: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    table: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
    metric: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
    text: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
    image: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    iframe: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    filter: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    markdown: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M7 15V9l2 3 2-3v6"/><path d="M17 12l-2 3h-1l-2-3"/></svg>`,
  };

  private _allTypes: WidgetType[] = ['chart', 'table', 'metric', 'text', 'image', 'iframe', 'filter', 'markdown'];

  render() {
    return html`
      <div class="palette-section">
        <div class="palette-title">Widgets</div>
        <div class="widget-list">
          ${this._allTypes.map(type => {
            const info = WIDGET_DEFAULTS[type];
            return html`
              <div class="widget-item"
                   data-widget-type="${type}"
                   draggable="true"
                   @dragstart=${(e: DragEvent) => this._onDragStart(e, type)}>
                <div class="widget-icon ${type}">${this._icons[type]()}</div>
                ${info.label}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private _onDragStart(e: DragEvent, type: WidgetType): void {
    if (!e.dataTransfer) return;
    const info = WIDGET_DEFAULTS[type];
    e.dataTransfer.setData('application/widget-type', type);
    e.dataTransfer.setData('application/widget-width', String(info.defaultSize.width));
    e.dataTransfer.setData('application/widget-height', String(info.defaultSize.height));
    e.dataTransfer.effectAllowed = 'copy';
  }
}
