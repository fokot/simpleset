import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Dashboard, WidgetType } from '../types/dashboard-types.js';
import { EditorState } from './editor-state.js';
import './editor-toolbar.js';
import './editor-canvas.js';
import './widget-palette.js';
import './widget-config-panel.js';
import './dashboard-settings-dialog.js';

@customElement('dashboard-editor-component')
export class DashboardEditorComponent extends LitElement {
  @property({ type: Object })
  dashboard?: Dashboard;

  @state()
  private _showSettings = false;

  @state()
  private _showPreview = false;

  @state()
  private _darkMode = false;

  private _editorState!: EditorState;

  constructor() {
    super();
    this._editorState = new EditorState(this);
    // Detect system preference
    this._darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.dashboard) {
      this._editorState.setDashboard(this.dashboard);
    }
    this._handleKeydown = this._handleKeydown.bind(this);
    document.addEventListener('keydown', this._handleKeydown);

    // Listen for system theme changes
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._handleMediaChange = this._handleMediaChange.bind(this);
    this._mediaQuery.addEventListener('change', this._handleMediaChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeydown);
    this._mediaQuery?.removeEventListener('change', this._handleMediaChange);
  }

  private _mediaQuery?: MediaQueryList;

  private _handleMediaChange(e: MediaQueryListEvent) {
    this._darkMode = e.matches;
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
  }

  private _handleKeydown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this._editorState.undo();
    } else if (mod && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      this._editorState.redo();
    } else if (mod && e.key === 's') {
      e.preventDefault();
      this._handleSave();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const tag = (e.target as HTMLElement).tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        const sel = this._editorState.selectedWidgetId;
        if (sel) {
          e.preventDefault();
          this._editorState.removeWidget(sel);
        }
      }
    } else if (e.key === 'Escape') {
      this._editorState.selectWidget(null);
      this._showSettings = false;
      this._showPreview = false;
    }
  }

  // --- Event handlers ---

  private _handleWidgetAdd(e: CustomEvent) {
    const type = e.detail.type as WidgetType;
    this._editorState.addWidget(type);
  }

  private _handleWidgetDrop(e: CustomEvent) {
    const { type, x, y } = e.detail;
    this._editorState.addWidget(type as WidgetType, { x, y });
  }

  private _handleWidgetSelect(e: CustomEvent) {
    this._editorState.selectWidget(e.detail.widgetId);
  }

  private _handleWidgetMove(e: CustomEvent) {
    const { widgetId, x, y } = e.detail;
    this._editorState.updateWidgetPosition(widgetId, { x, y });
  }

  private _handleWidgetResize(e: CustomEvent) {
    const { widgetId, width, height } = e.detail;
    this._editorState.updateWidgetPosition(widgetId, { width, height });
  }

  private _handleWidgetDuplicate(e: CustomEvent) {
    this._editorState.duplicateWidget(e.detail.widgetId);
  }

  private _handleWidgetDelete(e: CustomEvent) {
    this._editorState.removeWidget(e.detail.widgetId);
  }

  private _handleTitleChange(e: CustomEvent) {
    if (!this._editorState.selectedWidgetId) return;
    this._editorState.updateWidgetTitle(this._editorState.selectedWidgetId, e.detail.value);
  }

  private _handleConfigChange(e: CustomEvent) {
    if (!this._editorState.selectedWidgetId) return;
    const { field, value } = e.detail;
    const widget = this._editorState.selectedWidget;
    if (!widget) return;

    const config = JSON.parse(JSON.stringify(widget.config));
    const parts = field.split('.');
    let obj: any = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;

    this._editorState.updateWidgetConfig(this._editorState.selectedWidgetId, config);
  }

  private _handlePositionChange(e: CustomEvent) {
    if (!this._editorState.selectedWidgetId) return;
    const { field, value } = e.detail;
    this._editorState.updateWidgetPosition(this._editorState.selectedWidgetId, { [field]: value });
  }

  private _handleSettingsChange(e: CustomEvent) {
    this._editorState.updateDashboardProperties(e.detail);
  }

  private _handleToolbarAction(e: CustomEvent) {
    switch (e.detail.action) {
      case 'undo': this._editorState.undo(); break;
      case 'redo': this._editorState.redo(); break;
      case 'save': this._handleSave(); break;
      case 'settings': this._showSettings = true; break;
      case 'preview': this._showPreview = !this._showPreview; break;
      case 'export': this._handleExport(); break;
      case 'import': this._handleImport(); break;
      case 'toggle-dark': this.toggleDarkMode(); break;
    }
  }

  private _handleSave() {
    this.dispatchEvent(new CustomEvent('dashboard-save', {
      detail: { dashboard: this._editorState.dashboard },
      bubbles: true,
      composed: true,
    }));
    this._editorState.markClean();
  }

  private _handleExport() {
    const json = this._editorState.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this._editorState.dashboard.name || 'dashboard'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private _handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        this._editorState.importJSON(text);
      } catch (err) {
        console.error('Failed to import dashboard:', err);
      }
    };
    input.click();
  }

  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      transition: background-color 0.3s ease, color 0.3s ease;

      /* Light theme tokens */
      --ed-bg-primary: #ffffff;
      --ed-bg-secondary: #f4f5f7;
      --ed-bg-tertiary: #ebedf0;
      --ed-bg-canvas: #e8eaed;
      --ed-border: #d4d7dd;
      --ed-border-subtle: #e8eaed;
      --ed-text-primary: #1a1d23;
      --ed-text-secondary: #5f6672;
      --ed-text-tertiary: #8c919a;
      --ed-text-muted: #adb1b8;
      --ed-accent: #0ea5e9;
      --ed-accent-hover: #0284c7;
      --ed-accent-subtle: rgba(14, 165, 233, 0.1);
      --ed-accent-glow: rgba(14, 165, 233, 0.25);
      --ed-danger: #ef4444;
      --ed-danger-bg: #fef2f2;
      --ed-danger-border: #fecaca;
      --ed-warning: #f59e0b;
      --ed-widget-bg: #ffffff;
      --ed-widget-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --ed-widget-shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
      --ed-overlay: rgba(0, 0, 0, 0.45);
      --ed-input-bg: #ffffff;
      --ed-sidebar-width: 248px;
      --ed-config-width: 280px;
      --ed-toolbar-height: 52px;
      --ed-radius-sm: 6px;
      --ed-radius-md: 8px;
      --ed-radius-lg: 12px;
      color: var(--ed-text-primary);
    }

    :host(.dark) {
      --ed-bg-primary: #16181d;
      --ed-bg-secondary: #1c1f26;
      --ed-bg-tertiary: #23262f;
      --ed-bg-canvas: #111318;
      --ed-border: #2d313a;
      --ed-border-subtle: #23262f;
      --ed-text-primary: #e4e6ea;
      --ed-text-secondary: #9da3ae;
      --ed-text-tertiary: #6b7280;
      --ed-text-muted: #4b5060;
      --ed-accent: #38bdf8;
      --ed-accent-hover: #7dd3fc;
      --ed-accent-subtle: rgba(56, 189, 248, 0.1);
      --ed-accent-glow: rgba(56, 189, 248, 0.2);
      --ed-danger: #f87171;
      --ed-danger-bg: rgba(239, 68, 68, 0.1);
      --ed-danger-border: rgba(239, 68, 68, 0.25);
      --ed-warning: #fbbf24;
      --ed-widget-bg: #1c1f26;
      --ed-widget-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15);
      --ed-widget-shadow-hover: 0 4px 16px rgba(0,0,0,0.3);
      --ed-overlay: rgba(0, 0, 0, 0.65);
      --ed-input-bg: #23262f;
    }

    .main-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar-left {
      width: var(--ed-sidebar-width);
      background: var(--ed-bg-primary);
      border-right: 1px solid var(--ed-border);
      padding: 16px;
      box-sizing: border-box;
      overflow-y: auto;
      flex-shrink: 0;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .sidebar-right {
      width: var(--ed-config-width);
      background: var(--ed-bg-primary);
      border-left: 1px solid var(--ed-border);
      padding: 16px;
      box-sizing: border-box;
      overflow-y: auto;
      flex-shrink: 0;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .canvas-area {
      flex: 1;
      background: var(--ed-bg-canvas);
      padding: 20px;
      box-sizing: border-box;
      overflow: auto;
      transition: background-color 0.3s ease;
    }

    editor-canvas {
      display: block;
      min-height: calc(100vh - var(--ed-toolbar-height) - 40px);
      border-radius: var(--ed-radius-md);
    }

    .sidebar-title {
      font-family: 'DM Mono', 'SF Mono', monospace;
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--ed-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
    }

    /* Scrollbar styling */
    .sidebar-left::-webkit-scrollbar,
    .sidebar-right::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-left::-webkit-scrollbar-track,
    .sidebar-right::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-left::-webkit-scrollbar-thumb,
    .sidebar-right::-webkit-scrollbar-thumb {
      background: var(--ed-border);
      border-radius: 4px;
    }

    /* Preview mode */
    .preview-overlay {
      position: fixed;
      inset: 0;
      z-index: 900;
      background: var(--ed-bg-primary);
      overflow: auto;
    }

    .preview-bar {
      position: sticky;
      top: 0;
      z-index: 901;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: #0f1115;
      color: #e4e6ea;
      font-size: 0.82rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      border-bottom: 1px solid #2d313a;
    }

    .preview-close-btn {
      padding: 5px 14px;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: var(--ed-radius-sm);
      background: transparent;
      color: #9da3ae;
      cursor: pointer;
      font-size: 0.78rem;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.15s ease;
    }

    .preview-close-btn:hover {
      background: rgba(255,255,255,0.08);
      color: #e4e6ea;
      border-color: rgba(255,255,255,0.25);
    }
  `;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('_darkMode')) {
      if (this._darkMode) {
        this.classList.add('dark');
      } else {
        this.classList.remove('dark');
      }
    }
  }

  render() {
    const state = this._editorState;

    return html`
      <editor-toolbar
        dashboard-name=${state.dashboard.name}
        ?can-undo=${state.canUndo}
        ?can-redo=${state.canRedo}
        ?is-dirty=${state.isDirty}
        ?dark-mode=${this._darkMode}
        @toolbar-action=${this._handleToolbarAction}
      ></editor-toolbar>

      <div class="main-area">
        <div class="sidebar-left">
          <div class="sidebar-title">Widgets</div>
          <widget-palette
            @widget-add=${this._handleWidgetAdd}
          ></widget-palette>
        </div>

        <div class="canvas-area">
          <editor-canvas
            .widgets=${state.widgets}
            .columns=${state.dashboard.layout.columns ?? 12}
            .gap=${state.dashboard.layout.margin?.[0] ?? 16}
            selected-widget-id=${state.selectedWidgetId ?? ''}
            @widget-drop=${this._handleWidgetDrop}
            @widget-select=${this._handleWidgetSelect}
            @widget-move=${this._handleWidgetMove}
            @widget-resize=${this._handleWidgetResize}
            @widget-duplicate=${this._handleWidgetDuplicate}
            @widget-delete=${this._handleWidgetDelete}
          ></editor-canvas>
        </div>

        <div class="sidebar-right">
          <div class="sidebar-title">Configuration</div>
          <widget-config-panel
            .widget=${state.selectedWidget}
            @title-change=${this._handleTitleChange}
            @config-change=${this._handleConfigChange}
            @position-change=${this._handlePositionChange}
            @widget-delete=${this._handleWidgetDelete}
          ></widget-config-panel>
        </div>
      </div>

      <dashboard-settings-dialog
        .dashboard=${state.dashboard}
        ?open=${this._showSettings}
        @settings-change=${this._handleSettingsChange}
        @close=${() => this._showSettings = false}
      ></dashboard-settings-dialog>

      ${this._showPreview ? html`
        <div class="preview-overlay">
          <div class="preview-bar">
            <span>Preview: ${state.dashboard.name}</span>
            <button class="preview-close-btn" @click=${() => this._showPreview = false}>Close Preview</button>
          </div>
          <dashboard-component .dashboard=${state.dashboard}></dashboard-component>
        </div>
      ` : ''}
    `;
  }
}
