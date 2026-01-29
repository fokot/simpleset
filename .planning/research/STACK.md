# Stack Research: WYSIWYG Dashboard Editor

**Project:** SimpleSet Dashboard Editor v1.0
**Researched:** 2026-01-29
**Focus:** Stack additions for visual editor features

## Current Stack (Already in Project)

| Technology | Version | Purpose |
|------------|---------|---------|
| Lit | 3.3.1 | Web components framework |
| TypeScript | 5.9.2 | Type-safe frontend code |
| ECharts | 6.0.0 | Chart visualizations |
| Rollup | 4.50.1 | Build tool |
| Zod | (in api/) | Schema validation |

## Core Libraries (Already Decided)

### Interactjs — Drag-and-Drop & Resize

| Property | Value |
|----------|-------|
| Package | `interactjs` |
| Version | **1.10.27** (latest, released Mar 2024) |
| Purpose | Drag-and-drop, resizing, snap-to-grid |
| Source | [npm](https://www.npmjs.com/package/interactjs), [interactjs.io](https://interactjs.io) |

**Why this library:**
- Framework-agnostic — works with any DOM elements including Web Components
- Built-in snap-to-grid modifiers (no additional library needed)
- Built-in resize handles
- Mature library (12.9k GitHub stars)
- No React/Vue dependencies

**Key features for editor:**
- `interact.modifiers.snap({ targets: [interact.snappers.grid({ x: gridSize, y: gridSize })] })` — Grid snapping
- `interact.modifiers.restrict()` — Keep widgets within canvas bounds
- Draggable + resizable on same element
- Touch/multi-touch support

## Additional Libraries Needed

### 1. State Management — Lit Signals (Labs)

| Property | Value |
|----------|-------|
| Package | `@lit-labs/signals` |
| Version | Latest (Labs package) |
| Purpose | Shared observable state for undo/redo, widget selection |
| Confidence | HIGH (official Lit package) |

**Why @lit-labs/signals:**
- Official Lit integration — extends SignalWatcher mixin for components
- Framework-agnostic signals (TC39 proposal polyfill)
- Perfect for editor state that multiple components observe (selected widget, undo stack)
- No external state management library needed
- Works with existing Lit reactive properties

**Alternative considered:** Plain Lit `@state` properties
- **Why not:** Harder to share state between editor canvas, property panel, and toolbar components

### 2. Undo/Redo — Custom Implementation (Recommended)

| Property | Value |
|----------|-------|
| Package | None (custom implementation) |
| Pattern | Command pattern with signal-backed history stack |

**Why custom implementation:**
- Dashboard state is already well-defined (Zod schemas)
- Simple to implement: `{ past: Dashboard[], present: Dashboard, future: Dashboard[] }`
- No external dependency for simple in-memory undo
- Libraries like `immer` (v11.1.3) add complexity without benefit for shallow dashboard objects

**Implementation approach:**
```typescript
// Uses Lit signals for reactive history state
const historyState = new Signal.State<{
  past: Dashboard[];
  present: Dashboard;
  future: Dashboard[];
}>(initialState);

function undo() { /* move present to future, pop past to present */ }
function redo() { /* move present to past, pop future to present */ }
function push(dashboard: Dashboard) { /* push present to past, set new present, clear future */ }
```

### 3. AI Integration — Backend-Only (No Frontend SDK)

| Property | Value |
|----------|-------|
| Package | None on frontend |
| Pattern | Call existing Scala backend, which proxies to AI |
| Confidence | HIGH |

**Why no frontend AI SDK:**
- AI endpoint is configurable (OpenAI, Anthropic, local models)
- Backend already has ZIO HTTP — add AI proxy endpoint there
- Keeps API keys server-side (security)
- Frontend just sends natural language prompt, receives chart config

**Backend additions needed:**
- `@anthropic-ai/sdk` v0.52+ (if Anthropic) OR `openai` v5+ (if OpenAI) — **on backend**
- Frontend: Simple fetch to `/api/ai/generate-chart`

## Integration Patterns

### Interactjs + Lit Web Components

```typescript
// In Lit component's firstUpdated lifecycle
firstUpdated() {
  // Get the shadow DOM element to make draggable
  const widget = this.renderRoot.querySelector('.widget-container');
  
  interact(widget)
    .draggable({
      modifiers: [
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: this.gridSize, y: this.gridSize })],
        }),
        interact.modifiers.restrict({
          restriction: 'parent',
          endOnly: true,
        }),
      ],
      listeners: {
        move: (event) => {
          // Update widget position, dispatch event to parent
          this.dispatchEvent(new CustomEvent('widget-move', { 
            detail: { x: event.dx, y: event.dy } 
          }));
        },
      },
    })
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      modifiers: [
        interact.modifiers.snapSize({
          targets: [interact.snappers.grid({ width: this.gridSize, height: this.gridSize })],
        }),
      ],
    });
}

// IMPORTANT: Clean up in disconnectedCallback
disconnectedCallback() {
  super.disconnectedCallback();
  const widget = this.renderRoot.querySelector('.widget-container');
  if (widget) interact(widget).unset();
}
```

### Signal-Based Editor State

```typescript
import { SignalWatcher, signal } from '@lit-labs/signals';

// Shared across components
export const editorState = {
  selectedWidgetId: signal<string | null>(null),
  dashboard: signal<Dashboard>(emptyDashboard),
  isDirty: signal<boolean>(false),
};

// Any component can observe
@customElement('property-panel')
export class PropertyPanel extends SignalWatcher(LitElement) {
  render() {
    const selected = editorState.selectedWidgetId.get();
    // Re-renders when selectedWidgetId changes
  }
}
```

## What NOT to Add

| Library | Why NOT |
|---------|---------|
| React / react-dnd | Project uses Lit — introducing React adds complexity and bundle size |
| Gridstack.js | Opinionated grid layout, harder to customize, React-focused |
| Redux / Zustand / MobX | Overkill for editor state; Lit Signals sufficient |
| Fabric.js / Konva | Canvas-based — existing widgets are DOM-based Lit components |
| immer | Dashboard objects are shallow; deep immutability library not needed |
| External undo library | Simple pattern suffices; no need for library overhead |
| Frontend AI SDK | Keep AI keys server-side; backend proxies requests |

## Version Summary

| Library | Version | Install Command |
|---------|---------|-----------------|
| interactjs | 1.10.27 | `pnpm add interactjs` |
| @lit-labs/signals | latest | `pnpm add @lit-labs/signals` |
| signal-polyfill | (peer) | Auto-installed with @lit-labs/signals |

**Total new dependencies:** 2 packages (interactjs, @lit-labs/signals)

## Installation Commands

```bash
cd frontend
pnpm add interactjs @lit-labs/signals
```

## Sources

| Claim | Source | Confidence |
|-------|--------|------------|
| Interactjs 1.10.27 is latest | [GitHub tags](https://github.com/taye/interact.js/tags), npm | HIGH |
| Interactjs has built-in grid snap | [Official docs](https://interactjs.io/docs/snapping/) | HIGH |
| @lit-labs/signals uses TC39 polyfill | [Lit docs](https://lit.dev/docs/data/signals/) | HIGH |
| Lit version 3.3.1 in project | pnpm-lock.yaml analysis | HIGH |

