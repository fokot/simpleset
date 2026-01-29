# Architecture Research: WYSIWYG Dashboard Editor

**Domain:** Visual editor integration with Lit-based dashboard system  
**Researched:** 2026-01-29  
**Confidence:** HIGH (based on existing codebase analysis + Lit official docs)

## Component Hierarchy

The editor follows a container/presenter pattern with clear separation between editing concerns and rendering.

```
dashboard-editor-component (NEW - main editor shell)
├── editor-toolbar (NEW - save, undo/redo, mode toggle)
├── widget-palette (NEW - draggable widget list)
├── editor-canvas (NEW - drop target + grid overlay)
│   └── widget-wrapper (NEW - selection, resize handles)
│       └── [existing widget components] (chart-widget, metric-widget, etc.)
├── config-panel (NEW - property editor for selected widget)
│   └── widget-config-form (NEW - dynamic form based on widget type)
└── preview-panel (OPTIONAL - uses existing dashboard-component)
```

### Component Responsibilities

| Component | Type | Responsibility |
|-----------|------|----------------|
| `dashboard-editor-component` | NEW | Orchestrates editor state, provides context |
| `editor-toolbar` | NEW | Actions: save, undo, redo, preview toggle |
| `widget-palette` | NEW | Lists widget types, handles drag start |
| `editor-canvas` | NEW | Grid rendering, drop handling, widget positioning |
| `widget-wrapper` | NEW | Selection state, resize/move handles, interactjs integration |
| `config-panel` | NEW | Shows configuration form for selected widget |
| `dashboard-component` | EXISTING | Read-only rendering (reused for preview) |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    dashboard-editor-component                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 EditorStateController                        │    │
│  │  - dashboard: Dashboard (working copy)                       │    │
│  │  - selectedWidgetId: string | null                          │    │
│  │  - historyStack: EditorCommand[]                            │    │
│  │  - isDirty: boolean                                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│         Context Provider (editorContext)                             │
│                              │                                       │
│    ┌───────────┬────────────┼────────────┬─────────────┐            │
│    ▼           ▼            ▼            ▼             ▼            │
│ toolbar    palette       canvas     config-panel   preview          │
│    │           │            │            │             │            │
│    └───────────┴────────────┴────────────┴─────────────┘            │
│                              │                                       │
│              dispatch(EditorCommand) ──▶ EditorStateController       │
└─────────────────────────────────────────────────────────────────────┘

On Save:
  EditorState.dashboard ──▶ Zod validation ──▶ POST /dashboards/{name}
```

### Key Data Flows

1. **Add Widget**: Palette drag → Canvas drop → `AddWidgetCommand` → state update → re-render
2. **Move/Resize**: Interactjs event → `MoveWidgetCommand` → state update → re-render
3. **Configure**: Config form change → `UpdateWidgetConfigCommand` → state update → re-render
4. **Save**: Toolbar click → validate Dashboard → API POST → clear dirty flag
5. **Undo**: Toolbar click → pop command from history → apply inverse → re-render

## Integration Points

### With Existing dashboard-component

The editor **does not modify** `dashboard-component`. Instead:
- Editor canvas renders widgets directly using existing widget components
- Preview mode passes editor's `Dashboard` object to `dashboard-component`
- Editor wraps widgets in `widget-wrapper` for selection/resize; preview doesn't

```typescript
// Editor canvas - direct widget rendering with wrapper
html`
  <widget-wrapper 
    .widget=${widget}
    .selected=${selectedWidgetId === widget.id}
    @select=${this.handleSelect}
    @move=${this.handleMove}
    @resize=${this.handleResize}
  >
    ${this.renderWidgetByType(widget)}
  </widget-wrapper>
`

// Preview - delegates to existing component
html`<dashboard-component .dashboard=${this.editorState.dashboard}></dashboard-component>`
```

### With Existing Widget Schemas

The editor uses existing schemas from `api/dashboards.ts` and types from `frontend/src/types/dashboard-types.ts`:

- **WidgetTypeSchema**: Drives palette entries (8 types)
- **WidgetPositionSchema**: Validated on move/resize
- **WidgetConfigSchema**: Drives config panel form fields
- **DashboardSchema**: Validated before save

### With Backend API

Existing endpoints used without modification:
- `POST /dashboards` - Create new dashboard
- `PUT /dashboards/{name}` - Update existing (for future "edit" feature)
- `GET /dashboards/{name}` - Load for editing (future)

## State Management

### Recommended Pattern: Reactive Controller + Lit Context

Use Lit's `@lit/context` package for sharing editor state across component tree, with a `ReactiveController` managing the state logic.

```typescript
// editor-state-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { createContext } from '@lit/context';
import { Dashboard, DashboardWidget } from './types/dashboard-types.js';

export interface EditorState {
  dashboard: Dashboard;
  selectedWidgetId: string | null;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export const editorContext = createContext<EditorStateController>('editor-state');

export class EditorStateController implements ReactiveController {
  host: ReactiveControllerHost;
  private _dashboard: Dashboard;
  private _selectedWidgetId: string | null = null;
  private _undoStack: EditorCommand[] = [];
  private _redoStack: EditorCommand[] = [];

  // ... controller implementation

