import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Dashboard, DashboardWidget, WidgetType, WidgetPosition, TextWidgetConfig, ImageWidgetConfig, MarkdownWidgetConfig } from './types/dashboard-types.js';
import { ChartData } from './widgets/chart-widget.js';
import './widgets/index.js';

interface DragState {
  isDragging: boolean;
  draggedWidget?: DashboardWidget;
  draggedWidgetType?: WidgetType;
  isNewWidget: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeState {
  isResizing: boolean;
  widgetId?: string;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startPosition?: WidgetPosition;
}

@customElement('dashboard-editor')
export class DashboardEditorComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      font-family: var(--dashboard-font-family, 'Inter, system-ui, sans-serif');
      background-color: var(--dashboard-bg-color, #f5f5f5);
    }

    .editor-container {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .sidebar-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .sidebar-subtitle {
      font-size: 0.85rem;
      opacity: 0.9;
      margin: 0;
    }

    .widget-palette {
      padding: 20px;
    }

    .palette-section {
      margin-bottom: 24px;
    }

    .palette-section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #666;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .widget-item {
      padding: 12px 16px;
      margin-bottom: 8px;
      background: #f8f9fa;
      border: 2px dashed #cbd5e0;
      border-radius: 8px;
      cursor: grab;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      user-select: none;
      -webkit-user-select: none;
    }

    .widget-item:hover {
      background: #e9ecef;
      border-color: #667eea;
      transform: translateX(4px);
    }

    .widget-item:active {
      cursor: grabbing;
    }

    .widget-item[draggable="true"] {
      cursor: grab;
    }

    .widget-item[draggable="true"]:active {
      cursor: grabbing;
    }

    .widget-icon {
      font-size: 1.5rem;
    }

    .widget-info {
      flex: 1;
    }

