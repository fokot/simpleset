import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Dashboard, DashboardWidget } from './types/dashboard-types.js';
import './widgets/index.js';

export interface DashboardData {
  [widgetId: string]: any;
}

@customElement('dashboard-component')
export class DashboardComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: var(--dashboard-font-family, 'Inter, system-ui, sans-serif');
      background-color: var(--dashboard-bg-color, #f5f5f5);
    }

    .dashboard-container {
      padding: var(--dashboard-padding, 16px);
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .dashboard-header {
      margin-bottom: 24px;
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--dashboard-text-color, #1a1a1a);
    }

    .dashboard-description {
      font-size: 1rem;
      color: var(--dashboard-text-secondary, #666);
      margin: 0;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(var(--dashboard-columns, 12), 1fr);
      gap: var(--dashboard-gap, 16px);
      width: 100%;
      min-height: 400px;
    }

    .widget-container {
      background: var(--widget-bg-color, white);
      border-radius: var(--widget-border-radius, 8px);
      box-shadow: var(--widget-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
      padding: var(--widget-padding, 16px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .widget-container:hover {
      box-shadow: var(--widget-shadow-hover, 0 4px 16px rgba(0, 0, 0, 0.15));
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--widget-border-color, #e0e0e0);
    }

    .widget-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      color: var(--widget-title-color, #1a1a1a);
    }

    .widget-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .error-message {
      color: var(--error-color, #d32f2f);
      background: var(--error-bg, #ffebee);
      padding: 12px;
      border-radius: 4px;
      border: 1px solid var(--error-border, #ffcdd2);
      font-size: 0.9rem;
    }

    .loading-message {
      color: var(--loading-color, #666);
      text-align: center;
      padding: 20px;
      font-style: italic;
    }
  `;

  @property({ type: Object })
  dashboard?: Dashboard;

  @property({ type: Object })
  data?: DashboardData;

  @property({ type: String, attribute: 'backend-base-url' })
  backendBaseUrl?: string;

  @state()
  private _errors: Map<string, string> = new Map();

  @state()
  private _loadedData: DashboardData = {};

  @state()
  private _isLoading: boolean = false;

  protected willUpdate(changedProperties: PropertyValues): void {
    // If dashboard or backendBaseUrl changed, trigger data loading
    if ((changedProperties.has('dashboard') || changedProperties.has('backendBaseUrl')) &&
        !this.data && this.backendBaseUrl && this.dashboard) {
      this._loadDataFromBackend();
    }

    if (changedProperties.has('dashboard') || changedProperties.has('data')) {
      this._validateData();
    }

    if (changedProperties.has('dashboard') && this.dashboard?.theme) {
      this._applyTheme();
    }
  }

  private _applyTheme(): void {
    if (!this.dashboard?.theme) return;

    const theme = this.dashboard.theme;
    const style = this.style;

    if (theme.backgroundColor) style.setProperty('--dashboard-bg-color', theme.backgroundColor);
    if (theme.textColor) style.setProperty('--dashboard-text-color', theme.textColor);
    if (theme.primaryColor) style.setProperty('--primary-color', theme.primaryColor);
    if (theme.secondaryColor) style.setProperty('--secondary-color', theme.secondaryColor);
    if (theme.accentColor) style.setProperty('--accent-color', theme.accentColor);
    if (theme.fontFamily) style.setProperty('--dashboard-font-family', theme.fontFamily);
    if (theme.borderRadius) style.setProperty('--widget-border-radius', `${theme.borderRadius}px`);
    if (theme.spacing) style.setProperty('--dashboard-gap', `${theme.spacing}px`);
  }

  private async _loadDataFromBackend(): Promise<void> {
    if (!this.dashboard || !this.backendBaseUrl) return;

    this._isLoading = true;
    this._errors.clear();
    this._loadedData = {};

    try {
      // Get all widgets that have dataBinding configuration
      const widgetsWithDataBinding = this.dashboard.widgets?.filter(
        widget => widget.config.type === 'chart' && widget.config.dataBinding
      ) || [];

      if (widgetsWithDataBinding.length === 0) {
        this._isLoading = false;
        return;
      }

      // Load data for all widgets in parallel
      const dataPromises = widgetsWithDataBinding.map(widget =>
        this._loadWidgetData(widget)
      );

      await Promise.all(dataPromises);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this._errors.set('data', `Failed to load dashboard data: ${error}`);
    } finally {
      this._isLoading = false;
    }
  }

  private async _loadWidgetData(widget: DashboardWidget): Promise<void> {
    if (widget.config.type !== 'chart' || !widget.config.dataBinding) return;

    const { sql, dataSourceId } = widget.config.dataBinding;

    if (!sql || !dataSourceId) {
      console.warn(`Widget ${widget.id} has incomplete dataBinding configuration`);
      return;
    }

    try {
      const url = `${this.backendBaseUrl}/${this.dashboard!.id}/${widget.id}`;
      console.log(`Fetching data for widget ${widget.id} from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ sql, dataSourceId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendData = await response.json();
      console.log(`Backend data received for ${widget.id}:`, backendData);

      // Transform backend data to chart format
      const chartData = this._transformBackendData(backendData);
      if (chartData) {
        this._loadedData[widget.id] = chartData;
        this.requestUpdate(); // Trigger re-render
      }
    } catch (error) {
      console.error(`Error loading data for widget ${widget.id}:`, error);
      this._errors.set(widget.id, `Failed to load data: ${error}`);
    }
  }

  private _transformBackendData(backendData: any): any {
    if (!backendData || !backendData.data || !Array.isArray(backendData.data)) {
      return null;
    }

    const data = backendData.data;
    if (data.length === 0) return null;

    // Get column names from the first row
    const columns = Object.keys(data[0]);
    if (columns.length === 0) return null;

    // First column is typically the label/category
    const labelColumn = columns[0];
    const labels = data.map((row: any) => row[labelColumn]);

    // Remaining columns are data series
    const dataColumns = columns.slice(1);
    const datasets = dataColumns.map(colName => ({
      label: colName.charAt(0).toUpperCase() + colName.slice(1),
      data: data.map((row: any) => row[colName])
    }));

    return {
      type: 'bar', // Default type, can be customized
      labels,
      datasets
    };
  }

  private _validateData(): void {
    this._errors.clear();

    if (!this.dashboard) {
      this._errors.set('dashboard', 'Dashboard configuration is required');
      return;
    }

    // If data is not provided but backendBaseUrl is set, data will be loaded automatically
    if (!this.data && !this.backendBaseUrl) {
      this._errors.set('data', 'Either data or backendBaseUrl must be provided');
      return;
    }

    // Validate dashboard structure
    if (!this.dashboard.layout) {
      this._errors.set('dashboard', 'Dashboard layout configuration is missing');
      return;
    }

    if (!Array.isArray(this.dashboard.widgets)) {
      this._errors.set('dashboard', 'Dashboard widgets must be an array');
      return;
    }

    // Only validate widgets if we have data (not loading from backend)
    if (this.data) {
      this.dashboard.widgets.forEach(widget => {
        this._validateWidget(widget);
      });
    }
  }

  private _validateWidget(widget: DashboardWidget): void {
    // Check if widget has required properties
    if (!widget.id) {
      this._errors.set('widget', 'Widget ID is required');
      return;
    }

    if (!widget.position) {
      this._errors.set(widget.id, `Widget ${widget.id} is missing position configuration`);
      return;
    }

    if (!widget.config) {
      this._errors.set(widget.id, `Widget ${widget.id} is missing configuration`);
      return;
    }

    // Validate position
    const pos = widget.position;
    if (pos.x < 0 || pos.y < 0 || pos.width <= 0 || pos.height <= 0) {
      this._errors.set(widget.id, `Widget ${widget.id} has invalid position or dimensions`);
      return;
    }

    // Check if data exists for widget
    if (!this.data![widget.id]) {
      this._errors.set(widget.id, `No data provided for widget: ${widget.title || widget.id}`);
      return;
    }

    // Validate widget-specific configuration
    this._validateWidgetConfig(widget);
  }

  private _validateWidgetConfig(widget: DashboardWidget): void {
    const { config } = widget;

    switch (config.type) {
      case 'metric':
        if (!config.config?.title) {
          this._errors.set(widget.id, `Metric widget ${widget.id} is missing title`);
        }
        break;
      case 'table':
        if (!config.config?.columns || !Array.isArray(config.config.columns)) {
          this._errors.set(widget.id, `Table widget ${widget.id} is missing columns configuration`);
        }
        break;
    }
  }

  private _getWidgetGridStyle(widget: DashboardWidget): string {
    const { position } = widget;
    return `
      grid-column: ${position.x + 1} / span ${position.width};
      grid-row: ${position.y + 1} / span ${position.height};
    `;
  }

  private _renderWidget(widget: DashboardWidget) {
    // Use provided data if available, otherwise use loaded data
    const widgetData = this.data?.[widget.id] || this._loadedData[widget.id];
    const error = this._errors.get(widget.id);

    return html`
      <div
        class="widget-container"
        style="${this._getWidgetGridStyle(widget)}"
      >
        ${widget.title ? html`
          <div class="widget-header">
            <h3 class="widget-title">${widget.title}</h3>
          </div>
        ` : ''}

        <div class="widget-content">
          ${error ? html`
            <div class="error-message">${error}</div>
          ` : this._renderWidgetContent(widget, widgetData)}
        </div>
      </div>
    `;
  }

  private _renderWidgetContent(widget: DashboardWidget, data: any) {
    if (!data) {
      const loadingMessage = this._isLoading ? 'Loading data from backend...' : 'Loading...';
      return html`<div class="loading-message">${loadingMessage}</div>`;
    }

    // Widget rendering will be implemented in the next step
    switch (widget.config.type) {
      case 'metric':
        return html`<metric-widget .config="${widget.config.config}" .data="${data}"></metric-widget>`;
      case 'table':
        return html`<table-widget .config="${widget.config.config}" .data="${data}"></table-widget>`;
      case 'chart':
        return html`<chart-widget .config="${widget.config}" .data="${data}"></chart-widget>`;
      default:
        return html`
          <div class="error-message">
            Unsupported widget type: ${widget.config.type}
          </div>
        `;
    }
  }

  render() {
    if (this._errors.has('dashboard') || this._errors.has('data')) {
      return html`
        <div class="dashboard-container">
          <div class="error-message">
            ${Array.from(this._errors.values()).join(', ')}
          </div>
        </div>
      `;
    }

    if (!this.dashboard) {
      return html`
        <div class="dashboard-container">
          <div class="loading-message">Loading dashboard...</div>
        </div>
      `;
    }

    return html`
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">${this.dashboard.name}</h1>
          ${this.dashboard.description ? html`
            <p class="dashboard-description">${this.dashboard.description}</p>
          ` : ''}
        </div>
        
        <div 
          class="dashboard-grid"
          style="--dashboard-columns: ${this.dashboard.layout.columns}"
        >
          ${this.dashboard.widgets?.map(widget => this._renderWidget(widget))}
        </div>
      </div>
    `;
  }
}
