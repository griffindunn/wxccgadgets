// ---------------------------------------------------------
// VERSION 5.0 - SUPERVISOR GADGET & LOADER
// ---------------------------------------------------------
console.log("GADGET: Loading Version 5.0...");

const SDK_URL = "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";
// !!! CHECK YOUR REGION !!!
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
            console.log("GADGET: 1. Importing SDK...");
            const module = await import(SDK_URL);
            
            console.log("GADGET: 2. Finding Desktop Class...");
            // Robust check: Look in module exports AND global window
            this.desktop = module.Desktop || module.default?.Desktop || window.Desktop;

            if (!this.desktop) {
                console.error("GADGET DUMP: Module content:", module);
                throw new Error("SDK loaded, but 'Desktop' class was not found in module or window.");
            }

            console.log("GADGET: 3. Initializing Config...");
            await this.desktop.config.init();
            
            console.log("GADGET: 4. Getting Token...");
            const token = await this.desktop.identity.getAccessToken();
            
            console.log("GADGET: 5. Fetching Data...");
            await this.fetchVariables(token);

        } catch (error) {
            console.error("GADGET CRITICAL ERROR:", error);
            this.renderError(error.message);
        }
    }

    async fetchVariables(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/global-variables?page=0&pageSize=100`, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
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
        this.shadowRoot.innerHTML = `
            <div style="padding:20px; font-family:sans-serif; border: 1px solid #ccc;">
                <h3>Loading...</h3>
                <p>Initializing Webex SDK...</p>
            </div>`;
    }

    renderError(msg) {
        this.shadowRoot.innerHTML = `
            <div style="padding:20px; color:red; font-family:sans-serif; border: 2px solid red;">
                <h3>Error</h3>
                <p>${msg}</p>
                <p><small>Check console for "GADGET CRITICAL ERROR"</small></p>
                <button onclick="location.reload()" style="padding:5px 10px; cursor:pointer;">Retry</button>
            </div>`;
    }

    render() {
        // Link to CSS in the styles folder
        const cssLink = `<link rel="stylesheet" href="https://griffindunn.github.io/wxccgadgets/styles/main.css">`;
        
        const rows = this.variables.map(v => 
            `<li><strong>${v.name}</strong>: ${v.value}</li>`
        ).join('');

        this.shadowRoot.innerHTML = `${cssLink}
            <div class="gadget-wrapper">
                <h3>Global Variables</h3>
                <ul>${this.variables.length ? rows : "No variables found."}</ul>
            </div>`;
    }
}

if (!customElements.get("supervisor-global-vars")) {
    customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}

// ---------------------------------------------------------
// LOADER COMPONENT
// ---------------------------------------------------------
class WxccGadgetLoader extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    
    connectedCallback() {
        const gadgetName = this.getAttribute('gadget-name');
        // Visual debugger
        this.style.border = "2px solid blue"; 
        
        if (gadgetName) {
            const el = document.createElement(gadgetName);
            Array.from(this.attributes).forEach(attr => {
                if (attr.name !== 'gadget-name') el.setAttribute(attr.name, attr.value);
            });
            this.shadowRoot.appendChild(el);
        }
    }
}

if (!customElements.get('wxcc-gadget-loader')) {
    customElements.define('wxcc-gadget-loader', WxccGadgetLoader);
}
