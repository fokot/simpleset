import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MetricWidgetConfig } from '../types/dashboard-types.js';

export interface MetricData {
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  target?: number;
}

@customElement('metric-widget')
export class MetricWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .metric-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
      padding: 16px;
    }

    .metric-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--metric-title-color, #666);
      margin: 0 0 8px 0;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--metric-value-color, #1a1a1a);
      line-height: 1;
    }

    .metric-prefix,
    .metric-suffix {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--metric-prefix-color, #666);
    }

    .metric-trend {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      margin-top: 8px;
    }

    .trend-up {
      color: var(--trend-up-color, #4caf50);
    }

    .trend-down {
      color: var(--trend-down-color, #f44336);
    }

    .trend-neutral {
      color: var(--trend-neutral-color, #666);
    }

    .trend-icon {
      font-size: 1rem;
    }

    .metric-target {
      font-size: 0.8rem;
      color: var(--metric-target-color, #999);
      margin-top: 4px;
    }

    .threshold-indicator {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      margin-top: 12px;
      background: var(--threshold-bg, #e0e0e0);
      position: relative;
      overflow: hidden;
    }

    .threshold-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .thresholds {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 0.7rem;
      color: var(--threshold-text-color, #999);
    }
  `;

  @property({ type: Object })
  config!: MetricWidgetConfig;

  @property({ type: Object })
  data!: MetricData;

  private _formatValue(value: number | string): string {
    if (typeof value === 'string') return value;
    
    if (this.config.format) {
      // Simple number formatting
      if (this.config.format.includes('%')) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (this.config.format.includes(',')) {
        return value.toLocaleString();
      }
      if (this.config.format.includes('.')) {
        const decimals = this.config.format.split('.')[1]?.length || 2;
        return value.toFixed(decimals);
      }
    }
    
    return value.toString();
  }

  private _getTrendIcon(direction: 'up' | 'down' | 'neutral'): string {
    switch (direction) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'neutral': return '→';
      default: return '';
    }
  }

  private _getThresholdColor(value: number): string {
    if (!this.config.thresholds || this.config.thresholds.length === 0) {
      return 'var(--primary-color, #2196f3)';
    }

    // Find the appropriate threshold
    const sortedThresholds = [...this.config.thresholds].sort((a, b) => a.value - b.value);
    
    for (let i = sortedThresholds.length - 1; i >= 0; i--) {
      if (value >= sortedThresholds[i].value) {
        return sortedThresholds[i].color;
      }
    }
    
    return sortedThresholds[0]?.color || 'var(--primary-color, #2196f3)';
  }

  private _getThresholdProgress(value: number): number {
    if (!this.config.thresholds || this.config.thresholds.length === 0) {
      return 100;
    }

    const maxThreshold = Math.max(...this.config.thresholds.map(t => t.value));
    return Math.min((value / maxThreshold) * 100, 100);
  }

  render() {
    if (!this.config || !this.data) {
      return html`
        <div class="metric-container">
          <div class="error-message">Invalid metric configuration or data</div>
        </div>
      `;
    }

    const numericValue = typeof this.data.value === 'number' ? this.data.value : 0;
    const thresholdColor = this._getThresholdColor(numericValue);
    const thresholdProgress = this._getThresholdProgress(numericValue);

    return html`
      <div class="metric-container">
        <div class="metric-title">${this.config.title}</div>
        
        <div class="metric-value" style="color: ${thresholdColor}">
          ${this.config.prefix ? html`<span class="metric-prefix">${this.config.prefix}</span>` : ''}
          ${this._formatValue(this.data.value)}
          ${this.config.suffix ? html`<span class="metric-suffix">${this.config.suffix}</span>` : ''}
        </div>

        ${this.data.trend ? html`
          <div class="metric-trend trend-${this.data.trend.direction}">
            <span class="trend-icon">${this._getTrendIcon(this.data.trend.direction)}</span>
            <span>${Math.abs(this.data.trend.value)}%</span>
          </div>
        ` : ''}

        ${this.config.target ? html`
          <div class="metric-target">
            Target: ${this._formatValue(this.config.target)}
          </div>
        ` : ''}

        ${this.config.thresholds && this.config.thresholds.length > 0 ? html`
          <div class="threshold-indicator">
            <div 
              class="threshold-fill" 
              style="width: ${thresholdProgress}%; background-color: ${thresholdColor}"
            ></div>
          </div>
          <div class="thresholds">
            <span>0</span>
            <span>${Math.max(...this.config.thresholds.map(t => t.value))}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}
