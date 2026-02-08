/* gadgets/global-vars.js */
(function() {
    console.log('Global Variable Manager v2.3 (Full Payload Fix) loading...');

    const template = document.createElement('template');
    template.innerHTML = `
      <style>@import url('https://griffindunn.github.io/wxccgadgets/styles/main.css');</style>
      <div id="app">
          <h2>Global Variables Manager</h2>
          <div id="debug-info" style="font-size: 0.8em; color: #888; margin-bottom: 10px; display: none;"></div>
          <div id="content"></div>
      </div>
      <div id="toast">Notification</div>
    `;

    class GlobalVariableManager extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            
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
                this.ctx.baseUrl = this.resolveApiUrl(newValue);
            }

            if (this.ctx.token && this.ctx.orgId && this.ctx.baseUrl) {
                this.updateDebugDisplay();
                this.loadVariables();
            }
        }

        resolveApiUrl(rawDc) {
            const cleanDc = rawDc ? rawDc.replace('prod', '').toLowerCase() : 'us1';
            const map = {
                'us1': 'https://api.wxcc-us1.cisco.com',
                'eu1': 'https://api.wxcc-eu1.cisco.com',
                'eu2': 'https://api.wxcc-eu2.cisco.com',
                'anz1': 'https://api.wxcc-anz1.cisco.com',
                'ca1': 'https://api.wxcc-ca1.cisco.com'
            };
            return map[cleanDc] || map['us1'];
        }

        updateDebugDisplay() {
            const debugEl = this.shadowRoot.getElementById('debug-info');
            debugEl.innerText = `Org: ${this.ctx.orgId} | API: ${this.ctx.baseUrl}`;
        }

        async loadVariables() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '<div class="loading"><span>Retrieving Global Variables...</span></div>';

            try {
                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/cad-variable?page=0&pageSize=100`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.ctx.token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) throw new Error(`API Error ${response.status}`);

                const json = await response.json();
                
                // Store the raw data exactly as it came from the API
                this.variables = (json.data || []).filter(v => v.active !== false);
                this.render();

            } catch (err) {
                console.error('[GlobalVarManager] Load failed:', err);
                contentDiv.innerHTML = `<div style="color:red">Error loading data: ${err.message}</div>`;
            }
        }

        render() {
            const contentDiv = this.shadowRoot.getElementById('content');
            
            if (this.variables.length === 0) {
                contentDiv.innerHTML = '<p style="padding:20px;text-align:center;">No active global variables found.</p>';
                return;
            }

            let html = '';
            this.variables.forEach(v => {
                const type = (v.variableType || '').toUpperCase();
                const isBool = (type === 'BOOLEAN');
                const value = v.defaultValue; 
                
                let inputHtml = '';
                if (isBool) {
                    const isTrue = (String(value) === 'true');
                    inputHtml = `
                        <select id="input-${v.id}">
                            <option value="true" ${isTrue ? 'selected' : ''}>TRUE</option>
                            <option value="false" ${!isTrue ? 'selected' : ''}>FALSE</option>
                        </select>
                    `;
                } else {
                    inputHtml = `<input type="text" id="input-${v.id}" value="${value || ''}" />`;
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

            contentDiv.querySelectorAll('.save-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleSave(e.target.dataset.id, e.target));
            });
        }

        async handleSave(varId, btnElement) {
            const input = this.shadowRoot.getElementById(`input-${varId}`);
            let newValue = input.value;
            const originalText = btnElement.innerText;

            btnElement.disabled = true;
            btnElement.innerText = "Saving...";

            // Retrieve the full original object
            const originalVar = this.variables.find(v => v.id === varId);

            // Correctly cast boolean values if needed
            if (originalVar.variableType && originalVar.variableType.toUpperCase() === 'BOOLEAN') {
                newValue = (newValue === 'true'); 
            }

            try {
                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/cad-variable/${varId}`;
                
                // --- THE FIX: Spread the entire original object ---
                // We take all existing properties (...originalVar) and only overwrite defaultValue.
                // We also ensure the 'id' is explicitly included in the body.
                const payload = {
                    ...originalVar, 
                    id: varId, 
                    defaultValue: newValue 
                };

                console.log('[GlobalVarManager] Payload:', JSON.stringify(payload));

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.ctx.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('API Error Response:', errText);
                    // Attempt to parse a readable error message from WxCC
                    let friendlyError = `Status ${response.status}`;
                    try {
                        const errJson = JSON.parse(errText);
                        if (errJson.message) friendlyError = errJson.message;
                        if (errJson.apiError && errJson.apiError.description) friendlyError = errJson.apiError.description;
                    } catch(e) {}
                    
                    throw new Error(friendlyError);
                }

                // Update local state to reflect the change
                originalVar.defaultValue = newValue;
                this.showNotification(`Saved "${originalVar.name}"`, 'success');

            } catch (err) {
                console.error('[GlobalVarManager] Save failed:', err);
                this.showNotification(`Save Failed: ${err.message}`, 'error');
            } finally {
                btnElement.disabled = false;
                btnElement.innerText = originalText;
            }
        }

        showNotification(msg, type) {
            const toast = this.shadowRoot.getElementById('toast');
            toast.innerText = msg;
            toast.className = `show ${type}`;
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
