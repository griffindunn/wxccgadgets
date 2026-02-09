# Supervisor Controls Gadget for Webex Contact Center

**Supervisor Controls** is a custom desktop gadget that allows Webex Contact Center supervisors to view and update **Global Variables** and **Business Hour Calendars** directly from the Supervisor Desktop.

## Features
* **Global Variables:** View, edit, and save String, Boolean, and Number variables.
* **Business Hours:** Visually manage open/close times and shifts.
* **Conflict Detection:** Automatically prevents overlapping shifts.
* **Single-File Deployment:** CSS styles are embedded within the JavaScript for easier hosting and faster loading.
* **Dark Mode Support:** Automatically adjusts to the agent's desktop theme.

## Files
* `SupervisorControls.min.js` - The only file you need to upload. (Contains both logic and styles).

## Installation Guide

### 1. Hosting
1.  Download `SupervisorControls.min.js`.
2.  Upload this file to your preferred hosting provider (GitHub Pages, AWS S3, or your internal web server).
3.  **Note the URL** (e.g., `https://your-domain.com/gadgets/SupervisorControls.min.js`).

### 2. Webex Control Hub Configuration
1.  Log in to **Webex Control Hub**.
2.  Navigate to **Contact Center** > **Desktop Layout**.
3.  Select the layout assigned to your Supervisors (or create a new one).
4.  Download the JSON layout file.
5.  Add the following widget configuration to your layout JSON (usually under the `header` or a dedicated `tab`):

```json
{
    "comp": "supervisor-controls",
    "script": "[https://your-domain.com/gadgets/SupervisorControls.min.js](https://your-domain.com/gadgets/SupervisorControls.min.js)",
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
