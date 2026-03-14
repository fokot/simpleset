import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface SourceItem {
  id: number;
  name: string;
  description?: string;
  type: string;
  config: { host: string; port: number; database: string; username?: string; ssl?: boolean };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardItem {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  tags?: string[];
  favorite?: boolean;
  published?: boolean;
  viewCount?: number;
  lastViewed?: string;
  audit?: { updatedAt?: string };
}

type Page = 'home' | 'sources' | 'add-source' | 'edit-source' | 'dashboards' | 'settings';

@customElement('main-page')
export class MainPage extends LitElement {
  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600&display=swap');

    :host {
      display: block;
      min-height: 100vh;
      background: #f5f2ed;
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
      --danger: #c45454;
      --success: #5a9a6a;
    }

    * { box-sizing: border-box; }

    /* ── Grain overlay ── */
    :host::before {
      content: '';
      position: fixed;
      inset: 0;
      opacity: 0.03;
      pointer-events: none;
      z-index: 100;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 256px 256px;
    }

    /* ── Top Nav ── */
    .topnav {
      background: var(--charcoal);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      height: 64px;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .logo-mark {
      width: 32px;
      height: 32px;
      background: var(--amber);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: var(--charcoal);
      transform: rotate(-3deg);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .logo:hover .logo-mark {
      transform: rotate(0deg) scale(1.05);
    }

    .logo-text {
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }

    .nav-links {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .nav-link {
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link:hover {
      color: #fff;
      background: rgba(255,255,255,0.08);
    }

    .nav-link[data-active] {
      color: var(--amber);
      background: rgba(212, 160, 74, 0.1);
    }

    .nav-link svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* ── Main Content ── */
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 32px 80px;
    }

    /* ── Home hero ── */
    .hero {
      margin-bottom: 48px;
      animation: fadeUp 0.6s ease both;
    }

    .hero h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0 0 8px;
      background: linear-gradient(135deg, var(--charcoal) 0%, var(--charcoal-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin: 0;
      font-weight: 400;
    }

    /* ── Section headers ── */
    .section {
      margin-bottom: 48px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .section-count {
      font-family: 'Source Code Pro', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--cream-dark);
      color: var(--text-muted);
      padding: 3px 10px;
      border-radius: 99px;
    }

    .section-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon svg {
      width: 20px;
      height: 20px;
    }

    .section-icon.sources {
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      color: #2e7d32;
    }

    .section-icon.dashboards {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      color: #1565c0;
    }

    /* ── Action button ── */
    .btn-create {
      background: var(--charcoal);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      white-space: nowrap;
    }

    .btn-create:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(42, 37, 32, 0.25);
    }

    .btn-create:active {
      transform: translateY(0);
    }

    .btn-create svg {
      width: 16px;
      height: 16px;
    }

    /* ── Cards grid ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .card {
      background: var(--surface);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 14px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      position: relative;
      overflow: hidden;
      animation: fadeUp 0.5s ease both;
    }

    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 14px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    }

    .card:hover {
      transform: translateY(-3px);
      border-color: var(--amber-light);
    }

    .card:hover::after {
      opacity: 1;
    }

    .card:nth-child(1) { animation-delay: 0.05s; }
    .card:nth-child(2) { animation-delay: 0.1s; }
    .card:nth-child(3) { animation-delay: 0.15s; }
    .card:nth-child(4) { animation-delay: 0.2s; }
    .card:nth-child(5) { animation-delay: 0.25s; }
    .card:nth-child(6) { animation-delay: 0.3s; }

    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .card-type {
      font-family: 'Source Code Pro', monospace;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--cream);
      color: var(--text-muted);
    }

    .card-type.pg { background: #e3f2fd; color: #1565c0; }
    .card-type.dashboard { background: var(--amber-glow); color: #a07830; }

    .card-fav {
      color: var(--amber);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .card:hover .card-fav, .card-fav[data-active] {
      opacity: 1;
    }

    .card-name {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-bottom: 6px;
      color: var(--charcoal);
    }

    .card-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.78rem;
      color: var(--text-dim);
      font-family: 'Source Code Pro', monospace;
    }

    .card-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .card-meta-item svg {
      width: 14px;
      height: 14px;
      opacity: 0.5;
    }

    .card-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .card-tag {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 5px;
      background: var(--cream);
      color: var(--text-muted);
    }

    /* ── Empty state ── */
    .empty {
      text-align: center;
      padding: 48px 24px;
      background: var(--surface);
      border: 2px dashed var(--cream-dark);
      border-radius: 16px;
      animation: fadeUp 0.5s ease both;
    }

    .empty-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-icon.sources {
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      color: #2e7d32;
    }

    .empty-icon.dashboards {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      color: #1565c0;
    }

    .empty-icon svg {
      width: 28px;
      height: 28px;
    }

    .empty h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--charcoal);
    }

    .empty p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin: 0 0 20px;
      max-width: 360px;
      margin-left: auto;
      margin-right: auto;
    }

    .empty .btn-create {
      margin: 0 auto;
    }

    /* ── Settings page ── */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .settings-card {
      background: var(--surface);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 14px;
      padding: 24px;
      animation: fadeUp 0.5s ease both;
    }

    .settings-card h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 8px;
    }

    .settings-card p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Loading ── */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--cream-dark);
      border-top-color: var(--amber);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* ── Page transitions ── */
    .page-enter {
      animation: fadeUp 0.4s ease both;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Toast ── */
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 14px 24px;
      border-radius: 10px;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 200;
      animation: slideIn 0.3s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .toast-success { background: var(--success); }
    .toast-error { background: var(--danger); }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* ── Source form ── */
    .form-card {
      background: var(--surface);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 14px;
      padding: 32px;
      animation: fadeUp 0.5s ease both;
      max-width: 720px;
    }

    .form-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 24px;
      color: var(--charcoal);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .form-card h3 svg {
      width: 22px;
      height: 22px;
      color: var(--amber);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-group input,
    .form-group select {
      padding: 10px 14px;
      border: 1px solid var(--cream-dark);
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      background: var(--cream);
      color: var(--charcoal);
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--amber);
      background: #fff;
      box-shadow: 0 0 0 3px var(--amber-glow);
    }

    .form-group input::placeholder {
      color: var(--text-dim);
    }

    .ssl-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 24px;
    }

    .ssl-toggle input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--amber);
    }

    .ssl-toggle label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--charcoal);
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--cream-dark);
    }

    .form-actions-right {
      display: flex;
      gap: 10px;
    }

    .btn-test {
      background: var(--cream);
      color: var(--success);
      border: 1px solid var(--cream-dark);
      padding: 10px 20px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-test:hover:not(:disabled) {
      background: #e8f5e9;
      border-color: #c8e6c9;
    }

    .btn-test:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: var(--cream);
      color: var(--text-muted);
      border: 1px solid var(--cream-dark);
      padding: 10px 20px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: var(--cream-dark);
      color: var(--charcoal);
    }

    .btn-save {
      background: var(--charcoal);
      color: #fff;
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .btn-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(42, 37, 32, 0.25);
    }

    .btn-save:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .test-result {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      animation: fadeUp 0.3s ease both;
    }

    .test-result.success {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }

    .test-result.error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .btn-delete {
      background: none;
      color: var(--danger);
      border: 1px solid var(--cream-dark);
      padding: 10px 20px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-delete:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .delete-confirm {
      margin-top: 16px;
      padding: 16px;
      border-radius: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      animation: fadeUp 0.3s ease both;
    }

    .delete-confirm p {
      font-size: 0.875rem;
      color: #b91c1c;
      margin: 0 0 12px;
    }

    .delete-confirm-actions {
      display: flex;
      gap: 10px;
    }

    .source-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 14px 18px;
      background: var(--cream);
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'Source Code Pro', monospace;
      flex-wrap: wrap;
    }

    .source-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .source-meta-item svg {
      width: 14px;
      height: 14px;
      opacity: 0.5;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .topnav {
        padding: 0 16px;
        height: 56px;
      }

      .nav-link span { display: none; }
      .nav-link { padding: 8px 10px; }

      .content {
        padding: 24px 16px 60px;
      }

      .hero h1 {
        font-size: 1.8rem;
      }

      .cards-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-wrap: wrap;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .hero h1 {
        font-size: 1.5rem;
      }

      .card {
        padding: 18px;
      }
    }
  `;

  @property({ type: String, attribute: 'api-base-url' })
  apiBaseUrl = '';

  @state() private _page: Page = 'home';
  @state() private _sources: SourceItem[] = [];
  @state() private _dashboards: DashboardItem[] = [];
  @state() private _loadingSources = false;
  @state() private _loadingDashboards = false;

  // Add source form
  @state() private _formName = '';
  @state() private _formDescription = '';
  @state() private _formHost = 'localhost';
  @state() private _formPort = 5432;
  @state() private _formDatabase = '';
  @state() private _formUsername = '';
  @state() private _formPassword = '';
  @state() private _formSsl = false;
  @state() private _testResult: { success: boolean; message: string; latency?: number } | null = null;
  @state() private _testLoading = false;
  @state() private _saving = false;
  @state() private _editingId: number | null = null;
  @state() private _editingSource: SourceItem | null = null;
  @state() private _deleteConfirm = false;
  @state() private _deleting = false;
  @state() private _toast: { message: string; type: 'success' | 'error' } | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadSources();
    this._loadDashboards();
  }

  private async _loadSources() {
    if (!this.apiBaseUrl) return;
    this._loadingSources = true;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/datasources`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      this._sources = Array.isArray(json) ? json : json.data ?? [];
    } catch {
      this._sources = [];
    } finally {
      this._loadingSources = false;
    }
  }

  private async _loadDashboards() {
    if (!this.apiBaseUrl) return;
    this._loadingDashboards = true;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/dashboards`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      this._dashboards = Array.isArray(json) ? json : json.data ?? [];
    } catch {
      this._dashboards = [];
    } finally {
      this._loadingDashboards = false;
    }
  }

  private _navigate(page: Page) {
    this._page = page;
    if (page === 'home') {
      this._loadSources();
      this._loadDashboards();
    }
  }

  private _dispatchEvent(name: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  // ── Source form ──

  private _showToast(message: string, type: 'success' | 'error') {
    this._toast = { message, type };
    setTimeout(() => { this._toast = null; }, 3000);
  }

  private _resetForm() {
    this._formName = '';
    this._formDescription = '';
    this._formHost = 'localhost';
    this._formPort = 5432;
    this._formDatabase = '';
    this._formUsername = '';
    this._formPassword = '';
    this._formSsl = false;
    this._testResult = null;
    this._editingId = null;
    this._editingSource = null;
    this._deleteConfirm = false;
  }

  private _openAddSource() {
    this._resetForm();
    this._page = 'add-source';
  }

  private _openEditSource(source: SourceItem) {
    this._editingId = source.id;
    this._editingSource = source;
    this._formName = source.name;
    this._formDescription = source.description ?? '';
    this._formHost = source.config.host ?? 'localhost';
    this._formPort = source.config.port ?? 5432;
    this._formDatabase = source.config.database ?? '';
    this._formUsername = source.config.username ?? '';
    this._formPassword = '';
    this._formSsl = source.config.ssl ?? false;
    this._testResult = null;
    this._deleteConfirm = false;
    this._page = 'edit-source';
  }

  private async _testSourceConnection() {
    this._testLoading = true;
    this._testResult = null;
    try {
      let res: Response;
      if (this._editingId && !this._formPassword) {
        res = await fetch(`${this.apiBaseUrl}/api/v1/datasources/${this._editingId}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        res = await fetch(`${this.apiBaseUrl}/api/v1/datasources/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'postgresql',
            config: {
              host: this._formHost,
              port: this._formPort,
              database: this._formDatabase,
              username: this._formUsername,
              password: this._formPassword,
              ssl: this._formSsl,
            },
          }),
        });
      }
      const json = await res.json();
      this._testResult = json.data ?? json;
    } catch (e: any) {
      this._testResult = { success: false, message: e.message };
    } finally {
      this._testLoading = false;
    }
  }

  private async _saveSource() {
    this._saving = true;
    const isEdit = !!this._editingId;
    try {
      const body: Record<string, unknown> = {
        name: this._formName,
        description: this._formDescription || undefined,
        type: 'postgresql',
        config: {
          host: this._formHost,
          port: this._formPort,
          database: this._formDatabase,
          username: this._formUsername,
          password: this._formPassword,
          ssl: this._formSsl,
        },
      };
      if (isEdit) body.id = this._editingId;

      const res = await fetch(
        isEdit
          ? `${this.apiBaseUrl}/api/v1/datasources/${this._editingId}`
          : `${this.apiBaseUrl}/api/v1/datasources`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `HTTP ${res.status}`);
      }
      this._showToast(isEdit ? 'Source updated successfully' : 'Source created successfully', 'success');
      this._resetForm();
      this._page = 'sources';
      await this._loadSources();
    } catch (e: any) {
      this._showToast(`Failed to save: ${e.message}`, 'error');
    } finally {
      this._saving = false;
    }
  }

  private async _deleteSource() {
    if (!this._editingId) return;
    this._deleting = true;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/datasources/${this._editingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._showToast('Source deleted', 'success');
      this._resetForm();
      this._page = 'sources';
      await this._loadSources();
    } catch (e: any) {
      this._showToast(`Failed to delete: ${e.message}`, 'error');
    } finally {
      this._deleting = false;
    }
  }

  // ── Icons ──

  private _iconPlug() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
  }

  private _iconDatabase() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`;
  }

  private _iconGrid() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
  }

  private _iconSettings() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  private _iconPlus() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;
  }

  private _iconHome() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  }

  private _iconServer() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;
  }

  private _iconEye() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  private _iconClock() {
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }

  private _iconStar() {
    return html`<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }

  // ── Render ──

  render() {
    return html`
      <nav class="topnav">
        <div class="logo" @click=${() => this._navigate('home')}>
          <div class="logo-mark">S</div>
          <span class="logo-text">SimpleSet</span>
        </div>

        <div class="nav-links">
          <button class="nav-link" ?data-active=${this._page === 'home'} @click=${() => this._navigate('home')}>
            ${this._iconHome()}
            <span>Home</span>
          </button>
          <button class="nav-link" ?data-active=${this._page === 'sources' || this._page === 'add-source' || this._page === 'edit-source'} @click=${() => this._navigate('sources')}>
            ${this._iconDatabase()}
            <span>Sources</span>
          </button>
          <button class="nav-link" ?data-active=${this._page === 'dashboards'} @click=${() => this._navigate('dashboards')}>
            ${this._iconGrid()}
            <span>Dashboards</span>
          </button>
          <button class="nav-link" ?data-active=${this._page === 'settings'} @click=${() => this._navigate('settings')}>
            ${this._iconSettings()}
            <span>Settings</span>
          </button>
        </div>
      </nav>

      ${this._toast ? html`
        <div class="toast toast-${this._toast.type}">${this._toast.message}</div>
      ` : nothing}

      <div class="content">
        ${this._page === 'home' ? this._renderHome() : nothing}
        ${this._page === 'sources' ? this._renderSources() : nothing}
        ${this._page === 'add-source' ? this._renderSourceForm() : nothing}
        ${this._page === 'edit-source' ? this._renderSourceForm() : nothing}
        ${this._page === 'dashboards' ? this._renderDashboards() : nothing}
        ${this._page === 'settings' ? this._renderSettings() : nothing}
      </div>
    `;
  }

  private _renderHome() {
    return html`
      <div class="page-enter">
        <div class="hero">
          <h1>Welcome back</h1>
          <p>Manage your data sources and build dashboards</p>
        </div>

        ${this._renderSourcesSection()}
        ${this._renderDashboardsSection()}
      </div>
    `;
  }

  private _renderSources() {
    return html`
      <div class="page-enter">
        <div class="hero">
          <h1>Sources</h1>
          <p>Manage your data sources</p>
        </div>
        ${this._renderSourcesSection()}
      </div>
    `;
  }

  private _renderSourceForm() {
    const isEdit = !!this._editingId;
    const canSave = this._formName && this._formHost && this._formDatabase
      && (isEdit || (this._formUsername && this._formPassword));

    return html`
      <div class="page-enter">
        <div class="hero">
          <h1>${isEdit ? 'Edit Source' : 'New Source'}</h1>
          <p>${isEdit ? 'Update your data source configuration' : 'Connect to a PostgreSQL database'}</p>
        </div>

        <div class="form-card">
          <h3>${this._iconDatabase()} Connection Details</h3>

          ${isEdit && this._editingSource ? html`
            <div class="source-meta">
              ${this._editingSource.createdAt ? html`
                <span class="source-meta-item">
                  ${this._iconClock()}
                  Created ${this._formatDate(this._editingSource.createdAt)}
                </span>
              ` : nothing}
              ${this._editingSource.updatedAt ? html`
                <span class="source-meta-item">
                  ${this._iconClock()}
                  Updated ${this._formatDate(this._editingSource.updatedAt)}
                </span>
              ` : nothing}
            </div>
          ` : nothing}

          <div class="form-grid">
            <div class="form-group full-width">
              <label>Name *</label>
              <input type="text" .value=${this._formName}
                @input=${(e: Event) => { this._formName = (e.target as HTMLInputElement).value; }}
                placeholder="My Database" />
            </div>

            <div class="form-group full-width">
              <label>Description</label>
              <input type="text" .value=${this._formDescription}
                @input=${(e: Event) => { this._formDescription = (e.target as HTMLInputElement).value; }}
                placeholder="Optional description" />
            </div>

            <div class="form-group">
              <label>Host *</label>
              <input type="text" .value=${this._formHost}
                @input=${(e: Event) => { this._formHost = (e.target as HTMLInputElement).value; }}
                placeholder="localhost" />
            </div>

            <div class="form-group">
              <label>Port *</label>
              <input type="number" .value=${String(this._formPort)}
                @input=${(e: Event) => { this._formPort = parseInt((e.target as HTMLInputElement).value) || 5432; }}
                placeholder="5432" />
            </div>

            <div class="form-group">
              <label>Database *</label>
              <input type="text" .value=${this._formDatabase}
                @input=${(e: Event) => { this._formDatabase = (e.target as HTMLInputElement).value; }}
                placeholder="mydb" />
            </div>

            <div class="form-group">
              <label>Username ${isEdit ? '' : '*'}</label>
              <input type="text" .value=${this._formUsername}
                @input=${(e: Event) => { this._formUsername = (e.target as HTMLInputElement).value; }}
                placeholder=${isEdit ? 'Leave blank to keep current' : 'postgres'} />
            </div>

            <div class="form-group">
              <label>Password ${isEdit ? '' : '*'}</label>
              <input type="password" .value=${this._formPassword}
                @input=${(e: Event) => { this._formPassword = (e.target as HTMLInputElement).value; }}
                placeholder=${isEdit ? 'Leave blank to keep current' : 'Enter password'} />
            </div>

            <div class="form-group">
              <div class="ssl-toggle">
                <input type="checkbox" id="ssl-check" .checked=${this._formSsl}
                  @change=${(e: Event) => { this._formSsl = (e.target as HTMLInputElement).checked; }} />
                <label for="ssl-check">Enable SSL</label>
              </div>
            </div>
          </div>

          ${this._testResult ? html`
            <div class="test-result ${this._testResult.success ? 'success' : 'error'}">
              ${this._testResult.success ? '\u2713' : '\u2717'} ${this._testResult.message}
              ${this._testResult.latency != null ? html` (${this._testResult.latency}ms)` : nothing}
            </div>
          ` : nothing}

          <div class="form-actions">
            <button class="btn-test" @click=${this._testSourceConnection} ?disabled=${this._testLoading}>
              ${this._iconPlug()}
              ${this._testLoading ? 'Testing...' : 'Test Connection'}
            </button>
            <div class="form-actions-right">
              ${isEdit ? html`
                <button class="btn-delete" @click=${() => { this._deleteConfirm = true; }}
                  ?disabled=${this._deleting}>
                  Delete
                </button>
              ` : nothing}
              <button class="btn-cancel" @click=${() => this._navigate('sources')}>Cancel</button>
              <button class="btn-save" @click=${this._saveSource}
                ?disabled=${!canSave || this._saving}>
                ${this._saving ? 'Saving...' : (isEdit ? 'Update Source' : 'Save Source')}
              </button>
            </div>
          </div>

          ${this._deleteConfirm ? html`
            <div class="delete-confirm">
              <p>Are you sure you want to delete this source? This cannot be undone.</p>
              <div class="delete-confirm-actions">
                <button class="btn-cancel" @click=${() => { this._deleteConfirm = false; }}>Cancel</button>
                <button class="btn-delete" @click=${this._deleteSource} ?disabled=${this._deleting}>
                  ${this._deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }

  private _renderDashboards() {
    return html`
      <div class="page-enter">
        <div class="hero">
          <h1>Dashboards</h1>
          <p>Build and explore your data visualizations</p>
        </div>
        ${this._renderDashboardsSection()}
      </div>
    `;
  }

  private _renderSettings() {
    return html`
      <div class="page-enter">
        <div class="hero">
          <h1>Settings</h1>
          <p>Configure your SimpleSet instance</p>
        </div>

        <div class="settings-grid">
          <div class="settings-card" style="animation-delay: 0.05s">
            <h3>General</h3>
            <p>Application name, timezone, and default preferences.</p>
          </div>
          <div class="settings-card" style="animation-delay: 0.1s">
            <h3>Appearance</h3>
            <p>Theme, colors, and display options for your dashboards.</p>
          </div>
          <div class="settings-card" style="animation-delay: 0.15s">
            <h3>API Keys</h3>
            <p>Manage API keys for external integrations and automation.</p>
          </div>
          <div class="settings-card" style="animation-delay: 0.2s">
            <h3>Users &amp; Permissions</h3>
            <p>Manage who can access and edit sources and dashboards.</p>
          </div>
        </div>
      </div>
    `;
  }

  private _renderSourcesSection() {
    return html`
      <div class="section">
        <div class="section-header">
          <div class="section-title">
            <div class="section-icon sources">${this._iconDatabase()}</div>
            <h2>Sources</h2>
            ${this._sources.length > 0 ? html`
              <span class="section-count">${this._sources.length}</span>
            ` : nothing}
          </div>
          <button class="btn-create" @click=${() => this._openAddSource()}>
            ${this._iconPlus()}
            New Source
          </button>
        </div>

        ${this._loadingSources ? html`
          <div class="loading">
            <div class="spinner"></div>
            Loading sources...
          </div>
        ` : nothing}

        ${!this._loadingSources && this._sources.length === 0 ? html`
          <div class="empty">
            <div class="empty-icon sources">${this._iconDatabase()}</div>
            <h3>No sources yet</h3>
            <p>Connect to a PostgreSQL database to start querying your data and building dashboards.</p>
            <button class="btn-create" @click=${() => this._openAddSource()}>
              ${this._iconPlus()}
              Add your first source
            </button>
          </div>
        ` : nothing}

        ${!this._loadingSources && this._sources.length > 0 ? html`
          <div class="cards-grid">
            ${this._sources.map(conn => html`
              <div class="card" @click=${() => this._openEditSource(conn)}>
                <div class="card-top">
                  <span class="card-type pg">${conn.type}</span>
                </div>
                <div class="card-name">${conn.name}</div>
                ${conn.description ? html`
                  <div class="card-desc">${conn.description}</div>
                ` : nothing}
                <div class="card-meta">
                  <span class="card-meta-item">
                    ${this._iconServer()}
                    ${conn.config.host}:${conn.config.port}
                  </span>
                  <span class="card-meta-item">
                    ${this._iconDatabase()}
                    ${conn.config.database}
                  </span>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderDashboardsSection() {
    return html`
      <div class="section">
        <div class="section-header">
          <div class="section-title">
            <div class="section-icon dashboards">${this._iconGrid()}</div>
            <h2>Dashboards</h2>
            ${this._dashboards.length > 0 ? html`
              <span class="section-count">${this._dashboards.length}</span>
            ` : nothing}
          </div>
          <button class="btn-create" @click=${() => this._dispatchEvent('create-dashboard')}>
            ${this._iconPlus()}
            New Dashboard
          </button>
        </div>

        ${this._loadingDashboards ? html`
          <div class="loading">
            <div class="spinner"></div>
            Loading dashboards...
          </div>
        ` : nothing}

        ${!this._loadingDashboards && this._dashboards.length === 0 ? html`
          <div class="empty">
            <div class="empty-icon dashboards">${this._iconGrid()}</div>
            <h3>No dashboards yet</h3>
            <p>Create your first dashboard to visualize data with charts, metrics, and tables.</p>
            <button class="btn-create" @click=${() => this._dispatchEvent('create-dashboard')}>
              ${this._iconPlus()}
              Create your first dashboard
            </button>
          </div>
        ` : nothing}

        ${!this._loadingDashboards && this._dashboards.length > 0 ? html`
          <div class="cards-grid">
            ${this._dashboards.map(dash => html`
              <div class="card" @click=${() => this._dispatchEvent('open-dashboard', dash)}>
                <div class="card-top">
                  <span class="card-type dashboard">${dash.published ? 'published' : 'draft'}</span>
                  ${dash.favorite ? html`
                    <span class="card-fav" data-active>${this._iconStar()}</span>
                  ` : nothing}
                </div>
                <div class="card-name">${dash.name}</div>
                ${dash.description ? html`
                  <div class="card-desc">${dash.description}</div>
                ` : nothing}
                ${dash.tags && dash.tags.length > 0 ? html`
                  <div class="card-tags">
                    ${dash.tags.map(tag => html`<span class="card-tag">${tag}</span>`)}
                  </div>
                ` : nothing}
                <div class="card-meta">
                  ${dash.viewCount != null ? html`
                    <span class="card-meta-item">
                      ${this._iconEye()}
                      ${dash.viewCount}
                    </span>
                  ` : nothing}
                  ${dash.audit?.updatedAt ? html`
                    <span class="card-meta-item">
                      ${this._iconClock()}
                      ${this._formatDate(dash.audit.updatedAt)}
                    </span>
                  ` : nothing}
                </div>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const days = Math.floor(diff / 86400000);
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  }
}
