# Collision Detection Implementation

## 🎯 Overview

The dashboard editor now includes comprehensive collision detection to prevent widgets from overlapping. When a widget is dropped or moved, the system automatically finds the nearest valid position if the preferred position would cause a collision.

---

## ✨ Features

### 1. **Automatic Position Adjustment**
- When dropping a widget, if the target position overlaps with existing widgets, the system automatically finds the nearest valid position
- Uses a spiral search pattern to find the closest available spot
- Falls back to placing at the bottom of the dashboard if no nearby position is available

### 2. **Real-Time Visual Feedback**
- **Blue Preview Box**: Shows where the widget will be placed (valid position)
- **Red Preview Box**: Indicates the position would cause a collision (will auto-adjust)
- **Canvas Highlight**: 
  - Blue border when dragging over valid area
  - Red border when current position would cause collision

### 3. **Smart Collision Detection**
- Checks for overlaps in the grid coordinate system
- Considers widget dimensions (width and height)
- Excludes the widget being moved from collision checks
- Works with the 12-column grid layout

---

## 🔧 Implementation Details

### Core Functions

#### 1. `_checkCollision(pos1, pos2)`
Checks if two widget positions overlap in the grid.

```typescript
private _checkCollision(
  pos1: WidgetPosition,
  pos2: WidgetPosition
): boolean {
  const x1End = pos1.x + pos1.width;
  const y1End = pos1.y + pos1.height;
  const x2End = pos2.x + pos2.width;
  const y2End = pos2.y + pos2.height;

  // No overlap if one rectangle is completely outside the other
  if (x1End <= pos2.x || x2End <= pos1.x || y1End <= pos2.y || y2End <= pos1.y) {
    return false;
  }

  return true;
}
```

**Algorithm**: Uses rectangle intersection logic
- Checks if rectangles are completely separated on X or Y axis
- Returns `true` if they overlap, `false` otherwise

#### 2. `_hasCollision(position, excludeWidgetId?)`
Checks if a position would collide with any existing widgets.

```typescript
private _hasCollision(
  position: WidgetPosition,
  excludeWidgetId?: string
): boolean {
  return this._widgets.some(widget => {
    if (excludeWidgetId && widget.id === excludeWidgetId) {
      return false; // Skip the widget being moved
    }
    return this._checkCollision(position, widget.position);
  });
}
```

**Features**:
- Iterates through all widgets on the dashboard
- Optionally excludes a widget (useful when moving existing widgets)
- Returns `true` if any collision is detected

#### 3. `_findNearestValidPosition(preferredPosition, excludeWidgetId?)`
Finds the nearest valid position using a spiral search pattern.

```typescript
private _findNearestValidPosition(
  preferredPosition: WidgetPosition,
  excludeWidgetId?: string
): WidgetPosition {
  // First check if preferred position is valid
  if (!this._hasCollision(preferredPosition, excludeWidgetId)) {
    return preferredPosition;
  }

  // Try positions in a spiral pattern
  for (let radius = 1; radius <= 10; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        // Only check perimeter positions
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
          continue;
        }

        const testPosition = {
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

  // Fallback: place at bottom
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
```

**Algorithm**:
1. **First**: Check if preferred position is already valid
2. **Spiral Search**: Try positions in expanding circles around the preferred position
   - Radius 1: Check 8 positions around the preferred spot
   - Radius 2: Check 16 positions in the next ring
   - Continue up to radius 10
3. **Fallback**: If no valid position found nearby, place at the bottom of the dashboard

**Why Spiral?**: Ensures the widget is placed as close as possible to where the user dropped it.

#### 4. `_checkDragCollision(e)`
Real-time collision checking during drag operations.

```typescript
private _checkDragCollision(e: DragEvent) {
  const canvasElement = this.shadowRoot?.querySelector('.dashboard-grid');
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

  // Determine widget size
  let width = 4, height = 3;
  let excludeWidgetId: string | undefined;

  if (this._dragState.draggedWidget) {
    width = this._dragState.draggedWidget.position.width;
    height = this._dragState.draggedWidget.position.height;
    excludeWidgetId = this._dragState.draggedWidget.id;
  }

  const testPosition = {
    x: Math.max(0, Math.min(gridX, this._columns - width)),
    y: Math.max(0, gridY),
    width,
    height,
  };

  // Update state for visual feedback
  this._invalidDropPosition = this._hasCollision(testPosition, excludeWidgetId);
  this._previewPosition = testPosition;
}
```

**Features**:
- Called on every `dragover` event
- Calculates grid position from mouse coordinates
- Updates visual feedback states
- Shows preview box at the target position

---

## 🎨 Visual Feedback

### State Variables

```typescript
@state()
private _invalidDropPosition: boolean = false;

@state()
private _previewPosition: WidgetPosition | null = null;
```

### CSS Classes

