/* gadgets/global-vars.js */
(function() {
    // Phase 6.2: Fix 404 via API Fallback + Control Hub UI Styling
    const VERSION = "v2.9";
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
            
            this.ctx = { token: null, orgId: null, region: null, baseUrl: null };
            this.data = { variables: [], businessHours: [] };
            this.editState = {}; // Stores temp edits for Business Hours
        }

        static get observedAttributes() { return ['token', 'org-id', 'data-center']; }

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
                await Promise.all([this.loadVariables(), this.loadBusinessHours()]);
                this.render();
            } catch (err) {
                console.error('[GVM] Load failed:', err);
                contentDiv.innerHTML = `<div style="color:red">Error loading data: ${err.message}</div>`;
            }
        }

        async loadVariables() {
            const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/cad-variable?page=0&pageSize=100`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${this.ctx.token}` } });
            if (!res.ok) throw new Error(`Variables API Error ${res.status}`);
            const json = await res.json();
            this.data.variables = (json.data || []).filter(v => v.active !== false);
        }

        async loadBusinessHours() {
            const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours?page=0&pageSize=100`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${this.ctx.token}` } });
            if (!res.ok) throw new Error(`Business Hours API Error ${res.status}`);
            const json = await res.json();
            this.data.businessHours = json.data || [];
            
            // Init Edit State (Deep Copy)
            this.editState = {};
            this.data.businessHours.forEach(bh => {
                this.editState[bh.id] = JSON.parse(JSON.stringify(bh.workingHours || []));
            });
        }

        render() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '';

            // 1. Render Variables
            const vars = [...this.data.variables].sort((a, b) => {
                if (a.variableType < b.variableType) return -1;
                if (a.variableType > b.variableType) return 1;
                return a.name.localeCompare(b.name);
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

            // 2. Render Business Hours
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
            const inputHtml = isBool 
                ? `<select id="input-${v.id}">
                     <option value="true" ${String(v.defaultValue) === 'true' ? 'selected' : ''}>TRUE</option>
                     <option value="false" ${String(v.defaultValue) === 'false' ? 'selected' : ''}>FALSE</option>
                   </select>`
                : `<textarea id="input-${v.id}" class="var-input" rows="1">${v.defaultValue || ''}</textarea>`;

            return `
                <div class="var-row">
                    <div class="var-info">
                        <span class="var-name">${v.name}</span>
                        ${v.description ? `<div class="var-desc">${v.description}</div>` : ''}
                    </div>
                    <div class="var-input-container">
                        ${inputHtml}
                        <button class="btn btn-primary save-var-btn" data-id="${v.id}">Save</button>
                    </div>
                </div>`;
        }

        buildBusinessHoursCard(bh, shifts) {
            const card = document.createElement('div');
            card.className = 'bh-card';
            
            const shiftsHtml = shifts.map((shift, idx) => `
                <div class="shift-item">
                    <div class="shift-main">
                        <span class="shift-name-text">${shift.name || 'Unnamed Shift'}</span>
                        <span class="shift-details">
                            ${this.formatDays(shift.days)} • ${this.formatTime(shift.startTime)} - ${this.formatTime(shift.endTime)}
                        </span>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-secondary edit-shift-btn" data-bh="${bh.id}" data-idx="${idx}">Edit</button>
                        <button class="btn btn-danger delete-shift-btn" data-bh="${bh.id}" data-idx="${idx}">Delete</button>
                    </div>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="bh-header">
                    <div>
                        <div class="bh-title">${bh.name}</div>
                        ${bh.description ? `<div class="var-desc">${bh.description}</div>` : ''}
                    </div>
                    <button class="btn btn-primary add-shift-btn" data-bh="${bh.id}">Add Shift</button>
                </div>
                <div class="bh-content">
                    ${shifts.length ? shiftsHtml : '<div style="color:#999;font-style:italic;">No shifts defined.</div>'}
                    <div style="text-align:right; border-top:1px solid #eee; padding-top:15px;">
                        <button class="btn btn-primary save-bh-btn" data-bh="${bh.id}">Save All Changes</button>
                    </div>
                </div>`;
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
                name: "New Shift", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "09:00", endTime: "17:00"
            });
            this.render();
        }

        deleteShift(bhId, idx) {
            if(confirm("Delete this shift?")) {
                this.editState[bhId].splice(idx, 1);
                this.render();
            }
        }

        editShiftUI(bhId, idx, btnEl) {
            const container = btnEl.closest('.shift-item');
            const shift = this.editState[bhId][idx];
            const allDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

            // Inline Edit Form mimicking a modal
            container.outerHTML = `
                <div class="shift-edit-box">
                    <div class="edit-row">
                        <div class="form-group">
                            <span class="form-label">Name</span>
                            <input type="text" class="edit-name" value="${shift.name || ''}" style="width:150px;">
                        </div>
                        <div class="form-group">
                            <span class="form-label">Time Duration</span>
                            <div style="display:flex;align-items:center;gap:5px;">
                                <input type="time" class="edit-start" value="${shift.startTime}">
                                <span>to</span>
                                <input type="time" class="edit-end" value="${shift.endTime}">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <span class="form-label">Days Active</span>
                        <div class="edit-days-container">
                            ${allDays.map(d => `
                                <div class="day-pill ${shift.days.includes(d) ? 'selected' : ''}" data-day="${d}">
                                    ${shift.days.includes(d) ? '&#10003;' : ''} ${d}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:5px;">
                        <button class="btn btn-secondary cancel-edit-btn">Cancel</button>
                        <button class="btn btn-primary confirm-edit-btn">Done</button>
                    </div>
                </div>`;

            // Re-select because DOM changed
            const editBox = this.shadowRoot.querySelector('.shift-edit-box');
            
            // Toggle Days Logic
            editBox.querySelectorAll('.day-pill').forEach(t => {
                t.addEventListener('click', (e) => {
                    e.currentTarget.classList.toggle('selected');
                    // Toggle checkmark visual
                    if(e.currentTarget.classList.contains('selected')) {
                        e.currentTarget.innerHTML = `&#10003; ${e.currentTarget.dataset.day}`;
                    } else {
                        e.currentTarget.innerText = e.currentTarget.dataset.day;
                    }
                });
            });

            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => this.render());

            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value;
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                const days = Array.from(editBox.querySelectorAll('.day-pill.selected')).map(el => el.dataset.day);

                if (!name || days.length === 0) { alert("Name and at least one day required."); return; }
                if (start >= end) { alert("Start time must be before end time."); return; }

                this.editState[bhId][idx] = { name, startTime: start, endTime: end, days };
                this.render();
            });
        }

        // --- Conflict Detection ---
        checkConflicts(shifts) {
            const dayMap = {}; 
            for (const s of shifts) {
                const start = parseInt(s.startTime.replace(':', ''));
                const end = parseInt(s.endTime.replace(':', ''));
                for (const d of s.days) {
                    if (!dayMap[d]) dayMap[d] = [];
                    for (const ex of dayMap[d]) {
                        if (start < ex.end && end > ex.start) {
                            return `Conflict on ${d}: "${s.name}" overlaps with "${ex.name}"`;
                        }
                    }
                    dayMap[d].push({ start, end, name: s.name });
                }
            }
            return null; 
        }

        // --- Save Handlers (With Fallback) ---
        async handleSaveBusinessHours(bhId, btnElement) {
            const originalText = btnElement.innerText;
            btnElement.disabled = true;
            btnElement.innerText = "Checking...";

            const finalShifts = this.editState[bhId];
            const conflict = this.checkConflicts(finalShifts);
            if (conflict) {
                this.showNotification(conflict, 'error');
                btnElement.disabled = false;
                btnElement.innerText = originalText;
                return;
            }

            const originalBh = this.data.businessHours.find(b => b.id === bhId);
            const payload = { ...originalBh, workingHours: finalShifts };

            try {
                btnElement.innerText = "Saving...";
                
                // Try V2 Endpoint first
                const v2Url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours/${bhId}`;
                let res = await fetch(v2Url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // Fallback to V1 if V2 returns 404
                if (res.status === 404) {
                    console.warn('[GVM] V2 Endpoint returned 404. Retrying with legacy V1 endpoint...');
                    const v1Url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/business-hours/${bhId}`;
                    res = await fetch(v1Url, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`API Error ${res.status}: ${txt}`);
                }
                
                originalBh.workingHours = JSON.parse(JSON.stringify(finalShifts));
                this.showNotification(`Saved "${originalBh.name}" successfully`, 'success');

            } catch (err) {
                console.error(err);
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
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);
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
            if (!days || !days.length) return 'No Days';
            if (days.length === 7) return 'Every Day';
            const map = {SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6};
            return [...days].sort((a,b) => map[a] - map[b]).map(d => d.substring(0,3)).join(', ');
        }

        formatTime(t) {
            if (!t) return '';
            const [h, m] = t.split(':');
            const d = new Date(); d.setHours(h); d.setMinutes(m);
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
