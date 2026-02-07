// ---------------------------------------------------------
// VERSION 9.0 - EXPLICIT INIT CONFIG
// ---------------------------------------------------------
console.log("GADGET: Loading Version 9.0 (Explicit Config)...");

// Use the robust ESM CDN
const SDK_URL = "https://esm.sh/@wxcc-desktop/sdk";
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
            const { Desktop } = await import(SDK_URL);

            if (!Desktop) throw new Error("SDK loaded, but 'Desktop' export is missing.");
            this.desktop = Desktop;

            // *** CRITICAL FIX: GET WIDGET NAME ***
            // We try to find the name passed from the loader, or default to "SupervisorControls"
            const widgetName = this.getAttribute("gadget-name") || "SupervisorControls";
            console.log(`GADGET: Initializing SDK for widget: ${widgetName}`);

            // *** PASS CONFIG TO INIT ***
            // This prevents the "undefined (reading 'widgetName')" error
            await this.desktop.config.init({
                widgetName: widgetName,
                widgetId: widgetName 
            });
            
            console.log("GADGET: SDK Initialized! Getting Token...");
            const token = await this.desktop.identity.getAccessToken();
            
            console.log("GADGET: Fetching Variables...");
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
                <p>Initializing Webex SDK (v9.0)...</p>
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
        
        // Render simple list for now to prove it works
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

// Register Components
if (!customElements.get("supervisor-global-vars")) {
    customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}

class WxccGadgetLoader extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    
    connectedCallback() {
        const gadgetName = this.getAttribute('gadget-name');
        if (gadgetName) {
            const el = document.createElement(gadgetName);
            // Pass all attributes down to the child so it can read them
            Array.from(this.attributes).forEach(attr => {
                el.setAttribute(attr.name, attr.value);
            });
            this.shadowRoot.appendChild(el);
        }
    }
}

if (!customElements.get('wxcc-gadget-loader')) {
    customElements.define('wxcc-gadget-loader', WxccGadgetLoader);
}
