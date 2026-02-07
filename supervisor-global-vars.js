/**
 * Supervisor Global Variables Gadget
 * Strategy: Store Injection (No SDK)
 */
(function() {
    // ------------------------------------------------
    // CONFIGURATION
    // ------------------------------------------------
    // Set your API region base URL here if not passed in attributes
    const DEFAULT_REGION = "us1"; 

    // Template for Shadow DOM
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host { 
            display: block; 
            font-family: "CiscoSans", "Inter", sans-serif; 
            background: #fff;
            height: 100%;
            overflow: auto; 
            padding: 1rem;
            box-sizing: border-box;
        }
        .header { margin-bottom: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; }
        h2 { margin: 0; font-size: 1.25rem; color: #121212; }
        .status-bar { font-size: 0.85rem; color: #666; margin-top: 5px; }
        
        /* Table Styles */
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e5e5; font-size: 0.85rem; color: #555; }
        td { padding: 10px 8px; border-bottom: 1px solid #f2f2f2; vertical-align: middle; }
        
        /* Input & Button Styles */
        input[type="text"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 0.9rem;
            box-sizing: border-box;
        }
        button {
            padding: 6px 16px;
            border: none;
            border-radius: 16px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: background 0.2s;
            font-weight: 500;
        }
        .btn-save { background-color: #007AA3; color: white; }
        .btn-save:hover { background-color: #005E7D; }
        .btn-save:disabled { background-color: #ccc; cursor: not-allowed; }

        .loading { color: #007AA3; font-weight: bold; padding: 20px; text-align: center; }
        .error { color: #d63d3d; background: #fff5f5; padding: 10px; border-radius: 4px; border: 1px solid #fc8181; }
      </style>

      <div class="header">
          <h2 id="title">Global Variables</h2>
          <div class="status-bar">
            Status: <span id="status-text">Initializing...</span>
          </div>
      </div>
      
      <div id="content-area"></div>
    `;
  
    class SupervisorGlobalVars extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
        
        // State
        this.token = null;
        this.orgId = null;
        this.region = DEFAULT_REGION;
        this.variables = [];
      }
  
      /**
       * 1. Listen for attributes injected by the Desktop ($STORE)
       */
      static get observedAttributes() {
        return ['token', 'org-id', 'region'];
      }
  
      /**
       * 2. Handle attribute updates (e.g. on load or token refresh)
       */
      attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        // Clean up the value (remove $STORE placeholders if they failed to resolve)
        const val = (newValue && !newValue.startsWith('$')) ? newValue : null;

        if (name === 'token') this.token = val;
        if (name === 'org-id') this.orgId = val;
        if (name === 'region') this.region = val || DEFAULT_REGION;
        
        this.attemptLoad();
      }
  
      connectedCallback() {
        // Also check attributes on initial load
        this.token = this.getAttribute('token');
        this.orgId = this.getAttribute('org-id');
        this.region = this.getAttribute('region') || DEFAULT_REGION;
        
        // Handle $STORE placeholders explicitly
        if (this.token && this.token.startsWith('$')) this.token = null;
        if (this.orgId && this.orgId.startsWith('$')) this.orgId = null;

        this.attemptLoad();
      }

      /**
       * 3. Fetch Data if we have what we need
       */
      attemptLoad() {
          const statusEl = this.shadowRoot.getElementById('status-text');
          
          if (!this.token || !this.orgId) {
              statusEl.textContent = "Waiting for Desktop Token...";
              return;
          }

          statusEl.textContent = "Authenticated. Fetching data...";
          this.fetchVariables();
      }
  
      /**
       * 4. API Logic (Standard Fetch)
       */
      async fetchVariables() {
        const content = this.shadowRoot.getElementById('content-area');
        content.innerHTML = '<div class="loading">Loading variables from Webex...</div>';
        
        // Construct URL based on Region
        const baseUrl = `https://api.wxcc-${this.region}.cisco.com`;

        try {
          const response = await fetch(`${baseUrl}/v1/global-variables?page=0&pageSize=100`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) {
              if(response.status === 401) throw new Error("Token Expired or Invalid");
              if(response.status === 403) throw new Error("Permission Denied (Check User Profile)");
              throw new Error(`API Error: ${response.status}`);
          }

          const json = await response.json();
          // API returns { data: [...] } or just [...]
          this.variables = Array.isArray(json) ? json : (json.data || []);
          
          this.renderList();
          this.shadowRoot.getElementById('status-text').textContent = "Ready";

        } catch (err) {
          console.error("Gadget Error:", err);
          content.innerHTML = `<div class="error"><strong>Error loading data:</strong><br>${err.message}</div>`;
          this.shadowRoot.getElementById('status-text').textContent = "Error";
        }
      }
      
      /**
       * 5. Save Logic
       */
      async saveVariable(id, name, type, newValue, btn) {
          const originalText = btn.textContent;
          btn.textContent = "Saving...";
          btn.disabled = true;
          
          const baseUrl = `https://api.wxcc-${this.region}.cisco.com`;
          
          try {
              const payload = {
                  name: name,
                  value: newValue,
                  type: type 
              };

              const response = await fetch(`${baseUrl}/v1/global-variables/${id}`, {
                  method: 'PUT',
                  headers: {
                      'Authorization': `Bearer ${this.token}`,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) throw new Error("Save failed");

              btn.textContent = "Saved!";
              btn.style.backgroundColor = "#2fb16d"; // Success Green
              setTimeout(() => {
                  btn.textContent = originalText;
                  btn.disabled = false;
                  btn.style.backgroundColor = ""; 
              }, 2000);

          } catch (err) {
              alert("Failed to save: " + err.message);
              btn.textContent = "Retry";
              btn.disabled = false;
          }
      }

      /**
       * 6. Render UI
       */
      renderList() {
        const content = this.shadowRoot.getElementById('content-area');
        
        if (this.variables.length === 0) {
            content.innerHTML = '<p style="padding:10px">No global variables found.</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width:35%">Name</th>
                    <th style="width:45%">Value</th>
                    <th style="width:20%">Action</th>
                </tr>
            </thead>
            <tbody id="var-list-body"></tbody>
        `;

        const tbody = table.querySelector('tbody');

        this.variables.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.name}</strong></td>
                <td>
                    <input type="text" id="input-${v.id}" value="${v.value || ''}" />
                </td>
                <td>
                    <button class="btn-save" id="btn-${v.id}">Update</button>
                </td>
            `;
            
            // Attach Event Listener
            const btn = tr.querySelector(`#btn-${v.id}`);
            const input = tr.querySelector(`#input-${v.id}`);
            
            btn.addEventListener('click', () => {
                this.saveVariable(v.id, v.name, v.type, input.value, btn);
            });

            tbody.appendChild(tr);
        });

        content.innerHTML = '';
        content.appendChild(table);
      }
    }
  
    if (!customElements.get('supervisor-global-vars')) {
      customElements.define('supervisor-global-vars', SupervisorGlobalVars);
    }
  })();