```css
/* Valid drop zone */
.dashboard-canvas.drag-over {
  background: rgba(102, 126, 234, 0.05);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3) inset;
}

/* Invalid drop zone (collision detected) */
.dashboard-canvas.drag-over.invalid-position {
  background: rgba(239, 68, 68, 0.05);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) inset;
}

/* Preview widget (valid position) */
.widget-preview {
  background: rgba(102, 126, 234, 0.1);
  border: 2px dashed rgba(102, 126, 234, 0.5);
  border-radius: 8px;
  pointer-events: none;
  z-index: 1000;
}

/* Preview widget (invalid position) */
.widget-preview.invalid {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}
```

### Preview Widget Rendering

```typescript
private _renderPreviewWidget() {
  if (!this._previewPosition) return '';

  const previewClasses = [
    'widget-preview',
    this._invalidDropPosition ? 'invalid' : ''
  ].filter(Boolean).join(' ');

  return html`
    <div
      class="${previewClasses}"
      style="${this._getWidgetGridStyle({ position: this._previewPosition })}"
    >
    </div>
  `;
}
```

---

## 🧪 Testing Guide

### Test Scenarios

#### 1. **Add Widget to Empty Dashboard**
- ✅ Drag a widget from palette
- ✅ Drop anywhere on empty canvas
- ✅ Widget should appear at the dropped position
- ✅ No collision detection needed

#### 2. **Add Widget Next to Existing Widget**
- ✅ Add first widget
- ✅ Drag second widget from palette
- ✅ Drop it next to the first widget (no overlap)
- ✅ Should place at exact drop position
- ✅ Preview box should be blue

#### 3. **Add Widget on Top of Existing Widget**
- ✅ Add first widget at position (0, 0)
- ✅ Drag second widget from palette
- ✅ Try to drop it at position (0, 0) (overlapping)
- ✅ Preview box should turn red
- ✅ Widget should auto-adjust to nearest valid position
- ✅ Widget appears next to or below the first widget

#### 4. **Move Widget to Valid Position**
- ✅ Add two widgets
- ✅ Drag one widget to an empty area
- ✅ Preview box should be blue
- ✅ Widget should move to exact drop position

#### 5. **Move Widget to Overlapping Position**
- ✅ Add two widgets
- ✅ Drag one widget on top of the other
- ✅ Preview box should turn red
- ✅ Widget should auto-adjust to nearest valid position
- ✅ Original widget should move, not create duplicate

#### 6. **Fill Dashboard and Add More**
- ✅ Add multiple widgets filling the top area
- ✅ Drag new widget from palette
- ✅ Try to drop in filled area
- ✅ Widget should auto-place at bottom

---

## 📊 Collision Detection Flow

```
User drags widget
    ↓
dragover event fires
    ↓
_checkDragCollision() called
    ↓
Calculate grid position from mouse coordinates
    ↓
Check if position would collide with existing widgets
    ↓
Update visual feedback:
  - _invalidDropPosition (red/blue border)
  - _previewPosition (show preview box)
    ↓
User drops widget
    ↓
drop event fires
    ↓
_addNewWidget() or _moveWidget() called
    ↓
_findNearestValidPosition() called
    ↓
If collision detected:
  - Search for nearest valid position (spiral pattern)
  - Fallback to bottom if no nearby position
    ↓
Widget placed at valid position
    ↓
Dashboard re-renders with new widget
```

---

## 🎯 Key Benefits

1. **User-Friendly**: Automatically handles collisions without rejecting drops
2. **Visual Feedback**: Clear indication of valid/invalid positions
3. **Smart Placement**: Finds the closest valid position to user's intent
4. **Predictable**: Consistent behavior across all scenarios
5. **Performance**: Efficient collision detection algorithm
6. **Grid-Aware**: Respects the 12-column grid system

---

## 🔍 Edge Cases Handled

1. **Widget at Grid Edge**: Prevents widgets from going off-grid
2. **Large Widgets**: Correctly handles widgets of different sizes
3. **Moving Widget to Its Own Position**: Excludes widget from collision check
4. **Full Dashboard**: Places at bottom when no nearby space available
5. **Empty Dashboard**: No collision detection overhead
6. **Rapid Dragging**: Efficient real-time collision checking

---

## 🚀 Future Enhancements (Not Implemented)

Potential improvements for future versions:

1. **Compact Mode**: Automatically rearrange widgets to fill gaps
2. **Swap Widgets**: Allow swapping positions of two widgets
3. **Resize with Collision**: Prevent resizing into other widgets
4. **Undo/Redo**: Track position changes for undo functionality
5. **Snap to Edges**: Magnetic snapping to widget edges
6. **Multi-Select**: Move multiple widgets together
7. **Collision Sound**: Audio feedback for invalid positions

---

## 📝 Summary

The collision detection system provides a seamless user experience by:
- ✅ Preventing widget overlaps automatically
- ✅ Providing real-time visual feedback
- ✅ Finding the best alternative position when needed
- ✅ Maintaining the integrity of the dashboard layout
- ✅ Working efficiently with the grid system

All collision detection is performed in-memory with no persistence layer, maintaining the ephemeral nature of the dashboard editor.

