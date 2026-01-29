# Roadmap: v1.0 WYSIWYG Dashboard Editor

## Overview

A visual drag-and-drop editor enabling users to create dashboards without code. This milestone delivers core editing capabilities, widget configuration, persistence, undo/redo, and AI-powered assistance. Phases build incrementally from foundation through complete feature set.

**Requirements:** 14 | **Phases:** 5 | **Depth:** Standard

## Phase Summary

| Phase | Name | Goal | Requirements | Dependencies |
|-------|------|------|--------------|--------------|
| 1 | Core Editor Framework | User sees a working editor shell with grid-based canvas | EDITOR-01, LAYOUT-01 | None |
| 2 | Widget Interaction | User can add, move, resize, and select widgets | EDITOR-02, EDITOR-03, EDITOR-04 | Phase 1 |
| 3 | Configuration & Persistence | User can configure widgets and save dashboards | EDITOR-05, EDITOR-06, LAYOUT-02, LAYOUT-03 | Phase 2 |
| 4 | Undo/Redo & Polish | User can undo/redo all editing actions | EDITOR-07 | Phase 3 |
| 5 | AI Integration | User gets AI assistance for chart and layout generation | EDITOR-08, AI-01, AI-02, AI-03 | Phase 3 |

---

## Phase 1: Core Editor Framework

**Goal:** User sees a working editor shell with grid-based canvas ready for widget placement.

**Dependencies:** None (foundation phase)

**Requirements:**
- EDITOR-01: User can open a blank canvas editor
- LAYOUT-01: Canvas has grid-based layout with snap-to-grid

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Editor shell with toolbar and 3-column layout
- [ ] 01-02-PLAN.md — Grid canvas with visible 12-column grid lines

**Success Criteria:**
1. User can navigate to `/editor` and see the editor UI (toolbar, canvas area, empty sidebar panels)
2. Canvas displays visible grid lines indicating the 12-column layout structure
3. Grid cells are visually distinct and ready to receive widgets
4. Editor shell renders correctly in Chrome, Firefox, and Safari

---

## Phase 2: Widget Interaction

**Goal:** User can add widgets to canvas and manipulate them spatially.

**Dependencies:** Phase 1 (requires canvas and grid)

**Requirements:**
- EDITOR-02: User can drag widgets from palette onto canvas
- EDITOR-03: User can move and resize widgets on canvas
- EDITOR-04: User can select a widget to configure it

**Success Criteria:**
1. User can drag a widget type from palette and drop it onto canvas at a grid-aligned position
2. Dragged widget shows visual feedback during drag (ghost/preview)
3. User can click a widget to select it (visual selection indicator appears)
4. User can drag a selected widget to move it; widget snaps to grid on release
5. User can drag resize handles to change widget dimensions; widget snaps to grid on release

---

## Phase 3: Configuration & Persistence

**Goal:** User can configure widgets visually and save working dashboards.

**Dependencies:** Phase 2 (requires widget selection and manipulation)

**Requirements:**
- EDITOR-05: User can configure widget properties via visual panel
- EDITOR-06: User can save dashboard with explicit "Save" button
- LAYOUT-02: User can edit dashboard theme (colors, fonts, spacing)
- LAYOUT-03: User can configure dashboard-level settings (name, description, layout type)

**Success Criteria:**
1. When widget is selected, config panel shows editable properties for that widget type
2. Changes made in config panel immediately reflect in the widget on canvas
3. User can edit dashboard name, description, and layout settings via dashboard settings panel
4. User can modify theme settings (colors, fonts, spacing) and see changes applied
5. User clicks "Save" and dashboard persists to backend; saved dashboard renders correctly in `dashboard-component`

---

## Phase 4: Undo/Redo & Polish

**Goal:** User can undo/redo all editing actions within the session.

**Dependencies:** Phase 3 (requires all edit actions to be tracked)

**Requirements:**
- EDITOR-07: User can undo/redo changes (in-memory, session-only)

**Success Criteria:**
1. User can click Undo button (or Ctrl+Z) to reverse the last action
2. User can click Redo button (or Ctrl+Shift+Z) to restore an undone action
3. All action types are undoable: add widget, move widget, resize widget, configure widget, delete widget
4. Undo/redo history is session-only; refreshing page clears history

---

## Phase 5: AI Integration

**Goal:** User gets AI assistance for chart generation, layout suggestions, and widget configuration.

**Dependencies:** Phase 3 (requires widget system and configuration panel)

**Requirements:**
- EDITOR-08: User can configure AI endpoint (external or internal API)
- AI-01: User can generate chart config from natural language prompt
- AI-02: User can get AI suggestions for dashboard layout
- AI-03: User can get AI assistance for widget configuration

**Success Criteria:**
1. User can configure AI endpoint URL in editor settings (supports OpenAI, Anthropic, or internal API)
2. User can type natural language prompt and receive generated chart configuration that creates a valid widget
3. User can request AI layout suggestions and receive recommendations for widget arrangement
4. User can request AI assistance for widget configuration and receive property value suggestions
5. AI-generated configurations pass Zod schema validation before being applied

---

## Coverage Validation

### Requirement to Phase Mapping

| Requirement | Phase | Description |
|-------------|-------|-------------|
| EDITOR-01 | 1 | User can open a blank canvas editor |
| EDITOR-02 | 2 | User can drag widgets from palette onto canvas |
| EDITOR-03 | 2 | User can move and resize widgets on canvas |
| EDITOR-04 | 2 | User can select a widget to configure it |
| EDITOR-05 | 3 | User can configure widget properties via visual panel |
| EDITOR-06 | 3 | User can save dashboard with explicit "Save" button |
| EDITOR-07 | 4 | User can undo/redo changes (in-memory, session-only) |
| EDITOR-08 | 5 | User can configure AI endpoint (external or internal API) |
| AI-01 | 5 | User can generate chart config from natural language prompt |
| AI-02 | 5 | User can get AI suggestions for dashboard layout |
| AI-03 | 5 | User can get AI assistance for widget configuration |
| LAYOUT-01 | 1 | Canvas has grid-based layout with snap-to-grid |
| LAYOUT-02 | 3 | User can edit dashboard theme (colors, fonts, spacing) |
| LAYOUT-03 | 3 | User can configure dashboard-level settings |

**Coverage:** 14/14 requirements mapped ✓

### Category Distribution

| Category | Requirements | Phase(s) |
|----------|--------------|----------|
| Editor Core | 8 | 1, 2, 3, 4, 5 |
| AI Features | 3 | 5 |
| Layout | 3 | 1, 3 |

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1 - Core Editor Framework | Not started | 0/2 | ░░░░░░░░░░ 0% |
| 2 - Widget Interaction | Not started | 0/3 | ░░░░░░░░░░ 0% |
| 3 - Configuration & Persistence | Not started | 0/4 | ░░░░░░░░░░ 0% |
| 4 - Undo/Redo & Polish | Not started | 0/1 | ░░░░░░░░░░ 0% |
| 5 - AI Integration | Not started | 0/4 | ░░░░░░░░░░ 0% |

**Overall:** 0/14 requirements complete (0%)

---
*Last updated: 2026-01-29*

