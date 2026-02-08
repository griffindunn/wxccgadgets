/* gadgets/global-vars.js */
(function() {
    // Phase 10: UX Improvements (Pre-pop, In-place Delete, Clean UI)
    const VERSION = "v3.3";
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
            const isBool = (v.variableType === 'BOOLEAN');
            const inputHtml = isBool 
                ? `<select id="input-${v.id}">
                     <option value="true" ${String(v.defaultValue) === 'true' ? 'selected' : ''}>TRUE</option>
                     <option value="false"
