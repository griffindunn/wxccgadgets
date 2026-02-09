/* FILENAME: SupervisorControls.js
   DESCRIPTION: A Webex Contact Center gadget for Supervisors to manage 
                Global Variables and Business Hours (Shifts) directly from the desktop.
*/

(function() {
    // This is the version number. Useful for checking if the agent has the latest code loaded.
    const VERSION = "v4.0-Final";
    
    // --- STYLING SECTION (CSS) ---
    // This section controls the "Look and Feel" of the gadget (Colors, Spacing, Fonts).
    // It is embedded here so the gadget works instantly without needing external files.
    const CSS_STYLES = `
        :host {
            /* These "variables" define our color palette. 
               We support both Light Mode (default) and Dark Mode automatically. */
            color-scheme: light dark;
            
            /* Default Colors (Light Mode) */
            --bg-app: #fff;              /* White background */
            --bg-card: #fff;             /* Card background */
            --bg-header: #fcfcfc;        /* Header background */
            --bg-input: #fff;            /* Text box background */
            --bg-shift-row: #f9f9f9;     /* Light gray for rows */
            --bg-shift-row-hover: #eef9fd; /* Light blue when hovering */
            --bg-edit-box: #f0fbff;      /* Blue-ish box for editing */
            --bg-new-area: #fafafa;      /* Background for "Add New" area */
            
            --text-main: #333;           /* Dark gray text (easy to read) */
            --text-sub: #555;            /* Slightly lighter text */
            --text-desc: #777;           /* Gray text for descriptions */
            --text-input: #333;          /* Input text color */
            
            --border-color: #dcdcdc;     /* Light gray borders */
            --border-light: #eee;        /* Very light borders */
            --border-accent: #00bceb;    /* Cisco Blue for highlights */
            
            --color-primary: #00bceb;    /* Main Action Color (Blue) */
            --color-primary-hover: #00a0c6; /* Darker Blue (on hover) */
            --color-success: #2fb16c;    /* Green (Save/Success) */
            --color-danger: #dc3545;     /* Red (Delete/Error) */

            /* Basic Layout Settings */
            display: block;
            font-family: "CiscoSans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: var(--bg-app);
            color: var(--text-main);
            height: 100%;
            overflow-y: auto; /* Allow scrolling if the list is long */
            padding: 20px;
            box-sizing: border-box;
        }

        /* Dark Mode Overrides - The browser triggers this if the user selects "Dark Mode" */
        @media (prefers-color-scheme: dark) {
            :host {
                --bg-app: #121212;       /* Very dark background */
                --bg-card: #1e1e1e;      /* Dark gray cards */
                --bg-header: #252525;    /* Darker headers */
                --bg-input: #2c2c2c;     /* Dark inputs */
                --bg-shift-row: #2a2a2a; /* Dark rows */
                --bg-shift-row-hover: #333;
                --bg-edit-box: #2c3e50;  /* Dark Blue-gray for edit box */
                --bg-new-area: #222;
                
                --text-main: #e0e0e0;    /* Light text for dark background */
                --text-sub: #ccc;
                --text-desc: #aaa;
                --text-input: #fff;
                
                --border-color: #444;    /* Darker borders */
                --border-light: #333;
            }
        }

        /* --- UI COMPONENT STYLES --- */
        
        /* The main title at the top */
        h2 { color: var(--color-primary); margin: 0 0 25px; font-weight: 300; }
        
        /* Category Headers (e.g. "STRING Variables", "BOOLEAN Variables") */
        h3.category-header {
            width: 100%; margin: 30px 0 15px; font-size: 0.8rem; font-weight: 700;
            text-transform: uppercase; color: var(--text-sub);
            border-bottom: 1px solid var(--border-color); padding-bottom: 8px; letter-spacing: 1px;
        }

        /* Container for all the cards */
        #content { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; padding-bottom: 40px; }

        /* The Card for a Single Variable */
        .var-row {
            background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;
            padding: 16px; display: flex; align-items: flex-start; transition: box-shadow 0.2s;
            flex: 0 0 auto; min-width: 300px; /* Don't stretch too wide */
        }
        .var-row:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Slight shadow on hover */ }
        
        /* Variable Name and Description Area */
        .var-info { flex: 0 0 150px; margin-right: 20px; margin-top: 8px; }
        .var-name { font-weight: 600; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px; display: block; }
        .var-desc { font-size: 0.8rem; color: var(--text-desc); line-height: 1.4; }
        
        /* Variable Input Area (Text box + Save Button) */
        .var-input-container { display: flex; gap: 8px; align-items: flex-start; flex: 1; }
        textarea.var-input, select {
            width: 100%; padding: 8px; border: 1px solid var(--border-color);
            background-color: var(--bg-input); color: var(--text-input);
            border-radius: 4px; font: inherit; min-height: 38px; resize: both; box-sizing: border-box;
        }

        /* --- BUSINESS HOURS SECTION --- */
        
        /* The Card for Business Hours */
        .bh-card {
            display: flex; flex-direction: column; background: var(--bg-card);
            border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
            flex: 0 0 auto; min-width: 450px;
        }
        .bh-header {
            background: var(--bg-header); padding: 15px 20px; border-bottom: 1px solid var(--border-light);
            display: flex; justify-content: space-between; align-items: center;
        }
        .bh-title { font-size: 1rem; font-weight: 600; color: var(--text-main); }
        .bh-content { padding: 0; }

        /* The "Add New Shift" Area (Hidden by default) */
        .bh-new-shift-area {
            padding: 0 20px; border-bottom: 1px solid var(--border-light);
            display: none; background-color: var(--bg-new-area);
        }
        .bh-new-shift-area.active { display: block; padding: 20px; }

        /* Lists of Shifts per Day */
        .bh-day-group { border-bottom: 1px solid var(--border-light); padding: 12px 20px; }
        .bh-day-group:last-child { border-bottom: none; }
        .bh-day-name { font-size: 0.85rem; font-weight: 700; color: var(--text-sub); margin-bottom: 8px; }
        .bh-day-shifts { display: flex; flex-direction: column; gap: 6px; }

        /* Individual Shift Rows */
        .shift-row {
            display: grid; grid-template-columns: 1fr 1fr; padding: 8px 12px;
            background: var(--bg-shift-row); border-radius: 4px; cursor: pointer; font-size: 0.9rem;
        }
        .shift-row:hover { background: var(--bg-shift-row-hover); }
        .shift-row-name { color: var(--color-primary); font-weight: 600; }
        .shift-row-time { color: var(--text-desc); text-align: right; }
        .shift-empty { font-size: 0.85rem; color: #999; font-style: italic; padding-left: 12px; }

        /* The Editor Box (Appears when you click a shift) */
        .shift-edit-box {
            background: var(--bg-edit-box); border: 1px solid var(--border-accent);
            border-radius: 6px; padding: 15px; margin-top: 8px; display: flex; flex-direction: column; gap: 12px;
        }
        .bh-new-shift-area .shift-edit-box { margin-top: 0; background: var(--bg-card); }
        
        /* Confirmation Popup for Deleting */
        .delete-confirm-view { text-align: center; padding: 20px 0; animation: fadeIn 0.2s ease-in; }

        /* Form Inputs inside the Editor */
        .edit-row { display: flex; gap: 15px; flex-wrap: wrap; }
        .form-group { display: flex; flex-direction: column; gap: 4px; }
        .form-label { font-size: 0.7rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; }
        .edit-name, .edit-start, .edit-end {
            background: var(--bg-input); color: var(--text-input);
            border: 1px solid var(--border-color); padding: 5px; border-radius: 4px;
        }

        /* Day Selection "Pills" (Buttons for MON, TUE, WED...) */
        .day-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .day-pill {
            padding: 5px 8px; border: 1px solid var(--border-color); background: var(--bg-input);
            color: var(--text-input); border-radius: 4px; font-size: 0.75rem; cursor: pointer; user-select: none;
        }
        .day-pill:hover { background: var(--border-light); }
        .day-pill.selected { background: var(--color-primary); color: white; border-color: var(--color-primary); }

        /* The "Save Changes" Bar at the bottom of Business Hours */
        .bh-save-bar {
            padding: 15px 20px; background: var(--bg-new-area); border-top: 1px solid var(--border-color);
            text-align: right; display: none; /* Hidden until you make a change */
        }
        .bh-save-bar.visible { display: block; animation: slideUp 0.3s ease-out; }

        /* Animation Definitions */
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Buttons Styling */
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

        /* Footer and Notifications */
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
    // This defines the "Skeleton" of our gadget.
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${CSS_STYLES}</style>
      <div id="app">
          <h2>Supervisor Controls</h2>
          <div id="debug-info" style="font-size: 0.8em; color: var(--text-desc); margin-bottom: 10px; display: none;"></div>
          <div id="content"></div>
      </div>
      <div id="toast">Notification</div>
      <div class="footer-version">${VERSION}</div>
    `;

    // --- MAIN GADGET LOGIC ---
    class SupervisorControls extends HTMLElement {
        constructor() {
            super();
            // Create a "Shadow DOM" (keeps our styles separate from the rest of the Webex desktop)
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            
            // Initialize our internal storage (State)
            this.ctx = { token: null, orgId: null, region: null, baseUrl: null };
            this.data = { variables: [], businessHours: [] };
            this.editState = {};   // Holds temporary changes before saving
            this.hasChanges = {};  // Tracks if a user made edits to a specific section
        }

        // 1. WATCH FOR DATA FROM WEBEX
        // These are the attributes Webex injects into our gadget automatically.
        static get observedAttributes() { return ['token', 'org-id', 'data-center']; }

        // 2. WAKE UP WHEN DATA ARRIVES
        // This function runs whenever Webex sends us the Auth Token or Org ID.
        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'token') this.ctx.token = newValue;
            if (name === 'org-id') this.ctx.orgId = newValue;
            if (name === 'data-center') {
                this.ctx.region = newValue;
                this.ctx.baseUrl = this.resolveApiUrl(newValue);
            }
            // Once we have everything we need, go fetch the real data!
            if (this.ctx.token && this.ctx.orgId && this.ctx.baseUrl) {
                this.updateDebugDisplay();
                this.loadAllData();
            }
        }

        // Helper: Figure out which Cisco Server to talk to based on the region code
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

        // Helper: Show debug info (Org ID, API URL) if needed
        updateDebugDisplay() {
            const debugEl = this.shadowRoot.getElementById('debug-info');
            debugEl.innerText = `Org: ${this.ctx.orgId} | API: ${this.ctx.baseUrl}`;
        }

        // 3. FETCH DATA FROM SERVER
        // Calls both Variables API and Business Hours API
        async loadAllData() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '<div class="loading"><span>Loading Data...</span></div>';
            try {
                // Run both requests at the same time for speed
                await Promise.all([this.loadVariables(), this.loadBusinessHours()]);
                // Once data is here, draw the screen
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
            // Filter out hidden/inactive variables
            this.data.variables = (json.data || []).filter(v => v.active !== false);
        }

        async loadBusinessHours() {
            const url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours?page=0&pageSize=100`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${this.ctx.token}` } });
            if (!res.ok) throw new Error(`Business Hours API Error ${res.status}`);
            const json = await res.json();
            this.data.businessHours = json.data || [];
            
            // Prepare our edit state (a copy of the data we can mess with safely)
            this.editState = {};
            this.hasChanges = {};
            this.data.businessHours.forEach(bh => {
                this.editState[bh.id] = JSON.parse(JSON.stringify(bh.workingHours || []));
                this.hasChanges[bh.id] = false;
            });
        }

        // 4. SECURITY HELPER
        // Cleans text to prevent "Hackers" from injecting bad code (XSS prevention)
        escapeHtml(str) {
            if(!str) return '';
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // 5. RENDER (DRAW) THE SCREEN
        // This takes all our data and turns it into HTML elements
        render() {
            const contentDiv = this.shadowRoot.getElementById('content');
            contentDiv.innerHTML = '';

            // A. Draw Variables (Alphabetical Order)
            const vars = [...this.data.variables].sort((a, b) => {
                if (a.variableType < b.variableType) return -1;
                if (a.variableType > b.variableType) return 1;
                return a.name.localeCompare(b.name);
            });

            let currentType = '';
            vars.forEach(v => {
                // Create headers for STRING, BOOLEAN, etc.
                const type = (v.variableType || 'UNKNOWN').toUpperCase();
                if (type !== currentType) {
                    currentType = type;
                    contentDiv.insertAdjacentHTML('beforeend', `<h3 class="category-header">${this.escapeHtml(currentType)} Variables</h3>`);
                }
                contentDiv.insertAdjacentHTML('beforeend', this.buildVariableCard(v));
            });

            // B. Draw Business Hours
            if (this.data.businessHours.length > 0) {
                contentDiv.insertAdjacentHTML('beforeend', `<h3 class="category-header">Business Hours</h3>`);
                this.data.businessHours.forEach(bh => {
                    const shifts = this.editState[bh.id] || [];
                    const isDirty = this.hasChanges[bh.id];
                    contentDiv.appendChild(this.buildBusinessHoursCard(bh, shifts, isDirty));
                });
            }

            // Attach "Click" listeners to all the new buttons we just drew
            this.attachEventListeners(contentDiv);
        }

        // HTML Builder for a Variable Card
        buildVariableCard(v) {
            const vType = (v.variableType || '').toLowerCase();
            const isBool = (vType === 'boolean');
            const safeName = this.escapeHtml(v.name);
            const safeDesc = this.escapeHtml(v.description);
            const safeVal = this.escapeHtml(v.defaultValue || '');
            
            // If it's a Boolean, show a dropdown (True/False). Otherwise show a Text Box.
            const inputHtml = isBool 
                ? `<select id="input-${v.id}">
                     <option value="true" ${String(v.defaultValue) === 'true' ? 'selected' : ''}>TRUE</option>
                     <option value="false" ${String(v.defaultValue) === 'false' ? 'selected' : ''}>FALSE</option>
                   </select>`
                : `<textarea id="input-${v.id}" class="var-input" rows="1">${safeVal}</textarea>`;

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

        // HTML Builder for a Business Hour Card
        buildBusinessHoursCard(bh, shifts, isDirty) {
            const card = document.createElement('div');
            card.className = 'bh-card';
            
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const shortDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            
            let daysHtml = '';

            // Group shifts by Day of the Week
            daysOfWeek.forEach((dayName, dayIndex) => {
                const dayCode = shortDays[dayIndex];
                
                // Find shifts active on this specific day
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

            // Build the main card HTML
            card.innerHTML = `
                <div class="bh-header">
                    <div>
                        <div class="bh-title">${this.escapeHtml(bh.name)}</div>
                        ${bh.description ? `<div class="var-desc">${this.escapeHtml(bh.description)}</div>` : ''}
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

        // 6. ATTACH EVENTS (Make Buttons Work)
        attachEventListeners(root) {
            // Variable Save Buttons
            root.querySelectorAll('.save-var-btn').forEach(b => b.addEventListener('click', e => this.handleSaveVariable(e.target.dataset.id, e.target)));
            // Add Shift Buttons
            root.querySelectorAll('.add-shift-btn').forEach(b => b.addEventListener('click', e => this.openAddShiftUI(e.target.dataset.bh)));
            // Save Business Hours Buttons
            root.querySelectorAll('.save-bh-btn').forEach(b => b.addEventListener('click', e => this.handleSaveBusinessHours(e.target.dataset.bh, e.target)));
            
            // Clicking a Shift Row to Edit it
            root.querySelectorAll('.shift-row').forEach(row => {
                row.addEventListener('click', e => {
                    // Prevent opening if already open
                    if(row.nextElementSibling && row.nextElementSibling.classList.contains('shift-edit-box')) return;
                    this.openEditShiftUI(e.currentTarget.dataset.bh, e.currentTarget.dataset.idx, e.currentTarget);
                });
            });
        }

        // --- UI LOGIC: OPEN "ADD SHIFT" FORM ---
        openAddShiftUI(bhId) {
            const container = this.shadowRoot.getElementById(`new-shift-container-${bhId}`);
            if (!container) return;

            const defaultShift = { 
                name: "New Shift", 
                startTime: "09:00", 
                endTime: "17:00", 
                days: [] 
            };
            
            // Draw the form inside the container
            container.innerHTML = this.getShiftEditHTML(defaultShift, true);
            container.classList.add('active');

            // Attach handlers (Cancel, Save) to this specific form
            this.attachShiftEditHandlers(container, bhId, -1);
        }

        // --- UI LOGIC: OPEN "EDIT SHIFT" FORM ---
        openEditShiftUI(bhId, idx, rowEl) {
            const shift = this.editState[bhId][idx];
            
            // Inject the form directly below the clicked row
            rowEl.insertAdjacentHTML('afterend', this.getShiftEditHTML(shift, false));
            const editBox = rowEl.nextElementSibling;
            rowEl.style.display = 'none'; // Hide the original row while editing

            // Specific "Cancel" logic for edit mode (restore the row)
            editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                editBox.remove();
                rowEl.style.display = 'grid';
            }, { once: true });

            this.attachShiftEditHandlers(editBox, bhId, idx, rowEl);
        }

        // --- LOGIC: HANDLE FORM BUTTONS (SHARED) ---
        attachShiftEditHandlers(container, bhId, idx, rowEl = null) {
            const editBox = container.querySelector('.shift-edit-box');

            // Toggle Days (Blue Pill Buttons)
            editBox.querySelectorAll('.day-pill').forEach(t => {
                t.addEventListener('click', (e) => {
                    e.currentTarget.classList.toggle('selected');
                    // Add checkmark if selected
                    if(e.currentTarget.classList.contains('selected')) {
                        e.currentTarget.innerHTML = `&#10003; ${e.currentTarget.dataset.day}`;
                    } else {
                        e.currentTarget.innerText = e.currentTarget.dataset.day;
                    }
                });
            });

            // Cancel Logic (For Add Mode)
            if(idx === -1) {
                editBox.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                    container.innerHTML = '';
                    container.classList.remove('active');
                });
            }

            // Delete Logic (Show confirmation popup)
            const deleteBtn = editBox.querySelector('.delete-shift-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    // Hide the form, show the "Are you sure?" message
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

                    // Cancel Delete
                    editBox.querySelector('.cancel-del-btn').addEventListener('click', () => {
                        editBox.querySelector('.delete-confirm-view').remove();
                        normalView.style.display = 'block';
                    });

                    // Confirm Delete
                    editBox.querySelector('.confirm-del-btn').addEventListener('click', () => {
                        this.editState[bhId].splice(idx, 1); // Remove from list
                        this.hasChanges[bhId] = true;
                        this.render(); // Redraw screen
                    });
                });
            }

            // Done Button (Validate and Commit Change to Memory)
            editBox.querySelector('.confirm-edit-btn').addEventListener('click', () => {
                const name = editBox.querySelector('.edit-name').value;
                const start = editBox.querySelector('.edit-start').value;
                const end = editBox.querySelector('.edit-end').value;
                const days = Array.from(editBox.querySelectorAll('.day-pill.selected')).map(el => el.dataset.day);

                // 1. Basic Validation
                const validation = this.validateShift(name, start, end, days);
                if (validation) { this.showNotification(validation, 'error'); return; }

                // 2. Conflict Check (Don't allow overlapping times on the same day)
                const tempShifts = [...this.editState[bhId]];
                const otherShifts = idx === -1 ? tempShifts : tempShifts.filter((_, i) => i != idx);
                
                const conflict = this.checkConflicts({ name, startTime: start, endTime: end, days }, otherShifts);
                if (conflict) { this.showNotification(conflict, 'error'); return; }

                // 3. Save to Local State
                if(idx === -1) {
                    this.editState[bhId].push({ name, startTime: start, endTime: end, days });
                } else {
                    this.editState[bhId][idx] = { name, startTime: start, endTime: end, days };
                }
                
                this.hasChanges[bhId] = true; // Mark as "Dirty" (Needs Saving)
                this.render(); // Redraw
            });
        }

        // HTML for the Edit Form
        getShiftEditHTML(shift, isNew) {
            const allDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const safeName = this.escapeHtml(shift.name || '');
            
            // Only show "Delete" if it's an existing shift
            const deleteBtnHtml = isNew 
                ? '<div></div>' 
                : '<button class="btn btn-danger delete-shift-btn">Delete Shift</button>';

            return `
                <div class="shift-edit-box">
                    <div class="edit-normal-view">
                        <div class="edit-row">
                            <div class="form-group">
                                <span class="form-label">Name</span>
                                <input type="text" class="edit-name" value="${safeName}" style="width:180px;">
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

        // Ensure user filled out the form correctly
        validateShift(name, start, end, days) {
            if (!name) return "Name is required.";
            if (days.length === 0) return "Select at least one day.";
            if (!start || !end) return "Start and End times required.";
            if (start >= end) return "Start time must be before End time.";
            return null;
        }

        // Check if Shift A overlaps with Shift B
        checkConflicts(candidate, existingShifts) {
            // Convert "09:30" to integer 930 for easy math comparison
            const cStart = parseInt(candidate.startTime.replace(':', ''));
            const cEnd = parseInt(candidate.endTime.replace(':', ''));

            for (const day of candidate.days) {
                // Find other shifts on the same day
                const dayShifts = existingShifts.filter(s => s.days.includes(day));
                for (const existing of dayShifts) {
                    const eStart = parseInt(existing.startTime.replace(':', ''));
                    const eEnd = parseInt(existing.endTime.replace(':', ''));
                    // Overlap Logic: (StartA < EndB) and (EndA > StartB)
                    if (cStart < eEnd && cEnd > eStart) {
                        return `Overlap detected on ${day} with "${existing.name}"`;
                    }
                }
            }
            return null; 
        }

        // 7. SAVE TO SERVER (API CALLS)
        async handleSaveBusinessHours(bhId, btnElement) {
            const originalText = btnElement.innerText;
            btnElement.disabled = true;
            btnElement.innerText = "Saving...";

            const finalShifts = this.editState[bhId];
            const originalBh = this.data.businessHours.find(b => b.id === bhId);
            const payload = { ...originalBh, workingHours: finalShifts };

            try {
                // Try V2 API first
                const v2Url = `${this.ctx.baseUrl}/organization/${this.ctx.orgId}/v2/business-hours/${bhId}`;
                let res = await fetch(v2Url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.ctx.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // If V2 fails with 404 (Not Found), try V1 API
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
                
                // Success! Update data and UI.
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
            // Ensure Boolean is actual true/false, not string "true"
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

        // Helper: Convert array of days to readable string
        formatDays(days) {
            if (!days || !days.length) return 'No Days';
            if (days.length === 7) return 'Every Day';
            const map = {SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6};
            return [...days].sort((a,b) => map[a] - map[b]).map(d => d.substring(0,3)).join(', ');
        }

        // Helper: Convert "13:00" to "1:00 PM"
        formatTime(t) {
            if (!t) return '';
            const [h, m] = t.split(':');
            const hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${m} ${ampm}`;
        }

        // Helper: Show the black pop-up notification at bottom of screen
        showNotification(msg, type) {
            const toast = this.shadowRoot.getElementById('toast');
            toast.innerText = msg;
            toast.className = `show ${type}`;
            // Auto-hide after 4 seconds
            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 4000);
        }
    }

    // 8. REGISTER THE GADGET
    // This tells the browser: "When you see <supervisor-controls>, use this class."
    if (!customElements.get('supervisor-controls')) {
        customElements.define('supervisor-controls', SupervisorControls);
        console.log(`Supervisor Controls ${VERSION} registered.`);
    }
})();
