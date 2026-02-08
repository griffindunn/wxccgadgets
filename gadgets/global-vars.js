/* gadgets/global-vars.js */

document.addEventListener('DOMContentLoaded', () => {
    const displayArea = document.getElementById('gadget-content');
    
    // Parse the data passed in the URL (The $STORE variables)
    const urlParams = new URLSearchParams(window.location.search);
    
    // Map the URL parameters to friendly names
    const data = {
        "Access Token": urlParams.get('token') || 'Not Found',
        "Organization ID": urlParams.get('orgId') || 'Not Found',
        "Region / Datacenter": urlParams.get('region') || 'Not Found'
    };

    let htmlContent = '<h2>WxCC Global Variables</h2>';
    
    // Check if we actually got data (length check on token is a simple validation)
    if (data["Access Token"].length < 10 && data["Access Token"] !== 'Not Found') {
         htmlContent += '<p style="color:red">Warning: Token appears invalid. Ensure $STORE vars are set in Layout JSON.</p>';
    }

    // Loop through and display
    for (const [label, value] of Object.entries(data)) {
        // Truncate the token for display purposes if it's too long
        let displayValue = value;
        if (label === "Access Token" && value.length > 50) {
            displayValue = value.substring(0, 40) + "... (truncated)";
        }

        htmlContent += `
            <div class="data-row">
                <span class="label">${label.toUpperCase()}</span>
                <span class="value" title="${value}">${displayValue}</span>
            </div>
        `;
    }

    displayArea.innerHTML = htmlContent;
});
