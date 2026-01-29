# Phase 1: Core Editor Framework - Research

**Researched:** 2026-01-29
**Domain:** Lit Web Components + CSS Grid + Interactjs Integration
**Confidence:** HIGH

## Summary

This phase establishes the editor shell with a 12-column grid-based canvas. The existing codebase already uses Lit 3.1.0 with TypeScript and has an established pattern for dashboard rendering via `dashboard-component.ts`. The editor will follow the same component conventions.

Research confirms Interactjs works within Shadow DOM when properly initialized in `firstUpdated()`. The existing dashboard uses CSS Grid with `--dashboard-columns` CSS variable for responsive column layouts. Grid lines can be rendered using `repeating-linear-gradient` backgrounds without additional DOM elements.

**Primary recommendation:** Create `dashboard-editor-component.ts` as the shell that composes `editor-canvas.ts` (grid display), `editor-toolbar.ts`, and placeholder panels. Initialize Interactjs in `firstUpdated()` after Shadow DOM is ready.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | 3.1.0 | Web Components framework | Already in codebase |
| typescript | 5.9.2 | Type safety | Already in codebase |

### To Install
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| interactjs | ^1.10.27 | Drag, drop, resize with grid snap | Recommended in prior decisions |

**Installation:**
```bash
cd frontend && pnpm add interactjs
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── editor/
│   ├── dashboard-editor-component.ts  # Main shell
│   ├── editor-canvas.ts               # Grid canvas with visible lines
│   ├── editor-toolbar.ts              # Save, undo/redo buttons
│   └── index.ts                       # Barrel export
├── dashboard-component.ts             # Existing (don't modify)
├── types/
│   └── dashboard-types.ts             # Existing (reuse)
└── widgets/                           # Existing widgets
```

### Pattern 1: Interactjs in Lit Shadow DOM
**What:** Initialize Interactjs in `firstUpdated()` to ensure Shadow DOM is ready
**When to use:** Always when using Interactjs with Lit components
**Example:**
```typescript
// Source: Interactjs docs + Lit lifecycle docs
import interact from 'interactjs';

@customElement('editor-canvas')
export class EditorCanvas extends LitElement {
  private _interactInstance?: Interact.Interactable;
  
  firstUpdated() {
    // Shadow DOM is now ready
    const canvas = this.renderRoot.querySelector('.canvas');
    this._interactInstance = interact(canvas).dropzone({
      // Drop zone configuration
    });
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this._interactInstance?.unset();
  }
}
```

### Pattern 2: CSS Grid with Visible Grid Lines
**What:** Use `repeating-linear-gradient` to render visual grid lines without extra DOM
**When to use:** For editor canvas showing 12-column layout
**Example:**
```typescript
// Source: CSS specifications
static styles = css`
  .canvas {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
    min-height: 600px;
    position: relative;
    /* Visual grid lines */
    background-image: 
      repeating-linear-gradient(
        to right,
        transparent,
        transparent calc(100% / 12 - 1px),
        #e0e0e0 calc(100% / 12 - 1px),
        #e0e0e0 calc(100% / 12)
      );
    background-color: #f5f5f5;
  }
`;
```

