// ---------------------------------------------------------
// VERSION 7.0 - ES MODULE LOAD
// ---------------------------------------------------------
console.log("GADGET: Loading Version 7.0 (ES Module)...");

// We use the 'esm' (ES Module) build specifically
const SDK_URL = "https://unpkg.com/@wxcc-desktop/sdk@latest/dist/index.js";
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
            console.log("GADGET: 1. Importing SDK Module...");
            
            // Standard ES Module Import
            const module = await import(SDK_URL);
            
            console.log("GADGET: Module Loaded. Keys:", Object.keys(module));

            // The SDK usually exports { Desktop } named export
            if (module.Desktop) {
                this.desktop = module.Desktop;
                console.log("GADGET: Found module.Desktop");
            } 
            // Sometimes it's a default export
            else if (module.default && module.default.Desktop) {
                this.desktop = module.default.Desktop;
                console.log("GADGET: Found module.default.Desktop");
            }
            // Sometimes the default export IS the Desktop class
            else if (module.default && typeof module.default.config === 'object') {
                 this.desktop = module.default;
                 console.log("GADGET: Found module.default (as Desktop)");
            }
            else {
                throw new Error("SDK loaded, but could not find 'Desktop' class in exports.");
            }

            // 3. Initialize
            console.log("GADGET: Initializing Config...");
            await this.desktop.config.init();
            
            console.log("GADGET: Getting Token...");
            const token = await this.desktop.identity.getAccessToken();
            
            console.log("GADGET: Fetching Variables...");
            await this.fetchVariables(token);

        } catch (error) {
            console.error("GADGET CRITICAL ERROR:", error);
            this.renderError(error.message + " (Check Console)");
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
            <div style="padding:20px; font-family:sans-serif;">
                <h3>Loading...</h3>
                <p>Connecting to Webex...</p>
            </div>`;
    }

    renderError(msg) {
        this.shadowRoot.innerHTML = `
            <div style="padding:20px; color:red; font-family:sans-serif; border: 2px solid red;">
                <h3>Error</h3>
                <p>${msg}</p>
                <button onclick="location.reload()">Retry</button>
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
                <ul>${this.variables.length ? rows : "No variables found."}</ul>
            </div>`;
    }
}

if (!customElements.get("supervisor-global-vars")) {
    customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}

class WxccGadgetLoader extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() {
        const gadgetName = this.getAttribute('gadget-name');
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
