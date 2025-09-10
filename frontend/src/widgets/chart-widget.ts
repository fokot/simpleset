import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { WidgetConfig } from '../types/dashboard-types.js';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
  type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
}

export class ChartWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
    }

    .chart-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 2px dashed var(--chart-border-color, #ccc);
      border-radius: 8px;
      background: var(--chart-placeholder-bg, #f9f9f9);
      min-height: 200px;
    }

    .chart-icon {
      font-size: 3rem;
      color: var(--chart-icon-color, #999);
      margin-bottom: 16px;
    }

    .chart-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--chart-title-color, #333);
      margin-bottom: 8px;
    }

    .chart-description {
      font-size: 0.9rem;
      color: var(--chart-description-color, #666);
      text-align: center;
      margin-bottom: 16px;
    }

    .chart-data-preview {
      background: white;
      border: 1px solid var(--chart-border-color, #e0e0e0);
      border-radius: 4px;
      padding: 12px;
      max-width: 300px;
      width: 100%;
    }

    .data-preview-title {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--chart-title-color, #333);
    }

    .data-preview-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 0.8rem;
      border-bottom: 1px solid var(--chart-border-color, #f0f0f0);
    }

    .data-preview-item:last-child {
      border-bottom: none;
    }

    .data-label {
      color: var(--chart-description-color, #666);
    }

    .data-value {
      font-weight: 500;
      color: var(--chart-title-color, #333);
    }

    .chart-type-badge {
      display: inline-block;
      padding: 4px 8px;
      background: var(--primary-color, #2196f3);
      color: white;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .dataset-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
  `;

  @property({ type: Object })
  config!: WidgetConfig;

  @property({ type: Object })
  data!: ChartData;

  private _getChartIcon(type?: string): string {
    switch (type) {
      case 'line': return '📈';
      case 'bar': return '📊';
      case 'pie': return '🥧';
      case 'doughnut': return '🍩';
      case 'area': return '📈';
      default: return '📊';
    }
  }

  private _getChartTypeDescription(type?: string): string {
    switch (type) {
      case 'line': return 'Line chart showing trends over time';
      case 'bar': return 'Bar chart comparing values across categories';
      case 'pie': return 'Pie chart showing proportional data';
      case 'doughnut': return 'Doughnut chart displaying categorical data';
      case 'area': return 'Area chart highlighting data volume';
      default: return 'Chart visualization of your data';
    }
  }

  private _generateColors(count: number): string[] {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
      '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  render() {
    if (!this.config || !this.data) {
      return html`
        <div class="chart-container">
          <div class="chart-placeholder">
            <div class="chart-icon">❌</div>
            <div class="chart-title">Invalid Chart Configuration</div>
            <div class="chart-description">
              Chart configuration or data is missing
            </div>
          </div>
        </div>
      `;
    }

    const chartType = this.data.type || 'bar';
    const colors = this._generateColors(this.data.datasets?.length || 1);

    return html`
      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="chart-type-badge">${chartType}</div>
          <div class="chart-icon">${this._getChartIcon(chartType)}</div>
          <div class="chart-title">Chart Widget</div>
          <div class="chart-description">
            ${this._getChartTypeDescription(chartType)}
          </div>

          ${this.data.labels && this.data.datasets ? html`
            <div class="chart-data-preview">
              <div class="data-preview-title">Data Preview</div>
              
              <div class="data-preview-item">
                <span class="data-label">Labels:</span>
                <span class="data-value">${this.data.labels.length} items</span>
              </div>
              
              <div class="data-preview-item">
                <span class="data-label">Datasets:</span>
                <span class="data-value">${this.data.datasets.length}</span>
              </div>
              
              ${this.data.labels.slice(0, 3).map((label, index) => html`
                <div class="data-preview-item">
                  <span class="data-label">${label}:</span>
                  <span class="data-value">
                    ${this.data.datasets[0]?.data[index] || 'N/A'}
                  </span>
                </div>
              `)}
              
              ${this.data.labels.length > 3 ? html`
                <div class="data-preview-item">
                  <span class="data-label">...</span>
                  <span class="data-value">+${this.data.labels.length - 3} more</span>
                </div>
              ` : ''}

              ${this.data.datasets.length > 0 ? html`
                <div class="dataset-legend">
                  ${this.data.datasets.map((dataset, index) => html`
                    <div class="legend-item">
                      <div 
                        class="legend-color" 
                        style="background-color: ${dataset.backgroundColor || colors[index]}"
                      ></div>
                      <span>${dataset.label}</span>
                    </div>
                  `)}
                </div>
              ` : ''}
            </div>
          ` : html`
            <div class="chart-description">
              <em>No chart data available</em>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

customElements.define('chart-widget', ChartWidget);
