// 1. Define the Supervisor Gadget Component
const SDK_URL = "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";
// CHECK YOUR REGION BELOW: (us1, eu1, ap1, etc.)
const API_BASE_URL = "https://api.wxcc-us1.cisco.com"; 

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
            console.log("Attempting to load SDK...");
            const module = await import(SDK_URL);
            
            // *** FIX: ROBUST SDK LOADING ***
            // Try to find the Desktop object in the module or the window
            this.desktop = module.Desktop || module.default || window.Desktop;

            if (!this.desktop) {
                console.error("SDK Module Dump:", module);
                throw new Error("SDK loaded, but 'Desktop' class was not found.");
            }

            console.log("SDK Found. Initializing...");
            
            // Now safe to access .config
            await this.desktop.config.init();
            
            console.log("SDK Initialized. Getting Token...");
            const token = await this.desktop.identity.getAccessToken();
            
            await this.fetchVariables(token);

        } catch (error) {
            console.error("Gadget Critical Error:", error);
            this.renderError(error.message);
        }
    }

    async fetchVariables(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/global-variables?page=0&pageSize=100`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            this.variables = Array.isArray(json) ? json : (json.data || []);
            this.render();
        } catch (err) {
            this.renderError("Fetch Failed: " + err.message);
        }
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `<div style="padding:20px; font-family:sans-serif;">Loading Global Variables...</div>`;
    }

    renderError(msg) {
        this.shadowRoot.innerHTML = `
            <div style="padding:20px; color:red; font-family:sans-serif; border: 2px solid red;">
                <h3>Error</h3>
                <p>${msg}</p>
                <p><small>Check the browser console (F12) for more details.</small></p>
            </div>`;
    }

    render() {
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

// Register the Supervisor Component
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
        const gadgetName = this.getAttribute('gadget-name');
        if (!gadgetName) {
            this.shadowRoot.innerHTML = `<div>Error: 'gadget-name' missing</div>`;
            return;
        }

        const gadgetElement = document.createElement(gadgetName);
        
        Array.from(this.attributes).forEach(attr => {
            if (attr.name !== 'gadget-name') {
                gadgetElement.setAttribute(attr.name, attr.value);
            }
        });

        this.shadowRoot.appendChild(gadgetElement);
    }
}

if (!customElements.get('wxcc-gadget-loader')) {
    customElements.define('wxcc-gadget-loader', WxccGadgetLoader);
}
