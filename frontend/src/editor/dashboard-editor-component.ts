import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import './editor-toolbar.js';
import './editor-canvas.js';

@customElement('dashboard-editor-component')
export class DashboardEditorComponent extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: 'Outfit', system-ui, sans-serif;
      color: #2a2520;
      --amber: #d4a04a;
      --amber-light: #f0d799;
      --amber-glow: rgba(212, 160, 74, 0.15);
      --charcoal: #2a2520;
      --charcoal-light: #3d3630;
      --cream: #f5f2ed;
      --cream-dark: #e8e3db;
      --surface: #ffffff;
      --text-muted: #8a8279;
      --text-dim: #b5ada4;
    }

    .main-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar-left {
      width: 240px;
      background: var(--surface);
      border-right: 1px solid var(--cream-dark);
      box-sizing: border-box;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-right {
      width: 280px;
      background: var(--surface);
      border-left: 1px solid var(--cream-dark);
      box-sizing: border-box;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-section {
      padding: 20px;
      border-bottom: 1px solid var(--cream-dark);
    }

    .sidebar-section:last-child {
      border-bottom: none;
    }

    .canvas-area {
      flex: 1;
      background: var(--cream);
      padding: 24px;
      box-sizing: border-box;
      overflow: auto;
      position: relative;
    }

    editor-canvas {
      display: block;
      min-height: calc(100% - 60px);
    }

    .sidebar-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }

    .sidebar-hint {
      color: var(--text-dim);
      font-size: 0.82rem;
      line-height: 1.5;
    }

    .widget-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .widget-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--cream);
      cursor: grab;
      transition: all 0.2s;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--charcoal);
    }

    .widget-item:hover {
      background: var(--amber-glow);
      color: var(--charcoal);
    }

    .widget-item:active {
      cursor: grabbing;
    }

    .widget-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .widget-icon svg {
      width: 16px;
      height: 16px;
    }

    .widget-icon.chart {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      color: #1565c0;
    }

    .widget-icon.table {
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      color: #2e7d32;
    }

    .widget-icon.metric {
      background: linear-gradient(135deg, #fff3e0, #ffe0b2);
      color: #e65100;
    }

    .widget-icon.text {
      background: linear-gradient(135deg, #f3e5f5, #e1bee7);
      color: #7b1fa2;
    }

    .config-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 16px;
      color: var(--text-dim);
    }

    .config-empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--cream);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .config-empty-icon svg {
      width: 24px;
      height: 24px;
      color: var(--text-dim);
    }

    .config-empty p {
      font-size: 0.82rem;
      line-height: 1.5;
      margin: 0;
    }
  `;

  private _iconBarChart() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
  }

  private _iconTable() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`;
  }

  private _iconHash() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`;
  }

  private _iconText() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`;
  }

  private _iconPointer() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`;
  }

  render() {
    return html`
      <editor-toolbar></editor-toolbar>
      <div class="main-area">
        <div class="sidebar-left">
          <div class="sidebar-section">
            <div class="sidebar-title">Widgets</div>
            <div class="widget-list">
              <div class="widget-item">
                <div class="widget-icon chart">${this._iconBarChart()}</div>
                Chart
              </div>
              <div class="widget-item">
                <div class="widget-icon table">${this._iconTable()}</div>
                Table
              </div>
              <div class="widget-item">
                <div class="widget-icon metric">${this._iconHash()}</div>
                Metric
              </div>
              <div class="widget-item">
                <div class="widget-icon text">${this._iconText()}</div>
                Text
              </div>
            </div>
          </div>
        </div>
        <div class="canvas-area">
          <editor-canvas></editor-canvas>
        </div>
        <div class="sidebar-right">
          <div class="sidebar-section">
            <div class="sidebar-title">Properties</div>
            <div class="config-empty">
              <div class="config-empty-icon">${this._iconPointer()}</div>
              <p>Select a widget on the canvas to edit its properties</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
