import { Desktop } from "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";

// !!! IMPORTANT !!!
// Change this URL to match your Webex Contact Center Region
// US: https://api.wxcc-us1.cisco.com
// EU: https://api.wxcc-eu1.cisco.com
// AP: https://api.wxcc-ap1.cisco.com
const API_BASE_URL = "https://api.wxcc-us1.cisco.com";

export class SupervisorGlobalVars extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.desktop = Desktop;
    this.variables = []; // Local store for the variables
    this.orgId = null;
    this.accessToken = null;
  }

  async connectedCallback() {
    this.renderLoading();

    try {
      // 1. Initialize SDK
      await this.desktop.config.init();
      
      // 2. Get Auth Token & Org ID from the Desktop SDK
      // Note: The specific method to get the token may vary by SDK version. 
      // This is the standard pattern for the current module.
      this.accessToken = await this.desktop.identity.getAccessToken();
      this.orgId = await this.desktop.identity.getOrgId();

      console.log("Supervisor Gadget: Auth successful", this.orgId);

      // 3. Fetch the variables
      await this.fetchVariables();

    } catch (error) {
      console.error("Init Failed", error);
      this.renderError("Failed to initialize or fetch variables. See console for details.");
    }
  }

  /**
   * Fetch all global variables from the WxCC API
   */
  async fetchVariables() {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/global-variables?page=0&pageSize=100`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const data = await response.json();
      // The API returns { data: [...] } or just [...] depending on version. 
      // We handle both safely.
      this.variables = Array.isArray(data) ? data : (data.data || []);
      
      this.render(); // Re-render with data
      
    } catch (error) {
      console.error("Fetch Error", error);
      this.renderError("Could not load global variables.");
    }
  }

  /**
   * Update a specific variable
   */
  async saveVariable(id, name, type, newValue, btnElement) {
    // UI Feedback: Change button to "Saving..."
    const originalText = btnElement.innerText;
    btnElement.innerText = "Saving...";
    btnElement.disabled = true;

    try {
      const payload = {
        name: name,
        value: newValue,
        type: type // The API usually requires the type to be sent back
      };

      const response = await fetch(`${API_BASE_URL}/v1/global-variables/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Update failed");

      // Success Feedback
      btnElement.innerText = "Saved!";
      btnElement.style.backgroundColor = "#2fb16d"; // Green
      setTimeout(() => {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
        btnElement.style.backgroundColor = ""; // Reset color
      }, 2000);

    } catch (error) {
      console.error("Update Error", error);
      btnElement.innerText = "Error";
      btnElement.style.backgroundColor = "#d63d3d"; // Red
      setTimeout(() => {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
        btnElement.style.backgroundColor = "";
      }, 2000);
    }
  }

  /**
   * Render the Loading State
   */
  renderLoading() {
    this.shadowRoot.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <p>Loading Supervisor Controls...</p>
      </div>
    `;
  }

  /**
   * Render Error State
   */
  renderError(msg) {
    this.shadowRoot.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <p>Error: ${msg}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  /**
   * Render the Main UI
   */
  render() {
    const title = this.getAttribute("title") || "Global Variables";
    const cssLink = `<link rel="stylesheet" href="https://griffindunn.github.io/wxccgadgets/styles/main.css">`;

    // Local override styles for the table
    const styles = `
      <style>
        :host { display: block; font-family: "CiscoSans", sans-serif; }
        .var-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .var-table th { text-align: left; padding: 8px; background: #f4f4f4; border-bottom: 2px solid #ddd; }
        .var-table td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
        .input-wrapper { display: flex; gap: 8px; }
        input.var-input { flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; }
        button.save-btn { padding: 6px 12px; cursor: pointer; background-color: #007AA3; color: white; border: none; border-radius: 14px; font-size: 0.85rem;}
        button.save-btn:hover { background-color: #005E7D; }
        button.save-btn:disabled { background-color: #ccc; cursor: not-allowed; }
      </style>
    `;

    // Generate Rows
    const rows = this.variables.map(v => `
      <tr>
        <td><strong>${v.name}</strong></td>
        <td>
          <div class="input-wrapper">
            <input type="text" 
                   class="var-input" 
                   value="${v.value}" 
                   id="input-${v.id}"
            />
            <button class="save-btn" 
                    data-id="${v.id}" 
                    data-name="${v.name}" 
                    data-type="${v.type}">
              Save
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    const html = `
      <div class="gadget-wrapper">
        <h3>${title}</h3>
        ${this.variables.length === 0 ? '<p>No variables found.</p>' : `
          <table class="var-table">
            <thead>
              <tr>
                <th style="width: 40%">Variable Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `}
      </div>
    `;

    this.shadowRoot.innerHTML = `${cssLink}${styles}${html}`;

    // Re-attach event listeners to the new buttons
    this.shadowRoot.querySelectorAll(".save-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const name = e.target.getAttribute("data-name");
        const type = e.target.getAttribute("data-type");
        const input = this.shadowRoot.getElementById(`input-${id}`);
        
        this.saveVariable(id, name, type, input.value, e.target);
      });
    });
  }
}

if (!customElements.get("supervisor-global-vars")) {
  customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}
