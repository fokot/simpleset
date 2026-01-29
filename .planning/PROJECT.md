# Project: WYSIWYG Dashboard Editor with AI

## What This Is

A visual drag-and-drop editor for creating and configuring dashboards with AI-powered assistance. Users start with a blank canvas, drag widgets onto it, configure them visually, and get AI help for chart generation, layout suggestions, and smart configuration.

## Why This Exists

**Problem:** Currently, dashboards must be created by manually editing JSON configuration files or writing code. This is slow, error-prone, and requires technical knowledge.

**Solution:** A WYSIWYG editor that lets end-users visually build dashboards without touching code, with AI assistance to accelerate the process.

**Value:** Democratizes dashboard creation - anyone can build sophisticated dashboards through drag-and-drop and natural language AI prompts.

## Core Value

**The ONE thing that must work:** Users can drag widgets onto a canvas, configure them visually, and save working dashboards - all without writing code.

## Context

### Existing System

This is a **brownfield project** - adding a new editor to an existing dashboard platform:

**Current Architecture:**
- **Frontend:** Lit Web Components (TypeScript)
- **Backend:** Scala 3 + ZIO HTTP
- **Existing Components:** `dashboard-component` (renders dashboards), widget library (chart, text, image, iframe, filter, metric, table, markdown)
- **API:** REST endpoints for dashboard CRUD, data queries
- **Data Layer:** PostgreSQL backend, data source abstraction

**What Already Works:**
- Dashboard rendering with 8 widget types
- Backend API for dashboard persistence
- Data binding and query execution
- Widget-based architecture with Zod schemas

**What's Missing:**
- Visual editor for creating/editing dashboards
- AI-powered assistance
- Drag-and-drop interface
- Visual configuration UI

### Technical Constraints

**Must Use:**
- Lit (consistency with existing frontend)
- Interactjs (drag-and-drop library)
- Existing dashboard schema from `api/dashboards.ts`
- Existing backend API endpoints

**Must NOT:**
- Introduce React or other frameworks (keep stack consistent)
- Break existing dashboard-component rendering
- Change existing API contracts (backward compatibility)

## Requirements

### Validated

These capabilities already exist in the codebase:

- ✓ Dashboard rendering with widget system — existing
- ✓ Backend API for dashboard persistence — existing
- ✓ Widget types: chart, text, image, iframe, filter, metric, table, markdown — existing
- ✓ Dashboard schema with layout, theme, widgets — existing
- ✓ Data binding and query execution — existing

### Active

These are the new capabilities to build:

- [ ] **EDITOR-01**: User can open a blank canvas editor
- [ ] **EDITOR-02**: User can drag widgets from palette onto canvas
- [ ] **EDITOR-03**: User can move and resize widgets on canvas
- [ ] **EDITOR-04**: User can select a widget to configure it
- [ ] **EDITOR-05**: User can configure widget properties via visual panel
- [ ] **EDITOR-06**: User can save dashboard with explicit "Save" button
- [ ] **EDITOR-07**: User can undo/redo changes (in-memory, session-only)
- [ ] **EDITOR-08**: User can configure AI endpoint (external or internal API)
- [ ] **AI-01**: User can generate chart config from natural language prompt
- [ ] **AI-02**: User can get AI suggestions for dashboard layout
- [ ] **AI-03**: User can get AI assistance for widget configuration
- [ ] **LAYOUT-01**: Canvas has grid-based layout with snap-to-grid
- [ ] **LAYOUT-02**: User can edit dashboard theme (colors, fonts, spacing)
- [ ] **LAYOUT-03**: User can configure dashboard-level settings (name, description, layout type)

### Out of Scope

- Authentication/authorization — deferred (mentioned explicitly)
- Loading existing dashboards for editing — v1 is blank canvas only
- Collaborative editing — future consideration
- Version history persistence — undo/redo is session-only
- Mobile/touch optimization — desktop-first
- Dashboard templates/presets — future enhancement
- AI model hosting — user provides endpoint, we don't host
- Real-time preview of data — widgets show placeholder/mock data in editor

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Lit + Interactjs over React + react-grid-layout | Consistency with existing Lit-based frontend, avoid mixed stack | New component: `dashboard-editor-component.ts` |
| Configurable AI endpoint | Flexibility for external (OpenAI/Anthropic) or internal models | AI service abstraction layer needed |
| Explicit save (not auto-save) | User control over when changes persist | Save button in editor UI |
| In-memory undo/redo only | Simpler implementation, sufficient for editing sessions | No persistence of history |
| No authentication in v1 | Faster delivery, can add later | Open editor access |
| Blank canvas only (no load existing) | Focused scope for v1 | Load feature deferred to v2 |

## Success Criteria

**Must achieve:**
1. User creates a multi-widget dashboard using only drag-and-drop and visual config (zero code)
2. User generates a chart from natural language prompt via AI
3. User saves dashboard and it renders correctly in existing dashboard-component
4. Undo/redo works for all editor actions

**Quality bar:**
- Drag-and-drop feels smooth (no lag, clear visual feedback)
- AI responses are helpful and generate valid configurations
- Saved dashboards are valid per existing Zod schemas
- Editor works in Chrome, Firefox, Safari

## Non-Goals

- Replacing existing dashboard-component (editor creates dashboards, component renders them)
- Building AI models (we consume APIs)
- Dashboard analytics/usage tracking
- Multi-user collaboration features

---
*Last updated: 2026-01-29 after initialization*

