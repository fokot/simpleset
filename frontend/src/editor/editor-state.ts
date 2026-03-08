import { ReactiveController, ReactiveControllerHost } from 'lit';
import { Dashboard, DashboardWidget, WidgetPosition, WidgetConfig, WidgetType } from '../types/dashboard-types.js';

export interface EditorStateSnapshot {
  dashboard: Dashboard;
  selectedWidgetId: string | null;
}

const DEFAULT_WIDGET_CONFIGS: Record<WidgetType, () => WidgetConfig> = {
  chart: () => ({ type: 'chart' as const }),
  text: () => ({ type: 'text' as const, config: { content: 'Enter text here', fontSize: 16, textAlign: 'left' as const } }),
  image: () => ({ type: 'image' as const, config: { src: '', alt: 'Image', fit: 'contain' as const } }),
  iframe: () => ({ type: 'iframe' as const, config: { src: '', title: 'Embedded content' } }),
  filter: () => ({ type: 'filter' as const, config: { type: 'dropdown' as const, label: 'Filter', parameter: 'param1' } }),
  metric: () => ({ type: 'metric' as const, config: { title: 'Metric', value: 0 } }),
  table: () => ({ type: 'table' as const, config: { columns: [{ key: 'col1', title: 'Column 1' }] } }),
  markdown: () => ({ type: 'markdown' as const, config: { content: '# Heading\n\nMarkdown content here.' } }),
};

const DEFAULT_POSITIONS: Record<WidgetType, () => WidgetPosition> = {
  chart: () => ({ x: 0, y: 0, width: 6, height: 4, minWidth: 3, minHeight: 2 }),
  text: () => ({ x: 0, y: 0, width: 4, height: 2, minWidth: 2, minHeight: 1 }),
  image: () => ({ x: 0, y: 0, width: 4, height: 3, minWidth: 2, minHeight: 2 }),
  iframe: () => ({ x: 0, y: 0, width: 6, height: 4, minWidth: 3, minHeight: 2 }),
  filter: () => ({ x: 0, y: 0, width: 3, height: 1, minWidth: 2, minHeight: 1 }),
  metric: () => ({ x: 0, y: 0, width: 3, height: 2, minWidth: 2, minHeight: 1 }),
  table: () => ({ x: 0, y: 0, width: 6, height: 4, minWidth: 4, minHeight: 2 }),
  markdown: () => ({ x: 0, y: 0, width: 4, height: 3, minWidth: 2, minHeight: 1 }),
};

let nextWidgetId = 1;

function generateWidgetId(): string {
  return `widget-${Date.now()}-${nextWidgetId++}`;
}

function cloneDashboard(dashboard: Dashboard): Dashboard {
  return JSON.parse(JSON.stringify(dashboard));
}

function createDefaultDashboard(): Dashboard {
  return {
    id: 'new-dashboard',
    name: 'Untitled Dashboard',
    description: '',
    layout: {
      type: 'grid',
      columns: 12,
      rowHeight: 80,
      margin: [16, 16],
      containerPadding: [16, 16],
    },
    widgets: [],
    sharing: { isPublic: false, allowedUsers: [] },
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: 'editor',
      updatedAt: new Date().toISOString(),
      updatedBy: 'editor',
    },
  };
}

export class EditorState implements ReactiveController {
  host: ReactiveControllerHost;

  private _dashboard: Dashboard;
  private _selectedWidgetId: string | null = null;
  private _undoStack: Dashboard[] = [];
  private _redoStack: Dashboard[] = [];
  private _isDirty = false;
  private _maxUndoSteps = 50;

  constructor(host: ReactiveControllerHost, dashboard?: Dashboard) {
    this.host = host;
    host.addController(this);
    this._dashboard = dashboard ? cloneDashboard(dashboard) : createDefaultDashboard();
  }

  hostConnected() {}
  hostDisconnected() {}

  // --- Getters ---

  get dashboard(): Dashboard {
    return this._dashboard;
  }

  get selectedWidgetId(): string | null {
    return this._selectedWidgetId;
  }

