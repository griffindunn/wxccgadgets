# Webex CC Gadgets
Repository for custom Webex Contact Center desktop widgets.

## How to use
In the Webex Control Hub > Contact Center > Desktop Layout:

### Supervisor Global Variables
1. Create a new layout (or edit existing Supervisor layout).
2. Add a `comp` (component) to a generic area.
3. Paste the following JSON:

```json
{
    "comp": "wxcc-gadget-loader",
    "script": "[https://griffindunn.github.io/wxccgadgets/loader.js](https://griffindunn.github.io/wxccgadgets/loader.js)",
    "attributes": {
        "gadget-name": "supervisor-global-vars"
    },
    "properties": {
        "title": "Global Variables"
    }
}