import { Desktop } from "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";

export class SupervisorGlobalVars extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.desktop = Desktop; // Keep a reference to the SDK
  }

  async connectedCallback() {
    // 1. Initialize the WxCC Desktop SDK
    try {
      await this.desktop.config.init();
      console.log("Supervisor Gadget: SDK Initialized");
    } catch (error) {
      console.error("Supervisor Gadget: SDK Init Failed", error);
    }

    // 2. Render the UI
    this.render();
    
    // 3. Add Event Listeners (if needed)
    // this.shadowRoot.querySelector('#myButton').addEventListener('click', ...)
  }

  render() {
    // Basic styling to match Momentum Design (Webex look and feel)
    const style = `
      <style>
        :host {
          display: block;
          font-family: "CiscoSans", sans-serif; /* Standard Webex Font */
          padding: 1rem;
          background-color: var(--md-background-color, #fff);
          color: var(--md-primary-text-color, #222);
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        h2 {
          font-size: 1.2rem;
          margin: 0 0 10px 0;
        }
        .status-box {
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
      </style>
    `;

    // The HTML content
    const html = `
      <div class="container">
        <h2>Global Variables</h2>
        <div class="status-box">
          <p><strong>Status:</strong> Component Loaded</p>
          <p><strong>SDK Active:</strong> Yes</p>
        </div>
        </div>
    `;

    this.shadowRoot.innerHTML = `${style}${html}`;
  }
}

// Register the custom element so the loader can use it
if (!customElements.get("supervisor-global-vars")) {
  customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}