  get selectedWidget(): DashboardWidget | null {
    if (!this._selectedWidgetId) return null;
    return this._dashboard.widgets?.find(w => w.id === this._selectedWidgetId) ?? null;
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  get widgets(): DashboardWidget[] {
    return this._dashboard.widgets ?? [];
  }

  // --- State mutation helpers ---

  private _pushUndo(): void {
    this._undoStack.push(cloneDashboard(this._dashboard));
    if (this._undoStack.length > this._maxUndoSteps) {
      this._undoStack.shift();
    }
    this._redoStack = [];
    this._isDirty = true;
  }

  private _requestUpdate(): void {
    this.host.requestUpdate();
  }

  // --- Dashboard operations ---

  setDashboard(dashboard: Dashboard): void {
    this._pushUndo();
    this._dashboard = cloneDashboard(dashboard);
    this._selectedWidgetId = null;
    this._requestUpdate();
  }

  updateDashboardProperties(props: Partial<Pick<Dashboard, 'name' | 'description' | 'layout' | 'theme'>>): void {
    this._pushUndo();
    Object.assign(this._dashboard, props);
    this._dashboard.audit.updatedAt = new Date().toISOString();
    this._requestUpdate();
  }

  // --- Widget CRUD ---

  addWidget(type: WidgetType, position?: Partial<WidgetPosition>): DashboardWidget {
    this._pushUndo();
    const defaultPos = DEFAULT_POSITIONS[type]();
    const pos: WidgetPosition = { ...defaultPos, ...position };

    // Find a free position if placed at 0,0 and something is already there
    pos.y = this._findFreeRow(pos);

    const widget: DashboardWidget = {
      id: generateWidgetId(),
      title: this._getDefaultTitle(type),
      position: pos,
      config: DEFAULT_WIDGET_CONFIGS[type](),
      visible: true,
    };

    if (!this._dashboard.widgets) {
      this._dashboard.widgets = [];
    }
    this._dashboard.widgets.push(widget);
    this._selectedWidgetId = widget.id;
    this._requestUpdate();
    return widget;
  }

  removeWidget(widgetId: string): void {
    if (!this._dashboard.widgets) return;
    this._pushUndo();
    this._dashboard.widgets = this._dashboard.widgets.filter(w => w.id !== widgetId);
    if (this._selectedWidgetId === widgetId) {
      this._selectedWidgetId = null;
    }
    this._requestUpdate();
  }

  duplicateWidget(widgetId: string): DashboardWidget | null {
    const source = this._dashboard.widgets?.find(w => w.id === widgetId);
    if (!source) return null;

    this._pushUndo();
    const clone: DashboardWidget = JSON.parse(JSON.stringify(source));
    clone.id = generateWidgetId();
    clone.title = (clone.title || '') + ' (copy)';
    clone.position.y = this._findFreeRow(clone.position);

    this._dashboard.widgets!.push(clone);
    this._selectedWidgetId = clone.id;
    this._requestUpdate();
    return clone;
  }

  updateWidgetPosition(widgetId: string, position: Partial<WidgetPosition>): void {
    const widget = this._dashboard.widgets?.find(w => w.id === widgetId);
    if (!widget) return;
    this._pushUndo();
    Object.assign(widget.position, position);
    // Clamp to grid bounds
    const cols = this._dashboard.layout.columns ?? 12;
    widget.position.x = Math.max(0, Math.min(widget.position.x, cols - widget.position.width));
    widget.position.y = Math.max(0, widget.position.y);
    widget.position.width = Math.max(widget.position.minWidth ?? 1, Math.min(widget.position.width, cols - widget.position.x));
    widget.position.height = Math.max(widget.position.minHeight ?? 1, widget.position.height);
    this._requestUpdate();
  }

  updateWidgetConfig(widgetId: string, config: Partial<WidgetConfig>): void {
    const widget = this._dashboard.widgets?.find(w => w.id === widgetId);
    if (!widget) return;
    this._pushUndo();
    Object.assign(widget.config, config);
    this._requestUpdate();
  }

  updateWidgetTitle(widgetId: string, title: string): void {
    const widget = this._dashboard.widgets?.find(w => w.id === widgetId);
    if (!widget) return;
    this._pushUndo();
    widget.title = title;
    this._requestUpdate();
  }

  updateWidgetStyle(widgetId: string, style: Record<string, any>): void {
    const widget = this._dashboard.widgets?.find(w => w.id === widgetId);
    if (!widget) return;
    this._pushUndo();
    widget.style = { ...widget.style, ...style };
    this._requestUpdate();
  }

  // --- Selection ---

  selectWidget(widgetId: string | null): void {
    if (this._selectedWidgetId !== widgetId) {
      this._selectedWidgetId = widgetId;
      this._requestUpdate();
    }
  }

  // --- Undo/Redo ---

  undo(): void {
    if (!this.canUndo) return;
    this._redoStack.push(cloneDashboard(this._dashboard));
    this._dashboard = this._undoStack.pop()!;
    // Preserve selection if widget still exists
    if (this._selectedWidgetId && !this._dashboard.widgets?.find(w => w.id === this._selectedWidgetId)) {
      this._selectedWidgetId = null;
    }
    this._requestUpdate();
  }

  redo(): void {
    if (!this.canRedo) return;
    this._undoStack.push(cloneDashboard(this._dashboard));
    this._dashboard = this._redoStack.pop()!;
    this._requestUpdate();
  }

  // --- Save ---

  markClean(): void {
    this._isDirty = false;
    this._requestUpdate();
  }

  exportJSON(): string {
    return JSON.stringify(this._dashboard, null, 2);
  }

  importJSON(json: string): void {
    const parsed = JSON.parse(json);
    this.setDashboard(parsed);
  }

  // --- Helpers ---

  private _findFreeRow(position: WidgetPosition): number {
    if (!this._dashboard.widgets || this._dashboard.widgets.length === 0) return 0;
    const maxBottom = Math.max(...this._dashboard.widgets.map(w => w.position.y + w.position.height));
    // Check if requested position overlaps with any existing widget
    const overlaps = this._dashboard.widgets.some(w =>
      position.x < w.position.x + w.position.width &&
      position.x + position.width > w.position.x &&
      position.y < w.position.y + w.position.height &&
      position.y + position.height > w.position.y
    );
    return overlaps ? maxBottom : position.y;
  }

  private _getDefaultTitle(type: WidgetType): string {
    const titles: Record<WidgetType, string> = {
      chart: 'New Chart',
      text: 'Text Block',
      image: 'Image',
      iframe: 'Embedded Content',
      filter: 'Filter',
      metric: 'Metric',
      table: 'Data Table',
      markdown: 'Markdown',
    };
    return titles[type];
  }
}
