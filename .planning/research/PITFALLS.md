# Pitfalls Research: WYSIWYG Dashboard Editor

**Domain:** Visual dashboard editor with Lit + Interactjs
**Researched:** 2026-01-29
**Confidence:** MEDIUM (based on web research + codebase analysis)

---

## Drag-and-Drop Pitfalls (Interactjs + Lit)

### Pitfall 1: Shadow DOM Event Targeting
**What goes wrong:** Interactjs uses document-level event listeners. Shadow DOM boundaries prevent events from reaching interact targets, causing drag operations to fail silently or target wrong elements.
**Why it happens:** Lit components render inside Shadow DOM; events don't bubble through shadow boundaries by default.
**Prevention:**
- Use `{ shadow: true }` option if supported, or set up interact on the host element
- Ensure draggable elements are in light DOM or use `composed: true` events
- Initialize interact in `firstUpdated()`, not `constructor()`
**Detection:** Drag starts but immediately stops; console shows no interact events
**Phase impact:** Must address in Phase 1 (Core Editor Framework)

### Pitfall 2: Coordinate System Mismatch
**What goes wrong:** Drag positions are wrong when canvas is scaled/transformed or inside scrollable containers.
**Why it happens:** Interactjs returns page coordinates; transformed containers have different coordinate systems.
**Prevention:**
- Use `interact.modifiers.restrictRect({ restriction: 'parent' })` with correct parent
- Account for CSS transforms with custom coordinate conversion
- Always use `event.dx`/`event.dy` (deltas) rather than absolute positions
**Detection:** Widgets "jump" when dragged, positions offset from cursor
**Phase impact:** Phase 1

### Pitfall 3: Cleanup on Component Disconnect
**What goes wrong:** Memory leaks and ghost interactions when Lit components are removed/re-added.
**Why it happens:** Interactjs targets persist even after DOM elements are removed.
**Prevention:**
```typescript
disconnectedCallback() {
  super.disconnectedCallback();
  interact(this.renderRoot.querySelector('.draggable')).unset();
}
```
**Detection:** Increasing memory usage, interactions fire on stale elements
**Phase impact:** Phase 1

### Pitfall 4: Resize Handle Z-Index Conflicts
**What goes wrong:** Resize handles hidden behind adjacent widgets or not clickable.
**Why it happens:** Grid layouts with overlapping widgets create stacking context conflicts.
**Prevention:**
- Apply `z-index` elevation during active drag/resize
- Use `:hover` and `.interacting` CSS classes to manage layers
- Keep resize handles outside shadow DOM if possible
**Phase impact:** Phase 1-2

---

## State Management Pitfalls (Undo/Redo)

### Pitfall 5: Command Pattern Granularity Mismatch
**What goes wrong:** Undo feels wrong—either undoes too much or requires multiple undos for one logical action.
**Why it happens:** Commands capture individual operations, not user-perceived actions.
**Prevention:**
- Group related operations into composite commands (e.g., "move + resize" = one undo)
- Use debouncing: don't create new command until drag ends
- Store "before" state at dragstart, "after" at dragend
**Detection:** Users complain undo is unpredictable
**Phase impact:** Phase 2 (Editor Interactions)

### Pitfall 6: Lit Reactivity Doesn't Trigger on Nested Mutations
**What goes wrong:** UI doesn't update after undo/redo because Lit doesn't detect changes.
**Why it happens:** Lit only detects reference changes, not mutations to object properties or array contents.
**Prevention:**
```typescript
// WRONG: mutating in place
this.dashboard.widgets[0].position.x = 100;

// RIGHT: create new reference
this.dashboard = {
  ...this.dashboard,
  widgets: this.dashboard.widgets.map((w, i) =>
    i === 0 ? { ...w, position: { ...w.position, x: 100 } } : w
  )
};
this.requestUpdate();
```
**Detection:** State changes but UI doesn't reflect it
**Phase impact:** Phase 2

### Pitfall 7: Undo Stack Corruption on Branch
**What goes wrong:** After undo then new edit, redo stack has stale commands that reference old state.
**Why it happens:** Classic undo/redo tree problem—must clear redo stack on new action.
**Prevention:**
```typescript
execute(command: Command) {
  command.execute();
  this.undoStack.push(command);
  this.redoStack = []; // Clear redo on new action
}
```
**Phase impact:** Phase 2

### Pitfall 8: Dirty State Not Tracked
**What goes wrong:** Users close editor and lose unsaved changes without warning.
**Why it happens:** No tracking of "initial state vs current state" difference.
**Prevention:**
- Set `isDirty` flag on any command execution
- Clear on save
- Use `beforeunload` event to warn users
**Phase impact:** Phase 2

---

## AI Integration Pitfalls

### Pitfall 9: AI Generates Invalid Widget Configs
**What goes wrong:** AI produces JSON that fails Zod validation—missing required fields, wrong types, invalid enum values.
**Why it happens:** LLMs hallucinate field names, use deprecated options, don't know exact schema.
**Prevention:**
- Pass full Zod schema description in prompt (not just examples)
- Always validate AI output with `DashboardWidgetSchema.safeParse()`
- Provide graceful degradation: show parse errors, allow manual correction
- Use structured output if AI API supports it (e.g., Gemini JSON mode)
**Detection:** Console shows Zod validation errors after AI generation
**Phase impact:** Phase 4 (AI Integration)

