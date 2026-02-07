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
      console.log("Supervisor Gadget: SDK Initialized successfully");
    } catch (error) {
      console.error("Supervisor Gadget: SDK Init Failed", error);
    }

    // 2. Render the UI
    this.render();

    // 3. Add Event Listeners
    // Example: Bind the 'Update' button to a function
    const updateBtn = this.shadowRoot.getElementById("update-btn");
    if (updateBtn) {
        updateBtn.addEventListener("click", () => this.handleUpdate());
    }
  }

  /**
   * Example function to handle button clicks
   */
  async handleUpdate() {
    const inputVal = this.shadowRoot.getElementById("var-input").value;
    console.log(`Update requested for value: ${inputVal}`);
    
    // TODO: Add your specific SDK call here, e.g.:
    // await this.desktop.rest.post("/some/api", { value: inputVal });
    
    alert(`Value submitted: ${inputVal}`);
  }

  render() {
    // 1. Get properties passed from JSON (like "title")
    // If the attribute isn't found, default to "Global Variables"
    const title = this.getAttribute("title") || "Global Variables";

    // 2. Link to your external CSS (main.css)
    // Note: ensure this URL matches where your CSS file is hosted
    const cssLink = `<link rel="stylesheet" href="https://griffindunn.github.io/wxccgadgets/main.css">`;

    // 3. Define the HTML structure
    const html = `
      <div class="gadget-wrapper">
        <header>
            <h3>${title}</h3>
        </header>
        
        <div class="content">
            <div class="form-group">
                <label for="var-input">Variable Name</label>
                <input type="text" id="var-input" placeholder="Enter value here..." />
            </div>

            <div class="actions">
                <button id="update-btn" class="md-button md-button--blue">Update Variable</button>
            </div>
            
            <div class="status-footer">
                <small>SDK Status: Active</small>
            </div>
        </div>
      </div>
    `;

    // 4. Inject into Shadow DOM
    this.shadowRoot.innerHTML = `${cssLink}${html}`;
  }
}

// Register the component
if (!customElements.get("supervisor-global-vars")) {
  customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}
