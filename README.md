WxCC Gadgets
This repository hosts a collection of custom gadgets and styles for the Webex Contact Center (WxCC) Agent Desktop. These gadgets are designed to extend the functionality of the desktop, providing supervisors and agents with custom controls and data management tools.   

The gadgets are automatically hosted via GitHub Pages for easy integration into your WxCC Desktop Layouts.   

🚀 Featured Gadgets
Global Variable Manager (Supervisor Controls)
A custom gadget that allows supervisors to manage global variables directly from the Agent Desktop. It leverages the WxCC Desktop SDK to securely interact with your organization's data.   

Component Name: global-variable-manager

Source Script:   
https://griffindunn.github.io/wxccgadgets/gadgets/global-vars.js

🛠 Installation & Configuration
To use these gadgets, you must add them to your WxCC Desktop Layout JSON via the Management Portal.   

Example Configuration
Use the following snippet to add the Supervisor Controls tab to your navigation bar and define the gadget on its own page:   

JSON
{
  "nav": {
    "label": "Supervisor Controls",
    "icon": "settings",
    "iconType": "momentum",
    "navigateTo": "SupervisorControls",
    "align": "top"
  },
  "page": {
    "id": "SupervisorControls",
    "widgets": {
        "comp1": {
            "comp": "global-variable-manager",
            "script": "https://griffindunn.github.io/wxccgadgets/gadgets/global-vars.js",
            "attributes": {
                "token": "$STORE.auth.accessToken",
                "org-id": "$STORE.agent.orgId",
                "data-center": "$STORE.app.datacenter"
            },
            "wrapper": {
                "title": "Supervisor Controls",
                "maximizeAreaName": "app-maximize-area"
            }
        }
    },
    "layout": {
      "areas": [["comp1"]],
      "size": { "cols": [1], "rows": [1] }
    }
  }
}
🔑 Desktop Store Attributes ($STORE)
The Agent Desktop provides a global $STORE object that allows gadgets to access real-time context. Below are the attributes available for mapping in your layout JSON:

Authentication ($STORE.auth)
$STORE.auth.accessToken: The bearer token used for authenticated REST API calls.
$STORE.auth.refreshToken: The token used to refresh the session access token.

Agent Context ($STORE.agent)
$STORE.agent.orgId: The unique identifier for your Webex Contact Center organization.
$STORE.agent.agentId: The unique ID of the currently logged-in agent.
$STORE.agent.agentName: The display name of the agent.
$STORE.agent.sub: The unique subject identifier (UUID) for the user.
$STORE.agent.state: The current availability status (e.g., Available, Idle).

App & Environment ($STORE.app)
$STORE.app.datacenter: The AWS region/datacenter the desktop is connected to (e.g., produs1).
$STORE.app.darkMode: Boolean indicating if the user has enabled Dark Mode.
$STORE.app.locale: The agent's language and region setting (e.g., en-US).
$STORE.app.viewMode: Indicates if the desktop is in standard view or a connector/minimized view.

Interaction Data ($STORE.agentContact)
$STORE.agentContact.taskMap: Object containing all active tasks indexed by Task ID.
$STORE.agentContact.selectedTaskId: The ID of the call or chat currently in focus.

System Notifications ($STORE.generalNotifications)
$STORE.generalNotifications.list: A list of active notifications currently displayed in the desktop's notification center.

📂 Repository Structure
/gadgets: Contains the JavaScript logic for custom components (e.g., global-vars.js).
/styles: Contains global and gadget-specific CSS files (e.g., main.css).
