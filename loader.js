// 1. Define the Supervisor Gadget Component
const SDK_URL = "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";
const API_BASE_URL = "https://api.wxcc-us1.cisco.com"; // CHECK YOUR REGION (us1, eu1, etc)

class SupervisorGlobalVars extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.desktop = null;
        this.variables = [];
    }

    async connectedCallback() {
        this.renderLoading();
        try {
            // Dynamically load the SDK
            const module = await import(SDK_URL);
            this.desktop = module.Desktop;
            
            await this.desktop.config.init();
            const token = await this.desktop.identity.getAccessToken();
            
            await this.fetchVariables(token);
        } catch (error) {
            console.error("Gadget Error:", error);
            this.renderError(error.message);
        }
    }

    async fetchVariables(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/global-variables?page=0&pageSize=100`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await response.json();
            this.variables = Array.isArray(json) ? json : (json.data || []);
            this.render();
        } catch (err) {
            this.renderError("Fetch Failed: " + err.message);
        }
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `<div style="padding:20px">Loading Global Variables...</div>`;
    }

    renderError(msg) {
        this.shadowRoot.innerHTML = `<div style="padding:20px; color:red"><b>Error:</b> ${msg}</div>`;
    }

    render() {
        // Link to your styles in the 'styles' folder
        const cssLink = `<link rel="stylesheet" href="https://griffindunn.github.io/wxccgadgets/styles/main.css">`;
        
        const rows = this.variables.map(v => 
            `<li><strong>${v.name}</strong>: ${v.value}</li>`
        ).join('');

        this.shadowRoot.innerHTML = `${cssLink}
            <div class="gadget-wrapper">
                <h3>Global Variables</h3>
                <ul>${rows || "No variables found."}</ul>
            </div>`;
    }
}

// Register the Supervisor Component immediately
if (!customElements.get("supervisor-global-vars")) {
    customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}


// 2. Define the Loader Component
class WxccGadgetLoader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Since the Supervisor class is defined above, we don't need to import anything!
        // Just create the element directly.
        
        const gadgetName = this.getAttribute('gadget-name');
        if (!gadgetName) {
            this.shadowRoot.innerHTML = `<div>Error: 'gadget-name' missing</div>`;
            return;
        }

        const gadgetElement = document.createElement(gadgetName);
        
        // Pass attributes down
        Array.from(this.attributes).forEach(attr => {
            if (attr.name !== 'gadget-name') {
                gadgetElement.setAttribute(attr.name, attr.value);
            }
        });

        this.shadowRoot.appendChild(gadgetElement);
    }
}

// Register the Loader Component
if (!customElements.get('wxcc-gadget-loader')) {
    customElements.define('wxcc-gadget-loader', WxccGadgetLoader);
}
