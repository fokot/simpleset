import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DashboardWidget, WidgetType } from '../types/dashboard-types.js';
import interact from 'interactjs';

@customElement('editor-canvas')
export class EditorCanvas extends LitElement {
  @property({ type: Number })
  columns = 12;

  @property({ type: Number })
  gap = 16;

  @property({ type: Array })
  widgets: DashboardWidget[] = [];

  @property({ type: String, attribute: 'selected-widget-id' })
  selectedWidgetId: string | null = null;

  @state()
  private _dropIndicator: { x: number; y: number; width: number; height: number } | null = null;

  private _dragState: { widgetId: string; dx: number; dy: number } | null = null;
  private _resizeState: { widgetId: string; dw: number; dh: number } | null = null;

  private _interactables: any[] = [];
  private _resizeObserver?: ResizeObserver;
  private _canvasWidth = 0;
  private _prevWidgetIds = '';

  static styles = css`
    :host {
      display: block;
      position: relative;
      min-height: 100%;
      background: var(--ed-widget-bg, #ffffff);
      box-sizing: border-box;
      border-radius: var(--ed-radius-md, 8px);
      transition: background-color 0.3s ease;

      /* Dot grid pattern */
      --dot-size: 1px;
      --dot-space: 24px;
      --dot-color: var(--ed-border, #d4d7dd);
      background-image: radial-gradient(circle, var(--dot-color) var(--dot-size), transparent var(--dot-size));
      background-size: var(--dot-space) var(--dot-space);
      background-position: calc(var(--dot-space) / 2) calc(var(--dot-space) / 2);
    }

    .grid-content {
      position: relative;
      padding: 16px;
      min-height: 600px;
    }

    .widget-wrapper {
      position: absolute;
      box-sizing: border-box;
      border: 1.5px solid var(--ed-border-subtle, #e8eaed);
      border-radius: var(--ed-radius-md, 8px);
      background: var(--ed-widget-bg, #ffffff);
      box-shadow: var(--ed-widget-shadow, 0 1px 3px rgba(0,0,0,0.06));
      cursor: pointer;
      touch-action: none;
      overflow: hidden;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .widget-wrapper:hover {
      border-color: var(--ed-accent, #0ea5e9);
      box-shadow: var(--ed-widget-shadow-hover, 0 4px 12px rgba(0,0,0,0.08));
    }

    .widget-wrapper.selected {
      border-color: var(--ed-accent, #0ea5e9);
      box-shadow: 0 0 0 2px var(--ed-accent-glow, rgba(14, 165, 233, 0.25)),
                  var(--ed-widget-shadow-hover, 0 4px 12px rgba(0,0,0,0.08));
    }

    .widget-wrapper.dragging {
      opacity: 0.85;
      z-index: 100;
      cursor: grabbing;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }

    .widget-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: var(--ed-bg-secondary, #f4f5f7);
      border-bottom: 1px solid var(--ed-border-subtle, #e8eaed);
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--ed-text-secondary, #5f6672);
      cursor: grab;
      transition: background-color 0.15s ease;
    }

    .widget-header-bar:active {
      cursor: grabbing;
    }

    .widget-type-badge {
      font-family: 'DM Mono', 'SF Mono', monospace;
      font-size: 0.6rem;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--ed-bg-tertiary, #ebedf0);
      color: var(--ed-text-tertiary, #8c919a);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .widget-actions {
      display: flex;
      gap: 3px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .widget-wrapper:hover .widget-actions,
    .widget-wrapper.selected .widget-actions {
      opacity: 1;
    }

    .widget-action-btn {
      width: 22px;
      height: 22px;
      border: none;
      background: var(--ed-bg-tertiary, #ebedf0);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: var(--ed-text-secondary, #5f6672);
      padding: 0;
      transition: all 0.12s ease;
    }

    .widget-action-btn:hover {
      background: var(--ed-accent-subtle, rgba(14, 165, 233, 0.1));
      color: var(--ed-accent, #0ea5e9);
    }

    .widget-action-btn.delete:hover {
      background: var(--ed-danger-bg, #fef2f2);
      color: var(--ed-danger, #ef4444);
    }

    .widget-body {
      padding: 10px;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ed-text-muted, #adb1b8);
      font-size: 0.8rem;
      min-height: 40px;
    }

    .resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 18px;
      height: 18px;
      cursor: nwse-resize;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .widget-wrapper:hover .resize-handle,
    .widget-wrapper.selected .resize-handle {
      opacity: 1;
    }

    .resize-handle::after {
      content: '';
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      border-right: 2px solid var(--ed-accent, #0ea5e9);
      border-bottom: 2px solid var(--ed-accent, #0ea5e9);
      opacity: 0.6;
    }

    .drop-indicator {
      position: absolute;
      background: var(--ed-accent-subtle, rgba(14, 165, 233, 0.1));
      border: 2px dashed var(--ed-accent, #0ea5e9);
      border-radius: var(--ed-radius-md, 8px);
      pointer-events: none;
      z-index: 50;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      color: var(--ed-text-muted, #adb1b8);
      gap: 10px;
    }

    .empty-state-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--ed-radius-lg, 12px);
      background: var(--ed-bg-secondary, #f4f5f7);
      border: 2px dashed var(--ed-border, #d4d7dd);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: var(--ed-text-tertiary, #8c919a);
      transition: all 0.3s ease;
    }

    .empty-state:hover .empty-state-icon {
      border-color: var(--ed-accent, #0ea5e9);
      color: var(--ed-accent, #0ea5e9);
    }

    .empty-state-text {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--ed-text-secondary, #5f6672);
    }

    .empty-state-hint {
      font-family: 'DM Mono', 'SF Mono', monospace;
      font-size: 0.72rem;
      color: var(--ed-text-muted, #adb1b8);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this._canvasWidth = entry.contentRect.width - 32;
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._cleanupInteract();
  }

  protected firstUpdated() {
    const el = this.renderRoot.querySelector('.grid-content');
    if (el) {
      this._resizeObserver?.observe(el);
      this._canvasWidth = el.clientWidth - 32;
    }
  }

  protected updated(changedProperties: PropertyValues) {
    if (this._dragState || this._resizeState) return;

    if (changedProperties.has('widgets')) {
      const newIds = this.widgets.map(w => w.id).join(',');
      if (newIds !== this._prevWidgetIds) {
        this._prevWidgetIds = newIds;
        requestAnimationFrame(() => this._setupInteract());
      }
    }
  }

  private get _colWidth(): number {
    if (this._canvasWidth <= 0) return 80;
    return (this._canvasWidth - (this.columns - 1) * this.gap) / this.columns;
  }

  private get _rowHeight(): number {
    return 80;
  }

  private _gridToPixel(x: number, y: number, w: number, h: number) {
    const colW = this._colWidth;
    const rowH = this._rowHeight;
    return {
      left: x * (colW + this.gap),
      top: y * (rowH + this.gap),
      width: w * colW + (w - 1) * this.gap,
      height: h * rowH + (h - 1) * this.gap,
    };
  }

  private _pixelToGrid(px: number, py: number): { x: number; y: number } {
    const colW = this._colWidth + this.gap;
    const rowH = this._rowHeight + this.gap;
    return {
      x: Math.max(0, Math.round(px / colW)),
      y: Math.max(0, Math.round(py / rowH)),
    };
  }

  private _pixelToGridSize(pw: number, ph: number): { width: number; height: number } {
    const colW = this._colWidth + this.gap;
    const rowH = this._rowHeight + this.gap;
    return {
      width: Math.max(1, Math.round((pw + this.gap) / colW)),
      height: Math.max(1, Math.round((ph + this.gap) / rowH)),
    };
  }

  private _cleanupInteract() {
    this._interactables.forEach(i => i.unset());
    this._interactables = [];
  }

  private _setupInteract() {
    this._cleanupInteract();

    const wrappers = this.renderRoot.querySelectorAll('.widget-wrapper');
    wrappers.forEach(el => {
      const widgetId = (el as HTMLElement).dataset.widgetId;
      if (!widgetId) return;

      const widget = this.widgets.find(w => w.id === widgetId);
      if (!widget) return;

      const interactable = interact(el as HTMLElement)
        .draggable({
          allowFrom: '.widget-header-bar',
          modifiers: [
            interact.modifiers.restrict({
              restriction: 'parent',
            }),
          ],
          listeners: {
            start: () => {
              this._dragState = { widgetId, dx: 0, dy: 0 };
              this._selectWidget(widgetId);
            },
            move: (event: any) => {
              if (!this._dragState) return;
              this._dragState = {
                widgetId,
                dx: this._dragState.dx + event.dx,
                dy: this._dragState.dy + event.dy,
              };
              const target = event.target as HTMLElement;
              target.style.transform = `translate(${this._dragState.dx}px, ${this._dragState.dy}px)`;
              target.classList.add('dragging');
            },
            end: (event: any) => {
              if (!this._dragState) return;
              const target = event.target as HTMLElement;
              target.style.transform = '';
              target.classList.remove('dragging');

              const pos = this._gridToPixel(widget.position.x, widget.position.y, widget.position.width, widget.position.height);
              const newPixelX = pos.left + this._dragState.dx;
              const newPixelY = pos.top + this._dragState.dy;
              const gridPos = this._pixelToGrid(newPixelX, newPixelY);

              const maxX = this.columns - widget.position.width;
              gridPos.x = Math.max(0, Math.min(gridPos.x, maxX));
              gridPos.y = Math.max(0, gridPos.y);

              this._dragState = null;

              this.dispatchEvent(new CustomEvent('widget-move', {
                detail: { widgetId, x: gridPos.x, y: gridPos.y },
                bubbles: true,
                composed: true,
              }));
            },
          },
        })
        .resizable({
          edges: { bottom: '.resize-handle', right: '.resize-handle' },
          modifiers: [
            interact.modifiers.restrictSize({
              min: {
                width: (widget.position.minWidth ?? 1) * this._colWidth + ((widget.position.minWidth ?? 1) - 1) * this.gap,
                height: (widget.position.minHeight ?? 1) * this._rowHeight + ((widget.position.minHeight ?? 1) - 1) * this.gap,
              },
            }),
          ],
          listeners: {
            start: () => {
              this._resizeState = { widgetId, dw: 0, dh: 0 };
            },
            move: (event: any) => {
              const target = event.target as HTMLElement;
              target.style.width = `${event.rect.width}px`;
              target.style.height = `${event.rect.height}px`;
            },
            end: (event: any) => {
              const newSize = this._pixelToGridSize(event.rect.width, event.rect.height);
              const maxWidth = this.columns - widget.position.x;
              newSize.width = Math.min(newSize.width, maxWidth);

              this._resizeState = null;

              this.dispatchEvent(new CustomEvent('widget-resize', {
                detail: { widgetId, width: newSize.width, height: newSize.height },
                bubbles: true,
                composed: true,
              }));
            },
          },
        });

      this._interactables.push(interactable);
    });
  }

  private _handleDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('application/widget-type')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const rect = (this.renderRoot.querySelector('.grid-content') as HTMLElement).getBoundingClientRect();
    const gridPos = this._pixelToGrid(e.clientX - rect.left - 16, e.clientY - rect.top - 16);
    const dropW = 4;
    const dropH = 2;
    gridPos.x = Math.max(0, Math.min(gridPos.x, this.columns - dropW));
    const px = this._gridToPixel(gridPos.x, gridPos.y, dropW, dropH);
    this._dropIndicator = { x: px.left, y: px.top, width: px.width, height: px.height };
  }

  private _handleDragLeave(e: DragEvent) {
    const rect = this.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      this._dropIndicator = null;
    }
  }

  private _handleDrop(e: DragEvent) {
    e.preventDefault();
    this._dropIndicator = null;

    const widgetType = e.dataTransfer?.getData('application/widget-type') as WidgetType | undefined;
    if (!widgetType) return;

    const rect = (this.renderRoot.querySelector('.grid-content') as HTMLElement).getBoundingClientRect();
    const gridPos = this._pixelToGrid(e.clientX - rect.left - 16, e.clientY - rect.top - 16);

    this.dispatchEvent(new CustomEvent('widget-drop', {
      detail: { type: widgetType, x: gridPos.x, y: gridPos.y },
      bubbles: true,
      composed: true,
    }));
  }

  private _selectWidget(widgetId: string) {
    this.dispatchEvent(new CustomEvent('widget-select', {
      detail: { widgetId },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleCanvasClick(e: Event) {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('grid-content')) {
      this.dispatchEvent(new CustomEvent('widget-select', {
        detail: { widgetId: null },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private _handleDuplicate(e: Event, widgetId: string) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('widget-duplicate', {
      detail: { widgetId },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleDelete(e: Event, widgetId: string) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('widget-delete', {
      detail: { widgetId },
      bubbles: true,
      composed: true,
    }));
  }

  private _renderWidgetPreview(widget: DashboardWidget) {
    const type = widget.config.type;
    switch (type) {
      case 'chart':
        return html`<span style="font-size:1.5rem;opacity:0.4">📊</span>`;
      case 'metric':
        return html`<span style="font-size:1.2rem;color:var(--ed-text-secondary);font-weight:600">${(widget.config as any).config?.value ?? '—'}</span>`;
      case 'table':
        return html`<span style="font-size:1.5rem;opacity:0.4">📋</span>`;
      case 'text':
        return html`<span style="font-size:0.75rem;color:var(--ed-text-tertiary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(widget.config as any).config?.content ?? 'Text'}</span>`;
      case 'markdown':
        return html`<span style="font-size:0.75rem;color:var(--ed-text-tertiary)">Markdown</span>`;
      case 'image':
        return html`<span style="font-size:1.5rem;opacity:0.4">🖼</span>`;
      case 'iframe':
        return html`<span style="font-size:1.5rem;opacity:0.4">⧉</span>`;
      case 'filter':
        return html`<span style="font-size:0.75rem;color:var(--ed-text-tertiary)">${(widget.config as any).config?.label ?? 'Filter'}</span>`;
      default:
        return html`<span>${type}</span>`;
    }
  }

  private _renderWidget(widget: DashboardWidget) {
    const isSelected = widget.id === this.selectedWidgetId;
    const pos = this._gridToPixel(widget.position.x, widget.position.y, widget.position.width, widget.position.height);

    return html`
      <div
        class="widget-wrapper ${isSelected ? 'selected' : ''}"
        data-widget-id="${widget.id}"
        style="left:${pos.left}px;top:${pos.top}px;width:${pos.width}px;height:${pos.height}px;"
        @click=${(e: Event) => { e.stopPropagation(); this._selectWidget(widget.id); }}
      >
        <div class="widget-header-bar">
          <span>${widget.title || widget.id}</span>
          <div class="widget-actions">
            <button class="widget-action-btn" title="Duplicate" @click=${(e: Event) => this._handleDuplicate(e, widget.id)}>⧉</button>
            <button class="widget-action-btn delete" title="Delete" @click=${(e: Event) => this._handleDelete(e, widget.id)}>✕</button>
          </div>
        </div>
        <div class="widget-body">
          ${this._renderWidgetPreview(widget)}
        </div>
        <span class="widget-type-badge" style="position:absolute;bottom:4px;left:8px">${widget.config.type}</span>
        <div class="resize-handle"></div>
      </div>
    `;
  }

  render() {
    return html`
      <div
        class="grid-content"
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${this._handleDrop}
        @click=${this._handleCanvasClick}
      >
        ${this.widgets.length === 0 && !this._dropIndicator ? html`
          <div class="empty-state">
            <div class="empty-state-icon">+</div>
            <div class="empty-state-text">Drag a widget from the palette or click to add</div>
            <div class="empty-state-hint">${this.columns}-column grid layout</div>
          </div>
        ` : ''}

        ${this.widgets.map(w => this._renderWidget(w))}

        ${this._dropIndicator ? html`
          <div class="drop-indicator" style="left:${this._dropIndicator.x}px;top:${this._dropIndicator.y}px;width:${this._dropIndicator.width}px;height:${this._dropIndicator.height}px;"></div>
        ` : ''}
      </div>
    `;
  }
}
