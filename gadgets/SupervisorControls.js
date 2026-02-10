/* FILENAME: SupervisorControls.js
   DESCRIPTION: A Webex Contact Center gadget for Supervisors.
   VERSION: v4.15-FinalRelease (Clean UI, No Header, Auto-Sync)
*/

(function() {
    const VERSION = "v4.15-FinalRelease";
    
    // --- STYLING SECTION (CSS) ---
    const CSS_STYLES = `
        :host {
            color-scheme: light dark;
            --bg-app: #fff; --bg-card: #fff; --bg-header: #fcfcfc;
            --bg-input: #fff; --bg-shift-row: #f9f9f9; --bg-shift-row-hover: #eef9fd;
            --bg-edit-box: #f0fbff; --bg-new-area: #fafafa;
            --text-main: #333; --text-sub: #555; --text-desc: #777; --text-input: #333;
            --border-color: #dcdcdc; --border-light: #eee; --border-accent: #00bceb;
            --color-primary: #00bceb; --color-primary-hover: #00a0c6;
            --color-success: #2fb16c; --color-danger: #dc3545;

            /* DYNAMIC VARIABLES */
            --label-width: 180px;      
            --card-min-width: 450px;   

            display: block; font-family: "CiscoSans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: var(--bg-app); color: var(--text-main);
            height: 100%; overflow-y: auto; padding: 20px; box-sizing: border-box;
            transition: background-color 0.3s ease;
        }

        /* DARK MODE OVERRIDES */
        :host(.dark-theme) {
            --bg-app: #121212; --bg-card: #1e1e1e; --bg-header: #252525;
            --bg-input: #2c2c2c; --bg-shift-row: #2a2a2a; --bg-shift-row-hover: #333;
            --bg-edit-box: #2c3e50; --bg-new-area: #222;
            --text-main: #e0e0e0; --text-sub: #ccc; --text-desc: #aaa; --text-input: #fff;
            --border-color: #444; --border-light: #333;
        }

        h3.category-header {
            width: 100%; margin: 10px 0 15px; font-size: 0.8rem; font-weight: 700;
            text-transform: uppercase; color: var(--text-sub);
            border-bottom: 1px solid var(--border-color); padding-bottom: 8px; letter-spacing: 1px;
        }

        #content { display: block; padding-bottom: 40px; }
        .section-wrapper { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }

        /* --- VARIABLE CARD STYLING --- */
        .var-row {
            background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;
            padding: 16px; display: flex; align-items: flex-start; transition: box-shadow 0.2s;
            flex: 0 0 auto; 
            min-width: var(--card-min-width); 
            max-width: 100%; 
        }
        .var-row:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        
        .var-info { 
            flex: 0 0 var(--label-width); 
            margin-right: 20px; margin-top: 8px; 
            overflow-wrap: break-word; 
        }
        
        .var-name { font-weight: 600; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px; display: block; }
        .var-desc { font-size: 0.8rem; color: var(--text-desc); line-height: 1.4; }
        
        .var-input-container { display: flex; gap: 8px; align-items: flex-start; flex: 1; }
        
        .var-input, textarea.var-input, select, input[type="number"] {
            width: 100%; padding: 8px; border: 1px solid var(--border-color);
            background-color: var(--bg-input); color: var(--text-input);
            border-radius: 4px; font: inherit; min-height: 38px; box-sizing: border-box;
        }
        textarea.var-input { resize: both; min-width: 100px; }

        /* --- BUSINESS HOURS STYLES --- */
        .bh-card {
            display: flex; flex-direction: column; background: var(--bg-card);
            border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
            flex: 0 0 auto; min-width: 450px; margin-bottom: 20px;
        }
        .bh-header {
            background: var(--bg-header); padding: 15px 20px; border-bottom: 1px solid var(--border-light);
            display: flex; justify-content: space-between; align-items: center;
        }
        .bh-title { font-size: 1rem; font-weight: 600; color: var(--text-main); }
        .bh-content { padding: 0; }

        .bh-new-shift-area {
            padding: 0 20px; border-bottom: 1px solid var(--border-light);
            display: none; background-color: var(--bg-new-area);
        }
        .bh-new-shift-area.active { display: block; padding: 20px; }

        .bh-day-group { border-bottom: 1px solid var(--border-light); padding: 12px 20px; }
        .bh-day-group:last-child { border-bottom: none; }
        .bh-day-name { font-size: 0.85rem; font-weight: 700; color: var(--text-sub); margin-bottom: 8px; }
        .bh-day-shifts { display: flex; flex-direction: column; gap: 6px; }

        .shift-row {
            display: grid; grid-template-columns: 1fr 1fr; padding: 8px 12px;
            background: var(--bg-shift-row); border-radius: 4px; cursor: pointer; font-size: 0.9rem;
        }
        .shift-row:hover { background: var(--bg-shift-row-hover); }
        .shift-row-name { color: var(--color-primary); font-weight: 600; }
        .shift-row-time { color: var(--text-desc); text-align: right; }
        .shift-empty { font-size: 0.85rem; color: #999; font-style: italic; padding-left: 12px; }

        .shift-edit-box {
            background: var(--bg-edit-box); border: 1px solid var(--border-accent);
            border-radius: 6px; padding: 15px; margin-top: 8px; display: flex; flex-direction: column; gap: 12px;
        }
        .bh-new-shift-area .shift-edit-box { margin-top: 0; background: var(--bg-card); }
        
        .delete-confirm-view { text-align: center; padding: 20px 0; animation: fadeIn 0.2s ease-in; }

        .edit-row { display: flex; gap: 15px; flex-wrap: wrap; }
        .form-group { display: flex; flex-direction: column; gap: 4px; }
        .form-label { font-size: 0.7rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; }
        .edit-name, .edit-start, .edit-end {
            background: var(--bg-input); color: var(--text-input);
            border: 1px solid var(--border-color); padding: 5px; border-radius: 4px;
        }

        .day-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .day-pill {
            padding: 5px 8px; border: 1px solid var(--border-color); background: var(--bg-input);
            color: var(--text-input); border-radius: 4px; font-size: 0.75rem; cursor: pointer; user-select: none;
        }
        .day-pill:hover { background: var(--border-light); }
        .day-pill.selected { background: var(--color-primary); color: white; border-color: var(--color-primary); }

        .bh-save-bar {
            padding: 15px 20px; background: var(--bg-new-area); border-top: 1px solid var(--border-color);
            text-align: right; display: none;
        }
        .bh-save-bar.visible { display: block; animation: slideUp 0.3s ease-out; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .btn {
            padding: 0 16px; height: 36px; border: none; border-radius: 18px;
            font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s;
        }
        .btn-primary { background: var(--color-primary); color: white; }
        .btn-primary:hover { background: var(--color-primary-hover); }
        .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
        .btn-success { background: var(--color-success); color: white; }
        .btn-success:hover { opacity: 0.9; }
        .btn-black { background: #222; color: white; }
        .btn-black:hover { background: #000; }
        @media (prefers-color-scheme: dark) { .btn-black { background: #444; } .btn-black:hover { background: #555; } }
        .btn-secondary { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); }
        .btn-secondary:hover { background: var(--border-light); }
        .btn-danger { background: var(--color-danger); color: white; }
        .btn-danger:hover { opacity: 0.9; }

        .footer-version { position: fixed; bottom: 8px; left: 15px; font-size: 11px; color: var(--text-desc); pointer-events: none; }
        #toast {
            visibility: hidden; min-width: 300px; background-color: #333; color: #fff;
            text-align: center; border-radius: 6px; padding: 16px;
            position: fixed; z-index: 1000; left: 50%; bottom: 30px; transform: translateX(-50%);
            opacity: 0; transition: opacity 0.3s;
        }
        #toast.show { visibility: visible; opacity: 1; bottom: 50px; }
        #toast.success { background-color: var(--color-success); }
        #toast.error { background-color: var(--color-danger); }
        .loading { color: var(--text-desc); font-style: italic; display: flex; align-items: center; gap: 8px; }
    `;

    // --- HTML TEMPLATE ---
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${CSS_STYLES}</style>
      <div id="app">
          <div id="content">
              <div id="variables-container"></div>
              <div id="bh-container" style="margin-top: 30px;"></div>
          </div>
      </div>
      <div id="toast">Notification</div>
      <div class="footer-version">${VERSION}</div>
    `;

    class SupervisorControls extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            
            this.ctx = { token: null, orgId: null, region: null, baseUrl: null };
            this.data = { variables: [], businessHours: [] };
            this.editState = {}; 
            this.hasChanges = {};
        }

        connectedCallback() {
            // Check if attribute already exists on load (Rare race condition, but good safety)
            if (this.getAttribute('is-dark-mode') === 'true' || this.getAttribute('dark-mode') === 'true') {
                this.setDarkTheme(true);
            }
        }

        static get observedAttributes() { return ['token', 'org-id', 'data-center', 'is-dark-mode', 'dark-mode']; }

        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'token') this.ctx.token = newValue;
            if (name === 'org-id') this.ctx.orgId = newValue;
            if (name === 'data-center') {
                this.ctx.region = newValue;
                this.ctx.baseUrl = this.resolveApiUrl(newValue);
            }
            
            // --- DARK MODE SYNC ---
            if (name === 'is-dark-mode' || name === 'dark-mode') {
                const isDark = (newValue === 'true' || newValue === 'dark' || newValue === true);
                this.setDarkTheme(isDark);
            }
            
            if (this.ctx.token && this.ctx.orgId && this.ctx.baseUrl) {
                this.loadAllData();
            }
        }

        setDarkTheme(enable) {
            if (enable) {
                this.shadowRoot.host.classList.add('dark-theme');
            } else {
                this.shadowRoot.host.classList.remove('dark-theme');
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

        async loadAllData() {
            const contentDiv = this.shadowRoot.getElementById('content');
            if(!this.data.variables.length && !this.data.businessHours.length) {
                contentDiv.innerHTML = '<div class="loading"><span>Loading Data...</span></div>';
            }

            try {
                await Promise.all([this.loadVariables(), this.loadBusinessHours()]);
                contentDiv.innerHTML = `
                    <div id="variables-container"></div>
                    <div id="bh-container" style="margin-top: 30px;"></div>
                `;
                this.render();
            } catch (err) {
                console.error('[SupervisorControls] Load failed:', err);
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

        escapeHtml(str) {
            if(!str) return '';
            return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        render() {
            this.renderVariables();
            this.renderBusinessHours();
        }

        renderVariables() {
            const container = this.shadowRoot.getElementById('variables-container');
            if(!container) return; 
            container.innerHTML = ''; 

            const vars = [...this.data.variables].sort((a, b) => {
                if (a.variableType < b.variableType) return -1;
                if (a.variableType > b.variableType) return 1;
                return a.name.localeCompare(b.name);
            });

            // --- DYNAMIC LAYOUT CALCULATION ---
            const metrics = this.calculateLayoutMetrics(vars);
            this.style.setProperty('--label-width', `${metrics.labelWidth}px`);
            this.style.setProperty('--card-min-width', `${metrics.cardWidth}px`);

            let currentType = '';
            let currentWrapper = document.createElement('div');
            currentWrapper.className = 'section-wrapper';

            vars.forEach(v => {
                const type = (v.variableType || 'UNKNOWN').toUpperCase();
                if (type !== currentType) {
                    if (currentType !== '') container.appendChild(currentWrapper);
                    currentType = type;
                    container.insertAdjacentHTML('beforeend', `<h3 class="category-header">${this.escapeHtml(currentType)} Variables</h3>`);
                    currentWrapper = document.createElement('div');
                    currentWrapper.className = 'section-wrapper';
                }
                currentWrapper.insertAdjacentHTML('beforeend', this.buildVariableCard(v));
            });
            container.appendChild(currentWrapper);

            container.querySelectorAll('.save-var-btn').forEach(b => 
                b.addEventListener('click', e => this.handleSaveVariable(e.target.dataset.id, e.target))
            );
        }

        calculateLayoutMetrics(vars) {
            if (!vars || vars.length === 0) return { labelWidth: 150, cardWidth: 450 };
            
            const span = document.createElement('span');
            span.style.visibility = 'hidden';
            span.style.position = 'absolute';
            span.style.fontFamily = '"CiscoSans", "Helvetica Neue", Helvetica, Arial, sans-serif';
            span.style.fontWeight = '600';
            span.style.fontSize = '0.95rem';
            document.body.appendChild(span);

            let maxTextWidth = 100;
            vars.forEach(v => {
                span.innerText = v.name;
                const w = span.offsetWidth;
                if(w > maxTextWidth) maxTextWidth = w;
            });
            document.body.removeChild(span);

            const labelWidth = maxTextWidth + 20;
            const cardWidth = labelWidth + 250 + 70 + 40; 
            
            return { labelWidth, cardWidth };
        }

        renderBusinessHours() {
            const container = this.shadowRoot.getElementById('bh-container');
            if(!container) return;
            container.innerHTML = '';

            if (this.data.businessHours.length > 0) {
                container.insertAdjacentHTML('beforeend', `<h3 class="category-header">Business Hours</h3>`);
                const wrapper = document.createElement('div');
                wrapper.className = 'section-wrapper';
                
                this.data.businessHours.forEach(bh => {
                    const shifts = this.editState[bh.id] || [];
                    const isDirty = this.hasChanges[bh.id];
                    wrapper.appendChild(this.buildBusinessHoursCard(bh, shifts, isDirty));
                });
                container.appendChild(wrapper);
            }
            this.attachBusinessHoursListeners(container);
        }

        buildVariableCard(v) {
            const vType = (v.variableType || '').toUpperCase();
            const safeName = this.escapeHtml(v.name);
            const safeDesc = this.escapeHtml(v.description);
            const safeVal = this.escapeHtml(v.defaultValue || '');
            
            let inputHtml = '';

            if (vType === 'BOOLEAN') {
                inputHtml = `
                   <select id="input-${v.id}" class="var-input">
                     <option value="true" ${String(v.defaultValue) === 'true' ? 'selected' : ''}>TRUE</option>
                     <option value="false" ${String(v.defaultValue) === 'false' ? 'selected' : ''}>FALSE</option>
                   </select>`;
            } else if (vType === 'NUMBER' || vType === 'INTEGER') {
                inputHtml = `<input type="number" id="input-${v.id}" class="var-input" value="${safeVal}">`;
            } else {
                inputHtml = `<textarea id="input-${v.id}" class="var-input" rows="1">${safeVal}</textarea>`;
            }

            return `
                <div class="var-row">
                    <div class="var-info">
                        <span class="var-name">${safeName}</span>
                        ${v.description ? `<div class="var-desc">${safeDesc}</div>` : ''}
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
                            <div class="shift-row-name">${this.escapeHtml(s.name)}</div>
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
                        <div class="bh-title">${this.escapeHtml(bh.name)}</div>
                        ${bh.description ? `<div class="var-desc">${this.escapeHtml(bh.description)}</div>` : ''}
                    </div>
                    <button class="btn btn-black add-shift-btn" data-bh="${bh.id}">Add Shift</button>
                </div>
                <div id="new-shift-container-${bh.id}" class="bh-new-shift-area"></div>
                <div class="bh-content">${daysHtml}</div>
                <div class="bh-save-bar ${isDirty ? 'visible' : ''}">
                    <button class="btn btn-success save-bh-btn" data-bh="${bh.id}">Save Changes</button>
                </div>`;
            return card;
        }

        attachBusinessHoursListeners(root) {
            root.querySelectorAll('.add-shift-btn').forEach(b => b.addEventListener('click', e => this.openAddShiftUI(e.target.dataset.bh)));
            root.querySelectorAll('.save-bh-btn').forEach(b => b.addEventListener('click', e => this.handleSaveBusinessHours(e.target.dataset.bh, e.target)));
            root.querySelectorAll('.shift-row').forEach(row => {
                row.addEventListener('click', e => {
                    if(row.nextElementSibling && row.nextElementSibling.classList.contains('shift-edit-box')) return;
                    this.openEditShiftUI(e.currentTarget.dataset.bh, e.currentTarget.dataset.idx, e.currentTarget);
                });
            });
        }

        openAddShiftUI(bhId) {
            const container = this.shadowRoot.getElementById(`new-shift-container-${bhId}`);
            if (!container) return;

            const defaultShift = { name: "New Shift", startTime: "09:00", endTime: "17:00", days: [] };
            container.innerHTML = this.getShiftEditHTML(defaultShift, true);
            container.classList.add('active');

            this.attachShiftEditHandlers(container, bhId, -1);
        }

        openEditShiftUI(bhId, idxString, rowEl) {
            const idx = parseInt(idxString, 10);
            const shift = this.editState[bhId][idx];
            
            rowEl.insertAdjacentHTML('afterend', this.getShiftEditHTML(shift, false));
            const editBox = rowEl.nextElementSibling;
            rowEl.style.display = 'none'; 

            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                editBox.remove();
                rowEl.style.display = 'grid';
            }, { once: true });

            this.attachShiftEditHandlers(editBox, bhId, idx, rowEl);
        }

        attachShiftEditHandlers(container, bhId, idx, rowEl = null) {
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

            if(idx === -1) {
                editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                    container.innerHTML = '';
                    container.classList.remove('active');
                });
            }

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
                        </div>`;
                    editBox.insertAdjacentHTML('beforeend', confirmHtml);

                    editBox.querySelector('.cancel-del-btn').addEventListener('click', () => {
                        editBox.querySelector('.delete-confirm-view').remove();
                        normalView.style.display = 'block';
                    });

                    editBox.querySelector('.confirm-del-btn').addEventListener('click', () => {
                        this.editState[bhId].splice(idx, 1);
                        this.hasChanges[bhId] = true;
                        this.renderBusinessHours();
                    });
                });
            }

            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value.trim();
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                const days = Array.from(editBox.querySelectorAll('.day-pill.selected')).map(el => el.dataset.day);

                const validation = this.validateShift(name, start, end, days);
                if (validation) { this.showNotification(validation, 'error'); return; }

                const tempShifts = [...this.editState[bhId]];
                const otherShifts = idx === -1 ? tempShifts : tempShifts.filter((_, i) => i !== idx);

                const isDuplicate = otherShifts.some(s => (s.name || '').trim().toLowerCase() === name.toLowerCase());
                if (isDuplicate) { 
                    this.showNotification(`Error: Shift name "${name}" already exists.`, 'error'); 
                    return; 
                }

                const conflict = this.checkConflicts({ name, startTime: start, endTime: end, days }, otherShifts);
                if (conflict) { this.showNotification(conflict, 'error'); return; }

                if(idx === -1) {
                    this.editState[bhId].push({ name, startTime: start, endTime: end, days });
                } else {
                    this.editState[bhId][idx] = { name, startTime: start, endTime: end, days };
                }
                
                this.hasChanges[bhId] = true;
                this.renderBusinessHours();
            });
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
                this.renderBusinessHours();

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
            const vType = (originalVar.variableType || '').toUpperCase();
            
            if (vType === 'BOOLEAN') {
                newValue = (newValue === 'true');
            } else if (vType === 'NUMBER' || vType === 'INTEGER') {
                newValue = Number(newValue);
            }

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

        formatTime(t) {
            if (!t) return '';
            const [h, m] = t.split(':');
            const hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${m} ${ampm}`;
        }

        showNotification(msg, type) {
            const toast = this.shadowRoot.getElementById('toast');
            toast.innerText = msg;
            toast.className = `show ${type}`;
            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 4000);
        }
    }

    if (!customElements.get('supervisor-controls')) {
        customElements.define('supervisor-controls', SupervisorControls);
        console.log(`Supervisor Controls ${VERSION} registered.`);
    }
})();