### Pattern 3: Editor Shell Layout
**What:** Flexbox-based layout with toolbar, sidebars, and canvas
**When to use:** For the main editor component
**Example:**
```typescript
static styles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .toolbar { height: 48px; }
  .main {
    display: flex;
    flex: 1;
  }
  .sidebar { width: 250px; }
  .canvas-area { flex: 1; overflow: auto; }
`;
```

### Anti-Patterns to Avoid
- **Modifying dashboard-component:** Use widget-wrapper composition instead
- **DOM queries in constructor:** Shadow DOM not ready; use `firstUpdated()`
- **Forgetting `unset()` cleanup:** Memory leak; always clean up Interactjs

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop-resize | Custom pointer handlers | Interactjs | Edge cases: touch, inertia, multi-touch |
| Grid snapping | Manual coordinate rounding | `interact.snappers.grid()` | Handles offsets, limits, ranges |
| Visible grid | SVG/Canvas overlay | CSS `repeating-linear-gradient` | Pure CSS, no DOM overhead |

## Common Pitfalls

### Pitfall 1: Interactjs Initialization Before Shadow DOM Ready
**What goes wrong:** `interact(element)` returns null or fails to attach events
**Why it happens:** Querying `this.renderRoot` in constructor or `connectedCallback` before first render
**How to avoid:** Always initialize Interactjs in `firstUpdated()` lifecycle method
**Warning signs:** Drag events not firing, console errors about null elements

### Pitfall 2: Memory Leak from Missing Cleanup
**What goes wrong:** Interactjs instances persist after component removal, causing memory leaks
**Why it happens:** Forgetting to call `unset()` on Interactjs instances
**How to avoid:** Always call `this._interactInstance?.unset()` in `disconnectedCallback()`
**Warning signs:** Memory growth in dev tools, duplicate event handlers

### Pitfall 3: Shadow DOM Event Bubbling
**What goes wrong:** Events don't cross Shadow DOM boundaries for external listeners
**Why it happens:** Standard DOM events stop at shadow boundary
**How to avoid:** Use `composed: true, bubbles: true` when dispatching custom events
**Warning signs:** Parent components don't receive events from child shadow roots

### Pitfall 4: Grid Calculation Misalignment
**What goes wrong:** Widgets snap to wrong positions or overflow grid
**Why it happens:** Not accounting for gap/margin in grid calculations
**How to avoid:** Calculate cell width as `(containerWidth - (columns - 1) * gap) / columns`
**Warning signs:** Widgets overlapping or leaving gaps

## Code Examples

### Interactjs Grid Snap Configuration
```typescript
// Source: Interactjs docs - https://interactjs.io/docs/snapping/
import interact from 'interactjs';

// Create a grid snapper
const gridSnap = interact.snappers.grid({
  x: cellWidth,  // Calculated from container width / 12
  y: rowHeight,  // From DashboardLayout.rowHeight
  offset: { x: 0, y: 0 }
});

// Apply to draggable
interact('.widget').draggable({
  modifiers: [
    interact.modifiers.snap({
      targets: [gridSnap],
      relativePoints: [{ x: 0, y: 0 }]
    }),
    interact.modifiers.restrict({
      restriction: 'parent',
      elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
    })
  ]
});
```

### Lit Component Event Dispatch
```typescript
// Source: Lit docs - lifecycle
this.dispatchEvent(new CustomEvent('widget-moved', {
  detail: { widgetId, position },
  bubbles: true,
  composed: true  // Crosses shadow DOM boundary
}));
```

### Reusing Existing Types
```typescript
// Source: Codebase - frontend/src/types/dashboard-types.ts
import type { Dashboard, DashboardWidget, WidgetPosition } from '../types/dashboard-types';

// WidgetPosition: { x, y, width, height }
// DashboardLayout: { columns, rowHeight, margin }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery UI Draggable | Interactjs | ~2018 | Better touch support, TypeScript types |
| DOM-based grid lines | CSS gradient grid lines | CSS3 | No extra DOM, better performance |
| Class-based components | Lit decorators (@customElement) | Lit 2.0+ | Cleaner syntax, better TypeScript |

**Deprecated/outdated:**
- `@polymer/lit-element`: Use `lit` package instead
- Interactjs `interact.createSnapGrid()`: Use `interact.snappers.grid()` instead

## Open Questions

1. **Widget type discovery**
   - What we know: Existing widgets in `frontend/src/widgets/` folder
   - What's unclear: How to dynamically list available widget types for palette
   - Recommendation: Create a widget registry pattern in Phase 2

2. **Persistence strategy**
   - What we know: Dashboard type has full structure
   - What's unclear: Local storage vs API endpoint for saving
   - Recommendation: Start with in-memory state; persistence is Phase 3+

## Sources

### Primary (HIGH confidence)
- Interactjs official docs - draggable, snapping, modifiers (https://interactjs.io/docs/)
- Lit documentation - lifecycle, Shadow DOM (https://lit.dev/docs/components/lifecycle/)
- Existing codebase: `dashboard-component.ts`, `dashboard-types.ts`

### Secondary (MEDIUM confidence)
- CSS repeating-linear-gradient for grid visualization (MDN)
- GitHub Interactjs repository for TypeScript types

### Tertiary (LOW confidence)
- None - all findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing codebase defines Lit/TS versions
- Architecture: HIGH - based on existing component patterns
- Pitfalls: HIGH - verified from official Interactjs + Lit docs

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (stable libraries, 30-day validity)

