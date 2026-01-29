import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import './editor-toolbar.js';

@customElement('dashboard-editor-component')
export class DashboardEditorComponent extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family: var(--dashboard-font-family, 'Inter, system-ui, sans-serif');
    }

    .main-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar-left {
      width: 250px;
      background: #ffffff;
      border-right: 1px solid #e0e0e0;
      padding: 16px;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .sidebar-right {
      width: 280px;
      background: #ffffff;
      border-left: 1px solid #e0e0e0;
      padding: 16px;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .canvas-area {
      flex: 1;
      background: #f5f5f5;
      padding: 16px;
      box-sizing: border-box;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 1.2rem;
    }

    .sidebar-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }

    .sidebar-content {
      color: #999;
      font-size: 0.875rem;
    }
  `;

  render() {
    return html`
      <editor-toolbar></editor-toolbar>
      <div class="main-area">
        <div class="sidebar-left">
          <div class="sidebar-title">Widget Palette</div>
          <div class="sidebar-content">Drag widgets here...</div>
        </div>
        <div class="canvas-area">
          Canvas Area
        </div>
        <div class="sidebar-right">
          <div class="sidebar-title">Configuration</div>
          <div class="sidebar-content">Select a widget to configure...</div>
        </div>
      </div>
    `;
  }
}