  dispatch(command: EditorCommand): void {
    command.execute(this._dashboard);
    this._undoStack.push(command);
    this._redoStack = [];
    this.host.requestUpdate();
  }

  undo(): void {
    const cmd = this._undoStack.pop();
    if (cmd) {
      cmd.undo(this._dashboard);
      this._redoStack.push(cmd);
      this.host.requestUpdate();
    }
  }
}
```

### Undo/Redo: Command Pattern

Each user action creates a reversible command:

| Command | execute() | undo() |
|---------|-----------|--------|
| AddWidgetCommand | Add widget to array | Remove widget from array |
| RemoveWidgetCommand | Remove from array | Re-add at same index |
| MoveWidgetCommand | Update position | Restore previous position |
| ResizeWidgetCommand | Update dimensions | Restore previous dimensions |
| UpdateConfigCommand | Merge new config | Restore previous config |

```typescript
interface EditorCommand {
  execute(dashboard: Dashboard): void;
  undo(dashboard: Dashboard): void;
}

class MoveWidgetCommand implements EditorCommand {
  constructor(
    private widgetId: string,
    private oldPosition: WidgetPosition,
    private newPosition: WidgetPosition
  ) {}

  execute(dashboard: Dashboard) {
    const widget = dashboard.widgets?.find(w => w.id === this.widgetId);
    if (widget) widget.position = this.newPosition;
  }

  undo(dashboard: Dashboard) {
    const widget = dashboard.widgets?.find(w => w.id === this.widgetId);
    if (widget) widget.position = this.oldPosition;
  }
}
```

### Dirty Tracking

Track changes for "unsaved changes" warnings:
- Set `isDirty = true` on any command execution
- Set `isDirty = false` on successful save
- Check before navigation/close with `beforeunload` event

## Suggested Build Order

Build in this order to enable incremental testing:

### Phase 1: Foundation (Build First)
1. **EditorStateController** - State management core
2. **editorContext** - Context definition
3. **dashboard-editor-component** - Shell that provides context
4. **editor-canvas** - Basic grid rendering (no drag/drop yet)

*Why first: Everything depends on state management. Canvas provides visual feedback.*

### Phase 2: Widget Display
5. **widget-wrapper** - Selection + basic styling (no resize yet)
6. **Widget rendering** - Integrate existing widgets in canvas

*Why second: Can verify widgets render correctly before adding interaction.*

### Phase 3: Interaction
7. **widget-palette** - Widget list with drag initiation
8. **Interactjs integration** - Drop to canvas, move, resize
9. **MoveWidgetCommand / ResizeWidgetCommand** - Position updates

*Why third: Core editing capability. Requires canvas + widgets to be working.*

### Phase 4: Configuration
10. **config-panel** - Property editor shell
11. **widget-config-form** - Dynamic form generation per type
12. **UpdateConfigCommand** - Config changes with undo

*Why fourth: Depends on widget selection working.*

### Phase 5: Persistence
13. **editor-toolbar** - Save button, undo/redo buttons
14. **Save flow** - Zod validation + API integration
15. **AddWidgetCommand / RemoveWidgetCommand** - Complete command set

*Why fifth: Can test editing flow before persistence.*

### Phase 6: Polish
16. **Preview toggle** - Use existing dashboard-component
17. **Keyboard shortcuts** - Ctrl+Z, Ctrl+Y, Delete
18. **AI integration** - Service abstraction layer

## Anti-Patterns to Avoid

### ❌ Don't: Modify dashboard-component for editing
**Instead:** Create widget-wrapper that wraps existing widgets

### ❌ Don't: Store state in individual components
**Instead:** Use centralized EditorStateController with context

### ❌ Don't: Mutate dashboard directly
**Instead:** Use commands that can be undone

### ❌ Don't: Validate on every keystroke in config form
**Instead:** Validate on blur/submit; show errors inline

### ❌ Don't: Auto-save continuously
**Instead:** Explicit save (per PROJECT.md decision) with dirty tracking

## File Structure

```
frontend/src/
├── editor/
│   ├── dashboard-editor-component.ts    # Main shell
│   ├── editor-state-controller.ts       # State + commands
│   ├── editor-context.ts                # Context definition
│   ├── editor-canvas.ts                 # Grid + drop target
│   ├── editor-toolbar.ts                # Actions bar
│   ├── widget-palette.ts                # Widget list
│   ├── widget-wrapper.ts                # Selection/resize wrapper
│   ├── config-panel.ts                  # Configuration sidebar
│   ├── commands/
│   │   ├── index.ts
│   │   ├── add-widget-command.ts
│   │   ├── move-widget-command.ts
│   │   └── update-config-command.ts
│   └── forms/
│       ├── chart-config-form.ts
│       ├── metric-config-form.ts
│       └── ...
├── widgets/                              # EXISTING - no changes
└── types/
    └── dashboard-types.ts                # EXISTING - no changes
```

## Sources

- Lit official documentation (https://lit.dev/docs/) - Controllers, Context
- Existing codebase analysis: dashboard-component.ts, widget implementations
- PROJECT.md architectural decisions (Lit + Interactjs, explicit save)
- Command Pattern for undo/redo (standard pattern, multiple sources agree)

