export async function render(container, agentInfo) {
    // --- CONFIGURATION ---
    // CHANGE THIS if your tenant is in EU (e.g., https://api.wxcc-eu1.cisco.com/v1/global-variables)
    const API_BASE_URL = "https://api.wxcc-us1.cisco.com/v1/global-variables"; 

    // --- SECURITY CHECK ---
    if (!agentInfo.isSupervisor) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <h3>Access Denied</h3>
                <p>You do not have permission to view Global Variables. Please contact your administrator.</p>
            </div>
        `;
        return;
    }

    // --- UI TEMPLATE ---
    container.innerHTML = `
        <div class="gadget-header">
            <h2>Global Variable Manager</h2>
            <button id="refresh-btn" class="btn-secondary">Refresh</button>
        </div>
        <div id="status-message"></div>
        <div class="table-container">
            <table class="wxcc-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Value</th>
                        <th>Type</th>
                        <th style="width: 140px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="vars-table-body">
                    <tr><td colspan="4">Initializing...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const tableBody = container.querySelector('#vars-table-body');
    const statusMsg = container.querySelector('#status-message');
    const refreshBtn = container.querySelector('#refresh-btn');

    // --- HELPER FUNCTIONS ---

    const showStatus = (msg, type = 'info') => {
        statusMsg.innerHTML = `<div class="status-bar ${type}">${msg}</div>`;
        setTimeout(() => statusMsg.innerHTML = '', 4000);
    };

    // 1. Fetch Variables (GET)
    const fetchVariables = async () => {
        try {
            tableBody.innerHTML = '<tr><td colspan="4">Loading data...</td></tr>';
            
            // Construct URL with OrgId
            const url = `${API_BASE_URL}?orgId=${agentInfo.orgId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${agentInfo.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            renderTable(data); 

        } catch (error) {
            console.error("Fetch Error:", error);
            tableBody.innerHTML = `<tr><td colspan="4" class="error">
                Failed to load. <br/>
                1. Check Console for CORS/Network errors.<br/>
                2. Verify you are a Supervisor.
            </td></tr>`;
        }
    };

    // 2. Update Variable (PUT)
    const updateVariable = async (id, name, newValue, type) => {
        try {
            showStatus(`Saving ${name}...`, "info");
            
            const payload = {
                value: newValue,
                type: type 
            };

            // Construct URL with OrgId
            const url = `${API_BASE_URL}/${id}?orgId=${agentInfo.orgId}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${agentInfo.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Update Failed: ${response.status}`);
            
            showStatus("Update successful!", "success");
            fetchVariables(); // Refresh list to confirm

        } catch (error) {
            showStatus("Error updating variable.", "error");
            console.error(error);
        }
    };

    // 3. Render Table Logic
    const renderTable = (variables) => {
        tableBody.innerHTML = '';
        
        // Handle different API response structures (sometimes wrapper inside 'data')
        const list = Array.isArray(variables) ? variables : (variables.data || []);

        if (list.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No global variables found for this Org.</td></tr>';
            return;
        }

        list.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.name}</strong></td>
                <td>
                    <span class="view-mode">${v.value}</span>
                    <input type="text" class="edit-mode hidden" value="${v.value}" />
                </td>
                <td><small>${v.type}</small></td>
                <td>
                    <button class="btn-primary edit-btn">Edit</button>
                    <button class="btn-success save-btn hidden">Save</button>
                    <button class="btn-secondary cancel-btn hidden">Cancel</button>
                </td>
            `;
            
            // Interaction Logic
            const editBtn = tr.querySelector('.edit-btn');
            const saveBtn = tr.querySelector('.save-btn');
            const cancelBtn = tr.querySelector('.cancel-btn');
            const viewSpan = tr.querySelector('.view-mode');
            const editInput = tr.querySelector('.edit-mode');

            editBtn.addEventListener('click', () => {
                [viewSpan, editBtn].forEach(el => el.classList.add('hidden'));
                [editInput, saveBtn, cancelBtn].forEach(el => el.classList.remove('hidden'));
            });

            cancelBtn.addEventListener('click', () => {
                editInput.value = v.value; // Reset
                [viewSpan, editBtn].forEach(el => el.classList.remove('hidden'));
                [editInput, saveBtn, cancelBtn].forEach(el => el.classList.add('hidden'));
            });

            saveBtn.addEventListener('click', () => {
                updateVariable(v.id, v.name, editInput.value, v.type);
            });

            tableBody.appendChild(tr);
        });
    };

    // --- INIT ---
    refreshBtn.addEventListener('click', fetchVariables);
    fetchVariables();
}