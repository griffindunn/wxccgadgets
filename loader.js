const SDK_URL = "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";
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
            console.log("1. Starting SDK Load...");
            
            // method A: Try to load as a module
            // We await the import, but we don't trust the return value blindly.
            await import(SDK_URL);
            
            console.log("2. Script loaded. Checking for 'Desktop' object...");

            // method B: Check the global window object (Most likely location)
            if (window.Desktop) {
                console.log("   -> Found window.Desktop!");
                this.desktop = window.Desktop;
            } 
            // method C: Check if it's hidden under a different namespace
            else if (window.wxcc && window.wxcc.Desktop) {
                console.log("   -> Found window.wxcc.Desktop!");
                this.desktop = window.wxcc.Desktop;
            }
            else {
                 // Fallback: If we can't find it, we throw an error to stop execution
                 throw new Error("Could not find 'Desktop' object in window or module.");
            }

            // If we get here, this.desktop is set.
            console.log("3. Initializing Config...");
            await this.desktop.config.init();
            
            console.log("4. Getting Token...");
            const token = await this.desktop.identity.getAccessToken();
            
            console.log("5. Fetching Data...");
            await this.fetchVariables(token);

        } catch (error) {
            console.error("Gadget Critical Error:", error);
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
                throw new Error(`API Error: ${response.status}`);
            }

            const json = await response.json();
            // Handle different API response structures
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
                <p>Initializing Webex SDK...</p>
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

// ---------------------------------------------------------
// Register Components
// ---------------------------------------------------------

if (!customElements.get("supervisor-global-vars")) {
    customElements.define("supervisor-global-vars", SupervisorGlobalVars);
}

class WxccGadgetLoader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
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
