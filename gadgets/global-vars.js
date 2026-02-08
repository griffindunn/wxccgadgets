/* gadgets/global-vars.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Identify where we want to display the data
    const displayArea = document.getElementById('gadget-content');

    // 2. Parse the Query Parameters (passed from the Layout JSON)
    const urlParams = new URLSearchParams(window.location.search);
    
    // 3. Extract the specific fields you requested
    // Note: These key names must match what you put in the JSON layout later
    const data = {
        token: urlParams.get('token') || 'Not Provided',
        orgId: urlParams.get('orgId') || 'Not Provided',
        region: urlParams.get('region') || 'Not Provided'
    };

    // 4. Render the data to the DOM
    let htmlContent = '<h2>Global Variables Supervisor Gadget</h2>';
    htmlContent += '<p>Connection verified. Receiving the following context:</p>';

    for (const [key, value] of Object.entries(data)) {
        htmlContent += `
            <div class="data-row">
                <span class="label">${key.toUpperCase()}</span>
                <span class="value">${value}</span>
            </div>
        `;
    }

    displayArea.innerHTML = htmlContent;
});
