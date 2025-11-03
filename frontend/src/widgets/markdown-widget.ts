import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { MarkdownWidgetConfig } from '../types/dashboard-types.js';

@customElement('markdown-widget')
export class MarkdownWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .markdown-container {
      height: 100%;
      padding: 16px;
      overflow: auto;
    }

    .markdown-content {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
    }

    .markdown-content h1 {
      font-size: 2em;
      font-weight: 600;
      margin: 0.67em 0;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.3em;
    }

    .markdown-content h2 {
      font-size: 1.5em;
      font-weight: 600;
      margin: 0.75em 0 0.5em 0;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.3em;
    }

    .markdown-content h3 {
      font-size: 1.25em;
      font-weight: 600;
      margin: 0.75em 0 0.5em 0;
    }

    .markdown-content h4 {
      font-size: 1em;
      font-weight: 600;
      margin: 0.75em 0 0.5em 0;
    }

    .markdown-content h5 {
      font-size: 0.875em;
      font-weight: 600;
      margin: 0.75em 0 0.5em 0;
    }

    .markdown-content h6 {
      font-size: 0.85em;
      font-weight: 600;
      margin: 0.75em 0 0.5em 0;
      color: #666;
    }

    .markdown-content p {
      margin: 0 0 1em 0;
    }

    .markdown-content ul,
    .markdown-content ol {
      margin: 0 0 1em 0;
      padding-left: 2em;
    }

    .markdown-content li {
      margin: 0.25em 0;
    }

    .markdown-content code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9em;
    }

    .markdown-content pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0 0 1em 0;
    }

    .markdown-content pre code {
      background-color: transparent;
      padding: 0;
    }

    .markdown-content blockquote {
      border-left: 4px solid #e0e0e0;
      padding-left: 1em;
      margin: 0 0 1em 0;
      color: #666;
    }

    .markdown-content a {
      color: #2196f3;
      text-decoration: none;
    }

    .markdown-content a:hover {
      text-decoration: underline;
    }

    .markdown-content img {
      max-width: 100%;
      height: auto;
    }

    .markdown-content hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 1.5em 0;
    }

    .markdown-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 0 0 1em 0;
    }

    .markdown-content th,
    .markdown-content td {
      border: 1px solid #e0e0e0;
      padding: 0.5em;
      text-align: left;
    }

    .markdown-content th {
      background-color: #f5f5f5;
      font-weight: 600;
    }

    .markdown-content strong {
      font-weight: 600;
    }

    .markdown-content em {
      font-style: italic;
    }

    .placeholder {
      color: #999;
      text-align: center;
      padding: 16px;
      font-size: 0.9rem;
    }
  `;

  @property({ type: Object })
  config!: MarkdownWidgetConfig;

  private _parseMarkdown(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Escape HTML if not allowed
    if (!this.config.allowHtml) {
      html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    if (this.config.linkify !== false) {
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr>');

    // Line breaks
    if (this.config.breaks !== false) {
      html = html.replace(/\n/g, '<br>');
    }

    // Unordered lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');

    // Paragraphs
    html = html.replace(/^(?!<[hupol]|<\/|<br>)(.+)$/gim, '<p>$1</p>');

    return html;
  }

  render() {
    if (!this.config) {
      return html`
        <div class="markdown-container">
          <div class="placeholder">No configuration provided</div>
        </div>
      `;
    }

    if (!this.config.content) {
      return html`
        <div class="markdown-container">
          <div class="placeholder">📄 No markdown content specified</div>
        </div>
      `;
    }

    const renderedHtml = this._parseMarkdown(this.config.content);

    return html`
      <div class="markdown-container">
        <div class="markdown-content">
          ${unsafeHTML(renderedHtml)}
        </div>
      </div>
    `;
  }
}

