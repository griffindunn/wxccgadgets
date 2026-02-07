import "./supervisor-global-vars.js";

class WxccGadgetLoader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // 1. Get the gadget name from the layout attributes
        const gadgetName = this.getAttribute('gadget-name');
        
        if (!gadgetName) {
            this.shadowRoot.innerHTML = `<div style="color: red; padding: 10px;">Error: 'gadget-name' attribute is missing.</div>`;
            return;
        }

        // 2. Create the dynamic element (e.g., <supervisor-global-vars>)
        const gadgetElement = document.createElement(gadgetName);

        // 3. Pass down any other attributes defined in the layout
        Array.from(this.attributes).forEach(attr => {
            if (attr.name !== 'gadget-name') {
                gadgetElement.setAttribute(attr.name, attr.value);
            }
        });

        // 4. Append to Shadow DOM
        this.shadowRoot.appendChild(gadgetElement);
    }
}

// Register the generic loader component
if (!customElements.get('wxcc-gadget-loader')) {
    customElements.define('wxcc-gadget-loader', WxccGadgetLoader);
}
