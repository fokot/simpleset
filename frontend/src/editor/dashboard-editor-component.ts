import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DashboardWidget, WidgetType } from '../types/dashboard-types.js';
import { EditorState } from './editor-state.js';
import { OccupancyMap } from './occupancy-map.js';
import { CommandHistory, CompositeCommand } from './command-history.js';
import {
  AddWidgetCommand, DeleteWidgetCommand, MoveWidgetCommand,
  ResizeWidgetCommand, DuplicateWidgetCommand, UpdatePropertyCommand,
} from './editor-commands.js';
import { WIDGET_DEFAULTS, createDefaultPosition } from './widget-defaults.js';
import './editor-toolbar.js';
import './editor-canvas.js';
import './editor-widget-palette.js';
import './editor-property-panel.js';

@customElement('dashboard-editor-component')
export class DashboardEditorComponent extends LitElement {
  private _editorState = new EditorState(this);
  private _occupancy = new OccupancyMap(12);
  private _history = new CommandHistory(() => this.requestUpdate());

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: 'Outfit', system-ui, sans-serif;
      color: #2a2520;
      --amber: #d4a04a;
      --amber-light: #f0d799;
      --amber-glow: rgba(212, 160, 74, 0.15);
      --charcoal: #2a2520;
      --charcoal-light: #3d3630;
      --cream: #f5f2ed;
      --cream-dark: #e8e3db;
      --surface: #ffffff;
      --text-muted: #8a8279;
      --text-dim: #b5ada4;
    }

    .main-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar-left {
      width: 240px;
      background: var(--surface);
      border-right: 1px solid var(--cream-dark);
      box-sizing: border-box;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-right {
      width: 280px;
      background: var(--surface);
      border-left: 1px solid var(--cream-dark);
      box-sizing: border-box;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .canvas-area {
      flex: 1;
      background: var(--cream);
      padding: 24px;
      box-sizing: border-box;
      overflow: auto;
      position: relative;
    }

    editor-canvas {
      display: block;
      min-height: calc(100% - 60px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeyDown);
  }

  // --- Event handlers from canvas ---

  private _onAddWidget(e: CustomEvent) {
    const { type, x, y, width, height } = e.detail as {
      type: WidgetType; x: number; y: number; width: number; height: number;
    };
    const defaults = WIDGET_DEFAULTS[type];
    const widget: DashboardWidget = {
      id: this._editorState.generateId(),
      title: defaults.label,
      position: { x, y, width, height },
      config: JSON.parse(JSON.stringify(defaults.defaultConfig)),
      style: {},
    };
    const cmd = new AddWidgetCommand(this._editorState, this._occupancy, widget);
    this._history.execute(cmd);
    this._editorState.select(widget.id);
  }

  private _onSelectWidget(e: CustomEvent) {
    this._editorState.select(e.detail.widgetId);
  }

  private _onToggleSelect(e: CustomEvent) {
    this._editorState.toggleSelect(e.detail.widgetId);
  }

  private _onDeselectAll() {
    this._editorState.deselectAll();
  }

  private _onMoveWidgets(e: CustomEvent) {
    const { moves } = e.detail as {
      moves: Array<{ widgetId: string; fromX: number; fromY: number; toX: number; toY: number; width: number; height: number }>;
    };

    if (moves.length === 1) {
      const m = moves[0];
      const cmd = new MoveWidgetCommand(
        this._editorState, this._occupancy,
        m.widgetId, m.fromX, m.fromY, m.toX, m.toY, m.width, m.height,
      );
      this._history.execute(cmd);
    } else if (moves.length > 1) {
      const cmds = moves.map(m => new MoveWidgetCommand(
        this._editorState, this._occupancy,
        m.widgetId, m.fromX, m.fromY, m.toX, m.toY, m.width, m.height,
      ));
      this._history.execute(new CompositeCommand('Move widgets', cmds));
    }
  }

  private _onResizeWidget(e: CustomEvent) {
    const d = e.detail;
    const cmd = new ResizeWidgetCommand(
      this._editorState, this._occupancy,
      d.widgetId, d.fromX, d.fromY, d.fromW, d.fromH, d.toX, d.toY, d.toW, d.toH,
    );
    this._history.execute(cmd);
  }

  private _onDuplicateWidget(e: CustomEvent) {
    const { widgetId } = e.detail;
    const widget = this._editorState.getWidget(widgetId);
    if (!widget) return;

    const pos = this._occupancy.findNearestAvailable(
      widget.position.width, widget.position.height,
      widget.position.x + 1, widget.position.y,
    );
    if (!pos) return;

    const newWidget: DashboardWidget = {
      ...JSON.parse(JSON.stringify(widget)),
      id: this._editorState.generateId(),
      position: { ...widget.position, x: pos.x, y: pos.y },
    };
    const cmd = new DuplicateWidgetCommand(this._editorState, this._occupancy, newWidget);
    this._history.execute(cmd);
    this._editorState.select(newWidget.id);
  }

  private _onDeleteWidget(e: CustomEvent) {
    const { widgetId } = e.detail;
    const widget = this._editorState.getWidget(widgetId);
    if (!widget) return;

    const cmd = new DeleteWidgetCommand(this._editorState, this._occupancy, widget);
    this._history.execute(cmd);
  }

  private _onPropertyChange(e: CustomEvent) {
    const { widgetId, path, value } = e.detail;
    const widget = this._editorState.getWidget(widgetId);
    if (!widget) return;

    // Handle position changes via move/resize commands
    if (path === 'position.x' || path === 'position.y') {
      const pos = widget.position;
      const newX = path === 'position.x' ? value : pos.x;
      const newY = path === 'position.y' ? value : pos.y;
      if (this._occupancy.isValidPosition(newX, newY, pos.width, pos.height, widgetId)) {
        const cmd = new MoveWidgetCommand(
          this._editorState, this._occupancy,
          widgetId, pos.x, pos.y, newX, newY, pos.width, pos.height,
        );
        this._history.execute(cmd);
      }
      return;
    }

    if (path === 'position.width' || path === 'position.height') {
      const pos = widget.position;
      const newW = path === 'position.width' ? value : pos.width;
      const newH = path === 'position.height' ? value : pos.height;
      if (this._occupancy.isValidPosition(pos.x, pos.y, newW, newH, widgetId)) {
        const cmd = new ResizeWidgetCommand(
          this._editorState, this._occupancy,
          widgetId, pos.x, pos.y, pos.width, pos.height, pos.x, pos.y, newW, newH,
        );
        this._history.execute(cmd);
      }
      return;
    }

    // Get old value
    const parts = path.split('.');
    let oldValue: any = widget;
    for (const p of parts) {
      oldValue = (oldValue as any)?.[p];
    }

    const cmd = new UpdatePropertyCommand(this._editorState, widgetId, path, oldValue, value);
    this._history.execute(cmd);
  }

  private _onUndo() {
    this._history.undo();
    this._occupancy.buildFromWidgets(this._editorState.widgets);
  }

  private _onRedo() {
    this._history.redo();
    this._occupancy.buildFromWidgets(this._editorState.widgets);
  }

  // --- Keyboard shortcuts ---

  private _onKeyDown = (e: KeyboardEvent): void => {
    // Don't handle if focus is in an input
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const isMeta = e.metaKey || e.ctrlKey;

    // Undo: Ctrl/Cmd+Z
    if (isMeta && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      this._onUndo();
      return;
    }

    // Redo: Ctrl/Cmd+Shift+Z
    if (isMeta && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      this._onRedo();
      return;
    }

    // Delete: Delete or Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this._deleteSelected();
      return;
    }

    // Escape: deselect
    if (e.key === 'Escape') {
      this._editorState.deselectAll();
      return;
    }

    // Arrow keys: nudge
    const arrowMap: Record<string, { dx: number; dy: number }> = {
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
    };

    if (arrowMap[e.key] && this._editorState.selectedIds.size > 0) {
      e.preventDefault();
      this._nudgeSelected(arrowMap[e.key].dx, arrowMap[e.key].dy);
    }
  };

  private _deleteSelected(): void {
    const selected = this._editorState.selectedWidgets;
    if (selected.length === 0) return;

    if (selected.length === 1) {
      const cmd = new DeleteWidgetCommand(this._editorState, this._occupancy, selected[0]);
      this._history.execute(cmd);
    } else {
      const cmds = selected.map(w => new DeleteWidgetCommand(this._editorState, this._occupancy, w));
      this._history.execute(new CompositeCommand('Delete widgets', cmds));
    }
  }

  private _nudgeSelected(dx: number, dy: number): void {
    const selected = this._editorState.selectedWidgets;
    if (selected.length === 0) return;

    // Check all can move
    const selectedIds = new Set(selected.map(w => w.id));
    for (const w of selected) {
      const newX = w.position.x + dx;
      const newY = w.position.y + dy;
      if (newX < 0 || newX + w.position.width > 12 || newY < 0) return;
      const collisions = this._occupancy.checkCollision(newX, newY, w.position.width, w.position.height, w.id);
      for (const id of collisions) {
        if (!selectedIds.has(id)) return; // real collision
      }
    }

    if (selected.length === 1) {
      const w = selected[0];
      const cmd = new MoveWidgetCommand(
        this._editorState, this._occupancy,
        w.id, w.position.x, w.position.y,
        w.position.x + dx, w.position.y + dy,
        w.position.width, w.position.height,
      );
      this._history.execute(cmd);
    } else {
      const cmds = selected.map(w => new MoveWidgetCommand(
        this._editorState, this._occupancy,
        w.id, w.position.x, w.position.y,
        w.position.x + dx, w.position.y + dy,
        w.position.width, w.position.height,
      ));
      this._history.execute(new CompositeCommand('Nudge widgets', cmds));
    }
  }

  render() {
    const selectedWidgets = this._editorState.selectedWidgets;

    return html`
      <editor-toolbar
        .canUndo=${this._history.canUndo}
        .canRedo=${this._history.canRedo}
        @undo=${this._onUndo}
        @redo=${this._onRedo}
      ></editor-toolbar>
      <div class="main-area">
        <div class="sidebar-left">
          <editor-widget-palette></editor-widget-palette>
        </div>
        <div class="canvas-area"
          @add-widget=${this._onAddWidget}
          @select-widget=${this._onSelectWidget}
          @toggle-select=${this._onToggleSelect}
          @deselect-all=${this._onDeselectAll}
          @move-widgets=${this._onMoveWidgets}
          @resize-widget=${this._onResizeWidget}
          @duplicate-widget=${this._onDuplicateWidget}
          @delete-widget=${this._onDeleteWidget}
        >
          <editor-canvas
            .widgets=${this._editorState.widgets}
            .selectedIds=${this._editorState.selectedIds}
            .occupancy=${this._occupancy}
          ></editor-canvas>
        </div>
        <div class="sidebar-right"
          @property-change=${this._onPropertyChange}
        >
          <editor-property-panel
            .widgets=${selectedWidgets}
            .multiSelect=${selectedWidgets.length > 1}
          ></editor-property-panel>
        </div>
      </div>
    `;
  }
}
