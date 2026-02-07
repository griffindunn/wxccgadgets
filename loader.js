// ---------------------------------------------------------
// VERSION 11.0 - SCRIPT INJECTION (UNKPG)
// ---------------------------------------------------------
console.log("GADGET: Loading Version 11.0 (Script Injection)...");

// UNPKG usually serves the full "Umd" build which includes everything
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
            // 1. Inject the Script Tag
            console.log("GADGET: Injecting SDK Script...");
            await this.loadScript(SDK_URL);
            
            // 2. Find the Global Object
            console.log("GADGET: Script loaded. Searching for global 'Desktop'...");
            
            // We verify exactly where the SDK attached itself
            if (window.Desktop) {
                this.desktop = window.Desktop;
                console.log("GADGET: Found 'window.Desktop'");
            } 
            else if (window.wxcc && window.wxcc.Desktop) {
                this.desktop = window.wxcc.Desktop;
                console.log("GADGET: Found 'window.wxcc.Desktop'");
            }
            else {
                // Debugging: Print all keys on window that start with 'Des' or 'wx'
                const keys = Object.keys(window).filter(k => k.startsWith('Des') || k.startsWith('wx'));
                console.error("GADGET: Window keys found:", keys);
                throw new Error("SDK script finished loading, but 'Desktop' global is missing.");
            }

            // 3. Initialize
            const widgetName = this.getAttribute("gadget-name") || "SupervisorControls";
            console.log(`GADGET: Initializing SDK for ${widgetName}...`);
            
            await this.desktop.config.init({
                widgetName: widgetName,
                widgetId: widgetName
            });

            // 4. Get Token
            console.log("GADGET: Getting Access Token...");
            // Double check identity exists before calling it
            if (!this.desktop.identity) {
                console.error("GADGET: Desktop object structure:", this.desktop);
                throw new Error("Desktop.identity is undefined. The SDK might be incomplete.");
            }

            const token = await this.desktop.identity.getAccessToken();
            console.log("GADGET: Token Received!");

            // 5. Fetch Data
            await this.fetchVariables(token);

        } catch (error) {
            console.error("GADGET CRITICAL ERROR:", error);
            this.renderError(error.message);
        }
    }

    // Helper to load external scripts safely
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // If it's already loaded, don't load it again
            if (window.Desktop) return resolve();

            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                // Small delay to ensure the global variable is set
                setTimeout(resolve, 500);
            };
            script.onerror = () => reject(new Error("Network Error: Could not load SDK script."));
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
                <p>Injecting Webex SDK (v11.0)...</p>
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
