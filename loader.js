class WxccGadgetLoader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        // Debugging Border (Keep this until it works fully!)
        this.style.border = "5px solid red"; 
        this.style.display = "block";
        this.style.padding = "10px";
        
        try {
            // *** FIX: Point to the 'gadgets' folder ***
            // We use the full URL to be 100% safe.
            // (Ensure this matches your GitHub username/repo exactly)
            await import("https://griffindunn.github.io/wxccgadgets/gadgets/supervisor-global-vars.js");
            
            console.log("Loader: Child script loaded successfully.");
        } catch (err) {
            console.error("Loader: Failed to load child script.", err);
            this.shadowRoot.innerHTML = `<div style="color:red">Error loading gadget file: ${err.message}</div>`;
            return;
        }

        const gadgetName = this.getAttribute('gadget-name');
        
        if (!gadgetName) {
            this.shadowRoot.innerHTML = `<div>Error: 'gadget-name' attribute is missing.</div>`;
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