    .widget-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #1a1a1a;
      margin: 0 0 2px 0;
    }

    .widget-description {
      font-size: 0.75rem;
      color: #666;
      margin: 0;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .properties-panel {
      width: 320px;
      background: white;
      border-left: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .properties-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .properties-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }

    .properties-content {
      padding: 20px;
    }

    .property-group {
      margin-bottom: 20px;
    }

    .property-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #666;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .property-input,
    .property-textarea,
    .property-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    .property-input:focus,
    .property-textarea:focus,
    .property-select:focus {
      outline: none;
      border-color: #667eea;
    }

    .property-textarea {
      min-height: 100px;
      resize: vertical;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.85rem;
    }

    .property-number {
      width: 100%;
    }

    .property-color {
      width: 100%;
      height: 40px;
      cursor: pointer;
    }

    .empty-properties {
      text-align: center;
      color: #999;
      padding: 40px 20px;
      font-size: 0.9rem;
    }

    .toolbar {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .toolbar-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }

    .dashboard-name-input {
      font-size: 1.2rem;
      font-weight: 600;
      border: 2px solid transparent;
      padding: 8px 12px;
      border-radius: 6px;
      background: #f8f9fa;
      transition: all 0.2s ease;
      min-width: 300px;
    }

    .dashboard-name-input:hover {
      background: #e9ecef;
    }

    .dashboard-name-input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
    }

    .toolbar-button {
      padding: 8px 16px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      background: white;
      color: #1a1a1a;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toolbar-button:hover {
      background: #f8f9fa;
      border-color: #667eea;
    }

    .toolbar-button.primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
    }

    .toolbar-button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .canvas-container {
      flex: 1;
      overflow: auto;
      padding: 24px;
      background: #f5f5f5;
    }

    .dashboard-canvas {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      min-height: 600px;
      padding: 24px;
      position: relative;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .dashboard-canvas.drag-over {
      background: rgba(102, 126, 234, 0.05);
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3) inset;
    }

    .dashboard-canvas.drag-over.invalid-position {
      background: rgba(239, 68, 68, 0.05);
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) inset;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(var(--dashboard-columns, 12), 1fr);
      gap: var(--dashboard-gap, 16px);
      min-height: 500px;
      position: relative;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      display: grid;
      grid-template-columns: repeat(var(--dashboard-columns, 12), 1fr);
      gap: var(--dashboard-gap, 16px);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .dashboard-grid.dragging .grid-overlay {
      opacity: 1;
    }

    .grid-cell {
      border: 1px dashed #cbd5e0;
      border-radius: 4px;
      background: rgba(102, 126, 234, 0.02);
    }

    .widget-container {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      position: relative;
      cursor: move;
      transition: all 0.2s ease;
      user-select: none;
      -webkit-user-select: none;
    }

    .widget-container:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .widget-container.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }

    .widget-container.resizing {
      cursor: default;
    }

    .widget-container.selected {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .widget-container.drop-target {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      background: rgba(16, 185, 129, 0.05);
    }

    .widget-container[draggable="true"] {
      cursor: grab;
    }

    .widget-container[draggable="true"]:active {
      cursor: grabbing;
    }

    .resize-handle {
      position: absolute;
      background: transparent;
      z-index: 10;
    }

    .resize-handle:hover {
      background: rgba(102, 126, 234, 0.3);
    }

    .resize-handle.n {
      top: -4px;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: ns-resize;
    }

    .resize-handle.s {
      bottom: -4px;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: ns-resize;
    }

    .resize-handle.e {
      right: -4px;
      top: 8px;
      bottom: 8px;
      width: 8px;
      cursor: ew-resize;
    }

    .resize-handle.w {
      left: -4px;
      top: 8px;
      bottom: 8px;
      width: 8px;
      cursor: ew-resize;
    }

    .resize-handle.ne {
      top: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      cursor: nesw-resize;
    }

    .resize-handle.nw {
      top: -4px;
      left: -4px;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }

    .resize-handle.se {
      bottom: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }

    .resize-handle.sw {
      bottom: -4px;
      left: -4px;
      width: 12px;
      height: 12px;
      cursor: nesw-resize;
    }

    .widget-preview {
      background: rgba(102, 126, 234, 0.1);
      border: 2px dashed rgba(102, 126, 234, 0.5);
      border-radius: 8px;
      position: relative;
      pointer-events: none;
      z-index: 1000;
    }

    .widget-preview.invalid {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.5);
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .widget-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .widget-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .widget-container:hover .widget-actions {
      opacity: 1;
    }

    .widget-action-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: #f8f9fa;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }

    .widget-action-btn:hover {
      background: #e9ecef;
    }

    .widget-action-btn.delete:hover {
      background: #fee;
      color: #d32f2f;
    }

    .widget-content {
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-style: italic;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .empty-state-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #666;
    }

    .empty-state-description {
      font-size: 0.95rem;
      margin: 0;
      color: #999;
    }
  `;

  @property({ type: Object })
  dashboard?: Dashboard;

  @state()
  private _widgets: DashboardWidget[] = [];

  @state()
  private _selectedWidgetId?: string;

  @state()
  private _dragState: DragState = {
    isDragging: false,
    isNewWidget: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  };

  @state()
  private _dashboardName: string = 'New Dashboard';

  @state()
  private _columns: number = 12;

  @state()
  private _isDragOver: boolean = false;

  @state()
  private _invalidDropPosition: boolean = false;

  @state()
  private _previewPosition: WidgetPosition | null = null;

  @state()
  private _dropTargetWidgetId: string | null = null;

  @state()
  private _resizeState: ResizeState = {
    isResizing: false,
    startX: 0,
    startY: 0,
  };

  private _widgetIdCounter = 0;

  connectedCallback() {
    super.connectedCallback();

    // Initialize with default dashboard if none provided
    if (!this.dashboard) {
      this._initializeDefaultDashboard();
    } else {
      this._widgets = [...(this.dashboard.widgets || [])];
      this._dashboardName = this.dashboard.name;
      this._columns = this.dashboard.layout.columns || 12;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  private _initializeDefaultDashboard() {
    this._widgets = [];
    this._dashboardName = 'New Dashboard';
    this._columns = 12;
  }

  private _generateWidgetId(): string {
    return `widget-${Date.now()}-${++this._widgetIdCounter}`;
  }

  private _handlePaletteItemDragStart = (e: DragEvent, widgetType: WidgetType) => {
    if (!e.dataTransfer) return;

    // Set the data being dragged
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      isNewWidget: true,
      widgetType: widgetType
    }));

    // Set drag image
    e.dataTransfer.setDragImage(e.currentTarget as Element, 0, 0);

    this._dragState = {
      isDragging: true,
      isNewWidget: true,
      draggedWidgetType: widgetType,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    };
  };

  private _handleWidgetDragStart = (e: DragEvent, widget: DashboardWidget) => {
    if (!e.dataTransfer) return;

    // Don't start dragging if we're resizing
    if (this._resizeState.isResizing) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();

    // Set the data being dragged
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      isNewWidget: false,
      widgetId: widget.id
    }));

    this._dragState = {
      isDragging: true,
      isNewWidget: false,
      draggedWidget: widget,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    };

    this._selectedWidgetId = widget.id;
  };

  private _handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = this._dragState.isNewWidget ? 'copy' : 'move';
    }
    this._isDragOver = true;

    // Check for collision at current mouse position
    this._checkDragCollision(e);
  };

  /**
   * Check if dropping at the current mouse position would cause a collision
   */
  private _checkDragCollision(e: DragEvent) {
    const canvasElement = this.shadowRoot?.querySelector('.dashboard-grid') as HTMLElement;
    if (!canvasElement) {
      this._invalidDropPosition = false;
      this._previewPosition = null;
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellWidth = rect.width / this._columns;
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / 100);

    // Determine the size of the widget being dragged
    let width = 4;
    let height = 3;
    let excludeWidgetId: string | undefined;

    if (this._dragState.draggedWidget) {
      width = this._dragState.draggedWidget.position.width;
      height = this._dragState.draggedWidget.position.height;
      excludeWidgetId = this._dragState.draggedWidget.id;
    }

    const testPosition: WidgetPosition = {
      x: Math.max(0, Math.min(gridX, this._columns - width)),
      y: Math.max(0, gridY),
      width,
      height,
    };

    // Check if this position would collide
    this._invalidDropPosition = this._hasCollision(testPosition, excludeWidgetId);

    // Set preview position for visual feedback
    this._previewPosition = testPosition;
  }

  private _handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    this._isDragOver = true;
  };

  private _handleDragLeave = (e: DragEvent) => {
    // Check if we're actually leaving the canvas (not just entering a child element)
    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      this._isDragOver = false;
      this._invalidDropPosition = false;
      this._previewPosition = null;
    }
  };

  private _handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this._isDragOver = false;
    this._invalidDropPosition = false;
    this._previewPosition = null;

    if (!e.dataTransfer) return;

    const canvasElement = this.shadowRoot?.querySelector('.dashboard-grid') as HTMLElement;
    if (!canvasElement) {
      // If no grid exists yet (empty state), use the canvas itself
      const canvas = this.shadowRoot?.querySelector('.dashboard-canvas') as HTMLElement;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

        if (dragData.isNewWidget && dragData.widgetType) {
          this._addNewWidget(dragData.widgetType, x, y, rect.width);
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    } else {
      const rect = canvasElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

        if (dragData.isNewWidget && dragData.widgetType) {
          this._addNewWidget(dragData.widgetType, x, y, rect.width);
        } else if (!dragData.isNewWidget && dragData.widgetId) {
          const widget = this._widgets.find(w => w.id === dragData.widgetId);
          if (widget) {
            this._moveWidget(widget, x, y, rect.width);
          }
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }

    this._dragState = {
      isDragging: false,
      isNewWidget: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    };

    this.requestUpdate();
  };

  private _handleDragEnd = (e: DragEvent) => {
    this._isDragOver = false;
    this._invalidDropPosition = false;
    this._previewPosition = null;
    this._dropTargetWidgetId = null;
    this._dragState = {
      isDragging: false,
      isNewWidget: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    };
    this.requestUpdate();
  };

  private _handleWidgetDragOver = (e: DragEvent, widget: DashboardWidget) => {
    // Only handle if we're dragging a new widget from the palette
    if (!this._dragState.isNewWidget) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    // Mark this widget as the drop target
    this._dropTargetWidgetId = widget.id;
  };

  private _handleWidgetDragLeave = (e: DragEvent, widget: DashboardWidget) => {
    // Only handle if we're dragging a new widget from the palette
    if (!this._dragState.isNewWidget) {
      return;
    }

    // Check if we're actually leaving the widget (not just entering a child element)
    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      if (this._dropTargetWidgetId === widget.id) {
        this._dropTargetWidgetId = null;
      }
    }
  };

  private _handleWidgetDrop = (e: DragEvent, widget: DashboardWidget) => {
    // Only handle if we're dragging a new widget from the palette
    if (!this._dragState.isNewWidget) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this._isDragOver = false;
    this._invalidDropPosition = false;
    this._previewPosition = null;
    this._dropTargetWidgetId = null;

    if (!e.dataTransfer) return;

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

      if (dragData.isNewWidget && dragData.widgetType) {
        // Add the new widget and resize the target widget to make room
        this._addNewWidgetOntoWidget(dragData.widgetType, widget);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }

    this._dragState = {
      isDragging: false,
      isNewWidget: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    };

    this.requestUpdate();
  };

  private _handleResizeStart = (e: MouseEvent, widget: DashboardWidget, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();

    this._resizeState = {
      isResizing: true,
      widgetId: widget.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startPosition: { ...widget.position },
    };

    // Add global mouse event listeners
    document.addEventListener('mousemove', this._handleResizeMove);
    document.addEventListener('mouseup', this._handleResizeEnd);
  };

  private _handleResizeMove = (e: MouseEvent) => {
    if (!this._resizeState.isResizing || !this._resizeState.widgetId || !this._resizeState.startPosition) {
      return;
    }

    const widget = this._widgets.find(w => w.id === this._resizeState.widgetId);
    if (!widget) return;

    const canvasElement = this.shadowRoot?.querySelector('.dashboard-grid') as HTMLElement;
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const cellWidth = rect.width / this._columns;
    const cellHeight = 100; // Row height

    // Calculate delta in pixels
    const deltaX = e.clientX - this._resizeState.startX;
    const deltaY = e.clientY - this._resizeState.startY;

    // Convert to grid units
    const deltaGridX = Math.round(deltaX / cellWidth);
    const deltaGridY = Math.round(deltaY / cellHeight);

    const startPos = this._resizeState.startPosition;
    const handle = this._resizeState.handle!;

    let newPosition: WidgetPosition = { ...startPos };

    // Calculate new position based on which handle is being dragged
    switch (handle) {
      case 'e': // East (right edge)
        newPosition.width = Math.max(2, startPos.width + deltaGridX);
        break;
      case 'w': // West (left edge)
        const newWidthW = Math.max(2, startPos.width - deltaGridX);
        const deltaWidthW = startPos.width - newWidthW;
        newPosition.x = startPos.x + deltaWidthW;
        newPosition.width = newWidthW;
        break;
      case 's': // South (bottom edge)
        newPosition.height = Math.max(2, startPos.height + deltaGridY);
        break;
      case 'n': // North (top edge)
        const newHeightN = Math.max(2, startPos.height - deltaGridY);
        const deltaHeightN = startPos.height - newHeightN;
        newPosition.y = Math.max(0, startPos.y + deltaHeightN);
        newPosition.height = newHeightN;
        break;
      case 'se': // Southeast (bottom-right corner)
        newPosition.width = Math.max(2, startPos.width + deltaGridX);
        newPosition.height = Math.max(2, startPos.height + deltaGridY);
        break;
      case 'sw': // Southwest (bottom-left corner)
        const newWidthSW = Math.max(2, startPos.width - deltaGridX);
        const deltaWidthSW = startPos.width - newWidthSW;
        newPosition.x = startPos.x + deltaWidthSW;
        newPosition.width = newWidthSW;
        newPosition.height = Math.max(2, startPos.height + deltaGridY);
        break;
      case 'ne': // Northeast (top-right corner)
        newPosition.width = Math.max(2, startPos.width + deltaGridX);
        const newHeightNE = Math.max(2, startPos.height - deltaGridY);
        const deltaHeightNE = startPos.height - newHeightNE;
        newPosition.y = Math.max(0, startPos.y + deltaHeightNE);
        newPosition.height = newHeightNE;
        break;
      case 'nw': // Northwest (top-left corner)
        const newWidthNW = Math.max(2, startPos.width - deltaGridX);
        const deltaWidthNW = startPos.width - newWidthNW;
        newPosition.x = startPos.x + deltaWidthNW;
        newPosition.width = newWidthNW;
        const newHeightNW = Math.max(2, startPos.height - deltaGridY);
        const deltaHeightNW = startPos.height - newHeightNW;
        newPosition.y = Math.max(0, startPos.y + deltaHeightNW);
        newPosition.height = newHeightNW;
        break;
    }

    // Ensure widget stays within grid bounds
    newPosition.x = Math.max(0, Math.min(newPosition.x, this._columns - 1));
    newPosition.width = Math.min(newPosition.width, this._columns - newPosition.x);

    // Check for collisions with other widgets
    const hasCollision = this._hasCollision(newPosition, widget.id);

    if (!hasCollision) {
      // Update widget position
      this._widgets = this._widgets.map(w =>
        w.id === widget.id ? { ...w, position: newPosition } : w
      );
    }
  };

  private _handleResizeEnd = (e: MouseEvent) => {
    this._resizeState = {
      isResizing: false,
      startX: 0,
      startY: 0,
    };

    // Remove global mouse event listeners
    document.removeEventListener('mousemove', this._handleResizeMove);
    document.removeEventListener('mouseup', this._handleResizeEnd);

    this.requestUpdate();
  };

  /**
   * Check if two widgets overlap in the grid
   */
  private _checkCollision(
    pos1: WidgetPosition,
    pos2: WidgetPosition
  ): boolean {
    // Check if rectangles overlap
    const x1End = pos1.x + pos1.width;
    const y1End = pos1.y + pos1.height;
    const x2End = pos2.x + pos2.width;
    const y2End = pos2.y + pos2.height;

    // No overlap if one rectangle is to the left, right, above, or below the other
    if (x1End <= pos2.x || x2End <= pos1.x || y1End <= pos2.y || y2End <= pos1.y) {
      return false;
    }

    return true;
  }

  /**
   * Check if a widget at the given position would collide with any existing widgets
   * @param position The position to check
   * @param excludeWidgetId Optional widget ID to exclude from collision check (for moving widgets)
   */
  private _hasCollision(
    position: WidgetPosition,
    excludeWidgetId?: string
  ): boolean {
    return this._widgets.some(widget => {
      if (excludeWidgetId && widget.id === excludeWidgetId) {
        return false;
      }
      return this._checkCollision(position, widget.position);
    });
  }

  /**
   * Find the nearest valid position for a widget by trying positions in a spiral pattern
   */
  private _findNearestValidPosition(
    preferredPosition: WidgetPosition,
    excludeWidgetId?: string
  ): WidgetPosition {
    // First check if the preferred position is valid
    if (!this._hasCollision(preferredPosition, excludeWidgetId)) {
      return preferredPosition;
    }

    // Try positions in a spiral pattern around the preferred position
    const maxAttempts = 50;
    let attempt = 0;

    for (let radius = 1; radius <= 10 && attempt < maxAttempts; radius++) {
      // Try positions at this radius
      for (let dx = -radius; dx <= radius && attempt < maxAttempts; dx++) {
        for (let dy = -radius; dy <= radius && attempt < maxAttempts; dy++) {
          // Only check positions on the perimeter of the current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
            continue;
          }

          attempt++;
          const testPosition: WidgetPosition = {
            ...preferredPosition,
            x: Math.max(0, Math.min(preferredPosition.x + dx, this._columns - preferredPosition.width)),
            y: Math.max(0, preferredPosition.y + dy),
          };

          if (!this._hasCollision(testPosition, excludeWidgetId)) {
            return testPosition;
          }
        }
      }
    }

    // If no valid position found, try placing at the bottom
    let bottomY = 0;
    this._widgets.forEach(widget => {
      if (!excludeWidgetId || widget.id !== excludeWidgetId) {
        bottomY = Math.max(bottomY, widget.position.y + widget.position.height);
      }
    });

    return {
      ...preferredPosition,
      x: 0,
      y: bottomY,
    };
  }

  private _addNewWidget(widgetType: WidgetType, x: number, y: number, canvasWidth: number) {
    const cellWidth = canvasWidth / this._columns;
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / 100); // Assuming row height of 100px

    // Calculate preferred position
    const preferredPosition: WidgetPosition = {
      x: Math.max(0, Math.min(gridX, this._columns - 4)),
      y: Math.max(0, gridY),
      width: 4,
      height: 3,
    };

    // Find valid position (will auto-adjust if collision detected)
    const validPosition = this._findNearestValidPosition(preferredPosition);

    const newWidget: DashboardWidget = {
      id: this._generateWidgetId(),
      title: this._getDefaultWidgetTitle(widgetType),
      position: validPosition,
      config: this._getDefaultWidgetConfig(widgetType),
      visible: true,
    };

    this._widgets = [...this._widgets, newWidget];
    this._selectedWidgetId = newWidget.id;
  }

  private _addNewWidgetOntoWidget(widgetType: WidgetType, targetWidget: DashboardWidget) {
    // Resize the target widget to make room for the new widget
    // Split the target widget horizontally (reduce width by half)
    const newTargetWidth = Math.max(2, Math.floor(targetWidget.position.width / 2));
    const newWidgetWidth = targetWidget.position.width - newTargetWidth;

    // Update the target widget's width
    const updatedTargetWidget: DashboardWidget = {
      ...targetWidget,
      position: {
        ...targetWidget.position,
        width: newTargetWidth,
      },
    };

    // Create the new widget positioned to the right of the resized target widget
    const newWidget: DashboardWidget = {
      id: this._generateWidgetId(),
      title: this._getDefaultWidgetTitle(widgetType),
      position: {
        x: targetWidget.position.x + newTargetWidth,
        y: targetWidget.position.y,
        width: newWidgetWidth,
        height: targetWidget.position.height,
      },
      config: this._getDefaultWidgetConfig(widgetType),
      visible: true,
    };

    // Update the widgets array - only modify the target widget, not all widgets
    this._widgets = this._widgets.map(w =>
      w.id === targetWidget.id ? updatedTargetWidget : w
    );

    // Add the new widget
    this._widgets = [...this._widgets, newWidget];
    this._selectedWidgetId = newWidget.id;
  }

  private _moveWidget(widget: DashboardWidget, x: number, y: number, canvasWidth: number) {
    const cellWidth = canvasWidth / this._columns;
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / 100);

    // Calculate preferred position
    const preferredPosition: WidgetPosition = {
      ...widget.position,
      x: Math.max(0, Math.min(gridX, this._columns - widget.position.width)),
      y: Math.max(0, gridY),
    };

    // Find valid position (will auto-adjust if collision detected)
    const validPosition = this._findNearestValidPosition(preferredPosition, widget.id);

    const updatedWidget = {
      ...widget,
      position: validPosition,
    };

    this._widgets = this._widgets.map(w => w.id === widget.id ? updatedWidget : w);
  }

  private _getDefaultWidgetTitle(widgetType: WidgetType): string {
    const titles: Record<WidgetType, string> = {
      chart: 'Chart Widget',
      metric: 'Metric Widget',
      table: 'Table Widget',
      text: 'Text Widget',
      image: 'Image Widget',
      iframe: 'IFrame Widget',
      filter: 'Filter Widget',
      markdown: 'Markdown Widget',
    };
    return titles[widgetType] || 'Widget';
  }

  private _getDefaultWidgetConfig(widgetType: WidgetType): any {
    switch (widgetType) {
      case 'chart':
        return {
          type: 'chart',
          chartType: 'bar',
          chartData: {
            type: 'bar',
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Sample Data',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: '#2196F3',
              borderColor: '#1976D2'
            }]
          }
        };
      case 'metric':
        return {
          type: 'metric',
          config: {
            title: 'Metric',
            value: 0,
          },
        };
      case 'table':
        return {
          type: 'table',
          config: {
            columns: [
              { key: 'name', title: 'Name', sortable: true },
              { key: 'value', title: 'Value', sortable: true },
            ],
          },
        };
      case 'text':
        return {
          type: 'text',
          config: {
            content: 'Enter your text here...',
            fontSize: 16,
            fontWeight: 'normal',
            textAlign: 'left',
            color: '#1a1a1a',
          },
        };
      case 'image':
        return {
          type: 'image',
          config: {
            src: 'https://via.placeholder.com/400x300',
            alt: 'Placeholder image',
            fit: 'contain',
          },
        };
      case 'markdown':
        return {
          type: 'markdown',
          config: {
            content: '# Markdown Widget\n\nEdit this content to display **formatted** text.\n\n- Item 1\n- Item 2\n- Item 3',
            allowHtml: false,
            breaks: true,
            linkify: true,
          },
        };
      default:
        return { type: widgetType };
    }
  }

  private _deleteWidget(widgetId: string) {
    this._widgets = this._widgets.filter(w => w.id !== widgetId);
    if (this._selectedWidgetId === widgetId) {
      this._selectedWidgetId = undefined;
    }
  }

  private _selectWidget(widgetId: string) {
    this._selectedWidgetId = widgetId;
  }

  private _handleDashboardNameChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._dashboardName = input.value;
  }

  private _clearDashboard() {
    if (confirm('Are you sure you want to clear the dashboard? This will remove all widgets.')) {
      this._widgets = [];
      this._selectedWidgetId = undefined;
    }
  }

  private _exportDashboard() {
    const dashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: this._dashboardName,
      description: 'Created with Dashboard Editor',
      layout: {
        type: 'grid',
        columns: this._columns,
        rowHeight: 100,
      },
      widgets: this._widgets,
      sharing: {
        isPublic: false,
        allowedUsers: [],
      },
      audit: {
        createdAt: new Date().toISOString(),
        createdBy: 'editor-user',
        updatedAt: new Date().toISOString(),
        updatedBy: 'editor-user',
      },
    };

    console.log('Dashboard Configuration:', dashboard);
    alert('Dashboard configuration exported to console! Check the browser console (F12) to see the JSON.');
  }

  private _getWidgetGridStyle(widget: DashboardWidget): string {
    return `
      grid-column: ${widget.position.x + 1} / span ${widget.position.width};
      grid-row: ${widget.position.y + 1} / span ${widget.position.height};
    `;
  }

  private _renderWidgetPalette() {
    const widgetTypes: Array<{ type: WidgetType; icon: string; name: string; description: string }> = [
      { type: 'chart', icon: '📊', name: 'Chart', description: 'Visualize data with charts' },
      { type: 'metric', icon: '📈', name: 'Metric', description: 'Display key metrics' },
      { type: 'table', icon: '📋', name: 'Table', description: 'Show data in tables' },
      { type: 'text', icon: '📝', name: 'Text', description: 'Add text content' },
      { type: 'image', icon: '🖼️', name: 'Image', description: 'Display images' },
      { type: 'markdown', icon: '📄', name: 'Markdown', description: 'Rich text with markdown' },
    ];

    return html`
      <div class="widget-palette">
        <div class="palette-section">
          <h3 class="palette-section-title">Widgets</h3>
          ${widgetTypes.map(widget => html`
            <div
              class="widget-item"
              draggable="true"
              @dragstart="${(e: DragEvent) => this._handlePaletteItemDragStart(e, widget.type)}"
              @dragend="${this._handleDragEnd}"
            >
              <div class="widget-icon">${widget.icon}</div>
              <div class="widget-info">
                <div class="widget-name">${widget.name}</div>
                <div class="widget-description">${widget.description}</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderToolbar() {
    return html`
      <div class="toolbar">
        <div class="toolbar-left">
          <input
            type="text"
            class="dashboard-name-input"
            .value="${this._dashboardName}"
            @input="${this._handleDashboardNameChange}"
            placeholder="Dashboard Name"
          />
        </div>
        <div class="toolbar-right">
          <button class="toolbar-button" @click="${this._clearDashboard}">
            🗑️ Clear
          </button>
          <button class="toolbar-button primary" @click="${this._exportDashboard}">
            💾 Export Config
          </button>
        </div>
      </div>
    `;
  }

  private _renderPreviewWidget() {
    if (!this._previewPosition) return '';

    const previewClasses = [
      'widget-preview',
      this._invalidDropPosition ? 'invalid' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div
        class="${previewClasses}"
        style="${this._getWidgetGridStyle({ position: this._previewPosition } as DashboardWidget)}"
      >
      </div>
    `;
  }

  private _renderWidgetContent(widget: DashboardWidget) {
    switch (widget.config.type) {
      case 'metric':
        return html`
          <metric-widget
            .config="${widget.config.config}"
            .data="${{ value: widget.config.config?.value || 0 }}"
          ></metric-widget>
        `;
      case 'text':
        return html`
          <text-widget .config="${widget.config.config}"></text-widget>
        `;
      case 'image':
        return html`
          <image-widget .config="${widget.config.config}"></image-widget>
        `;
      case 'markdown':
        return html`
          <markdown-widget .config="${widget.config.config}"></markdown-widget>
        `;
      case 'table':
        return html`
          <table-widget
            .config="${widget.config.config}"
            .data="${[]}"
          ></table-widget>
        `;
      case 'chart':
        return html`
          <chart-widget
            .config="${widget.config}"
            .data="${(widget.config as any).chartData || this._getDefaultChartData()}"
          ></chart-widget>
        `;
      default:
        return html`<div>${widget.config.type} widget placeholder</div>`;
    }
  }

  private _getDefaultChartData(): ChartData {
    return {
      type: 'bar',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sample Data',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: '#2196F3',
        borderColor: '#1976D2'
      }]
    };
  }

  private _renderWidget(widget: DashboardWidget) {
    const isSelected = this._selectedWidgetId === widget.id;
    const isDragging = this._dragState.isDragging && this._dragState.draggedWidget?.id === widget.id;
    const isDropTarget = this._dropTargetWidgetId === widget.id;
    const isResizing = this._resizeState.isResizing && this._resizeState.widgetId === widget.id;

    const resizeHandles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    return html`
      <div
        class="widget-container ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''} ${isResizing ? 'resizing' : ''}"
        style="${this._getWidgetGridStyle(widget)}"
        draggable="${!isResizing}"
        @dragstart="${(e: DragEvent) => this._handleWidgetDragStart(e, widget)}"
        @dragend="${this._handleDragEnd}"
        @dragover="${(e: DragEvent) => this._handleWidgetDragOver(e, widget)}"
        @dragleave="${(e: DragEvent) => this._handleWidgetDragLeave(e, widget)}"
        @drop="${(e: DragEvent) => this._handleWidgetDrop(e, widget)}"
        @click="${() => this._selectWidget(widget.id)}"
      >
        ${isSelected ? resizeHandles.map(handle => html`
          <div
            class="resize-handle ${handle}"
            @mousedown="${(e: MouseEvent) => this._handleResizeStart(e, widget, handle)}"
          ></div>
        `) : ''}

        <div class="widget-header">
          <h3 class="widget-title">${widget.title || 'Untitled Widget'}</h3>
          <div class="widget-actions">
            <button
              class="widget-action-btn delete"
              @click="${(e: Event) => {
                e.stopPropagation();
                this._deleteWidget(widget.id)}}}"
              title="Delete widget"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="widget-content">
          ${this._renderWidgetContent(widget)}
        </div>
      </div>
    `;
  }

  private _renderCanvas() {
    const canvasClasses = [
      'dashboard-canvas',
      this._isDragOver ? 'drag-over' : '',
      this._invalidDropPosition ? 'invalid-position' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="canvas-container">
        <div
          class="${canvasClasses}"
          @dragover="${this._handleDragOver}"
          @dragenter="${this._handleDragEnter}"
          @dragleave="${this._handleDragLeave}"
          @drop="${this._handleDrop}"
        >
          ${this._widgets.length === 0 ? html`
            <div class="empty-state">
              <div class="empty-state-icon">🎨</div>
              <h2 class="empty-state-title">Start Building Your Dashboard</h2>
              <p class="empty-state-description">
                Drag widgets from the left sidebar to add them to your dashboard
              </p>
            </div>
          ` : html`
            <div
              class="dashboard-grid ${this._dragState.isDragging ? 'dragging' : ''}"
              style="--dashboard-columns: ${this._columns}"
            >
              <div class="grid-overlay">
                ${Array.from({ length: this._columns * 6 }).map(() => html`
                  <div class="grid-cell"></div>
                `)}
              </div>
              ${this._widgets.map(widget => this._renderWidget(widget))}
              ${this._previewPosition ? this._renderPreviewWidget() : ''}
            </div>
          `}
        </div>
      </div>
    `;
  }

  private _updateWidgetConfig(widgetId: string, configPath: string, value: any) {
    this._widgets = this._widgets.map(w => {
      if (w.id === widgetId) {
        const updatedWidget = { ...w };
        const pathParts = configPath.split('.');
        let current: any = updatedWidget;

        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }

        current[pathParts[pathParts.length - 1]] = value;
        return updatedWidget;
      }
      return w;
    });
  }

  private _renderPropertiesPanel() {
    const selectedWidget = this._widgets.find(w => w.id === this._selectedWidgetId);

    if (!selectedWidget) {
      return html`
        <div class="properties-panel">
          <div class="properties-header">
            <h3 class="properties-title">Properties</h3>
          </div>
          <div class="empty-properties">
            Select a widget to edit its properties
          </div>
        </div>
      `;
    }

    return html`
      <div class="properties-panel">
        <div class="properties-header">
          <h3 class="properties-title">Widget Properties</h3>
        </div>
        <div class="properties-content">
          <div class="property-group">
            <label class="property-label">Widget Title</label>
            <input
              type="text"
              class="property-input"
              .value="${selectedWidget.title || ''}"
              @input="${(e: Event) => {
                const input = e.target as HTMLInputElement;
                this._updateWidgetConfig(selectedWidget.id, 'title', input.value);
              }}"
            />
          </div>

          ${this._renderWidgetSpecificProperties(selectedWidget)}
        </div>
      </div>
    `;
  }

  private _renderWidgetSpecificProperties(widget: DashboardWidget) {
    switch (widget.config.type) {
      case 'chart':
        return this._renderChartWidgetProperties(widget);
      case 'text':
        return this._renderTextWidgetProperties(widget);
      case 'image':
        return this._renderImageWidgetProperties(widget);
      case 'markdown':
        return this._renderMarkdownWidgetProperties(widget);
      default:
        return html``;
    }
  }

  private _renderChartWidgetProperties(widget: DashboardWidget) {
    if (widget.config.type !== 'chart') return html``;
    const chartType = (widget.config as any).chartType || 'bar';
    const chartData = (widget.config as any).chartData || this._getDefaultChartData();

    return html`
      <div class="property-group">
        <label class="property-label">Chart Type</label>
        <select
          class="property-select"
          .value="${chartType}"
          @change="${(e: Event) => {
            const select = e.target as HTMLSelectElement;
            const newType = select.value;
            this._updateWidgetConfig(widget.id, 'config.chartType', newType);

            // Update chart data type to match
            const currentData = (widget.config as any).chartData || this._getDefaultChartData();
            this._updateWidgetConfig(widget.id, 'config.chartData', {
              ...currentData,
              type: newType
            });
          }}"
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="area">Area Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="doughnut">Doughnut Chart</option>
          <option value="scatter">Scatter Chart</option>
          <option value="radar">Radar Chart</option>
        </select>
      </div>

      <div class="property-group">
        <label class="property-label">Sample Data (JSON)</label>
        <textarea
          class="property-textarea"
          style="font-family: monospace; min-height: 200px;"
          .value="${JSON.stringify(chartData, null, 2)}"
          @input="${(e: Event) => {
            const textarea = e.target as HTMLTextAreaElement;
            try {
              const parsedData = JSON.parse(textarea.value);
              this._updateWidgetConfig(widget.id, 'config.chartData', parsedData);
            } catch (error) {
              // Invalid JSON, don't update
              console.warn('Invalid JSON for chart data');
            }
          }}"
          placeholder='{"type": "bar", "labels": [...], "datasets": [...]}'
        ></textarea>
      </div>

      <div class="property-group">
        <label class="property-label">Quick Presets</label>
        <button
          class="toolbar-button"
          style="width: 100%; margin-bottom: 8px;"
          @click="${() => {
            const sampleData: ChartData = {
              type: chartType as any,
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Sales',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: '#2196F3',
                borderColor: '#1976D2'
              }]
            };
            this._updateWidgetConfig(widget.id, 'config.chartData', sampleData);
          }}"
        >
          📊 Load Sample Data
        </button>
        <button
          class="toolbar-button"
          style="width: 100%; margin-bottom: 8px;"
          @click="${() => {
            const multiSeriesData: ChartData = {
              type: chartType as any,
              labels: ['Q1', 'Q2', 'Q3', 'Q4'],
              datasets: [
                {
                  label: 'Product A',
                  data: [30, 45, 60, 55],
                  backgroundColor: '#2196F3',
                  borderColor: '#1976D2'
                },
                {
                  label: 'Product B',
                  data: [20, 35, 40, 50],
                  backgroundColor: '#4CAF50',
                  borderColor: '#388E3C'
                }
              ]
            };
            this._updateWidgetConfig(widget.id, 'config.chartData', multiSeriesData);
          }}"
        >
          📈 Multi-Series Data
        </button>
      </div>
    `;
  }

  private _renderTextWidgetProperties(widget: DashboardWidget) {
    if (widget.config.type !== 'text') return html``;
    const config: TextWidgetConfig = widget.config.config || {} as TextWidgetConfig;

    return html`
      <div class="property-group">
        <label class="property-label">Text Content</label>
        <textarea
          class="property-textarea"
          .value="${config.content || ''}"
          @input="${(e: Event) => {
            const textarea = e.target as HTMLTextAreaElement;
            this._updateWidgetConfig(widget.id, 'config.config.content', textarea.value);
          }}"
        ></textarea>
      </div>

      <div class="property-group">
        <label class="property-label">Font Size (px)</label>
        <input
          type="number"
          class="property-input property-number"
          .value="${config.fontSize || 16}"
          @input="${(e: Event) => {
            const input = e.target as HTMLInputElement;
            this._updateWidgetConfig(widget.id, 'config.config.fontSize', parseInt(input.value));
          }}"
        />
      </div>

      <div class="property-group">
        <label class="property-label">Font Weight</label>
        <select
          class="property-select"
          .value="${config.fontWeight || 'normal'}"
          @change="${(e: Event) => {
            const select = e.target as HTMLSelectElement;
            this._updateWidgetConfig(widget.id, 'config.config.fontWeight', select.value);
          }}"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="bolder">Bolder</option>
          <option value="lighter">Lighter</option>
        </select>
      </div>

      <div class="property-group">
        <label class="property-label">Text Align</label>
        <select
          class="property-select"
          .value="${config.textAlign || 'left'}"
          @change="${(e: Event) => {
            const select = e.target as HTMLSelectElement;
            this._updateWidgetConfig(widget.id, 'config.config.textAlign', select.value);
          }}"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>

      <div class="property-group">
        <label class="property-label">Text Color</label>
        <input
          type="color"
          class="property-input property-color"
          .value="${config.color || '#1a1a1a'}"
          @input="${(e: Event) => {
            const input = e.target as HTMLInputElement;
            this._updateWidgetConfig(widget.id, 'config.config.color', input.value);
          }}"
        />
      </div>
    `;
  }

  private _renderImageWidgetProperties(widget: DashboardWidget) {
    if (widget.config.type !== 'image') return html``;
    const config: ImageWidgetConfig = widget.config.config || {} as ImageWidgetConfig;

    return html`
      <div class="property-group">
        <label class="property-label">Image URL</label>
        <input
          type="text"
          class="property-input"
          .value="${config.src || ''}"
          @input="${(e: Event) => {
            const input = e.target as HTMLInputElement;
            this._updateWidgetConfig(widget.id, 'config.config.src', input.value);
          }}"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div class="property-group">
        <label class="property-label">Alt Text</label>
        <input
          type="text"
          class="property-input"
          .value="${config.alt || ''}"
          @input="${(e: Event) => {
            const input = e.target as HTMLInputElement;
            this._updateWidgetConfig(widget.id, 'config.config.alt', input.value);
          }}"
          placeholder="Image description"
        />
      </div>

      <div class="property-group">
        <label class="property-label">Image Fit</label>
        <select
          class="property-select"
          .value="${config.fit || 'contain'}"
          @change="${(e: Event) => {
            const select = e.target as HTMLSelectElement;
            this._updateWidgetConfig(widget.id, 'config.config.fit', select.value);
          }}"
        >
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
          <option value="scale-down">Scale Down</option>
        </select>
      </div>

      <div class="property-group">
        <label class="property-label">Link URL (optional)</label>
        <input
          type="text"
          class="property-input"
          .value="${config.link || ''}"
          @input="${(e: Event) => {
            const input = e.target as HTMLInputElement;
            this._updateWidgetConfig(widget.id, 'config.config.link', input.value);
          }}"
          placeholder="https://example.com"
        />
      </div>
    `;
  }

  private _renderMarkdownWidgetProperties(widget: DashboardWidget) {
    if (widget.config.type !== 'markdown') return html``;
    const config: MarkdownWidgetConfig = widget.config.config || {} as MarkdownWidgetConfig;

    return html`
      <div class="property-group">
        <label class="property-label">Markdown Content</label>
        <textarea
          class="property-textarea"
          style="min-height: 200px;"
          .value="${config.content || ''}"
          @input="${(e: Event) => {
            const textarea = e.target as HTMLTextAreaElement;
            this._updateWidgetConfig(widget.id, 'config.config.content', textarea.value);
          }}"
          placeholder="# Heading&#10;&#10;Your markdown content here..."
        ></textarea>
      </div>
    `;
  }

  render() {
    return html`
      <div class="editor-container">
        <div class="sidebar">
          <div class="sidebar-header">
            <h2 class="sidebar-title">Dashboard Editor</h2>
            <p class="sidebar-subtitle">Drag & drop to build</p>
          </div>
          ${this._renderWidgetPalette()}
        </div>

        <div class="main-content">
          ${this._renderToolbar()}
          ${this._renderCanvas()}
        </div>

        ${this._renderPropertiesPanel()}
      </div>
    `;
  }
}

