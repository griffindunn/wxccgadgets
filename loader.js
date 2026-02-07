// ---------------------------------------------------------
// VERSION 6.0 - SCRIPT INJECTION METHOD
// ---------------------------------------------------------
console.log("GADGET: Loading Version 6.0 (Script Injection)...");

// Use the bundled UMD version if available, otherwise standard index
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
            // 1. Load the SDK via Script Tag (Forces Global Scope)
            await this.loadScript(SDK_URL);
            
            console.log("GADGET: Script loaded. Checking global scope...");

            // 2. Find the Desktop Class
            // It often attaches to window.Desktop or window.wxcc.Desktop
            if (window.Desktop) {
                this.desktop = window.Desktop;
                console.log("GADGET: Found window.Desktop");
            } else if (window.wxcc && window.wxcc.Desktop) {
                this.desktop = window.wxcc.Desktop;
                console.log("GADGET: Found window.wxcc.Desktop");
            } else {
                // Last ditch effort: Check if it exported a module default
                console.error("GADGET: Dump of window object keys:", Object.keys(window));
                throw new Error("SDK script loaded, but 'Desktop' global was not found.");
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
            this.renderError(error.message);
        }
    }

    // Helper: Injects a <script> tag into the head
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.Desktop || (window.wxcc && window.wxcc.Desktop)) {
                return resolve();
            }
            
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.async = true;
            
            script.onload = () => {
                console.log("GADGET: SDK Script tag loaded.");
                // Give it a tiny delay to ensure global var is set
                setTimeout(resolve, 100);
            };
            
            script.onerror = (e) => {
                reject(new Error("Failed to load SDK script from CDN."));
            };
            
            document.head.appendChild(script);
        });
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
                <p>Injecting Webex SDK...</p>
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
