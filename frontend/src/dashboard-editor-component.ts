import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Dashboard, DashboardWidget, WidgetType, WidgetPosition } from './types/dashboard-types.js';
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

    .widget-container.selected {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .widget-container[draggable="true"] {
      cursor: grab;
    }

    .widget-container[draggable="true"]:active {
      cursor: grabbing;
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
        return { type: 'chart' };
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

  private _renderWidget(widget: DashboardWidget) {
    const isSelected = this._selectedWidgetId === widget.id;
    const isDragging = this._dragState.isDragging && this._dragState.draggedWidget?.id === widget.id;

    return html`
      <div
        class="widget-container ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}"
        style="${this._getWidgetGridStyle(widget)}"
        draggable="true"
        @dragstart="${(e: DragEvent) => this._handleWidgetDragStart(e, widget)}"
        @dragend="${this._handleDragEnd}"
        @click="${() => this._selectWidget(widget.id)}"
      >
        <div class="widget-header">
          <h3 class="widget-title">${widget.title || 'Untitled Widget'}</h3>
          <div class="widget-actions">
            <button
              class="widget-action-btn delete"
              @click="${(e: Event) => {
                e.stopPropagation();
                this._deleteWidget(widget.id);
              }}"
              title="Delete widget"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="widget-content">
          ${widget.config.type} widget placeholder
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
      </div>
    `;
  }
}

