import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WidgetConfig } from '../types/dashboard-types.js';
import * as echarts from 'echarts';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
  type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar';
  options?: any; // Additional ECharts options
}

@customElement('chart-widget')
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

    .chart-wrapper {
      flex: 1;
      min-height: 200px;
      position: relative;
    }

    .chart-canvas {
      width: 100%;
      height: 100%;
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

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color, #2196f3);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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

  @state()
  private _chartInstance?: echarts.ECharts;

  @state()
  private _isLoading = false;

  @state()
  private _error?: string;

  private _isRendering = false;
  private _resizeObserver?: ResizeObserver;
  private _resizeTimeout?: number;
  private _lastWidth = 0;
  private _lastHeight = 0;

  connectedCallback() {
    super.connectedCallback();
    // this._setupResizeObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // this._cleanupResizeObserver();
    this._disposeChart();
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    if ((changedProperties.has('data') || changedProperties.has('config')) && !this._isRendering) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this._renderChart();
      });
    }
  }

  firstUpdated(changedProperties: Map<string, any>) {
    super.firstUpdated(changedProperties);
    // Render chart after first update if we have data
    if (this.data && this.config) {
      requestAnimationFrame(() => {
        this._renderChart();
      });
    }
  }

  // private _setupResizeObserver() {
  //   if (typeof ResizeObserver !== 'undefined') {
  //     this._resizeObserver = new ResizeObserver((entries) => {
  //       // Debounce resize calls to prevent infinite loops
  //       if (this._resizeTimeout) {
  //         window.clearTimeout(this._resizeTimeout);
  //       }
  //       this._resizeTimeout = window.setTimeout(() => {
  //         if (this._chartInstance && entries.length > 0) {
  //           const entry = entries[0];
  //           const newWidth = entry.contentRect.width;
  //           const newHeight = entry.contentRect.height;
  //
  //           // Only resize if dimensions actually changed
  //           if (newWidth !== this._lastWidth || newHeight !== this._lastHeight) {
  //             this._lastWidth = newWidth;
  //             this._lastHeight = newHeight;
  //             this._chartInstance.resize();
  //           }
  //         }
  //       }, 100);
  //     });
  //
  //     this.updateComplete.then(() => {
  //       // Observe the host element instead of the chart canvas
  //       if (this._resizeObserver) {
  //         this._resizeObserver.observe(this);
  //       }
  //     });
  //   }
  // }

  // private _cleanupResizeObserver() {
  //   if (this._resizeObserver) {
  //     this._resizeObserver.disconnect();
  //     this._resizeObserver = undefined;
  //   }
  //   if (this._resizeTimeout) {
  //     window.clearTimeout(this._resizeTimeout);
  //     this._resizeTimeout = undefined;
  //   }
  // }

  private _disposeChart() {
    if (this._chartInstance) {
      this._chartInstance.dispose();
      this._chartInstance = undefined;
    }
  }

  private async _renderChart() {
    if (!this.data || !this.config) {
      this._error = 'Missing chart data or configuration';
      return;
    }

    if (this._isRendering) {
      return; // Prevent concurrent rendering
    }

    this._isRendering = true;
    this._error = undefined;

    try {
      // Ensure component is fully updated
      await this.updateComplete;

      // Wait a bit more to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 10));

      const chartElement = this.shadowRoot?.querySelector('.chart-canvas') as HTMLElement;

      if (!chartElement) {
        // Try to force a re-render and wait
        this.requestUpdate();
        await this.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 50));

        const retryElement = this.shadowRoot?.querySelector('.chart-canvas') as HTMLElement;
        if (!retryElement) {
          throw new Error('Chart container not found after retry');
        }

        this._initializeChart(retryElement);
      } else {
        this._initializeChart(chartElement);
      }

    } catch (error) {
      this._error = error instanceof Error ? error.message : 'Failed to render chart';
      console.error('Chart rendering error:', error);
    } finally {
      this._isRendering = false;
    }
  }

  private _initializeChart(chartElement: HTMLElement) {
    try {
      // Dispose existing chart
      this._disposeChart();

      // Ensure element has dimensions
      if (chartElement.offsetWidth === 0 || chartElement.offsetHeight === 0) {
        chartElement.style.width = '100%';
        chartElement.style.height = '100%';
        chartElement.style.minHeight = '200px';
      }

      // Create new chart instance
      this._chartInstance = echarts.init(chartElement);

      // Generate chart options based on data and type
      const options = this._generateChartOptions();

      // Set chart options
      this._chartInstance.setOption(options);
    } catch (error) {
      this._error = error instanceof Error ? error.message : 'Failed to initialize chart';
      throw error;
    }
  }

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

  private _generateChartOptions(): any {
    const chartType = this.data.type || 'bar';
    const colors = this._generateColors(this.data.datasets?.length || 1);

    // Base options
    const baseOptions = {
      color: colors,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: this.data.datasets?.map(d => d.label) || [],
        top: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      ...this.data.options // Allow custom options override
    };

    switch (chartType) {
      case 'line':
        return this._generateLineChartOptions(baseOptions);
      case 'bar':
        return this._generateBarChartOptions(baseOptions);
      case 'pie':
      case 'doughnut':
        return this._generatePieChartOptions(baseOptions, chartType === 'doughnut');
      case 'area':
        return this._generateAreaChartOptions(baseOptions);
      case 'scatter':
        return this._generateScatterChartOptions(baseOptions);
      case 'radar':
        return this._generateRadarChartOptions(baseOptions);
      default:
        return this._generateBarChartOptions(baseOptions);
    }
  }

  private _generateLineChartOptions(baseOptions: any): any {
    return {
      ...baseOptions,
      xAxis: {
        type: 'category',
        data: this.data.labels,
        boundaryGap: false
      },
      yAxis: {
        type: 'value'
      },
      series: this.data.datasets?.map((dataset, index) => ({
        name: dataset.label,
        type: 'line',
        data: dataset.data,
        smooth: true,
        lineStyle: {
          color: dataset.borderColor || baseOptions.color[index]
        },
        areaStyle: null
      })) || []
    };
  }

  private _generateBarChartOptions(baseOptions: any): any {
    return {
      ...baseOptions,
      xAxis: {
        type: 'category',
        data: this.data.labels
      },
      yAxis: {
        type: 'value'
      },
      series: this.data.datasets?.map((dataset, index) => ({
        name: dataset.label,
        type: 'bar',
        data: dataset.data,
        itemStyle: {
          color: dataset.backgroundColor || baseOptions.color[index]
        }
      })) || []
    };
  }

  private _generateAreaChartOptions(baseOptions: any): any {
    return {
      ...baseOptions,
      xAxis: {
        type: 'category',
        data: this.data.labels,
        boundaryGap: false
      },
      yAxis: {
        type: 'value'
      },
      series: this.data.datasets?.map((dataset, index) => ({
        name: dataset.label,
        type: 'line',
        data: dataset.data,
        smooth: true,
        areaStyle: {
          color: dataset.backgroundColor || baseOptions.color[index]
        },
        lineStyle: {
          color: dataset.borderColor || baseOptions.color[index]
        }
      })) || []
    };
  }

  private _generatePieChartOptions(baseOptions: any, isDoughnut: boolean = false): any {
    const dataset = this.data.datasets?.[0];
    if (!dataset) return baseOptions;

    const pieData = this.data.labels.map((label, index) => ({
      name: label,
      value: dataset.data[index] || 0
    }));

    return {
      ...baseOptions,
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: this.data.labels
      },
      series: [{
        name: dataset.label || 'Data',
        type: 'pie',
        radius: isDoughnut ? ['40%', '70%'] : '70%',
        center: ['50%', '60%'],
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }

  private _generateScatterChartOptions(baseOptions: any): any {
    return {
      ...baseOptions,
      xAxis: {
        type: 'value',
        scale: true
      },
      yAxis: {
        type: 'value',
        scale: true
      },
      series: this.data.datasets?.map((dataset, index) => ({
        name: dataset.label,
        type: 'scatter',
        data: dataset.data.map((value, idx) => [idx, value]),
        itemStyle: {
          color: dataset.backgroundColor || baseOptions.color[index]
        }
      })) || []
    };
  }

  private _generateRadarChartOptions(baseOptions: any): any {
    const maxValue = Math.max(...this.data.datasets?.flatMap(d => d.data) || [0]);

    return {
      ...baseOptions,
      radar: {
        indicator: this.data.labels.map(label => ({
          name: label,
          max: maxValue * 1.2
        }))
      },
      series: [{
        type: 'radar',
        data: this.data.datasets?.map((dataset, index) => ({
          name: dataset.label,
          value: dataset.data,
          itemStyle: {
            color: dataset.backgroundColor || baseOptions.color[index]
          },
          lineStyle: {
            color: dataset.borderColor || baseOptions.color[index]
          }
        })) || []
      }]
    };
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

    if (this._error) {
      return html`
        <div class="chart-container">
          <div class="chart-placeholder">
            <div class="chart-icon">⚠️</div>
            <div class="chart-title">Chart Error</div>
            <div class="chart-description">
              ${this._error}
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="chart-container">
        <div class="chart-wrapper">
          <div class="chart-canvas"></div>
        </div>
      </div>
    `;
  }
}
