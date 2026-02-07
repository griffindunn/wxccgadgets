// ---------------------------------------------------------
// VERSION 10.0 - JSPM CDN (Preserves Static Properties)
// ---------------------------------------------------------
console.log("GADGET: Loading Version 10.0 (JSPM)...");

// JSPM handles the conversion of the Webex SDK better than esm.sh
const SDK_URL = "https://jspm.dev/@wxcc-desktop/sdk"; 
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
            console.log("GADGET: 1. Importing SDK from JSPM...");
            const module = await import(SDK_URL);

            // JSPM usually puts the main export in 'default'
            // We check both default and named export to be safe
            this.desktop = module.Desktop || module.default?.Desktop || module.default;

            if (!this.desktop) {
                console.error("GADGET DUMP:", module);
                throw new Error("SDK loaded, but 'Desktop' object could not be found.");
            }

            console.log("GADGET: SDK Object Found. Keys:", Object.keys(this.desktop));

            // *** CRITICAL CHECK ***
            // If identity is missing, the SDK is broken in this environment
            if (!this.desktop.identity) {
                console.warn("GADGET: 'identity' property missing. Checking fallback...");
                // Sometimes it's nested in a 'default' property inside the class
                if (this.desktop.default && this.desktop.default.identity) {
                    this.desktop = this.desktop.default;
                }
            }

            // Init Config
            const widgetName = this.getAttribute("gadget-name") || "SupervisorControls";
            console.log(`GADGET: Initializing for ${widgetName}...`);
            
            await this.desktop.config.init({
                widgetName: widgetName,
                widgetId: widgetName
            });
            
            console.log("GADGET: Config Init Success.");

            // Get Token
            // If this fails, we catch it below
            console.log("GADGET: Requesting Access Token...");
            if (!this.desktop.identity) throw new Error("Desktop.identity is undefined. Cannot get token.");
            
            const token = await this.desktop.identity.getAccessToken();
            console.log("GADGET: Token received!");

            // Fetch Data
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
            <div style="padding:20px; font-family:sans-serif;">
                <h3>Loading...</h3>
                <p>Connecting to Webex (v10.0)...</p>
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
