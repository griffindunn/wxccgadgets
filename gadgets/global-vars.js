/* gadgets/global-vars.js */
(function() {
    // Phase 5: Business Hours + Descriptions + Version Footer
    const VERSION = "v2.6";
    console.log(`Global Variable Manager ${VERSION} loading...`);

    const template = document.createElement('template');
    template.innerHTML = `
      <style>@import url('https://griffindunn.github.io/wxccgadgets/styles/main.css');</style>
      <div id="app">
          <h2>Global Variables Manager</h2>
          <div id="debug-info" style="font-size: 0.8em; color: #888; margin-bottom: 10px; display: none;"></div>
          <div id="content"></div>
      </div>
      <div id="toast">Notification</div>
      <div class="footer-version">${VERSION}</div>
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
            
            this.data = {
                variables: [],
                businessHours: []
            };
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
                this.loadAllData();
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

        async loadAllData() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '<div class="loading"><span>Loading Data...</span></div>';

            try {
                // Fetch both in parallel
                await Promise.all([
                    this.loadVariables(),
                    this.loadBusinessHours()
                ]);
                this.render();
            } catch (err) {
                console.error('[GlobalVarManager] Load failed:', err);
                contentDiv.innerHTML = `<div style="color:red">Error loading data: ${err.message}</div>`;
            }
        }

        async loadVariables() {
            const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/cad-variable?page=0&pageSize=100`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Variables API Error ${response.status}`);
            const json = await response.json();
            this.data.variables = (json.data || []).filter(v => v.active !== false);
        }

        async loadBusinessHours() {
            const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours?page=0&pageSize=100`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Business Hours API Error ${response.status}`);
            const json = await response.json();
            this.data.businessHours = json.data || [];
        }

        render() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = ''; // Clear

            // --- 1. Render Variables Sorted by Type -> Name ---
            const vars = [...this.data.variables].sort((a, b) => {
                if (a.variableType < b.variableType) return -1;
                if (a.variableType > b.variableType) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 1;
            });

            let currentType = '';
            vars.forEach(v => {
                const type = (v.variableType || 'UNKNOWN').toUpperCase();
                
                if (type !== currentType) {
                    currentType = type;
                    contentDiv.insertAdjacentHTML('beforeend', `<h3 class="category-header">${currentType} Variables</h3>`);
                }
                
                contentDiv.insertAdjacentHTML('beforeend', this.buildVariableCard(v));
            });

            // --- 2. Render Business Hours ---
            if (this.data.businessHours.length > 0) {
                contentDiv.insertAdjacentHTML('beforeend', `<h3 class="category-header">Business Hours</h3>`);
                this.data.businessHours.forEach(bh => {
                    contentDiv.appendChild(this.buildBusinessHoursCard(bh));
                });
            }

            // Attach Event Listeners
            contentDiv.querySelectorAll('.save-var-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleSaveVariable(e.target.dataset.id, e.target));
            });
            contentDiv.querySelectorAll('.save-bh-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleSaveBusinessHours(e.target.dataset.id, e.target));
            });
        }

        // --- HTML Generator: Variable Card ---
        buildVariableCard(v) {
            const isBool = (v.variableType === 'BOOLEAN');
            const value = v.defaultValue;
            const descriptionHtml = v.description ? `<div class="var-desc">${v.description}</div>` : '';
            
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
                inputHtml = `<textarea id="input-${v.id}" class="var-input" rows="1">${value || ''}</textarea>`;
            }

            return `
                <div class="var-row">
                    <div class="var-info">
                        <span class="var-name">${v.name}</span>
                        ${descriptionHtml}
                    </div>
                    <div class="var-input-container">
                        ${inputHtml}
                        <button class="save-var-btn" data-id="${v.id}">Save</button>
                    </div>
                </div>
            `;
        }

        // --- HTML Generator: Business Hours Card (Complex) ---
        buildBusinessHoursCard(bh) {
            const card = document.createElement('div');
            card.className = 'var-row bh-card';
            
            let shiftsHtml = '';
            
            // Generate rows for each shift (e.g. Morning, Afternoon)
            // Note: We use unique IDs for inputs to gather them later
            if (bh.workingHours && bh.workingHours.length > 0) {
                bh.workingHours.forEach((shift, index) => {
                    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                    
                    let daysHtml = '<div class="bh-days">';
                    days.forEach(day => {
                        const isChecked = shift.days.includes(day) ? 'checked' : '';
                        daysHtml += `
                            <label class="bh-day-check">
                                <span>${day[0]}</span>
                                <input type="checkbox" class="bh-input-day" data-bh="${bh.id}" data-idx="${index}" value="${day}" ${isChecked}>
                            </label>
                        `;
                    });
                    daysHtml += '</div>';

                    shiftsHtml += `
                        <div class="bh-shift-row">
                            ${daysHtml}
                            <div class="bh-time-group">
                                <input type="time" class="bh-input-start" data-bh="${bh.id}" data-idx="${index}" value="${shift.startTime}">
                                <span>to</span>
                                <input type="time" class="bh-input-end" data-bh="${bh.id}" data-idx="${index}" value="${shift.endTime}">
                            </div>
                        </div>
                    `;
                });
            } else {
                shiftsHtml = '<div style="color:#999;font-style:italic;">No shifts defined.</div>';
            }

            card.innerHTML = `
                <div class="bh-header">
                    <div class="var-info" style="width:auto;margin:0;">
                        <span class="var-name">${bh.name}</span>
                        ${bh.description ? `<div class="var-desc">${bh.description}</div>` : ''}
                    </div>
                    <button class="save-bh-btn" data-id="${bh.id}">Save</button>
                </div>
                <div class="bh-shifts-container">
                    ${shiftsHtml}
                </div>
            `;
            return card;
        }

        // --- Action: Save Variable ---
        async handleSaveVariable(varId, btnElement) {
            const input = this.shadowRoot.getElementById(`input-${varId}`);
            let newValue = input.value;
            const originalText = btnElement.innerText;
            btnElement.disabled = true;
            btnElement.innerText = "...";

            const originalVar = this.data.variables.find(v => v.id === varId);
            if (originalVar.variableType === 'BOOLEAN') newValue = (newValue === 'true'); 

            try {
                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/cad-variable/${varId}`;
                const payload = { ...originalVar, id: varId, defaultValue: newValue };

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);
                originalVar.defaultValue = newValue;
                this.showNotification(`Saved "${originalVar.name}"`, 'success');
            } catch (err) {
                this.showNotification(`Error: ${err.message}`, 'error');
            } finally {
                btnElement.disabled = false;
                btnElement.innerText = originalText;
            }
        }

        // --- Action: Save Business Hours ---
        async handleSaveBusinessHours(bhId, btnElement) {
            const originalText = btnElement.innerText;
            btnElement.disabled = true;
            btnElement.innerText = "...";

            const originalBh = this.data.businessHours.find(b => b.id === bhId);
            
            // Reconstruct the workingHours array from the DOM inputs
            // We clone the original structure to keep names/ids, but update days/times
            const updatedWorkingHours = JSON.parse(JSON.stringify(originalBh.workingHours));
            
            try {
                updatedWorkingHours.forEach((shift, index) => {
                    // Gather selected days for this shift index
                    const dayChecks = this.shadowRoot.querySelectorAll(`.bh-input-day[data-bh="${bhId}"][data-idx="${index}"]:checked`);
                    const selectedDays = Array.from(dayChecks).map(cb => cb.value);
                    
                    // Gather times
                    const startInput = this.shadowRoot.querySelector(`.bh-input-start[data-bh="${bhId}"][data-idx="${index}"]`);
                    const endInput = this.shadowRoot.querySelector(`.bh-input-end[data-bh="${bhId}"][data-idx="${index}"]`);
                    
                    shift.days = selectedDays;
                    shift.startTime = startInput.value;
                    shift.endTime = endInput.value;
                });

                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours/${bhId}`;
                const payload = { ...originalBh, workingHours: updatedWorkingHours };

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);
                
                originalBh.workingHours = updatedWorkingHours; // Update local state
                this.showNotification(`Saved "${originalBh.name}"`, 'success');

            } catch (err) {
                console.error(err);
                this.showNotification(`Error: ${err.message}`, 'error');
            } finally {
                btnElement.disabled = false;
                btnElement.innerText = originalText;
            }
        }

        showNotification(msg, type) {
            const toast = this.shadowRoot.getElementById('toast');
            toast.innerText = msg;
            toast.className = `show ${type}`;
            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
        }
    }

    if (!customElements.get('global-variable-manager')) {
        customElements.define('global-variable-manager', GlobalVariableManager);
        console.log(`Global Variable Manager ${VERSION} registered.`);
    }
})();
