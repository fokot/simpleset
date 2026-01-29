# Features Research: WYSIWYG Dashboard Editor

**Domain:** Visual dashboard editor / canvas-based UI builder
**Researched:** 2026-01-29
**Overall Confidence:** HIGH (based on established patterns from Figma, Grafana, react-grid-layout)

## Table Stakes (Must Have)

Features users absolutely expect in a dashboard editor. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Dependencies | Expected UX |
|---------|--------------|------------|--------------|-------------|
| **Widget Palette** | Users need to see available widgets before adding | Low | None | Left sidebar with categorized widget icons; hover shows name/description |
| **Drag from Palette to Canvas** | Standard pattern (Figma, Grafana, all builders) | Medium | Palette, Canvas | Click-hold widget icon, drag to canvas, ghost preview shows drop position |
| **Select Widget** | Cannot configure without selecting | Low | Canvas rendering | Click to select; show 8 resize handles (corners + edges); blue border highlight |
| **Move Widget** | Core editing capability | Medium | Selection system | Drag selected widget; show position preview; snap to grid during drag |
| **Resize Widget** | Core editing capability | Medium | Selection, Grid | Drag corner/edge handles; maintain aspect ratio with Shift; show dimensions |
| **Grid-Based Layout** | Dashboard standard; prevents overlap/chaos | Medium | None | 12-column grid (standard); visual grid lines in edit mode; widgets snap to grid |
| **Property Panel** | Configure without writing JSON | Medium | Selection | Right sidebar; shows selected widget's properties; live updates canvas |
| **Save Dashboard** | Persist work | Low | Backend API (exists) | Explicit "Save" button; success/error feedback; dirty state indicator |
| **Delete Widget** | Basic editing | Low | Selection | Delete key or context menu; confirm for destructive action |
| **Widget Title/Header** | Common requirement for dashboards | Low | Widget rendering | Editable title field in property panel; optional show/hide |

## Differentiators (Nice to Have)

Features that set this apart. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Dependencies | Expected UX |
|---------|-------------------|------------|--------------|-------------|
| **Undo/Redo** | Error recovery, exploration safety | Medium-High | State management | Ctrl+Z/Ctrl+Y; history stack (memento pattern); visual indicator of undo depth |
| **AI Chart Generation** | Major differentiator; reduces configuration friction | High | AI endpoint | Natural language input → chart config; "Generate chart showing X by Y" |
| **AI Layout Suggestions** | Unique value; auto-optimize dashboards | High | AI endpoint | "Suggest layout" button; AI recommends widget placement |
| **Copy/Paste Widgets** | Efficiency for similar widgets | Low-Medium | Selection, Clipboard | Ctrl+C/V; paste creates offset copy; works across dashboards |
| **Multi-Select** | Bulk operations | Medium | Selection system | Shift+click or drag-box selection; move/delete multiple |
| **Keyboard Navigation** | Accessibility, power users | Medium | Selection | Arrow keys move selected widget; Tab cycles selection |
| **Zoom/Pan Canvas** | Large dashboards | Medium-High | Canvas rendering | Scroll to zoom; drag to pan; minimap optional |
| **Preview Mode** | See runtime view without leaving editor | Low | Mode toggle | Toggle button; hides editor UI; shows dashboard as end-users see it |
| **Widget Templates** | Pre-configured starting points | Low | Widget palette | "Chart showing sales" vs blank chart; reduces setup time |
| **Auto-Save Draft** | Prevent work loss | Low-Medium | Local storage | Save to localStorage every N seconds; restore on reopen |

## Anti-Features (Deliberately Exclude from v1)

Features to NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Freeform Layout** | Causes messy dashboards; harder to implement; responsive issues | Use grid-only layout; force snap-to-grid |
| **Real-time Collaboration** | Massive complexity (OT/CRDT); out of scope | Single-user editing only; last-save-wins |
| **Nested Dashboards/Tabs** | Complexity explosion; confusing UX | Flat widget list; separate dashboard pages |
| **Custom CSS Injection** | Security risk; maintenance burden; breaks consistency | Predefined style options in property panel |
| **Pixel-Perfect Positioning** | Responsive nightmare; encourages bad practices | Grid units only (e.g., x:0-11, y:0-N) |
| **Version Branching** | Git-like complexity not needed for dashboards | Simple linear version history only |
| **Widget Marketplace/Plugins** | Scope creep; security concerns | Built-in widgets only; extensibility later |
| **Complex Animations** | Performance issues; implementation complexity | Subtle transitions only (resize, drag) |
| **Offline-First Architecture** | Unnecessary complexity for dashboard use case | Online-required; graceful offline message |

