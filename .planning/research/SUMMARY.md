# Research Summary: WYSIWYG Dashboard Editor

**Project:** SimpleSet Dashboard Editor v1.0  
**Synthesized:** 2026-01-29  
**Research Confidence:** HIGH

---

## Executive Summary

Building a WYSIWYG dashboard editor on the existing Lit + ECharts stack is well-supported by mature libraries and established patterns. **Interactjs (1.10.27)** provides framework-agnostic drag-drop-resize with built-in grid snapping—the key interaction primitive. State management via **@lit-labs/signals** combined with the **Command Pattern** enables clean undo/redo without introducing heavyweight external libraries.

The research reveals three critical success factors: (1) keeping editor concerns isolated via `widget-wrapper` composition rather than modifying `dashboard-component`, (2) using direct DOM manipulation during drag with Lit state commits only on drop for 60fps performance, and (3) validating AI-generated configs through existing Zod schemas before rendering. The existing schema infrastructure (`api/dashboards.ts`) and widget components require zero modifications—the editor adds a parallel editing layer.

---

## Stack Recommendations

| Library | Version | Purpose |
|---------|---------|---------|
| **interactjs** | 1.10.27 | Drag, drop, resize, snap-to-grid |
| **@lit-labs/signals** | latest | Shared reactive state across editor components |

**Install:** `cd frontend && pnpm add interactjs @lit-labs/signals`

**No new libraries needed for:**
- Undo/redo (custom command pattern with signals)
- AI integration (backend proxies—no frontend SDK)
- State management (Lit context + controllers suffice)

**Rejected options:** React-grid-layout (React dependency), Redux/Zustand (overkill), Fabric.js (canvas-based).

---

## Feature Priorities

### Table Stakes (v1.0 Must-Have)
| Feature | Notes |
|---------|-------|
| Widget palette | Left sidebar, categorized by type |
| Drag-to-canvas | Drop creates widget at grid position |
| Select/move/resize | Click-select, drag-move, handle-resize |
| Property panel | Right sidebar, context-aware forms |
| Grid snapping | 12-column grid, snap on move/resize |
| Save dashboard | Explicit save with dirty tracking |
| Delete widget | Delete key + context menu |

### Differentiators (v1.1+)
| Feature | Priority |
|---------|----------|
| Undo/Redo | HIGH - builds user trust |
| Keyboard shortcuts | MEDIUM - power user efficiency |
| AI chart generation | MEDIUM - unique value prop |
| Copy/Paste | MEDIUM - quality of life |
| Preview mode | LOW - can view saved dashboard |

### Explicitly Out of Scope
- Freeform (non-grid) layout
- Real-time collaboration
- Nested dashboards/tabs
- Custom CSS injection
- Widget marketplace

---

## Architecture Decisions

### Component Structure
```
dashboard-editor-component (shell)
├── editor-toolbar (save, undo/redo)
├── widget-palette (drag source)
├── editor-canvas (drop target, grid)
│   └── widget-wrapper (selection, resize handles)
│       └── [existing widgets unchanged]
└── config-panel (property editor)
```

### Key Patterns
1. **Composition over modification:** Editor wraps widgets via `widget-wrapper`; never modifies `dashboard-component`
2. **Command pattern for undo:** Each action (add/move/resize/configure) produces reversible command
3. **Context for shared state:** `EditorStateController` + `@lit/context` distributes state to all children
4. **Direct DOM during drag:** Use CSS `transform` for 60fps; commit to Lit state on `dragend`

### File Organization
```
frontend/src/editor/
├── dashboard-editor-component.ts
├── editor-state-controller.ts
├── editor-canvas.ts
├── widget-wrapper.ts
├── widget-palette.ts
├── config-panel.ts
└── commands/
    ├── add-widget-command.ts
    └── move-widget-command.ts
```

---

## Critical Pitfalls

| # | Pitfall | Prevention | Phase |
|---|---------|------------|-------|
| 1 | **Shadow DOM blocks Interactjs events** | Initialize interact on elements in `firstUpdated()`, not constructor; use `composed: true` for custom events | 1 |
| 2 | **Coordinate mismatch in transformed containers** | Always use `event.dx/dy` deltas, not absolute positions | 1 |
| 3 | **Interactjs listeners leak on disconnect** | Call `interact(el).unset()` in `disconnectedCallback()` | 1 |
| 4 | **Lit misses nested mutations** | Create new object references on every state change; never mutate in place | 2 |
| 5 | **AI generates invalid configs** | Always run `WidgetSchema.safeParse()` on AI output; show validation errors gracefully | 4 |

**Additional high-risk areas:**
- Re-rendering entire grid on single widget change → use `repeat(widgets, w => w.id, ...)`
- Undo granularity confusion → commit commands at dragend, not dragmove
- Schema mismatch frontend/API → single source of truth from `api/dashboards.ts`

---

## Roadmap Implications

### Suggested Phase Structure

| Phase | Name | Delivers | Rationale |
|-------|------|----------|-----------|
| **1** | Core Editor Framework | Shell, canvas, grid rendering, widget display | Foundation everything else builds on |
| **2** | Widget Interaction | Drag-from-palette, move, resize, select, delete | Core editing capability |
| **3** | Configuration & Persistence | Property panel, save, load, dirty tracking | Usable MVP |
| **4** | Undo/Redo & Polish | Command history, keyboard shortcuts, validation | User trust & efficiency |
| **5** | AI Integration | Chart generation from natural language | Differentiator (can be deferred) |

### Research Flags by Phase

| Phase | Research Needed? | Notes |
|-------|------------------|-------|
| 1 | **YES - Interactjs spike** | Verify Shadow DOM compatibility before committing |
| 2 | Standard patterns | Well-documented in Interactjs docs |
| 3 | Standard patterns | Existing API endpoints, Zod schemas |
| 4 | Standard patterns | Command pattern well-documented |
| 5 | **YES - AI prompt design** | Schema injection into prompts needs tuning |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (Interactjs + Signals) | **HIGH** | Mature libraries, official Lit support |
| Features | **HIGH** | Patterns established by Grafana, react-grid-layout |
| Architecture | **HIGH** | Based on Lit best practices + existing codebase |
| Pitfalls | **MEDIUM** | Some based on general Lit knowledge, not project-specific testing |

### Gaps to Address During Implementation
1. **Interactjs + Shadow DOM:** Need spike to validate integration
2. **Signal performance:** No benchmarks for signal updates at 60fps drag
3. **AI prompt effectiveness:** Requires iteration once AI endpoint exists

---

## Open Questions

1. **Touch/mobile support?** Interactjs supports it, but is mobile editing in v1 scope?
2. **Dashboard loading?** Current scope is create-only; edit existing needed for v1?
3. **Grid configuration?** Fixed 12-column or user-configurable?
4. **AI provider?** OpenAI vs Anthropic vs configurable (affects backend work)?

---

## Sources

**High Confidence:**
- Interactjs docs: https://interactjs.io/docs/
- Lit signals: https://lit.dev/docs/data/signals/
- react-grid-layout (patterns): https://github.com/react-grid-layout/react-grid-layout

**Medium Confidence:**
- Undo/redo patterns: https://gameprogrammingpatterns.com/command.html
- Figma/Grafana UX patterns (established conventions)

