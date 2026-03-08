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

  private _editorState!: EditorState;

  constructor() {
    super();
    this._editorState = new EditorState(this);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.dashboard) {
      this._editorState.setDashboard(this.dashboard);
    }
    // Keyboard shortcuts
    this._handleKeydown = this._handleKeydown.bind(this);
    document.addEventListener('keydown', this._handleKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeydown);
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
      // Only delete if not focused on an input
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

    // Handle nested field paths like 'config.content' or 'dataBinding.sql'
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
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family: var(--dashboard-font-family, 'Inter, system-ui, sans-serif');
      color: #333;
    }

    .main-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar-left {
      width: 240px;
      background: #ffffff;
      border-right: 1px solid #e0e0e0;
      padding: 14px;
      box-sizing: border-box;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-right {
      width: 270px;
      background: #ffffff;
      border-left: 1px solid #e0e0e0;
      padding: 14px;
      box-sizing: border-box;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .canvas-area {
      flex: 1;
      background: #f0f0f0;
      padding: 16px;
      box-sizing: border-box;
      overflow: auto;
    }

    editor-canvas {
      display: block;
      min-height: calc(100vh - 48px - 32px);
      border-radius: 4px;
    }

    .sidebar-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 12px;
    }

    /* Preview mode */
    .preview-overlay {
      position: fixed;
      inset: 0;
      z-index: 900;
      background: white;
      overflow: auto;
    }

    .preview-bar {
      position: sticky;
      top: 0;
      z-index: 901;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #1a1a1a;
      color: white;
      font-size: 0.85rem;
    }

    .preview-close-btn {
      padding: 4px 12px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 4px;
      background: transparent;
      color: white;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .preview-close-btn:hover {
      background: rgba(255,255,255,0.1);
    }
  `;

  render() {
    const state = this._editorState;

    return html`
      <editor-toolbar
        dashboard-name=${state.dashboard.name}
        ?can-undo=${state.canUndo}
        ?can-redo=${state.canRedo}
        ?is-dirty=${state.isDirty}
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
