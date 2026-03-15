import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { DashboardWidget, WidgetType } from '../types/dashboard-types.js';
import { OccupancyMap } from './occupancy-map.js';
import { GuideLine } from './alignment-guides.js';
import './alignment-guides.js';
import './editor-widget-toolbar.js';

@customElement('editor-canvas')
export class EditorCanvas extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) gap = 16;
  @property({ attribute: false }) widgets: readonly DashboardWidget[] = [];
  @property({ attribute: false }) selectedIds: ReadonlySet<string> = new Set();
  @property({ attribute: false }) occupancy!: OccupancyMap;

  @state() private _dragPreview: { x: number; y: number; width: number; height: number; valid: boolean } | null = null;
  @state() private _guides: GuideLine[] = [];
  @state() private _draggingWidgetId: string | null = null;
  @state() private _resizingWidgetId: string | null = null;
  @state() private _dragOffsets: Map<string, { dx: number; dy: number }> = new Map();

  @query('.grid-content') private _gridEl!: HTMLElement;

  private _cellWidth = 0;
  private _cellHeight = 80;
  private _gridRect: DOMRect | null = null;
  private _dragStartPos: { x: number; y: number } | null = null;
  private _resizeStartPos: { x: number; y: number; w: number; h: number } | null = null;
  private _resizeHandle: string = '';

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
      min-height: 600px;
      box-sizing: border-box;
    }

    .widget-cell {
      position: relative;
      border-radius: 10px;
      background: var(--surface, #ffffff);
      border: 2px solid transparent;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
      user-select: none;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .widget-cell:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .widget-cell.selected {
      border-color: #d4a04a;
      box-shadow: 0 0 0 3px rgba(212, 160, 74, 0.2);
    }

    .widget-cell.dragging {
      opacity: 0.4;
    }

    .widget-cell.conflict {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }

    .widget-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted, #8a8279);
      text-transform: capitalize;
      pointer-events: none;
    }

    .widget-title {
      font-size: 0.7rem;
      color: var(--text-dim, #b5ada4);
      margin-top: 2px;
      pointer-events: none;
    }

    .widget-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }

    .resize-handle {
      position: absolute;
      z-index: 10;
    }

    .resize-handle.se {
      right: -4px;
      bottom: -4px;
      width: 12px;
      height: 12px;
      cursor: se-resize;
      border-radius: 0 0 6px 0;
    }

    .resize-handle.e {
      right: -4px;
      top: 20%;
      bottom: 20%;
      width: 8px;
      cursor: e-resize;
    }

    .resize-handle.s {
      bottom: -4px;
      left: 20%;
      right: 20%;
      height: 8px;
      cursor: s-resize;
    }

    .resize-handle:hover {
      background: rgba(212, 160, 74, 0.3);
      border-radius: 4px;
    }

    .drag-preview {
      position: absolute;
      border: 2px dashed;
      border-radius: 10px;
      pointer-events: none;
      z-index: 20;
      transition: left 0.08s, top 0.08s, width 0.08s, height 0.08s;
    }

    .drag-preview.valid {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.08);
    }

    .drag-preview.invalid {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.08);
    }

    editor-widget-toolbar {
      position: absolute;
      top: -40px;
      left: 50%;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('dragleave', this._onDragLeave);
    this.addEventListener('drop', this._onDrop);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dragover', this._onDragOver);
    this.removeEventListener('dragleave', this._onDragLeave);
    this.removeEventListener('drop', this._onDrop);
  }

  private _measureGrid(): void {
    if (!this._gridEl) return;
    this._gridRect = this._gridEl.getBoundingClientRect();
    const totalGap = this.gap * (this.columns - 1);
    const padding = 40; // 20px each side
    this._cellWidth = (this._gridRect.width - padding - totalGap) / this.columns;
  }

  private _pixelToGrid(px: number, py: number): { col: number; row: number } {
    if (!this._gridRect) this._measureGrid();
    if (!this._gridRect) return { col: 0, row: 0 };
    const relX = px - this._gridRect.left - 20; // subtract padding
    const relY = py - this._gridRect.top - 20;
    const col = Math.round(relX / (this._cellWidth + this.gap));
    const row = Math.round(relY / (this._cellHeight + this.gap));
    return {
      col: Math.max(0, Math.min(col, this.columns - 1)),
      row: Math.max(0, row),
    };
  }

  private _gridToPixel(col: number, row: number): { x: number; y: number } {
    return {
      x: 20 + col * (this._cellWidth + this.gap),
      y: 20 + row * (this._cellHeight + this.gap),
    };
  }

  // --- Drag from palette ---
  private _onDragOver = (e: DragEvent): void => {
    if (!e.dataTransfer?.types.includes('application/widget-type')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    this._measureGrid();
    const { col, row } = this._pixelToGrid(e.clientX, e.clientY);
    const width = Number(e.dataTransfer.getData('application/widget-width') || '3');
    const height = Number(e.dataTransfer.getData('application/widget-height') || '2');

    // For dragover we can't read data, use stored or default
    const valid = this.occupancy?.isValidPosition(col, row, width || 3, height || 2) ?? true;
    this._dragPreview = { x: col, y: row, width: width || 3, height: height || 2, valid };
  };

  private _onDragLeave = (e: DragEvent): void => {
    // Only clear if leaving the canvas entirely
    const related = e.relatedTarget as Node | null;
    if (related && this.contains(related)) return;
    this._dragPreview = null;
  };

  private _onDrop = (e: DragEvent): void => {
    e.preventDefault();
    const type = e.dataTransfer?.getData('application/widget-type') as WidgetType | undefined;
    if (!type) return;

    this._measureGrid();
    const { col, row } = this._pixelToGrid(e.clientX, e.clientY);
    const width = Number(e.dataTransfer?.getData('application/widget-width') || '3');
    const height = Number(e.dataTransfer?.getData('application/widget-height') || '2');

    this._dragPreview = null;

    if (!this.occupancy?.isValidPosition(col, row, width, height)) return;

    this.dispatchEvent(new CustomEvent('add-widget', {
      detail: { type, x: col, y: row, width, height },
      bubbles: true, composed: true,
    }));
  };

  // --- Widget click (selection) ---
  private _onWidgetClick(e: MouseEvent, widgetId: string): void {
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey) {
      this.dispatchEvent(new CustomEvent('toggle-select', { detail: { widgetId }, bubbles: true, composed: true }));
    } else {
      this.dispatchEvent(new CustomEvent('select-widget', { detail: { widgetId }, bubbles: true, composed: true }));
    }
  }

  private _onCanvasClick(e: MouseEvent): void {
    // Only deselect if clicking the grid background
    if (e.target === this._gridEl || e.target === this) {
      this.dispatchEvent(new CustomEvent('deselect-all', { bubbles: true, composed: true }));
    }
  }

  // --- Widget drag (move) ---
  private _onWidgetMouseDown(e: MouseEvent, widgetId: string): void {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    e.preventDefault();

    const widget = this.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    // Select on mousedown if not selected
    if (!this.selectedIds.has(widgetId)) {
      if (!(e.metaKey || e.ctrlKey)) {
        this.dispatchEvent(new CustomEvent('select-widget', { detail: { widgetId }, bubbles: true, composed: true }));
      }
    }

    this._measureGrid();
    this._draggingWidgetId = widgetId;
    this._dragStartPos = { x: e.clientX, y: e.clientY };

    const onMouseMove = (ev: MouseEvent) => {
      if (!this._dragStartPos || !this._gridRect) return;
      const dx = ev.clientX - this._dragStartPos.x;
      const dy = ev.clientY - this._dragStartPos.y;

      const colDelta = Math.round(dx / (this._cellWidth + this.gap));
      const rowDelta = Math.round(dy / (this._cellHeight + this.gap));

      if (colDelta === 0 && rowDelta === 0) {
        this._dragPreview = null;
        return;
      }

      // For multi-select move, compute all new positions
      const movedWidgets = this.selectedIds.has(widgetId)
        ? this.widgets.filter(w => this.selectedIds.has(w.id))
        : [widget];

      let allValid = true;
      const offsets = new Map<string, { dx: number; dy: number }>();

      for (const w of movedWidgets) {
        const newX = w.position.x + colDelta;
        const newY = w.position.y + rowDelta;
        if (newX < 0 || newX + w.position.width > this.columns || newY < 0) {
          allValid = false;
          break;
        }
        // Check collision excluding all moved widgets
        const excludeIds = new Set(movedWidgets.map(mw => mw.id));
        const collisions = this.occupancy.checkCollision(newX, newY, w.position.width, w.position.height, undefined as any);
        // Filter out self and co-selected widgets
        let hasRealCollision = false;
        for (const id of collisions) {
          if (!excludeIds.has(id)) { hasRealCollision = true; break; }
        }
        if (hasRealCollision) { allValid = false; break; }
        offsets.set(w.id, { dx: colDelta, dy: rowDelta });
      }

      this._dragOffsets = offsets;

      // Show preview for the primary widget
      this._dragPreview = {
        x: widget.position.x + colDelta,
        y: widget.position.y + rowDelta,
        width: widget.position.width,
        height: widget.position.height,
        valid: allValid,
      };

      // Alignment guides
      this._computeGuides(widget.position.x + colDelta, widget.position.y + rowDelta,
        widget.position.width, widget.position.height, widgetId);
    };

    const onMouseUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (this._dragPreview && this._dragPreview.valid) {
        const movedWidgets = this.selectedIds.has(widgetId)
          ? this.widgets.filter(w => this.selectedIds.has(w.id))
          : [widget];

        const offset = this._dragOffsets.get(widgetId);
        if (offset && (offset.dx !== 0 || offset.dy !== 0)) {
          this.dispatchEvent(new CustomEvent('move-widgets', {
            detail: {
              moves: movedWidgets.map(w => ({
                widgetId: w.id,
                fromX: w.position.x, fromY: w.position.y,
                toX: w.position.x + offset.dx, toY: w.position.y + offset.dy,
                width: w.position.width, height: w.position.height,
              })),
            },
            bubbles: true, composed: true,
          }));
        }
      }

      this._draggingWidgetId = null;
      this._dragPreview = null;
      this._guides = [];
      this._dragOffsets = new Map();
      this._dragStartPos = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // --- Resize ---
  private _onResizeMouseDown(e: MouseEvent, widgetId: string, handle: string): void {
    e.preventDefault();
    e.stopPropagation();

    const widget = this.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    this._measureGrid();
    this._resizingWidgetId = widgetId;
    this._resizeHandle = handle;
    this._resizeStartPos = {
      x: e.clientX, y: e.clientY,
      w: widget.position.width, h: widget.position.height,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!this._resizeStartPos || !this._gridRect) return;
      const dx = ev.clientX - this._resizeStartPos.x;
      const dy = ev.clientY - this._resizeStartPos.y;

      let newW = this._resizeStartPos.w;
      let newH = this._resizeStartPos.h;

      if (handle.includes('e')) {
        newW = this._resizeStartPos.w + Math.round(dx / (this._cellWidth + this.gap));
      }
      if (handle.includes('s')) {
        newH = this._resizeStartPos.h + Math.round(dy / (this._cellHeight + this.gap));
      }

      // Apply constraints
      const pos = widget.position;
      newW = Math.max(pos.minWidth ?? 1, Math.min(newW, pos.maxWidth ?? this.columns, this.columns - pos.x));
      newH = Math.max(pos.minHeight ?? 1, Math.min(newH, pos.maxHeight ?? 50));

      const valid = this.occupancy.isValidPosition(pos.x, pos.y, newW, newH, widgetId);

      this._dragPreview = {
        x: pos.x, y: pos.y,
        width: newW, height: newH,
        valid,
      };
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (this._dragPreview && this._dragPreview.valid) {
        const pos = widget.position;
        if (this._dragPreview.width !== pos.width || this._dragPreview.height !== pos.height) {
          this.dispatchEvent(new CustomEvent('resize-widget', {
            detail: {
              widgetId,
              fromX: pos.x, fromY: pos.y, fromW: pos.width, fromH: pos.height,
              toX: pos.x, toY: pos.y, toW: this._dragPreview.width, toH: this._dragPreview.height,
            },
            bubbles: true, composed: true,
          }));
        }
      }

      this._resizingWidgetId = null;
      this._dragPreview = null;
      this._resizeStartPos = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // --- Alignment guides ---
  private _computeGuides(x: number, y: number, w: number, h: number, excludeId: string): void {
    const guides: GuideLine[] = [];
    const edges = { left: x, right: x + w, top: y, bottom: y + h };

    for (const widget of this.widgets) {
      if (widget.id === excludeId) continue;
      const we = {
        left: widget.position.x,
        right: widget.position.x + widget.position.width,
        top: widget.position.y,
        bottom: widget.position.y + widget.position.height,
      };

      // Vertical guides (column alignment)
      if (Math.abs(edges.left - we.left) <= 1) guides.push({ orientation: 'vertical', position: we.left });
      if (Math.abs(edges.right - we.right) <= 1) guides.push({ orientation: 'vertical', position: we.right });
      if (Math.abs(edges.left - we.right) <= 1) guides.push({ orientation: 'vertical', position: we.right });
      if (Math.abs(edges.right - we.left) <= 1) guides.push({ orientation: 'vertical', position: we.left });

      // Horizontal guides (row alignment)
      if (Math.abs(edges.top - we.top) <= 1) guides.push({ orientation: 'horizontal', position: we.top });
      if (Math.abs(edges.bottom - we.bottom) <= 1) guides.push({ orientation: 'horizontal', position: we.bottom });
      if (Math.abs(edges.top - we.bottom) <= 1) guides.push({ orientation: 'horizontal', position: we.bottom });
      if (Math.abs(edges.bottom - we.top) <= 1) guides.push({ orientation: 'horizontal', position: we.top });
    }

    // Deduplicate
    const seen = new Set<string>();
    this._guides = guides.filter(g => {
      const key = `${g.orientation}-${g.position}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  render() {
    return html`
      <div class="grid-content" @click=${this._onCanvasClick}>
        ${this.widgets.map(w => this._renderWidget(w))}
        ${this._renderDragPreview()}
      </div>
      <alignment-guides
        .guides=${this._guides}
        .cellWidth=${this._cellWidth || 80}
        .cellHeight=${this._cellHeight}
        .gap=${this.gap}
      ></alignment-guides>
    `;
  }

  private _renderWidget(w: DashboardWidget) {
    const isSelected = this.selectedIds.has(w.id);
    const isDragging = this._draggingWidgetId === w.id;
    const offset = this._dragOffsets.get(w.id);
    const classes = [
      'widget-cell',
      isSelected ? 'selected' : '',
      isDragging ? 'dragging' : '',
    ].filter(Boolean).join(' ');

    const pos = w.position;
    const gridColumn = `${pos.x + 1} / span ${pos.width}`;
    const gridRow = `${pos.y + 1} / span ${pos.height}`;

    const styleObj = w.style || {};

    return html`
      <div class="${classes}"
           style="grid-column: ${gridColumn}; grid-row: ${gridRow};
                  background: ${styleObj.backgroundColor || '#ffffff'};
                  border-radius: ${styleObj.borderRadius ?? 10}px;"
           @click=${(e: MouseEvent) => this._onWidgetClick(e, w.id)}
           @mousedown=${(e: MouseEvent) => this._onWidgetMouseDown(e, w.id)}>
        <div class="widget-info">
          <div class="widget-label">${w.config.type}</div>
          ${w.title ? html`<div class="widget-title">${w.title}</div>` : nothing}
        </div>
        ${isSelected ? html`
          <div class="resize-handle se" @mousedown=${(e: MouseEvent) => this._onResizeMouseDown(e, w.id, 'se')}></div>
          <div class="resize-handle e" @mousedown=${(e: MouseEvent) => this._onResizeMouseDown(e, w.id, 'e')}></div>
          <div class="resize-handle s" @mousedown=${(e: MouseEvent) => this._onResizeMouseDown(e, w.id, 's')}></div>
          <editor-widget-toolbar
            .widgetId=${w.id}
          ></editor-widget-toolbar>
        ` : nothing}
      </div>
    `;
  }

  private _renderDragPreview() {
    if (!this._dragPreview) return nothing;
    const p = this._dragPreview;
    const gridColumn = `${p.x + 1} / span ${p.width}`;
    const gridRow = `${p.y + 1} / span ${p.height}`;
    const cls = `drag-preview ${p.valid ? 'valid' : 'invalid'}`;

    return html`
      <div class="${cls}" style="grid-column: ${gridColumn}; grid-row: ${gridRow};"></div>
    `;
  }
}
