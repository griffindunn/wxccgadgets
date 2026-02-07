// SIMPLIFIED DEBUG VERSION
// No imports, just simple HTML.

export class SupervisorGlobalVars extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div style="background: #e6fffa; color: #006d5d; padding: 20px; border: 2px solid #006d5d;">
        <h2>SUCCESS!</h2>
        <p>The file loaded correctly from the 'gadgets' folder.</p>
        <p>If you see this, the path is correct, but the SDK import was causing the crash.</p>
      </div>
    `;
  }
}

if (!customElements.get("supervisor-global-vars")) {
  customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}
