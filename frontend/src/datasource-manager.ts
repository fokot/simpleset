import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  DataSource,
  CreateDataSourceRequest,
  TestConnectionRequest,
  TestConnectionResponse,
} from '../../api/datasources.js';

type ViewMode = 'list' | 'form';

@customElement('datasource-manager')
export class DatasourceManager extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--dashboard-font-family, 'Inter, system-ui, sans-serif');
      color: var(--dashboard-text-color, #1a1a1a);
    }

    .container {
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    /* Buttons */
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #2196f3; color: white; }
    .btn-primary:hover:not(:disabled) { background: #1976d2; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-secondary:hover:not(:disabled) { background: #bdbdbd; }
    .btn-danger { background: #d32f2f; color: white; }
    .btn-danger:hover:not(:disabled) { background: #b71c1c; }
    .btn-success { background: #388e3c; color: white; }
    .btn-success:hover:not(:disabled) { background: #2e7d32; }

    /* Toast */
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-size: 0.875rem;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    }
    .toast-success { background: #388e3c; }
    .toast-error { background: #d32f2f; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* List */
    .ds-list { display: flex; flex-direction: column; gap: 12px; }
    .ds-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: box-shadow 0.2s;
    }
    .ds-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .ds-info { flex: 1; }
    .ds-name { font-weight: 600; font-size: 1rem; margin-bottom: 4px; }
    .ds-meta { font-size: 0.8rem; color: #666; display: flex; gap: 12px; align-items: center; }
    .ds-actions { display: flex; gap: 8px; }

    .status-dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      margin-right: 4px;
    }
    .status-connected { background: #4caf50; }
    .status-disconnected { background: #9e9e9e; }
    .status-error { background: #d32f2f; }
    .status-connecting, .status-testing { background: #ff9800; }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }
    .empty-state p { margin: 8px 0; }

    /* Form */
    .form-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
    }
    .form-title { font-size: 1.25rem; font-weight: 600; margin: 0 0 20px 0; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #555;
    }
    .form-group input, .form-group select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33,150,243,0.15);
    }

    .ssl-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 20px;
    }
    .ssl-toggle input[type="checkbox"] {
      width: 18px; height: 18px; cursor: pointer;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }
    .form-actions-right { display: flex; gap: 8px; }

    .test-result {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .test-result.success { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
    .test-result.error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }

    /* Delete confirmation */
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
    .confirm-dialog {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .confirm-dialog h3 { margin: 0 0 12px 0; }
    .confirm-dialog p { color: #666; margin: 0 0 20px 0; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
  `;

  @property({ type: String, attribute: 'api-base-url' })
  apiBaseUrl = '';

  @state() private _view: ViewMode = 'list';
  @state() private _datasources: DataSource[] = [];
  @state() private _loading = false;
  @state() private _editingId: number | null = null;
  @state() private _deleteTarget: DataSource | null = null;
  @state() private _testResult: TestConnectionResponse | null = null;
  @state() private _testLoading = false;
  @state() private _saving = false;
  @state() private _toast: { message: string; type: 'success' | 'error' } | null = null;

  // Form fields
  @state() private _formName = '';
  @state() private _formDescription = '';
  @state() private _formHost = 'localhost';
  @state() private _formPort = 5432;
  @state() private _formDatabase = '';
  @state() private _formUsername = '';
  @state() private _formPassword = '';
  @state() private _formSsl = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadDatasources();
  }

  private _showToast(message: string, type: 'success' | 'error') {
    this._toast = { message, type };
    setTimeout(() => { this._toast = null; }, 3000);
  }

  private async _loadDatasources() {
    if (!this.apiBaseUrl) return;
    this._loading = true;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/datasources`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      this._datasources = Array.isArray(json) ? json : json.data ?? [];
    } catch (e: any) {
      this._showToast(`Failed to load datasources: ${e.message}`, 'error');
    } finally {
      this._loading = false;
    }
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
  }

  private _openAddForm() {
    this._resetForm();
    this._view = 'form';
  }

  private _openEditForm(ds: DataSource) {
    this._editingId = ds.id;
    this._formName = ds.name;
    this._formDescription = ds.description ?? '';
    this._formHost = ds.config.host ?? 'localhost';
    this._formPort = ds.config.port ?? 5432;
    this._formDatabase = ds.config.database ?? '';
    this._formUsername = ds.config.username ?? '';
    this._formPassword = ''; // password not returned by backend
    this._formSsl = ds.config.ssl ?? false;
    this._testResult = null;
    this._view = 'form';
  }

  private _cancelForm() {
    this._resetForm();
    this._view = 'list';
  }

  private _buildRequest(): CreateDataSourceRequest {
    return {
      name: this._formName,
      description: this._formDescription || undefined,
      type: 'postgresql',
      config: {
        type: 'postgresql',
        config: {
          host: this._formHost,
          port: this._formPort,
          database: this._formDatabase,
          username: this._formUsername,
          password: this._formPassword,
          ssl: this._formSsl,
        },
      },
    };
  }

  private async _testConnection() {
    this._testLoading = true;
    this._testResult = null;
    try {
      const body: TestConnectionRequest = {
        type: 'postgresql',
        config: {
          type: 'postgresql',
          config: {
            host: this._formHost,
            port: this._formPort,
            database: this._formDatabase,
            username: this._formUsername,
            password: this._formPassword,
            ssl: this._formSsl,
          },
        },
      };
      const res = await fetch(`${this.apiBaseUrl}/api/v1/datasources/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      this._testResult = json.data ?? json;
    } catch (e: any) {
      this._testResult = { success: false, message: e.message };
    } finally {
      this._testLoading = false;
    }
  }

  private async _saveDataSource() {
    this._saving = true;
    try {
      const body = this._buildRequest();
      const isEdit = !!this._editingId;
      const url = isEdit
        ? `${this.apiBaseUrl}/api/v1/datasources/${this._editingId}`
        : `${this.apiBaseUrl}/api/v1/datasources`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...body, id: this._editingId } : body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `HTTP ${res.status}`);
      }
      this._showToast(
        isEdit ? 'Connection updated successfully' : 'Connection created successfully',
        'success'
      );
      this._cancelForm();
      await this._loadDatasources();
    } catch (e: any) {
      this._showToast(`Failed to save: ${e.message}`, 'error');
    } finally {
      this._saving = false;
    }
  }

  private async _confirmDelete() {
    if (!this._deleteTarget) return;
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/api/v1/datasources/${this._deleteTarget.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._showToast('Connection deleted', 'success');
      this._deleteTarget = null;
      await this._loadDatasources();
    } catch (e: any) {
      this._showToast(`Failed to delete: ${e.message}`, 'error');
      this._deleteTarget = null;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  render() {
    return html`
      <div class="container">
        ${this._toast ? html`
          <div class="toast toast-${this._toast.type}">${this._toast.message}</div>
        ` : nothing}

        ${this._deleteTarget ? this._renderDeleteConfirm() : nothing}

        ${this._view === 'list' ? this._renderList() : this._renderForm()}
      </div>
    `;
  }

  private _renderList() {
    return html`
      <div class="header">
        <h2>Data Connections</h2>
        <button class="btn btn-primary" @click=${this._openAddForm}>+ Add Connection</button>
      </div>

      ${this._loading ? html`<p style="text-align:center;color:#666;">Loading…</p>` : nothing}

      ${!this._loading && this._datasources.length === 0 ? html`
        <div class="empty-state">
          <p style="font-size:1.2rem;">No connections yet</p>
          <p>Add a PostgreSQL connection to get started.</p>
          <button class="btn btn-primary" style="margin-top:12px" @click=${this._openAddForm}>
            + Add Connection
          </button>
        </div>
      ` : nothing}

      <div class="ds-list">
        ${this._datasources.map(ds => html`
          <div class="ds-card">
            <div class="ds-info">
              <div class="ds-name">${ds.name}</div>
              <div class="ds-meta">
                <span>${ds.type}</span>
                <span>${ds.config.host}:${ds.config.port}/${ds.config.database}</span>
                ${ds.description ? html`<span>${ds.description}</span>` : nothing}
              </div>
            </div>
            <div class="ds-actions">
              <button class="btn btn-secondary" @click=${() => this._openEditForm(ds)}>Edit</button>
              <button class="btn btn-danger" @click=${() => { this._deleteTarget = ds; }}>Delete</button>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderForm() {
    const isEdit = !!this._editingId;
    const canSave = this._formName && this._formHost && this._formDatabase && this._formUsername && this._formPassword;

    return html`
      <div class="header">
        <h2>${isEdit ? 'Edit Connection' : 'New Connection'}</h2>
      </div>

      <div class="form-card">
        <h3 class="form-title">PostgreSQL Connection</h3>

        <div class="form-grid">
          <div class="form-group full-width">
            <label>Connection Name *</label>
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
            <label>Username *</label>
            <input type="text" .value=${this._formUsername}
              @input=${(e: Event) => { this._formUsername = (e.target as HTMLInputElement).value; }}
              placeholder="postgres" />
          </div>

          <div class="form-group">
            <label>Password *</label>
            <input type="password" .value=${this._formPassword}
              @input=${(e: Event) => { this._formPassword = (e.target as HTMLInputElement).value; }}
              placeholder="••••••••" />
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
            ${this._testResult.success ? '✓' : '✗'} ${this._testResult.message}
            ${this._testResult.latency != null ? html` (${this._testResult.latency}ms)` : nothing}
          </div>
        ` : nothing}

        <div class="form-actions">
          <button class="btn btn-success" @click=${this._testConnection} ?disabled=${this._testLoading}>
            ${this._testLoading ? 'Testing…' : 'Test Connection'}
          </button>
          <div class="form-actions-right">
            <button class="btn btn-secondary" @click=${this._cancelForm}>Cancel</button>
            <button class="btn btn-primary" @click=${this._saveDataSource}
              ?disabled=${!canSave || this._saving}>
              ${this._saving ? 'Saving…' : (isEdit ? 'Update' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderDeleteConfirm() {
    return html`
      <div class="confirm-overlay" @click=${() => { this._deleteTarget = null; }}>
        <div class="confirm-dialog" @click=${(e: Event) => e.stopPropagation()}>
          <h3>Delete Connection</h3>
          <p>Are you sure you want to delete "<strong>${this._deleteTarget!.name}</strong>"? This action cannot be undone.</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click=${() => { this._deleteTarget = null; }}>Cancel</button>
            <button class="btn btn-danger" @click=${this._confirmDelete}>Delete</button>
          </div>
        </div>
      </div>
    `;
  }
}

