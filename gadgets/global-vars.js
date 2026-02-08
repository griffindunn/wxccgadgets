/* gadgets/global-vars.js */
(function() {
    // Phase 15: Fix Resize Constraint & Robust Dark Mode
    const VERSION = "v3.8";
    console.log(`Global Variable Manager ${VERSION} loading...`);

    const template = document.createElement('template');
    template.innerHTML = `
      <style>@import url('https://griffindunn.github.io/wxccgadgets/styles/main.css');</style>
      <div id="app">
          <h2>Supervisor Controls</h2>
          <div id="debug-info" style="font-size: 0.8em; color: var(--text-desc); margin-bottom: 10px; display: none;"></div>
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
            this.editState = {}; 
            this.hasChanges = {};
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
                contentDiv.innerHTML = `<div style="color:var(--color-danger)">Error loading data: ${err.message}</div>`;
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
            
            this.editState = {};
            this.hasChanges = {};
            this.data.businessHours.forEach(bh => {
                this.editState[bh.id] = JSON.parse(JSON.stringify(bh.workingHours || []));
                this.hasChanges[bh.id] = false;
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
                    const isDirty = this.hasChanges[bh.id];
                    contentDiv.appendChild(this.buildBusinessHoursCard(bh, shifts, isDirty));
                });
            }

            this.attachEventListeners(contentDiv);
        }

        buildVariableCard(v) {
            const vType = (v.variableType || '').toLowerCase();
            const isBool = (vType === 'boolean');
            
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

        buildBusinessHoursCard(bh, shifts, isDirty) {
            const card = document.createElement('div');
            card.className = 'bh-card';
            
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const shortDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            
            let daysHtml = '';

            daysOfWeek.forEach((dayName, dayIndex) => {
                const dayCode = shortDays[dayIndex];
                
                const activeShifts = shifts
                    .map((s, idx) => ({ ...s, originalIndex: idx }))
                    .filter(s => s.days && s.days.includes(dayCode))
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                let rowsHtml = '';
                if (activeShifts.length === 0) {
                    rowsHtml = `<div class="shift-empty">No Shifts</div>`;
                } else {
                    rowsHtml = activeShifts.map(s => `
                        <div class="shift-row" data-bh="${bh.id}" data-idx="${s.originalIndex}">
                            <div class="shift-row-name">${s.name}</div>
                            <div class="shift-row-time">${this.formatTime(s.startTime)} - ${this.formatTime(s.endTime)}</div>
                        </div>
                    `).join('');
                }

                daysHtml += `
                    <div class="bh-day-group">
                        <div class="bh-day-name">${dayName}</div>
                        <div class="bh-day-shifts">${rowsHtml}</div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="bh-header">
                    <div>
                        <div class="bh-title">${bh.name}</div>
                        ${bh.description ? `<div class="var-desc">${bh.description}</div>` : ''}
                    </div>
                    <button class="btn btn-black add-shift-btn" data-bh="${bh.id}">Add Shift</button>
                </div>
                <div id="new-shift-container-${bh.id}" class="bh-new-shift-area"></div>
                <div class="bh-content">
                    ${daysHtml}
                </div>
                <div class="bh-save-bar ${isDirty ? 'visible' : ''}">
                    <button class="btn btn-success save-bh-btn" data-bh="${bh.id}">Save Changes</button>
                </div>`;
            return card;
        }

        attachEventListeners(root) {
            root.querySelectorAll('.save-var-btn').forEach(b => b.addEventListener('click', e => this.handleSaveVariable(e.target.dataset.id, e.target)));
            root.querySelectorAll('.add-shift-btn').forEach(b => b.addEventListener('click', e => this.openAddShiftUI(e.target.dataset.bh)));
            root.querySelectorAll('.save-bh-btn').forEach(b => b.addEventListener('click', e => this.handleSaveBusinessHours(e.target.dataset.bh, e.target)));
            
            root.querySelectorAll('.shift-row').forEach(row => {
                row.addEventListener('click', e => {
                    if(row.nextElementSibling && row.nextElementSibling.classList.contains('shift-edit-box')) return;
                    this.openEditShiftUI(e.currentTarget.dataset.bh, e.currentTarget.dataset.idx, e.currentTarget);
                });
            });
        }

        // --- Add Shift UI ---
        openAddShiftUI(bhId) {
            const container = this.shadowRoot.getElementById(`new-shift-container-${bhId}`);
            if (!container) return;

            const defaultShift = { 
                name: "New Shift", 
                startTime: "09:00", 
                endTime: "17:00", 
                days: [] 
            };
            
            // Render Edit Form
            container.innerHTML = this.getShiftEditHTML(defaultShift, true);
            container.classList.add('active');

            // --- Handlers ---
            const editBox = container.querySelector('.shift-edit-box');

            editBox.querySelectorAll('.day-pill').forEach(t => {
                t.addEventListener('click', (e) => {
                    e.currentTarget.classList.toggle('selected');
                    if(e.currentTarget.classList.contains('selected')) {
                        e.currentTarget.innerHTML = `&#10003; ${e.currentTarget.dataset.day}`;
                    } else {
                        e.currentTarget.innerText = e.currentTarget.dataset.day;
                    }
                });
            });

            // Cancel
            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                container.innerHTML = '';
                container.classList.remove('active');
            });

            // Confirm
            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value;
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                const days = Array.from(editBox.querySelectorAll('.day-pill.selected')).map(el => el.dataset.day);

                const validation = this.validateShift(name, start, end, days);
                if (validation) { this.showNotification(validation, 'error'); return; }

                const conflict = this.checkConflicts({ name, startTime: start, endTime: end, days }, this.editState[bhId]);
                if (conflict) { this.showNotification(conflict, 'error'); return; }

                this.editState[bhId].push({ name, startTime: start, endTime: end, days });
                this.hasChanges[bhId] = true;
                this.render();
            });
        }

        // --- Edit Existing Shift UI ---
        openEditShiftUI(bhId, idx, rowEl) {
            const shift = this.editState[bhId][idx];
            
            // Insert after row
            rowEl.insertAdjacentHTML('afterend', this.getShiftEditHTML(shift, false));
            const editBox = rowEl.nextElementSibling;
            rowEl.style.display = 'none'; // Hide row

            // Handlers
            editBox.querySelectorAll('.day-pill').forEach(t => {
                t.addEventListener('click', (e) => {
                    e.currentTarget.classList.toggle('selected');
                    if(e.currentTarget.classList.contains('selected')) {
                        e.currentTarget.innerHTML = `&#10003; ${e.currentTarget.dataset.day}`;
                    } else {
                        e.currentTarget.innerText = e.currentTarget.dataset.day;
                    }
                });
            });

            // Cancel
            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                editBox.remove();
                rowEl.style.display = 'grid';
            });

            // Delete
            const deleteBtn = editBox.querySelector('.delete-shift-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    const normalView = editBox.querySelector('.edit-normal-view');
                    normalView.style.display = 'none';

                    const confirmHtml = `
                        <div class="delete-confirm-view">
                            <div style="margin-bottom: 15px; font-weight:600; color: var(--text-main);">Are you sure you want to delete this shift?</div>
                            <div style="display:flex; justify-content:center; gap:10px;">
                                <button class="btn btn-secondary cancel-del-btn">No, Keep it</button>
                                <button class="btn btn-danger confirm-del-btn">Yes, Delete</button>
                            </div>
                        </div>
                    `;
                    editBox.insertAdjacentHTML('beforeend', confirmHtml);

                    editBox.querySelector('.cancel-del-btn').addEventListener('click', () => {
                        editBox.querySelector('.delete-confirm-view').remove();
                        normalView.style.display = 'block';
                    });

                    editBox.querySelector('.confirm-del-btn').addEventListener('click', () => {
                        this.editState[bhId].splice(idx, 1);
                        this.hasChanges[bhId] = true;
                        this.render();
                    });
                });
            }

            // Confirm
            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value;
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                const days = Array.from(editBox.querySelectorAll('.day-pill.selected')).map(el => el.dataset.day);

                const validation = this.validateShift(name, start, end, days);
                if (validation) { this.showNotification(validation, 'error'); return; }

                const tempShifts = [...this.editState[bhId]];
                const otherShifts = tempShifts.filter((_, i) => i != idx);
                
                const conflict = this.checkConflicts({ name, startTime: start, endTime: end, days }, otherShifts);
                if (conflict) { this.showNotification(conflict, 'error'); return; }

                this.editState[bhId][idx] = { name, startTime: start, endTime: end, days };
                this.hasChanges[bhId] = true;
                this.render();
            });
        }

        getShiftEditHTML(shift, isNew) {
            const allDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            
            const deleteBtnHtml = isNew 
                ? '<div></div>' 
                : '<button class="btn btn-danger delete-shift-btn">Delete Shift</button>';

            return `
                <div class="shift-edit-box">
                    <div class="edit-normal-view">
                        <div class="edit-row">
                            <div class="form-group">
                                <span class="form-label">Name</span>
                                <input type="text" class="edit-name" value="${shift.name || ''}" style="width:180px;">
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
                        <div class="form-group" style="margin-top: 10px;">
                            <span class="form-label">Days Active</span>
                            <div class="day-pills">
                                ${allDays.map(d => `
                                    <div class="day-pill ${shift.days.includes(d) ? 'selected' : ''}" data-day="${d}">
                                        ${shift.days.includes(d) ? '&#10003;' : ''} ${d}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:15px; border-top: 1px solid var(--border-light); padding-top: 10px;">
                            ${deleteBtnHtml}
                            <div style="display:flex; gap:10px;">
                                <button class="btn btn-secondary cancel-edit-btn">Cancel</button>
                                <button class="btn btn-primary confirm-edit-btn">Done</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        validateShift(name, start, end, days) {
            if (!name) return "Name is required.";
            if (days.length === 0) return "Select at least one day.";
            if (!start || !end) return "Start and End times required.";
            if (start >= end) return "Start time must be before End time.";
            return null;
        }

        checkConflicts(candidate, existingShifts) {
            const cStart = parseInt(candidate.startTime.replace(':', ''));
            const cEnd = parseInt(candidate.endTime.replace(':', ''));

            for (const day of candidate.days) {
                const dayShifts = existingShifts.filter(s => s.days.includes(day));
                for (const existing of dayShifts) {
                    const eStart = parseInt(existing.startTime.replace(':', ''));
                    const eEnd = parseInt(existing.endTime.replace(':', ''));
                    if (cStart < eEnd && cEnd > eStart) {
                        return `Overlap detected on ${day} with "${existing.name}"`;
                    }
                }
            }
            return null; 
        }

        async handleSaveBusinessHours(bhId, btnElement) {
            const originalText = btnElement.innerText;
            btnElement.disabled = true;
            btnElement.innerText = "Saving...";

            const finalShifts = this.editState[bhId];
            const originalBh = this.data.businessHours.find(b => b.id === bhId);
            const payload = { ...originalBh, workingHours: finalShifts };

            try {
                const v2Url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours/${bhId}`;
                let res = await fetch(v2Url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.status === 404) {
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
                this.hasChanges[bhId] = false;
                this.showNotification(`Saved "${originalBh.name}"`, 'success');
                this.render(); 

            } catch (err) {
                this.showNotification(`Save Failed: ${err.message}`, 'error');
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
            const vType = (originalVar.variableType || '').toLowerCase();
            if (vType === 'boolean') newValue = (newValue === 'true'); 

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
