/* gadgets/global-vars.js */
(function() {
    // Phase 6.1: Fix 404 Error on Save (Attribute Mismatch)
    const VERSION = "v2.8";
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

            this.editState = {}; 
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
            
            // Initialize Edit State
            this.editState = {};
            this.data.businessHours.forEach(bh => {
                this.editState[bh.id] = JSON.parse(JSON.stringify(bh.workingHours || []));
            });
        }

        render() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '';

            // 1. Variables
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

            // 2. Business Hours
            if (this.data.businessHours.length > 0) {
                contentDiv.insertAdjacentHTML('beforeend', `<h3 class="category-header">Business Hours</h3>`);
                this.data.businessHours.forEach(bh => {
                    const shifts = this.editState[bh.id] || [];
                    contentDiv.appendChild(this.buildBusinessHoursCard(bh, shifts));
                });
            }

            this.attachEventListeners(contentDiv);
        }

        buildVariableCard(v) {
            const isBool = (v.variableType === 'BOOLEAN');
            const value = v.defaultValue;
            const desc = v.description ? `<div class="var-desc">${v.description}</div>` : '';
            
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
                        ${desc}
                    </div>
                    <div class="var-input-container">
                        ${inputHtml}
                        <button class="save-var-btn" data-id="${v.id}">Save</button>
                    </div>
                </div>
            `;
        }

        buildBusinessHoursCard(bh, shifts) {
            const card = document.createElement('div');
            card.className = 'var-row bh-card';
            
            const shiftsHtml = shifts.map((shift, idx) => `
                <div class="shift-item">
                    <div class="shift-info">
                        <span class="shift-name">${shift.name || 'Unnamed Shift'}</span>
                        <span class="shift-details">${this.formatDays(shift.days)} • ${this.formatTime(shift.startTime)} - ${this.formatTime(shift.endTime)}</span>
                    </div>
                    <div style="display:flex;gap:5px;">
                        <button class="edit-shift-btn secondary-btn sm-btn" data-bh="${bh.id}" data-idx="${idx}">Edit</button>
                        <button class="delete-shift-btn danger-btn sm-btn" data-bh="${bh.id}" data-idx="${idx}">✕</button>
                    </div>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="bh-header">
                    <div class="var-info" style="width:auto;margin:0;">
                        <span class="var-name">${bh.name}</span>
                        ${bh.description ? `<div class="var-desc">${bh.description}</div>` : ''}
                    </div>
                    <button class="add-shift-btn sm-btn" data-bh="${bh.id}">+ Add Shift</button>
                </div>
                <div class="bh-list">
                    ${shifts.length ? shiftsHtml : '<div style="color:#999;font-style:italic;padding:10px;">No shifts defined.</div>'}
                </div>
                <div style="text-align:right;width:100%;margin-top:10px;">
                    <button class="save-bh-btn" data-bh="${bh.id}">Save Changes</button>
                </div>
            `;
            return card;
        }

        attachEventListeners(root) {
            root.querySelectorAll('.save-var-btn').forEach(b => b.addEventListener('click', e => this.handleSaveVariable(e.target.dataset.id, e.target)));
            root.querySelectorAll('.add-shift-btn').forEach(b => b.addEventListener('click', e => this.addShift(e.target.dataset.bh)));
            root.querySelectorAll('.delete-shift-btn').forEach(b => b.addEventListener('click', e => this.deleteShift(e.target.dataset.bh, e.target.dataset.idx)));
            root.querySelectorAll('.edit-shift-btn').forEach(b => b.addEventListener('click', e => this.editShiftUI(e.target.dataset.bh, e.target.dataset.idx, e.target)));
            root.querySelectorAll('.save-bh-btn').forEach(b => b.addEventListener('click', e => this.handleSaveBusinessHours(e.target.dataset.bh, e.target)));
        }

        addShift(bhId) {
            this.editState[bhId].push({
                name: "New Shift",
                days: ["MON", "TUE", "WED", "THU", "FRI"],
                startTime: "09:00",
                endTime: "17:00"
            });
            this.render(); 
        }

        deleteShift(bhId, idx) {
            if(confirm("Are you sure you want to remove this shift?")) {
                this.editState[bhId].splice(idx, 1);
                this.render();
            }
        }

        editShiftUI(bhId, idx, btnEl) {
            const container = btnEl.closest('.shift-item');
            const shift = this.editState[bhId][idx];
            const allDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

            container.outerHTML = `
                <div class="shift-edit-container">
                    <div class="edit-row">
                        <div class="edit-group">
                            <span class="edit-label">Name</span>
                            <input type="text" class="edit-name" value="${shift.name || ''}">
                        </div>
                        <div class="edit-group">
                            <span class="edit-label">Start</span>
                            <input type="time" class="edit-start" value="${shift.startTime}">
                        </div>
                        <div class="edit-group">
                            <span class="edit-label">End</span>
                            <input type="time" class="edit-end" value="${shift.endTime}">
                        </div>
                    </div>
                    <div class="edit-group">
                        <span class="edit-label">Days Active</span>
                        <div class="day-toggles">
                            ${allDays.map(d => `
                                <div class="day-toggle ${shift.days.includes(d) ? 'selected' : ''}" data-day="${d}">${d.substring(0,1)}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:5px;">
                        <button class="confirm-edit-btn sm-btn" data-bh="${bhId}" data-idx="${idx}">Done</button>
                    </div>
                </div>
            `;

            const editBox = this.shadowRoot.querySelector('.shift-edit-container');
            
            editBox.querySelectorAll('.day-toggle').forEach(t => {
                t.addEventListener('click', (e) => {
                    e.target.classList.toggle('selected');
                });
            });

            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const newName = editBox.querySelector('.edit-name').value;
                const newStart = editBox.querySelector('.edit-start').value;
                const newEnd = editBox.querySelector('.edit-end').value;
                const newDays = Array.from(editBox.querySelectorAll('.day-toggle.selected')).map(el => el.dataset.day);

                if (!newName || newDays.length === 0) {
                    alert("Please provide a name and select at least one day.");
                    return;
                }
                if (newStart >= newEnd) {
                    alert("Start time must be before End time.");
                    return;
                }

                this.editState[bhId][idx] = {
                    name: newName,
                    startTime: newStart,
                    endTime: newEnd,
                    days: newDays
                };

                this.render(); 
            });
        }

        checkConflicts(shifts) {
            const dayMap = {}; 

            for (const s of shifts) {
                const start = parseInt(s.startTime.replace(':', ''));
                const end = parseInt(s.endTime.replace(':', ''));

                for (const d of s.days) {
                    if (!dayMap[d]) dayMap[d] = [];
                    for (const existing of dayMap[d]) {
                        if (start < existing.end && end > existing.start) {
                            return `Conflict on ${d}: "${s.name}" overlaps with "${existing.name}"`;
                        }
                    }
                    dayMap[d].push({ start, end, name: s.name });
                }
            }
            return null; 
        }

        async handleSaveBusinessHours(bhId, btnElement) {
            const originalText = btnElement.innerText;
            
            if (!bhId) {
                console.error("Save failed: Business Hour ID is missing from button.");
                this.showNotification("Error: Missing ID", "error");
                return;
            }

            btnElement.disabled = true;
            btnElement.innerText = "Checking...";

            const finalShifts = this.editState[bhId];

            const conflictError = this.checkConflicts(finalShifts);
            if (conflictError) {
                this.showNotification(`Error: ${conflictError}`, 'error');
                btnElement.disabled = false;
                btnElement.innerText = originalText;
                return;
            }

            const originalBh = this.data.businessHours.find(b => b.id === bhId);
            const payload = {
                ...originalBh,
                workingHours: finalShifts
            };

            try {
                btnElement.innerText = "Saving...";
                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours/${bhId}`;
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);
                
                originalBh.workingHours = JSON.parse(JSON.stringify(finalShifts));
                this.showNotification(`Saved "${originalBh.name}"`, 'success');

            } catch (err) {
                this.showNotification(`Save Failed: ${err.message}`, 'error');
            } finally {
                btnElement.disabled = false;
                btnElement.innerText = originalText;
            }
        }

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

        formatDays(days) {
            if (!days || days.length === 0) return 'No Days';
            if (days.length === 7) return 'Every Day';
            const map = {SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6};
            const sorted = [...days].sort((a,b) => map[a] - map[b]);
            return sorted.map(d => d.substring(0,3)).join(', ');
        }

        formatTime(t) {
            if (!t) return '';
            const [h, m] = t.split(':');
            const date = new Date();
            date.setHours(h);
            date.setMinutes(m);
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }

        showNotification(msg, type) {
            const toast = this.shadowRoot.getElementById('toast');
            toast.innerText = msg;
            toast.className = `show ${type}`;
            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 4000);
        }
    }

    if (!customElements.get('global-variable-manager')) {
        customElements.define('global-variable-manager', GlobalVariableManager);
        console.log(`Global Variable Manager ${VERSION} registered.`);
    }
})();
