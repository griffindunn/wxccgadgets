class WxccGadgetLoader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        // 1. Debugging Border (Verify this appears first!)
        this.style.border = "5px solid red"; 
        this.style.display = "block";
        this.style.padding = "10px";
        
        // 2. Load the Child Component Dynamically
        try {
            // This loads your other file safely without crashing the script
            await import("https://griffindunn.github.io/wxccgadgets/supervisor-global-vars.js");
            console.log("Loader: Child script loaded successfully.");
        } catch (err) {
            console.error("Loader: Failed to load child script.", err);
            this.shadowRoot.innerHTML = `<div style="color:red">Error loading gadget file. Check console.</div>`;
            return;
        }

        // 3. Get the gadget name from JSON
        const gadgetName = this.getAttribute('gadget-name');
        
        if (!gadgetName) {
            this.shadowRoot.innerHTML = `<div>Error: 'gadget-name' attribute is missing.</div>`;
            return;
        }

        // 4. Create the element (e.g., <supervisor-global-vars>)
        const gadgetElement = document.createElement(gadgetName);

        // 5. Pass down attributes
        Array.from(this.attributes).forEach(attr => {
            if (attr.name !== 'gadget-name') {
                gadgetElement.setAttribute(attr.name, attr.value);
            }
        });

        // 6. Show it!
        this.shadowRoot.appendChild(gadgetElement);
    }
}

// Register the loader
if (!customElements.get('wxcc-gadget-loader')) {
    customElements.define('wxcc-gadget-loader', WxccGadgetLoader);
}