## UX Patterns

Common patterns from successful editors (Figma, Grafana, Notion, react-grid-layout).

### Canvas Interaction Patterns

**Selection:**
- Single click selects widget
- Click on empty space deselects
- Selected widget shows 8 resize handles (corners + midpoints)
- Blue highlight border (2px, #2196F3 or similar)
- Selection handles are small squares (8x8px) on white with blue border

**Drag-to-Move:**
- Grab anywhere on widget (not just handle)
- Show ghost/shadow of widget during drag
- Grid snapping: widget snaps to nearest grid line
- Cursor: `grab` on hover, `grabbing` during drag
- Visual feedback: drop target highlights, other widgets shift to make room

**Resize:**
- Corner handles: proportional resize
- Edge handles: resize in one dimension only
- Shift+drag: constrain proportions
- Show dimensions (e.g., "3 × 2") during resize
- Minimum size: 1×1 grid unit (prevent 0-size widgets)

**Keyboard Shortcuts (Standard):**
- `Delete` / `Backspace`: Delete selected widget
- `Ctrl+Z`: Undo
- `Ctrl+Y` / `Ctrl+Shift+Z`: Redo  
- `Ctrl+C`: Copy widget
- `Ctrl+V`: Paste widget
- `Ctrl+D`: Duplicate widget
- `Escape`: Deselect / cancel current operation
- Arrow keys: Nudge widget by 1 grid unit
- `Ctrl+S`: Save dashboard

### Layout & Grid Patterns

**Grid System (react-grid-layout standard):**
- 12-column grid (most common; matches Bootstrap/Tailwind)
- Row height: configurable (typically 30-50px)
- Gutter/margin: 10-20px between widgets
- Widgets defined by: x, y, width, height (grid units)
- Maximum rows: auto-expand vertically

**Compaction Patterns:**
- Vertical compaction: widgets "fall up" to fill gaps (default, most intuitive)
- No overlap: system prevents widgets from overlapping
- Static widgets: some widgets can be "locked" (won't move during drag)

**Responsive Behavior (v1 consideration):**
- Fixed desktop layout for v1 (no responsive breakpoints)
- All widgets scale proportionally with container
- Minimum dashboard width: ~800px

### Property Panel Patterns

**Panel Structure:**
```
┌─────────────────────────┐
│ Widget: [Chart Name]    │  ← Selected widget title
├─────────────────────────┤
│ ▼ General               │  ← Collapsible sections
│   Title: [___________]  │
│   Description: [______] │
├─────────────────────────┤
│ ▼ Data                  │
│   Data Source: [v]      │
│   Query: [___________]  │
├─────────────────────────┤
│ ▼ Appearance            │
│   Background: [picker]  │
│   Border: [picker]      │
└─────────────────────────┘
```

**Property Panel UX:**
- Right sidebar (fixed position, ~300px wide)
- Shows "No widget selected" when nothing selected
- Grouped by category (General, Data, Appearance, etc.)
- Live preview: changes reflect immediately on canvas
- Validation: red border on invalid fields

### Widget Palette Patterns

**Palette Structure:**
```
┌─────────────────────────┐
│ 🔍 Search widgets...    │
├─────────────────────────┤
│ ▼ Charts                │
│   📊 Bar Chart          │
│   📈 Line Chart         │
│   🥧 Pie Chart          │
├─────────────────────────┤
│ ▼ Data                  │
│   📋 Table              │
│   🔢 Metric             │
├─────────────────────────┤
│ ▼ Content               │
│   📝 Text               │
│   📄 Markdown           │
│   🖼️ Image              │
├─────────────────────────┤
│ ▼ Controls              │
│   🔽 Filter             │
└─────────────────────────┘
```

**Palette UX:**
- Left sidebar (fixed, ~250px wide)
- Drag-to-add: drag widget icon to canvas
- Click-to-add: click widget, then click canvas position (alternative)
- Hover preview: shows larger preview or description
- Categories: collapsible; widgets grouped logically

### Drag-from-Palette Pattern (react-grid-layout)

1. User starts dragging widget from palette
2. On enter canvas: show drop preview (placeholder rectangle)
3. During drag: preview follows cursor, snaps to grid
4. On drop: create widget at drop position with default size
5. Open property panel with new widget selected

### Feedback & States

**Visual States:**
| State | Visual Treatment |
|-------|------------------|
| Hover (widget) | Subtle border highlight |
| Selected | Blue border + resize handles |
| Dragging | Reduced opacity (0.7) + shadow |
| Resizing | Show dimensions label |
| Invalid drop | Red outline / X cursor |
| Unsaved changes | Asterisk in title or dot indicator |

**Cursor States:**
| Context | Cursor |
|---------|--------|
| Over widget | `default` |
| Over selected widget body | `grab` |
| Dragging widget | `grabbing` |
| Over resize handle (corner) | `nwse-resize`, `nesw-resize` |
| Over resize handle (edge) | `ew-resize`, `ns-resize` |
| Over palette item | `grab` |

## Complexity Matrix

| Feature | Complexity | Dependencies | Phase Recommendation |
|---------|------------|--------------|---------------------|
| Canvas rendering | Low | Existing widget system | Phase 1 |
| Widget palette | Low | None | Phase 1 |
| Drag from palette | Medium | Palette, Canvas | Phase 1 |
| Select widget | Low | Canvas | Phase 1 |
| Move widget | Medium | Selection, Grid | Phase 1 |
| Resize widget | Medium | Selection, Grid | Phase 1 |
| Property panel | Medium | Selection | Phase 1 |
| Save dashboard | Low | Backend API (exists) | Phase 1 |
| Delete widget | Low | Selection | Phase 1 |
| Grid snap | Medium | Move/Resize | Phase 1 |
| Undo/Redo | Medium-High | State management | Phase 2 |
| Keyboard shortcuts | Low-Medium | Selection | Phase 2 |
| Copy/Paste | Low-Medium | Selection, Clipboard | Phase 2 |
| AI chart generation | High | AI endpoint integration | Phase 3 |
| AI layout suggestions | High | AI endpoint, Layout system | Phase 3 |
| Multi-select | Medium | Selection system | Optional/Later |
| Zoom/Pan | Medium-High | Canvas system | Optional/Later |

## Feature Dependencies

```
                    ┌─────────────────┐
                    │  Canvas Render  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │Widget Palette│ │   Selection  │ │  Grid System │
      └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                │                │
             ▼                │                │
      ┌──────────────┐        │                │
      │ Drag to Add  │        │                │
      └──────────────┘        │                │
                              ▼                ▼
                      ┌──────────────┐ ┌──────────────┐
                      │Property Panel│ │  Move/Resize │
                      └──────────────┘ └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  Undo/Redo   │
                      └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │AI Integration│
                      └──────────────┘
```

## Sources

**HIGH Confidence (authoritative):**
- react-grid-layout GitHub (v2.2.2): API documentation, props, patterns
  - https://github.com/react-grid-layout/react-grid-layout
- Nielsen Norman Group: Drag-and-Drop UX patterns
  - https://www.nngroup.com/articles/drag-drop/
- Grafana documentation: Dashboard editing UX
  - https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/

**MEDIUM Confidence (established patterns):**
- Figma UX patterns (selection, handles, property panels) - training data
- Standard keyboard shortcuts (Ctrl+Z, etc.) - universal conventions

## Open Questions for Implementation

1. **Library choice:** Use react-grid-layout (React) or port patterns to Lit? (Project uses Lit)
2. **State management:** How to implement undo/redo stack with Lit components?
3. **AI integration:** What API format for chart generation? (Depends on AI endpoint spec)
4. **Mobile support:** Is touch/mobile editing in scope for v1?

