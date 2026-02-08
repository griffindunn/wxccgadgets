/* gadgets/global-vars.js */
(function() {
    console.log('Global Variable Manager v2 loading...');

    const template = document.createElement('template');
    template.innerHTML = `
      <style>@import url('https://griffindunn.github.io/wxccgadgets/styles/main.css');</style>
      <div id="app">
          <h2>Global Variables Manager</h2>
          <div id="content"></div>
      </div>
      <div id="toast">Notification</div>
    `;

    class GlobalVariableManager extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            
            // State
            this.ctx = {
                token: null,
                orgId: null,
                region: null,
                baseUrl: null
            };
            this.variables = [];
        }

        static get observedAttributes() {
            return ['token', 'org-id', 'data-center'];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'token') this.ctx.token = newValue;
            if (name === 'org-id') this.ctx.orgId = newValue;
            if (name === 'data-center') {
                this.ctx.region = newValue;
                this.ctx.baseUrl = this.getApiUrl(newValue);
            }

            // Only load if we have all 3 pieces of info
            if (this.ctx.token && this.ctx.orgId && this.ctx.baseUrl) {
                this.loadVariables();
            }
        }

        // --- Helper: Get API URL based on Data Center ---
        getApiUrl(dc) {
            const map = {
                'us1': 'https://api.wxcc-us1.cisco.com',
                'eu1': 'https://api.wxcc-eu1.cisco.com',
                'eu2': 'https://api.wxcc-eu2.cisco.com',
                'anz1': 'https://api.wxcc-anz1.cisco.com',
                'ca1': 'https://api.wxcc-ca1.cisco.com'
            };
            return map[dc] || map['us1']; // Default to US1 if unknown
        }

        // --- Core Logic: Fetch Variables ---
        async loadVariables() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '<div class="loading"><span>Retrieving Global Variables...</span></div>';

            try {
                // Fetch CAD Variables (Page 0, 100 items)
                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/cad-variable?page=0&pageSize=100`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.ctx.token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) throw new Error(`API Error: ${response.status}`);

                const json = await response.json();
                // Filter: Only show active variables
                this.variables = (json.data || []).filter(v => v.active !== false);
                
                this.render();

            } catch (err) {
                console.error(err);
                contentDiv.innerHTML = `<div style="color:red">Error loading data: ${err.message}</div>`;
            }
        }

        // --- Core Logic: Render UI ---
        render() {
            const contentDiv = this.shadowRoot.getElementById('content');
            
            if (this.variables.length === 0) {
                contentDiv.innerHTML = '<p>No active global variables found.</p>';
                return;
            }

            let html = '';
            this.variables.forEach(v => {
                const isBool = v.variableType === 'BOOLEAN';
                const value = v.defaultValue || ''; // Current global value
                
                // Input generation based on type
                let inputHtml = '';
                if (isBool) {
                    inputHtml = `
                        <select id="input-${v.id}">
                            <option value="true" ${value === 'true' ? 'selected' : ''}>TRUE</option>
                            <option value="false" ${value === 'false' ? 'selected' : ''}>FALSE</option>
                        </select>
                    `;
                } else {
                    inputHtml = `<input type="text" id="input-${v.id}" value="${value}" />`;
                }

                html += `
                    <div class="var-row">
                        <div class="var-info">
                            <span class="var-name">${v.name}</span>
                            <span class="var-id">${v.variableType}</span>
                        </div>
                        <div class="var-input-container">
                            ${inputHtml}
                            <button class="save-btn" data-id="${v.id}">Save</button>
                        </div>
                    </div>
                `;
            });

            contentDiv.innerHTML = html;

            // Attach Event Listeners to Buttons
            const buttons = contentDiv.querySelectorAll('.save-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleSave(e.target.dataset.id, e.target));
            });
        }

        // --- Core Logic: Save Changes ---
        async handleSave(varId, btnElement) {
            const input = this.shadowRoot.getElementById(`input-${varId}`);
            const newValue = input.value;
            const originalText = btnElement.innerText;

            // UI Feedback: Loading
            btnElement.disabled = true;
            btnElement.innerText = "Saving...";

            // Find the original object to preserve other fields
            const originalVar = this.variables.find(v => v.id === varId);

            try {
                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/cad-variable/${varId}`;
                
                // Construct Payload (Must include required fields from original)
                const payload = {
                    name: originalVar.name,
                    description: originalVar.description,
                    variableType: originalVar.variableType,
                    defaultValue: newValue, // The update
                    active: true
                };

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.ctx.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Save failed: ${response.status}`);

                this.showNotification(`Saved "${originalVar.name}" successfully!`, 'success');

            } catch (err) {
                console.error(err);
                this.showNotification(`Failed: ${err.message}`, 'error');
            } finally {
                // UI Feedback: Restore
                btnElement.disabled = false;
                btnElement.innerText = originalText;
            }
        }

        // --- Helper: Toast Notification ---
        showNotification(msg, type) {
            const toast = this.shadowRoot.getElementById('toast');
            toast.innerText = msg;
            toast.className = `show ${type}`;
            
            // Hide after 3 seconds
            setTimeout(() => { 
                toast.className = toast.className.replace("show", ""); 
            }, 3000);
        }
    }

    if (!customElements.get('global-variable-manager')) {
        customElements.define('global-variable-manager', GlobalVariableManager);
        console.log('Global Variable Manager registered.');
    }
})();
