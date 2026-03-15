import { ReactiveController, ReactiveControllerHost } from 'lit';
import { DashboardWidget } from '../types/dashboard-types.js';

/**
 * Central editor state manager as a Lit ReactiveController.
 * Manages widgets, selection, and notifies the host on changes.
 */
export class EditorState implements ReactiveController {
  host: ReactiveControllerHost;

  private _widgets: DashboardWidget[] = [];
  private _selectedIds: Set<string> = new Set();
  private _nextId = 1;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}

  // --- Widget accessors ---

  get widgets(): readonly DashboardWidget[] {
    return this._widgets;
  }

  get selectedIds(): ReadonlySet<string> {
    return this._selectedIds;
  }

  get selectedWidgets(): DashboardWidget[] {
    return this._widgets.filter(w => this._selectedIds.has(w.id));
  }

  getWidget(id: string): DashboardWidget | undefined {
    return this._widgets.find(w => w.id === id);
  }

  // --- Widget mutations ---

  generateId(): string {
    return `widget-${this._nextId++}`;
  }

  addWidget(widget: DashboardWidget): void {
    this._widgets = [...this._widgets, widget];
    this._notify();
  }

  removeWidget(id: string): void {
    this._widgets = this._widgets.filter(w => w.id !== id);
    this._selectedIds.delete(id);
    this._notify();
  }

  updateWidget(id: string, updates: Partial<DashboardWidget>): void {
    this._widgets = this._widgets.map(w =>
      w.id === id ? { ...w, ...updates } : w
    );
    this._notify();
  }

  updateWidgetPosition(id: string, x: number, y: number, width?: number, height?: number): void {
    this._widgets = this._widgets.map(w => {
      if (w.id !== id) return w;
      const pos = { ...w.position, x, y };
      if (width !== undefined) pos.width = width;
      if (height !== undefined) pos.height = height;
      return { ...w, position: pos };
    });
    this._notify();
  }

  setWidgets(widgets: DashboardWidget[]): void {
    this._widgets = [...widgets];
    this._notify();
  }

  // --- Selection ---

  select(id: string): void {
    this._selectedIds = new Set([id]);
    this._notify();
  }

  toggleSelect(id: string): void {
    const next = new Set(this._selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this._selectedIds = next;
    this._notify();
  }

  deselectAll(): void {
    if (this._selectedIds.size === 0) return;
    this._selectedIds = new Set();
    this._notify();
  }

  isSelected(id: string): boolean {
    return this._selectedIds.has(id);
  }

  // --- Change notification ---

  private _notify(): void {
    this.host.requestUpdate();
  }
}
