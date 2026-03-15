import { Command } from './command-history.js';
import { EditorState } from './editor-state.js';
import { OccupancyMap } from './occupancy-map.js';
import { DashboardWidget } from '../types/dashboard-types.js';

export class AddWidgetCommand implements Command {
  readonly description: string;
  constructor(
    private state: EditorState,
    private occupancy: OccupancyMap,
    private widget: DashboardWidget,
  ) {
    this.description = `Add ${widget.config.type} widget`;
  }

  execute(): void {
    this.state.addWidget(this.widget);
    this.occupancy.markCells(
      this.widget.id,
      this.widget.position.x, this.widget.position.y,
      this.widget.position.width, this.widget.position.height,
    );
  }

  undo(): void {
    this.occupancy.unmarkCells(
      this.widget.id,
      this.widget.position.x, this.widget.position.y,
      this.widget.position.width, this.widget.position.height,
    );
    this.state.removeWidget(this.widget.id);
  }
}

export class DeleteWidgetCommand implements Command {
  readonly description: string;
  private widget: DashboardWidget;

  constructor(
    private state: EditorState,
    private occupancy: OccupancyMap,
    widget: DashboardWidget,
  ) {
    this.widget = { ...widget, position: { ...widget.position } };
    this.description = `Delete ${widget.config.type} widget`;
  }

  execute(): void {
    this.occupancy.unmarkCells(
      this.widget.id,
      this.widget.position.x, this.widget.position.y,
      this.widget.position.width, this.widget.position.height,
    );
    this.state.removeWidget(this.widget.id);
  }

  undo(): void {
    this.state.addWidget(this.widget);
    this.occupancy.markCells(
      this.widget.id,
      this.widget.position.x, this.widget.position.y,
      this.widget.position.width, this.widget.position.height,
    );
  }
}

export class MoveWidgetCommand implements Command {
  readonly description = 'Move widget';

  constructor(
    private state: EditorState,
    private occupancy: OccupancyMap,
    private widgetId: string,
    private fromX: number,
    private fromY: number,
    private toX: number,
    private toY: number,
    private width: number,
    private height: number,
  ) {}

  execute(): void {
    this.occupancy.unmarkCells(this.widgetId, this.fromX, this.fromY, this.width, this.height);
    this.occupancy.markCells(this.widgetId, this.toX, this.toY, this.width, this.height);
    this.state.updateWidgetPosition(this.widgetId, this.toX, this.toY);
  }

  undo(): void {
    this.occupancy.unmarkCells(this.widgetId, this.toX, this.toY, this.width, this.height);
    this.occupancy.markCells(this.widgetId, this.fromX, this.fromY, this.width, this.height);
    this.state.updateWidgetPosition(this.widgetId, this.fromX, this.fromY);
  }
}

export class ResizeWidgetCommand implements Command {
  readonly description = 'Resize widget';

  constructor(
    private state: EditorState,
    private occupancy: OccupancyMap,
    private widgetId: string,
    private fromX: number,
    private fromY: number,
    private fromW: number,
    private fromH: number,
    private toX: number,
    private toY: number,
    private toW: number,
    private toH: number,
  ) {}

  execute(): void {
    this.occupancy.unmarkCells(this.widgetId, this.fromX, this.fromY, this.fromW, this.fromH);
    this.occupancy.markCells(this.widgetId, this.toX, this.toY, this.toW, this.toH);
    this.state.updateWidgetPosition(this.widgetId, this.toX, this.toY, this.toW, this.toH);
  }

  undo(): void {
    this.occupancy.unmarkCells(this.widgetId, this.toX, this.toY, this.toW, this.toH);
    this.occupancy.markCells(this.widgetId, this.fromX, this.fromY, this.fromW, this.fromH);
    this.state.updateWidgetPosition(this.widgetId, this.fromX, this.fromY, this.fromW, this.fromH);
  }
}

export class DuplicateWidgetCommand implements Command {
  readonly description = 'Duplicate widget';

  constructor(
    private state: EditorState,
    private occupancy: OccupancyMap,
    private newWidget: DashboardWidget,
  ) {}

  execute(): void {
    this.state.addWidget(this.newWidget);
    this.occupancy.markCells(
      this.newWidget.id,
      this.newWidget.position.x, this.newWidget.position.y,
      this.newWidget.position.width, this.newWidget.position.height,
    );
  }

  undo(): void {
    this.occupancy.unmarkCells(
      this.newWidget.id,
      this.newWidget.position.x, this.newWidget.position.y,
      this.newWidget.position.width, this.newWidget.position.height,
    );
    this.state.removeWidget(this.newWidget.id);
  }
}

export class UpdatePropertyCommand implements Command {
  readonly description: string;

  constructor(
    private state: EditorState,
    private widgetId: string,
    private path: string,
    private oldValue: any,
    private newValue: any,
  ) {
    this.description = `Update ${path}`;
  }

  execute(): void {
    this._applyValue(this.newValue);
  }

  undo(): void {
    this._applyValue(this.oldValue);
  }

  private _applyValue(value: any): void {
    const widget = this.state.getWidget(this.widgetId);
    if (!widget) return;

    const updated = JSON.parse(JSON.stringify(widget));
    const parts = this.path.split('.');
    let obj = updated as any;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
      if (!obj) return;
    }
    obj[parts[parts.length - 1]] = value;
    this.state.updateWidget(this.widgetId, updated);
  }
}