### Pitfall 10: AI Response Latency Blocks UI
**What goes wrong:** UI freezes while waiting for AI response.
**Why it happens:** Synchronous await on slow AI API call.
**Prevention:**
- Show loading state immediately
- Use streaming responses if available
- Allow cancellation
- Set reasonable timeouts (30s max)
**Phase impact:** Phase 4

### Pitfall 11: Prompt Injection via User Content
**What goes wrong:** User-provided dashboard names/descriptions manipulate AI behavior.
**Prevention:**
- Sanitize user content before including in prompts
- Use system prompts to establish boundaries
- Validate AI output regardless of input
**Phase impact:** Phase 4

---

## Integration Pitfalls (Existing System)

### Pitfall 12: Editor Breaks Existing Dashboard Rendering
**What goes wrong:** Changes to shared types or dashboard-component break existing view-only rendering.
**Why it happens:** Editor and viewer share types; "editor-only" fields leak into production schemas.
**Prevention:**
- Keep editor state separate from dashboard model
- Editor wraps `dashboard-component`, doesn't modify it
- Use composition: `<dashboard-editor><dashboard-component></dashboard-component></dashboard-editor>`
**Detection:** View-only dashboards fail to render after editor deploy
**Phase impact:** Phase 1

### Pitfall 13: Zod Schema Mismatch Between Frontend Types and API
**What goes wrong:** Frontend allows widget configs that backend rejects, or vice versa.
**Why it happens:** `dashboard-types.ts` (frontend) and `dashboards.ts` (api) define same types separately.
**Prevention:**
- Single source of truth: import from `api/dashboards.ts` in frontend
- Or generate frontend types from Zod schemas
- Add integration tests that validate round-trip save/load
**Detection:** Saving dashboards fails with schema validation errors
**Phase impact:** Phase 1, Phase 3

### Pitfall 14: Event Bubbling Conflicts
**What goes wrong:** Click on widget config panel also triggers grid drag or selection.
**Why it happens:** Events bubble up; drag handlers catch events meant for nested UI.
**Prevention:**
- Use `event.stopPropagation()` on panel interactions
- Check `event.target` before starting drag
- Use modifier keys or explicit "drag handle" areas
**Phase impact:** Phase 2

---

## Performance Pitfalls

### Pitfall 15: Re-rendering Entire Grid on Single Widget Change
**What goes wrong:** Moving one widget causes all widgets to re-render, causing jank.
**Why it happens:** Array reference change triggers full `repeat()` re-render.
**Prevention:**
- Use `repeat()` directive with stable keys: `repeat(widgets, w => w.id, ...)`
- Separate widget position (editor state) from widget config (model)
- Use `will-change: transform` for dragged elements
**Detection:** Chrome DevTools shows excessive paint/layout events
**Phase impact:** Phase 1

### Pitfall 16: Too Many requestUpdate Calls During Drag
**What goes wrong:** Laggy drag performance; position updates can't keep up with pointer.
**Why it happens:** Calling `requestUpdate()` on every `dragmove` event (60fps+).
**Prevention:**
- Update CSS transform directly during drag, don't go through Lit
- Only update Lit state on dragend
- Use CSS `transform` not `left/top` for 60fps performance
```typescript
// During drag: direct DOM manipulation
element.style.transform = `translate(${x}px, ${y}px)`;

// On dragend: commit to Lit state
this.widgets = this.widgets.map(w =>
  w.id === id ? { ...w, position: { x, y } } : w
);
```
**Detection:** Drag feels sluggish; Chrome DevTools shows long frame times
**Phase impact:** Phase 1

### Pitfall 17: Large Dashboard Memory Bloat with Undo History
**What goes wrong:** Memory grows unbounded with edit history.
**Why it happens:** Storing full dashboard snapshots for each undo state.
**Prevention:**
- Use command pattern with inverse operations, not snapshots
- Limit undo stack size (e.g., 50 operations)
- Clear undo stack on save (or offer option to)
**Phase impact:** Phase 2

---

## Prevention Checklist

### Before Starting Phase 1
- [ ] Verify Interactjs works with Shadow DOM (create spike)
- [ ] Establish coordinate system conventions (grid units vs pixels)
- [ ] Define editor state model separate from dashboard model
- [ ] Set up type sharing between frontend and api (import from api/dashboards.ts)

### Before Starting Phase 2 (Interactions)
- [ ] Design command pattern interface with `execute()` and `undo()`
- [ ] Define command granularity rules (what counts as one user action)
- [ ] Plan dirty state tracking and save prompts
- [ ] Ensure all mutations create new object references for Lit reactivity

### Before Starting Phase 4 (AI)
- [ ] Define AI prompt template with full schema description
- [ ] Plan error handling for invalid AI output
- [ ] Design loading/streaming UI for AI operations
- [ ] Implement content sanitization for prompt injection prevention

### Ongoing
- [ ] Test undo/redo after every new operation type
- [ ] Profile performance with 20+ widgets on grid
- [ ] Verify view-only dashboard-component still works after editor changes
- [ ] Run Zod validation on all save operations

---

## Sources

- Interactjs documentation: https://interactjs.io/docs/
- Lit reactivity: https://lit.dev/docs/components/properties/ (nested object mutation warning)
- Command pattern for undo: https://gameprogrammingpatterns.com/command.html
- Undo/redo complexity: https://dev.to/isaachagoel/you-dont-know-undoredo-4hol
- Existing codebase analysis: `api/dashboards.ts`, `frontend/src/dashboard-component.ts`
- OWASP AI security: https://genai.owasp.org/llmrisk/llm09-overreliance/

