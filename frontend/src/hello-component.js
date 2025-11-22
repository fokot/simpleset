import { LitElement, html, css } from 'lit';

export class HelloComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .container:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .hello-text {
      font-size: 2rem;
      margin: 0;
      transition: all 0.3s ease;
    }

    .clicked {
      animation: bounce 0.6s ease-in-out;
    }

    .subtitle {
      font-size: 1rem;
      margin-top: 10px;
      opacity: 0.8;
    }

    @keyframes bounce {
      0%, 20%, 60%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-20px);
      }
      80% {
        transform: translateY(-10px);
      }
    }

    .click-count {
      margin-top: 15px;
      font-size: 0.9rem;
      opacity: 0.9;
    }
  `;

  static properties = {
    clickCount: { type: Number }
  };

  constructor() {
    super();
    this.clickCount = 0;
  }

  render() {
    return html`
      <div class="container" @click="${this._handleClick}">
        <h1 class="hello-text ${this.clickCount > 0 ? 'clicked' : ''}">
          Hello! 👋
        </h1>
        <p class="subtitle">Click me to see some magic!</p>
        ${this.clickCount > 0 
          ? html`<div class="click-count">Clicked ${this.clickCount} times</div>`
          : ''
        }
      </div>
    `;
  }

  _handleClick() {
    this.clickCount++;

    // Add some fun JavaScript effects
    const container = this.shadowRoot.querySelector('.container');

    // Random color change
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    container.style.background = randomColor;

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('hello-clicked', {
      detail: { clickCount: this.clickCount },
      bubbles: true,
      composed: true
    }));

    console.log(`Hello component clicked ${this.clickCount} times!`);
  }
}

customElements.define('hello-component', HelloComponent);