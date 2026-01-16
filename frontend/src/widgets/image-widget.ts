import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ImageWidgetConfig } from '../types/dashboard-types.js';

@customElement('image-widget')
export class ImageWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .image-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 8px;
      overflow: hidden;
    }

    .image-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-content {
      max-width: 100%;
      max-height: 100%;
    }

    .image-content.contain {
      object-fit: contain;
    }

    .image-content.cover {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }

    .image-content.fill {
      object-fit: fill;
      width: 100%;
      height: 100%;
    }

    .image-content.none {
      object-fit: none;
    }

    .image-content.scale-down {
      object-fit: scale-down;
    }

    .clickable {
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .clickable:hover {
      opacity: 0.9;
    }

    .error-message {
      color: #f44336;
      text-align: center;
      padding: 16px;
    }

    .placeholder {
      color: #999;
      text-align: center;
      padding: 16px;
      font-size: 0.9rem;
    }
  `;

  @property({ type: Object })
  config!: ImageWidgetConfig;

  @property({ type: Boolean })
  private _imageError = false;

  private _handleImageError() {
    this._imageError = true;
    this.requestUpdate();
  }

  private _handleImageClick() {
    if (this.config.link) {
      window.open(this.config.link, '_blank', 'noopener,noreferrer');
    }
  }

  render() {
    if (!this.config) {
      return html`
        <div class="image-container">
          <div class="placeholder">No configuration provided</div>
        </div>
      `;
    }

    if (!this.config.src) {
      return html`
        <div class="image-container">
          <div class="placeholder">🖼️ No image source specified</div>
        </div>
      `;
    }

    if (this._imageError) {
      return html`
        <div class="image-container">
          <div class="error-message">Failed to load image: ${this.config.src}</div>
        </div>
      `;
    }

    const fit = this.config.fit || 'contain';
    const alt = this.config.alt || 'Image';
    const hasLink = !!this.config.link;

    return html`
      <div class="image-container">
        <div class="image-wrapper">
          <img
            class="image-content ${fit} ${hasLink ? 'clickable' : ''}"
            src="${this.config.src}"
            alt="${alt}"
            @error="${this._handleImageError}"
            @click="${hasLink ? this._handleImageClick : null}"
            loading="lazy"
          />
        </div>
      </div>
    `;
  }
}

