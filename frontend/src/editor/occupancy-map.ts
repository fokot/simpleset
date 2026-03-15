import { DashboardWidget } from '../types/dashboard-types.js';

/**
 * Tracks which grid cells are occupied by which widget.
 * Grid is columns (x) by rows (y). Each cell stores the widget id or null.
 */
export class OccupancyMap {
  private grid: (string | null)[][] = [];
  readonly columns: number;
  private _maxRow: number;

  constructor(columns = 12, initialRows = 50) {
    this.columns = columns;
    this._maxRow = initialRows;
    this._initGrid(initialRows);
  }

  private _initGrid(rows: number): void {
    this.grid = [];
    for (let r = 0; r < rows; r++) {
      this.grid[r] = new Array(this.columns).fill(null);
    }
  }

  private _ensureRows(rows: number): void {
    while (this.grid.length < rows) {
      this.grid.push(new Array(this.columns).fill(null));
    }
    if (rows > this._maxRow) this._maxRow = rows;
  }

  /** Rebuild the entire map from a list of widgets. */
  buildFromWidgets(widgets: readonly DashboardWidget[]): void {
    this._initGrid(this._maxRow);
    for (const w of widgets) {
      this.markCells(w.id, w.position.x, w.position.y, w.position.width, w.position.height);
    }
  }

  /** Mark cells as occupied by the given widget id. */
  markCells(widgetId: string, x: number, y: number, width: number, height: number): void {
    this._ensureRows(y + height);
    for (let r = y; r < y + height; r++) {
      for (let c = x; c < x + width; c++) {
        if (c >= 0 && c < this.columns) {
          this.grid[r][c] = widgetId;
        }
      }
    }
  }

  /** Unmark cells occupied by the given widget id. */
  unmarkCells(widgetId: string, x: number, y: number, width: number, height: number): void {
    for (let r = y; r < y + height && r < this.grid.length; r++) {
      for (let c = x; c < x + width && c < this.columns; c++) {
        if (c >= 0 && this.grid[r]?.[c] === widgetId) {
          this.grid[r][c] = null;
        }
      }
    }
  }

  /**
   * Check if placing a widget at (x, y) with given size would collide.
   * @param excludeId - Widget id to exclude from collision (for moves/resizes of self)
   * @returns The set of widget ids that would be collided with, or empty set if no collision.
   */
  checkCollision(x: number, y: number, width: number, height: number, excludeId?: string): Set<string> {
    const collisions = new Set<string>();

    // Out of bounds check
    if (x < 0 || x + width > this.columns || y < 0) {
      collisions.add('__out_of_bounds__');
      return collisions;
    }

    this._ensureRows(y + height);

    for (let r = y; r < y + height; r++) {
      for (let c = x; c < x + width; c++) {
        const occupant = this.grid[r]?.[c];
        if (occupant && occupant !== excludeId) {
          collisions.add(occupant);
        }
      }
    }
    return collisions;
  }

  /** Check if a position is valid (no collisions, in bounds). */
  isValidPosition(x: number, y: number, width: number, height: number, excludeId?: string): boolean {
    if (x < 0 || x + width > this.columns || y < 0) return false;
    return this.checkCollision(x, y, width, height, excludeId).size === 0;
  }

  /**
   * Find the nearest available position for a widget of the given size.
   * Searches row by row, column by column.
   */
  findNearestAvailable(width: number, height: number, preferX = 0, preferY = 0): { x: number; y: number } | null {
    // Try preferred position first
    if (this.isValidPosition(preferX, preferY, width, height)) {
      return { x: preferX, y: preferY };
    }

    // Search outward from preferred position
    for (let r = 0; r < this._maxRow + 10; r++) {
      for (let c = 0; c <= this.columns - width; c++) {
        if (this.isValidPosition(c, r, width, height)) {
          return { x: c, y: r };
        }
      }
    }
    return null;
  }
}
