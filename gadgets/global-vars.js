/* gadgets/global-vars.js */
(function() {
    console.log('Global Variable Viewer loading...');

    // Define the template and styles
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        @import url('https://griffindunn.github.io/wxccgadgets/styles/main.css');
        :host {
            display: block;
            height: 100%;
            width: 100%;
            background-color: white;
            overflow-y: auto;
        }
      </style>
      <div class="gadget-container">
          <h2>Global Variables Supervisor Gadget</h2>
          <p>Status: <span id="status">Waiting for data...</span></p>
          
          <div id="data-display">
              </div>
      </div>
    `;

    class GlobalVariableViewer extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            
            // Store current values
            this.data = {
                token: 'Not Set',
                orgId: 'Not Set',
                region: 'Not Set'
            };
        }

        // 1. Tell the browser which attributes to watch
        static get observedAttributes() {
            return ['token', 'org-id', 'data-center'];
        }

        // 2. React when an attribute changes (WxCC passes data here)
        attributeChangedCallback(name, oldValue, newValue) {
            console.log(`[GlobalVarGadget] Attribute Changed: ${name}`, newValue);
            
            if (name === 'token') this.data.token = newValue;
            if (name === 'org-id') this.data.orgId = newValue;
            if (name === 'data-center') this.data.region = newValue;

            this.render();
        }

        connectedCallback() {
            this.render();
        }

        // 3. Update the UI
        render() {
            const displayArea = this.shadowRoot.getElementById('data-display');
            const statusSpan = this.shadowRoot.getElementById('status');
            
            // Check if we have received data yet
            if(this.data.token !== 'Not Set') {
                statusSpan.innerText = "Connected";
                statusSpan.style.color = "green";
            }

            // Truncate token for readability
            const displayToken = this.data.token.length > 50 
                ? this.data.token.substring(0, 40) + '... (truncated)' 
                : this.data.token;

            displayArea.innerHTML = `
                <div class="data-row">
                    <span class="label">ACCESS TOKEN</span>
                    <span class="value" title="${this.data.token}">${displayToken}</span>
                </div>
                <div class="data-row">
                    <span class="label">ORGANIZATION ID</span>
                    <span class="value">${this.data.orgId}</span>
                </div>
                <div class="data-row">
                    <span class="label">REGION / DATACENTER</span>
                    <span class="value">${this.data.region}</span>
                </div>
            `;
        }
    }

    // Register the component so WxCC can use it
    if (!customElements.get('global-variable-viewer')) {
        customElements.define('global-variable-viewer', GlobalVariableViewer);
        console.log('Global Variable Viewer registered.');
    }
})();
