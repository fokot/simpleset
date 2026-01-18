import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { DashboardWidget, WidgetType, TextWidgetConfig, DataBinding } from './types/dashboard-types.js';
import './dashboard-component.js';
import './widgets/index.js';

@customElement('element-editor-component')
export class ElementEditorComponent extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .sidebar {
      width: 250px;
      background: #f8f9fa;
      border-right: 1px solid #e9ecef;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 10;
      flex-shrink: 0;
    }

    .property-panel {
      width: 300px;
      background: #fff;
      border-left: 1px solid #e9ecef;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 10;
      flex-shrink: 0;
      overflow-y: auto;
    }

    .property-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .property-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #495057;
    }

    .property-input, .property-select, .property-textarea {
      padding: 8px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.9rem;
      width: 100%;
      box-sizing: border-box;
    }

    .property-textarea {
      min-height: 80px;
      resize: vertical;
      font-family: monospace;
    }

    .sidebar-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0;
      color: #343a40;
    }

    .widget-tools {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .draggable-item {
      padding: 12px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      cursor: grab;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .draggable-item:hover {
      border-color: #adb5bd;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .draggable-item:active {
      cursor: grabbing;
    }

    .main-content {
      flex: 1;
      background: #f1f3f5;
      padding: 24px;
      overflow: auto;
      position: relative;
    }

    .grid-container {
      background: white;
      min-height: 800px;
      position: relative;
      background-image:
        linear-gradient(to right, #e9ecef 1px, transparent 1px),
        linear-gradient(to bottom, #e9ecef 1px, transparent 1px);
      background-size: calc(100% / 40) var(--row-height, 30px);
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      border-radius: 8px;
    }

    .grid-cell {
        /* Visual guide for the grid */
    }

    .widget-wrapper {
      position: absolute;
      background: white;
      border: 1px solid #ced4da;
      border-radius: 4px;
      box-sizing: border-box;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }

    .widget-wrapper.selected {
      border: 2px solid #228be6;
      z-index: 100;
    }

    .resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
      background: linear-gradient(135deg, transparent 50%, #228be6 50%);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .widget-wrapper:hover .resize-handle,
    .widget-wrapper.selected .resize-handle {
      opacity: 1;
    }

    .delete-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #fa5252;
      color: white;
      border: none;
      border-radius: 4px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    }

    .widget-wrapper:hover .delete-btn {
      opacity: 1;
    }
  `;

  @state()
  widgets: DashboardWidget[] = [];

  @state()
  selectedWidgetId: string | null = null;

  @state()
  draggedType: WidgetType | null = null;

  @state()
  resizingWidgetId: string | null = null;

  @state()
  editingWidgetId: string | null = null;

  @state()
  private _columns = 40;

  @state()
  private _rowHeight = 30; // Initial value, updated by resize observer

  private _resizeObserver: ResizeObserver | null = null;
  private _gridRef: HTMLElement | null = null;

  firstUpdated() {
    this._gridRef = this.shadowRoot?.querySelector('.grid-container') as HTMLElement;
    if (this._gridRef) {
      this._updateGridMetrics();
      this._resizeObserver = new ResizeObserver(() => this._updateGridMetrics());
      this._resizeObserver.observe(this._gridRef);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  private _updateGridMetrics() {
    if (!this._gridRef) return;
    const width = this._gridRef.getBoundingClientRect().width;
    if (width > 0) {
      // Calculate row height to make cells square
      const colWidth = width / this._columns;
      this._rowHeight = colWidth;
    }
  }

  // --- Drag and Drop Logic ---

  private _handleDragStart(e: DragEvent, type: WidgetType) {
    this.draggedType = type;
    e.dataTransfer?.setData('text/plain', type);
    e.dataTransfer!.effectAllowed = 'copy';
  }

  private _handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  }

  private _handleDrop(e: DragEvent) {
    e.preventDefault();
    if (!this.draggedType || !this._gridRef) return;

    const { x, y } = this._getGridCoordinates(e.clientX, e.clientY);

    // Default size for new widgets (larger in grid units because units are smaller)
    const width = 10;
    const height = 6;

    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      config: this._createDefaultConfig(this.draggedType),
      position: { x, y, width, height }
    };

    if (!this._checkCollision(newWidget)) {
      this.widgets = [...this.widgets, newWidget];
      this.selectedWidgetId = newWidget.id;
    } else {
      // TODO: Visual feedback for collision?
      console.warn('Collision detected, cannot place widget here.');
      // Try to find nearest empty spot? For now just block.
      alert('Cannot place widget here, it overlaps with another widget.');
    }

    this.draggedType = null;
  }

  private _createDefaultConfig(type: WidgetType): any {
    switch (type) {
      case 'text':
        return { type: 'text', config: { content: 'New Text Label', fontSize: 16 } };
      case 'chart':
        return { type: 'chart', dataBinding: { dataSourceId: 'demo', sql: 'SELECT * FROM data' } };
      // Add other defaults as needed
      default:
        return { type: 'text', config: { content: 'Unknown Widget' } };
    }
  }

  private _getGridCoordinates(clientX: number, clientY: number) {
    if (!this._gridRef) return { x: 0, y: 0 };

    const rect = this._gridRef.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const colWidth = rect.width / this._columns;

    let x = Math.floor(relativeX / colWidth);
    let y = Math.floor(relativeY / this._rowHeight);

    // Boundary checks
    x = Math.max(0, Math.min(x, this._columns - 1));
    y = Math.max(0, y);

    return { x, y };
  }

  // --- Collision Detection ---

  private _checkCollision(item: DashboardWidget, ignoreId?: string): boolean {
    return this.widgets.some(w => {
      if (w.id === ignoreId) return false;
      return this._rectsIntersect(item.position, w.position);
    });
  }

  private _rectsIntersect(a: any, b: any): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // --- Wrapper/Selection Logic ---

  private _selectWidget(e: MouseEvent, id: string) {
    e.stopPropagation();
    this.selectedWidgetId = id;
  }

  private _deselectAll() {
    this.selectedWidgetId = null;
  }

  private _deleteWidget(e: MouseEvent, id: string) {
    e.stopPropagation();
    this.widgets = this.widgets.filter(w => w.id !== id);
    if (this.selectedWidgetId === id) {
      this.selectedWidgetId = null;
    }
  }

  // --- Resize Logic ---

  private _startResize(e: MouseEvent, widget: DashboardWidget) {
    e.stopPropagation();
    e.preventDefault();
    this.resizingWidgetId = widget.id;
    this.selectedWidgetId = widget.id;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = widget.position.width;
    const startHeight = widget.position.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this._gridRef) return;
      const rect = this._gridRef.getBoundingClientRect();
      const colWidth = rect.width / this._columns;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaCols = Math.round(deltaX / colWidth);
      const deltaRows = Math.round(deltaY / this._rowHeight);

      const newWidth = Math.max(1, Math.min(startWidth + deltaCols, this._columns - widget.position.x));
      const newHeight = Math.max(1, startHeight + deltaRows);

      const newPosition = { ...widget.position, width: newWidth, height: newHeight };

      // Check collision logic could be live here, but simplified to "commit only if valid" on mouse up or live check
      // For better UX, let's update if valid
      if (!this._checkCollision({ ...widget, position: newPosition }, widget.id)) {
        // Update widget state
        this.widgets = this.widgets.map(w => w.id === widget.id ? { ...w, position: newPosition } : w);
      }
    };

    const onMouseUp = () => {
      this.resizingWidgetId = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // --- Dragging existing widgets Logic ---
  // (Simple implementation: click and hold anywhere on widget to drag)
  // To avoid conflict with resize/delete, only trigger if target is not them.

  private _handleDoubleClick(e: MouseEvent, widget: DashboardWidget) {
    if (widget.config.type === 'text') {
      e.stopPropagation();
      this.editingWidgetId = widget.id;
      this.selectedWidgetId = widget.id;
    }
  }

  private _handleTextChange(widgetId: string, e: CustomEvent) {
    this._updateWidgetConfig(widgetId, ['config', 'content'], e.detail.content);
  }

  private _handleEditBlur() {
    this.editingWidgetId = null;
  }

  private _startWidgetDrag(e: DragEvent, widget: DashboardWidget) {
    // Using HTML5 drag/drop for sidebar, but for grid items, mouse events might be smoother for precise grid snapping.
    // However, let's conform to standard D&D for consistency if possible, or use mouse listeners.
    // Given "modern design", mouse listener based dragging (like gridstack) is usually better.
    // Implementing basic mouse drag for grid items:

    // Note: reusing dragstart might conflict with sidebar.
    // Let's implement "mouse down to move" on the wrapper.
  }

  private _initMove(e: MouseEvent, widget: DashboardWidget) {
    if ((e.target as HTMLElement).classList.contains('resize-handle') ||
      (e.target as HTMLElement).classList.contains('delete-btn')) {
      return;
    }

    e.preventDefault();
    this.selectedWidgetId = widget.id;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = widget.position.x;
    const startPosY = widget.position.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this._gridRef) return;
      const rect = this._gridRef.getBoundingClientRect();
      const colWidth = rect.width / this._columns;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaCols = Math.round(deltaX / colWidth);
      const deltaRows = Math.round(deltaY / this._rowHeight);

      const newX = Math.max(0, Math.min(startPosX + deltaCols, this._columns - widget.position.width));
      const newY = Math.max(0, startPosY + deltaRows);

      if (newX === widget.position.x && newY === widget.position.y) return;

      const newPosition = { ...widget.position, x: newX, y: newY };

      if (!this._checkCollision({ ...widget, position: newPosition }, widget.id)) {
        this.widgets = this.widgets.map(w => w.id === widget.id ? { ...w, position: newPosition } : w);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }


  render() {
    return html`
      <div class="sidebar">
        <h2 class="sidebar-title">Toolkit</h2>
        
        <div class="widget-tools">
           <div class="draggable-item" draggable="true" @dragstart=${(e: DragEvent) => this._handleDragStart(e, 'text')}>
              <span>T</span> Text Label
           </div>
           <div class="draggable-item" draggable="true" @dragstart=${(e: DragEvent) => this._handleDragStart(e, 'chart')}>
              <span>📊</span> Chart
           </div>
           <!-- Add more items as needed -->
        </div>
      </div>

      <div class="main-content" @click=${this._deselectAll}>
        <div class="grid-container" 
             style="--row-height: ${this._rowHeight}px"
             @dragover=${this._handleDragOver} 
             @drop=${this._handleDrop}>
             
             ${this.widgets.map(widget => this._renderWidgetWrapper(widget))}
             
        </div>
      </div>

      <div class="property-panel">
        <h2 class="sidebar-title">Properties</h2>
        ${this._renderPropertyForm()}
      </div>
    `;
  }

  private _renderPropertyForm() {
    if (!this.selectedWidgetId) {
      return html`<p style="color: #868e96; font-style: italic;">Select a widget to edit properties.</p>`;
    }

    const widget = this.widgets.find(w => w.id === this.selectedWidgetId);
    if (!widget) return null;

    return html`
       <div class="property-group">
          <label class="property-label">Widget ID</label>
          <input class="property-input" type="text" value="${widget.id}" disabled style="background: #f8f9fa; color: #868e96;">
       </div>

       ${this._renderSpecificProperties(widget)}
    `;
  }

  private _renderSpecificProperties(widget: DashboardWidget) {
    switch (widget.config.type) {
      case 'text':
        return this._renderTextProperties(widget);
      case 'chart':
        return this._renderChartProperties(widget);
      default:
        return html`<p>No properties available for this widget type.</p>`;
    }
  }

  private _updateWidgetConfig(widgetId: string, path: string[], value: any) {
    this.widgets = this.widgets.map(w => {
      if (w.id !== widgetId) return w;

      // Deep update
      const newConfig = JSON.parse(JSON.stringify(w.config)); // simplistic deep clone
      let current = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      return { ...w, config: newConfig };
    });
  }

  private _renderTextProperties(widget: DashboardWidget) {
    const config = (widget.config.type === 'text' ? widget.config.config : {}) as TextWidgetConfig;
    return html`
        <div class="property-group">
           <label class="property-label">Content</label>
           <textarea class="property-textarea" 
             @input=${(e: any) => this._updateWidgetConfig(widget.id, ['config', 'content'], e.target.value)}
           >${config.content || ''}</textarea>
        </div>
        <div class="property-group">
           <label class="property-label">Font Size (px)</label>
           <input class="property-input" type="number" 
             value="${config.fontSize || 16}"
             @input=${(e: any) => this._updateWidgetConfig(widget.id, ['config', 'fontSize'], Number(e.target.value))}
           >
        </div>
        <div class="property-group">
           <label class="property-label">Alignment</label>
           <select class="property-select"
             @change=${(e: any) => this._updateWidgetConfig(widget.id, ['config', 'textAlign'], e.target.value)}
           >
             <option value="left" ?selected=${config.textAlign === 'left'}>Left</option>
             <option value="center" ?selected=${config.textAlign === 'center'}>Center</option>
             <option value="right" ?selected=${config.textAlign === 'right'}>Right</option>
           </select>
        </div>
        <div class="property-group">
           <label class="property-label">Color</label>
           <input class="property-input" type="color" 
             value="${config.color || '#000000'}"
             @input=${(e: any) => this._updateWidgetConfig(widget.id, ['config', 'color'], e.target.value)}
           >
        </div>
     `;
  }

  private _renderChartProperties(widget: DashboardWidget) {
    const dataBinding = (widget.config.type === 'chart' ? widget.config.dataBinding : {}) as DataBinding;
    return html`
        <div class="property-group">
           <label class="property-label">Data Source ID</label>
           <input class="property-input" type="text" 
             value="${dataBinding?.dataSourceId || ''}"
             @input=${(e: any) => this._updateWidgetConfig(widget.id, ['dataBinding', 'dataSourceId'], e.target.value)}
           >
        </div>
        <div class="property-group">
           <label class="property-label">SQL Query</label>
           <textarea class="property-textarea" 
             style="font-family: monospace; min-height: 120px;"
             @input=${(e: any) => this._updateWidgetConfig(widget.id, ['dataBinding', 'sql'], e.target.value)}
           >${dataBinding?.sql || ''}</textarea>
        </div>
        <div class="property-group">
             <label class="property-label">Visualization Type</label>
             <!-- Ideally this would be part of config, but sticking to dataBinding for now as per minimal implementation request -->
             <!-- We might want to add chart config properties too, like title -->
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e9ecef; width: 100%; margin: 8px 0;">
        
        <div class="property-group">
           <label class="property-label">Widget Title</label>
            <input class="property-input" type="text"
             value="${widget.title || ''}"
             @input=${(e: any) => {
        this.widgets = this.widgets.map(w => w.id === widget.id ? { ...w, title: e.target.value } : w);
      }}
           >
        </div>
     `;
  }

  private _renderWidgetWrapper(widget: DashboardWidget) {
    const isSelected = this.selectedWidgetId === widget.id;

    const style = `
      left: calc(${widget.position.x} * (100% / ${this._columns}));
      top: calc(${widget.position.y} * ${this._rowHeight}px);
      width: calc(${widget.position.width} * (100% / ${this._columns}));
      height: calc(${widget.position.height} * ${this._rowHeight}px);
    `;

    return html`
      <div class="widget-wrapper ${isSelected ? 'selected' : ''}" 
           style="${style}"
           @mousedown=${(e: MouseEvent) => this._initMove(e, widget)}
           @click=${(e: MouseEvent) => this._selectWidget(e, widget.id)}>
           
           <button class="delete-btn" @click=${(e: MouseEvent) => this._deleteWidget(e, widget.id)} title="Remove">×</button>
                      <!-- Content Preview -->
            <div style="width: 100%; height: 100%; pointer-events: none; overflow: hidden; padding: 8px;"
                 @dblclick=${(e: MouseEvent) => this._handleDoubleClick(e, widget)}>
               ${this._renderWidgetContent(widget)}
            </div>

            <div class="resize-handle" @mousedown=${(e: MouseEvent) => this._startResize(e, widget)}></div>
      </div>
    `;
  }

  private _renderWidgetContent(widget: DashboardWidget) {
    switch (widget.config.type) {
      case 'text':
        return html`
          <text-widget 
            .config=${widget.config.config}
            .editable=${this.editingWidgetId === widget.id}
            style="pointer-events: auto"
            @text-change=${(e: CustomEvent) => this._handleTextChange(widget.id, e)}
            @edit-blur=${this._handleEditBlur}
          ></text-widget>`;
      case 'chart':
        return html`<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#e3f2fd;color:#1976d2">Chart Preview</div>`;
      default:
        return html`<div>Unknown Widget</div>`;
    }
  }
}
