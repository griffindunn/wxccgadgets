/* FILENAME: SupervisorControls.js
   DESCRIPTION: A Webex Contact Center gadget for Supervisors.
   VERSION: v4.20-SeparatedLists (Separated Business Hours & Holiday List Management)
*/

(function() {
    const VERSION = "v4.20-SeparatedLists";
    
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
            --color-override: #f0ad4e;

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
            width: 100%; margin: 30px 0 15px; font-size: 0.8rem; font-weight: 700;
            text-transform: uppercase; color: var(--text-sub);
            border-bottom: 1px solid var(--border-color); padding-bottom: 8px; letter-spacing: 1px;
        }

        #content { display: block; padding-bottom: 40px; }
        .section-wrapper { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }

        /* --- CARD STYLING (Shared) --- */
        .var-row, .bh-card, .list-card {
            background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;
            transition: box-shadow 0.2s; flex: 0 0 auto; 
            min-width: var(--card-min-width); max-width: 100%; 
        }
        .var-row { padding: 16px; display: flex; align-items: flex-start; }
        .var-row:hover, .bh-card:hover, .list-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        
        .var-info { 
            flex: 0 0 var(--label-width); margin-right: 20px; margin-top: 8px; 
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

        /* --- BUSINESS HOURS & LISTS --- */
        .bh-card, .list-card { display: flex; flex-direction: column; margin-bottom: 20px; overflow: hidden; }
        
        .bh-header {
            background: var(--bg-header); padding: 15px 20px; border-bottom: 1px solid var(--border-light);
            display: flex; justify-content: space-between; align-items: center;
        }
        .bh-title { font-size: 1rem; font-weight: 600; color: var(--text-main); }
        .bh-content { padding: 0; }

        /* Generic Edit Areas */
        .new-item-area {
            padding: 0 20px; border-bottom: 1px solid var(--border-light);
            display: none; background-color: var(--bg-new-area);
        }
        .new-item-area.active { display: block; padding: 20px; }

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
        .new-item-area .shift-edit-box { margin-top: 0; background: var(--bg-card); }
        
        .delete-confirm-view { text-align: center; padding: 20px 0; animation: fadeIn 0.2s ease-in; }

        /* Form Elements */
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

        /* Footer Association Dropdown */
        .bh-footer-select {
            padding: 15px 20px; background: var(--bg-new-area); border-top: 1px solid var(--border-color);
            display: flex; flex-direction: column; gap: 5px;
        }
        .bh-footer-label { font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; }

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
              <div id="holidays-container" style="margin-top: 30px;"></div>
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
            this.data = { variables: [], businessHours: [], holidayLists: [] };
            this.editState = {}; 
            this.listEditState = {};
            this.hasChanges = {};
        }

        connectedCallback() {
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
            if (name === 'is-dark-mode' || name === 'dark-mode') {
                const isDark = (newValue === 'true' || newValue === 'dark' || newValue === true);
                this.setDarkTheme(isDark);
            }
            if (this.ctx.token && this.ctx.orgId && this.ctx.baseUrl) {
                this.loadAllData();
            }
        }

        setDarkTheme(enable) {
            if (enable) this.shadowRoot.host.classList.add('dark-theme');
            else this.shadowRoot.host.classList.remove('dark-theme');
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
            if(!this.data.variables.length) {
                contentDiv.innerHTML = '<div class="loading"><span>Loading Data...</span></div>';
            }

            try {
                await Promise.all([this.loadVariables(), this.loadBusinessHours(), this.loadHolidayLists()]);
                contentDiv.innerHTML = `
                    <div id="variables-container"></div>
                    <div id="bh-container" style="margin-top: 30px;"></div>
                    <div id="holidays-container" style="margin-top: 30px;"></div>
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

        async loadHolidayLists() {
            // Note: Endpoint may vary. Using standard pattern /v2/holiday-schedules
            const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/holiday-schedules?page=0&pageSize=100`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${this.ctx.token}` } });
            if (!res.ok) {
                console.warn("Holiday Lists API failed or not available");
                this.data.holidayLists = []; 
                return;
            }
            const json = await res.json();
            this.data.holidayLists = json.data || [];
            
            this.listEditState = {};
            this.data.holidayLists.forEach(l => {
                this.listEditState[l.id] = JSON.parse(JSON.stringify(l.events || [])); // 'events' is standard for holiday lists
                this.hasChanges[l.id] = false;
            });
        }

        render() {
            try { this.renderVariables(); } catch (e) { console.error("Var Render Error", e); }
            try { this.renderBusinessHours(); } catch (e) { console.error("BH Render Error", e); }
            try { this.renderHolidayLists(); } catch (e) { console.error("Holiday Render Error", e); }
        }

        // --- RENDERERS ---

        renderVariables() {
            const container = this.shadowRoot.getElementById('variables-container');
            if(!container) return; 
            container.innerHTML = ''; 

            const vars = [...this.data.variables].sort((a, b) => a.name.localeCompare(b.name));
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
                b.addEventListener('click', e => this.handleSaveVariable(e.currentTarget.dataset.id, e.currentTarget))
            );
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

        renderHolidayLists() {
            const container = this.shadowRoot.getElementById('holidays-container');
            if(!container) return;
            container.innerHTML = '';

            if (this.data.holidayLists.length > 0) {
                container.insertAdjacentHTML('beforeend', `<h3 class="category-header">Override / Holiday Lists</h3>`);
                const wrapper = document.createElement('div');
                wrapper.className = 'section-wrapper';
                
                this.data.holidayLists.forEach(list => {
                    const events = this.listEditState[list.id] || [];
                    const isDirty = this.hasChanges[list.id];
                    wrapper.appendChild(this.buildHolidayListCard(list, events, isDirty));
                });
                container.appendChild(wrapper);
            }
            this.attachHolidayListeners(container);
        }

        // --- BUILDERS ---

        buildVariableCard(v) {
            const safeName = this.escapeHtml(v.name);
            const safeVal = this.escapeHtml(v.defaultValue || '');
            let inputHtml = '';

            if ((v.variableType||'').toUpperCase() === 'BOOLEAN') {
                inputHtml = `
                   <select id="input-${v.id}" class="var-input">
                     <option value="true" ${String(v.defaultValue) === 'true' ? 'selected' : ''}>TRUE</option>
                     <option value="false" ${String(v.defaultValue) === 'false' ? 'selected' : ''}>FALSE</option>
                   </select>`;
            } else if ((v.variableType||'').toUpperCase().includes('NUMBER')) {
                inputHtml = `<input type="number" id="input-${v.id}" class="var-input" value="${safeVal}">`;
            } else {
                inputHtml = `<textarea id="input-${v.id}" class="var-input" rows="1">${safeVal}</textarea>`;
            }

            return `
                <div class="var-row">
                    <div class="var-info"><span class="var-name">${safeName}</span></div>
                    <div class="var-input-container">
                        ${inputHtml}
                        <button class="btn btn-primary save-var-btn" data-id="${v.id}">Save</button>
                    </div>
                </div>`;
        }

        buildBusinessHoursCard(bh, shifts, isDirty) {
            const card = document.createElement('div');
            card.className = 'bh-card';
            
            // Build Dropdown Options
            let optionsHtml = '<option value="">-- No Override List --</option>';
            this.data.holidayLists.forEach(l => {
                // Check if this list is currently assigned
                const isSelected = (bh.holidayScheduleId === l.id); 
                optionsHtml += `<option value="${l.id}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(l.name)}</option>`;
            });

            // Build Shifts
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const shortDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            let daysHtml = '';

            daysOfWeek.forEach((dayName, dayIndex) => {
                const dayCode = shortDays[dayIndex];
                const activeShifts = shifts
                    .map((s, idx) => ({ ...s, originalIndex: idx }))
                    .filter(s => s.days && s.days.includes(dayCode))
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                let rowsHtml = activeShifts.length === 0 ? `<div class="shift-empty">No Shifts</div>` : 
                    activeShifts.map(s => `
                        <div class="shift-row" data-bh="${bh.id}" data-idx="${s.originalIndex}">
                            <div class="shift-row-name">${this.escapeHtml(s.name)}</div>
                            <div class="shift-row-time">${this.formatTime(s.startTime)} - ${this.formatTime(s.endTime)}</div>
                        </div>`).join('');

                daysHtml += `
                    <div class="bh-day-group">
                        <div class="bh-day-name">${dayName}</div>
                        <div class="bh-day-shifts">${rowsHtml}</div>
                    </div>`;
            });

            card.innerHTML = `
                <div class="bh-header">
                    <div><div class="bh-title">${this.escapeHtml(bh.name)}</div></div>
                    <button class="btn btn-black add-shift-btn" data-bh="${bh.id}">Add Shift</button>
                </div>
                <div id="new-shift-container-${bh.id}" class="new-item-area"></div>
                <div class="bh-content">${daysHtml}</div>
                <div class="bh-footer-select">
                    <span class="bh-footer-label">Associated Override List</span>
                    <select class="var-input bh-holiday-select" data-bh="${bh.id}">${optionsHtml}</select>
                </div>
                <div class="bh-save-bar ${isDirty ? 'visible' : ''}">
                    <button class="btn btn-success save-bh-btn" data-bh="${bh.id}">Save Changes</button>
                </div>`;
            return card;
        }

        buildHolidayListCard(list, events, isDirty) {
            const card = document.createElement('div');
            card.className = 'list-card';
            
            const eventsHtml = events.length === 0 ? `<div class="bh-day-group"><div class="shift-empty">No Dates Configured</div></div>` :
                events.map((ev, idx) => `
                    <div class="shift-row" data-list="${list.id}" data-idx="${idx}">
                        <div class="shift-row-name">${this.escapeHtml(ev.name)}</div>
                        <div class="shift-row-time">${ev.startDate} to ${ev.endDate}</div>
                    </div>
                `).join('');

            card.innerHTML = `
                <div class="bh-header">
                    <div><div class="bh-title">${this.escapeHtml(list.name)}</div></div>
                    <button class="btn btn-black add-date-btn" data-list="${list.id}">Add Date</button>
                </div>
                <div id="new-date-container-${list.id}" class="new-item-area"></div>
                <div class="bh-content"><div class="bh-day-shifts" style="padding:10px;">${eventsHtml}</div></div>
                <div class="bh-save-bar ${isDirty ? 'visible' : ''}">
                    <button class="btn btn-success save-list-btn" data-list="${list.id}">Save List</button>
                </div>`;
            return card;
        }

        // --- HANDLERS (Business Hours) ---

        attachBusinessHoursListeners(root) {
            root.querySelectorAll('.add-shift-btn').forEach(b => 
                b.addEventListener('click', e => this.openAddShiftUI(e.currentTarget.dataset.bh))
            );
            root.querySelectorAll('.save-bh-btn').forEach(b => 
                b.addEventListener('click', e => this.handleSaveBusinessHours(e.currentTarget.dataset.bh, e.currentTarget))
            );
            // Detect Dropdown Changes
            root.querySelectorAll('.bh-holiday-select').forEach(s => {
                s.addEventListener('change', e => {
                    const bhId = e.currentTarget.dataset.bh;
                    this.hasChanges[bhId] = true;
                    this.renderBusinessHours();
                });
            });
            // Row Clicks
            root.querySelectorAll('.shift-row').forEach(row => {
                row.addEventListener('click', e => {
                    if(row.nextElementSibling && row.nextElementSibling.classList.contains('shift-edit-box')) return;
                    this.openEditShiftUI(e.currentTarget.dataset.bh, e.currentTarget.dataset.idx, e.currentTarget);
                });
            });
        }

        // (Reusing robust logic from v4.18 for Shift UI)
        openAddShiftUI(bhId) {
            const container = this.shadowRoot.getElementById(`new-shift-container-${bhId}`);
            if (!container) return;
            container.innerHTML = this.getShiftEditHTML({ name: "New Shift", startTime: "09:00", endTime: "17:00", days: [] }, true);
            container.classList.add('active');
            this.attachShiftEditHandlers(container, bhId, -1);
        }

        openEditShiftUI(bhId, idxString, rowEl) {
            const idx = parseInt(idxString, 10);
            const shift = this.editState[bhId][idx];
            rowEl.insertAdjacentHTML('afterend', this.getShiftEditHTML(shift, false));
            const editBox = rowEl.nextElementSibling;
            rowEl.style.display = 'none'; 
            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => { editBox.remove(); rowEl.style.display = 'grid'; }, { once: true });
            this.attachShiftEditHandlers(editBox, bhId, idx);
        }

        attachShiftEditHandlers(targetElement, bhId, idx) {
            const editBox = targetElement.classList.contains('shift-edit-box') ? targetElement : targetElement.querySelector('.shift-edit-box');
            if(!editBox) return;

            editBox.querySelectorAll('.day-pill').forEach(t => t.addEventListener('click', e => {
                e.currentTarget.classList.toggle('selected');
                e.currentTarget.innerHTML = e.currentTarget.classList.contains('selected') ? `&#10003; ${e.currentTarget.dataset.day}` : e.currentTarget.dataset.day;
            }));

            if(idx === -1) editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => { if(!targetElement.classList.contains('shift-edit-box')) targetElement.innerHTML = ''; targetElement.classList.remove('active'); });

            const delBtn = editBox.querySelector('.delete-shift-btn');
            if(delBtn) delBtn.addEventListener('click', () => { this.editState[bhId].splice(idx, 1); this.hasChanges[bhId] = true; this.renderBusinessHours(); });

            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value.trim();
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                const days = Array.from(editBox.querySelectorAll('.day-pill.selected')).map(el => el.dataset.day);
                
                if (!name || !start || !end || days.length === 0) { this.showNotification("Fill all fields", 'error'); return; }
                
                const newShift = { name, startTime: start, endTime: end, days };
                if(idx === -1) this.editState[bhId].push(newShift); else this.editState[bhId][idx] = newShift;
                this.hasChanges[bhId] = true;
                this.renderBusinessHours();
            });
        }

        getShiftEditHTML(shift, isNew) {
            const allDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const safeName = this.escapeHtml(shift.name || '');
            const delHtml = isNew ? '' : '<button class="btn btn-danger delete-shift-btn">Delete</button>';
            const pills = allDays.map(d => `<div class="day-pill ${shift.days.includes(d)?'selected':''}" data-day="${d}">${shift.days.includes(d)?'&#10003;':''} ${d}</div>`).join('');
            return `
                <div class="shift-edit-box">
                    <div class="edit-row"><div class="form-group"><span class="form-label">Name</span><input class="edit-name" value="${safeName}"></div>
                    <div class="form-group"><span class="form-label">Time</span><div style="display:flex;gap:5px;"><input type="time" class="edit-start" value="${shift.startTime}"><input type="time" class="edit-end" value="${shift.endTime}"></div></div></div>
                    <div class="form-group" style="margin-top:10px;"><span class="form-label">Days</span><div class="day-pills">${pills}</div></div>
                    <div style="display:flex;justify-content:space-between;margin-top:15px;"><div>${delHtml}</div><div style="display:flex;gap:10px;"><button class="btn btn-secondary cancel-edit-btn">Cancel</button><button class="btn btn-primary confirm-edit-btn">Done</button></div></div>
                </div>`;
        }

        // --- HANDLERS (Holiday Lists) ---

        attachHolidayListeners(root) {
            root.querySelectorAll('.add-date-btn').forEach(b => 
                b.addEventListener('click', e => this.openAddDateUI(e.currentTarget.dataset.list))
            );
            root.querySelectorAll('.save-list-btn').forEach(b => 
                b.addEventListener('click', e => this.handleSaveList(e.currentTarget.dataset.list, e.currentTarget))
            );
            root.querySelectorAll('.shift-row').forEach(row => {
                row.addEventListener('click', e => {
                    if(row.nextElementSibling && row.nextElementSibling.classList.contains('shift-edit-box')) return;
                    this.openEditDateUI(e.currentTarget.dataset.list, e.currentTarget.dataset.idx, e.currentTarget);
                });
            });
        }

        openAddDateUI(listId) {
            const container = this.shadowRoot.getElementById(`new-date-container-${listId}`);
            if (!container) return;
            const today = new Date().toISOString().split('T')[0];
            container.innerHTML = this.getDateEditHTML({ name: "New Holiday", startDate: today, endDate: today }, true);
            container.classList.add('active');
            this.attachDateEditHandlers(container, listId, -1);
        }

        openEditDateUI(listId, idxString, rowEl) {
            const idx = parseInt(idxString, 10);
            const evt = this.listEditState[listId][idx];
            rowEl.insertAdjacentHTML('afterend', this.getDateEditHTML(evt, false));
            const editBox = rowEl.nextElementSibling;
            rowEl.style.display = 'none';
            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => { editBox.remove(); rowEl.style.display = 'grid'; }, { once: true });
            this.attachDateEditHandlers(editBox, listId, idx);
        }

        attachDateEditHandlers(targetElement, listId, idx) {
            const editBox = targetElement.classList.contains('shift-edit-box') ? targetElement : targetElement.querySelector('.shift-edit-box');
            if(!editBox) return;

            if(idx === -1) editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => { if(!targetElement.classList.contains('shift-edit-box')) targetElement.innerHTML = ''; targetElement.classList.remove('active'); });

            const delBtn = editBox.querySelector('.delete-shift-btn');
            if(delBtn) delBtn.addEventListener('click', () => { this.listEditState[listId].splice(idx, 1); this.hasChanges[listId] = true; this.renderHolidayLists(); });

            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value.trim();
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                
                if (!name || !start || !end) { this.showNotification("Fill all fields", 'error'); return; }
                
                const newEvt = { name, startDate: start, endDate: end };
                if(idx === -1) this.listEditState[listId].push(newEvt); else this.listEditState[listId][idx] = newEvt;
                this.hasChanges[listId] = true;
                this.renderHolidayLists();
            });
        }

        getDateEditHTML(evt, isNew) {
            const safeName = this.escapeHtml(evt.name || '');
            const delHtml = isNew ? '' : '<button class="btn btn-danger delete-shift-btn">Delete</button>';
            return `
                <div class="shift-edit-box">
                    <div class="edit-row"><div class="form-group"><span class="form-label">Name</span><input class="edit-name" value="${safeName}"></div>
                    <div class="form-group"><span class="form-label">Date Range</span><div style="display:flex;gap:5px;"><input type="date" class="edit-start" value="${evt.startDate}"><input type="date" class="edit-end" value="${evt.endDate}"></div></div></div>
                    <div style="display:flex;justify-content:space-between;margin-top:15px;"><div>${delHtml}</div><div style="display:flex;gap:10px;"><button class="btn btn-secondary cancel-edit-btn">Cancel</button><button class="btn btn-primary confirm-edit-btn">Done</button></div></div>
                </div>`;
        }

        // --- SAVE HANDLERS ---

        async handleSaveBusinessHours(bhId, btnElement) {
            btnElement.innerText = "Saving..."; btnElement.disabled = true;
            try {
                // Find selected holiday list from dropdown
                const select = this.shadowRoot.querySelector(`.bh-holiday-select[data-bh="${bhId}"]`);
                const holidayId = select ? select.value : null;

                const originalBh = this.data.businessHours.find(b => b.id === bhId);
                const payload = { ...originalBh, workingHours: this.editState[bhId], holidayScheduleId: holidayId };

                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours/${bhId}`;
                const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                
                if(!res.ok) throw new Error("API Save Error");
                
                this.hasChanges[bhId] = false;
                this.showNotification("Saved Business Hour", "success");
                
                // Update local model so dropdown state persists
                originalBh.holidayScheduleId = holidayId;
                this.renderBusinessHours();
            } catch (e) {
                this.showNotification("Save Failed", "error");
                btnElement.innerText = "Save Changes"; btnElement.disabled = false;
            }
        }

        async handleSaveList(listId, btnElement) {
            btnElement.innerText = "Saving..."; btnElement.disabled = true;
            try {
                const originalList = this.data.holidayLists.find(l => l.id === listId);
                const payload = { ...originalList, events: this.listEditState[listId] };

                const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/holiday-schedules/${listId}`;
                const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                
                if(!res.ok) throw new Error("API Save Error");
                
                this.hasChanges[listId] = false;
                this.showNotification("Saved Holiday List", "success");
                this.renderHolidayLists();
            } catch (e) {
                this.showNotification("Save Failed", "error");
                btnElement.innerText = "Save List"; btnElement.disabled = false;
            }
        }

        // --- UTILS ---
        calculateLayoutMetrics(vars) { 
            try {
                if(!vars.length) return {labelWidth:150, cardWidth:450};
                const s=document.createElement('span'); s.style.visibility='hidden'; s.style.position='absolute'; s.style.font='600 0.95rem "CiscoSans"';
                this.shadowRoot.appendChild(s);
                let w=100; vars.forEach(v=>{ s.innerText=v.name; if(s.offsetWidth>w)w=s.offsetWidth; });
                this.shadowRoot.removeChild(s);
                return {labelWidth:w+20, cardWidth:w+360};
            } catch(e) { return {labelWidth:150, cardWidth:450}; }
        }

        formatTime(t) { if(!t) return ''; const [h,m] = t.split(':'); const hr = parseInt(h,10); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; }
        
        async handleSaveVariable(varId, btn) {
            const input = this.shadowRoot.getElementById(`input-${varId}`);
            let val = input.value;
            const original = this.data.variables.find(v=>v.id===varId);
            if(original.variableType==='BOOLEAN') val=(val==='true');
            else if(original.variableType.includes('NUMBER')) val=Number(val);
            
            try {
                await fetch(`${this.ctx.baseUrl}/organization/${this.ctx.orgId}/cad-variable/${varId}`, {
                    method: 'PUT', headers: {'Authorization':`Bearer ${this.ctx.token}`,'Content-Type':'application/json'},
                    body: JSON.stringify({...original, defaultValue:val})
                });
                this.showNotification("Saved Variable", "success");
            } catch(e) { this.showNotification("Save Failed", "error"); }
        }

        showNotification(msg, type) {
            const t = this.shadowRoot.getElementById('toast');
            t.innerText = msg; t.className = `show ${type}`;
            setTimeout(() => t.className = t.className.replace("show", ""), 4000);
        }
    }

    if (!customElements.get('supervisor-controls')) {
        customElements.define('supervisor-controls', SupervisorControls);
        console.log(`Supervisor Controls ${VERSION} registered.`);
    }
})();
