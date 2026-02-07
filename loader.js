import { Desktop } from "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk@latest/dist/index.js";

class WxCCGadgetLoader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.gadgetName = "default-gadget";
    this.agentInfo = null;
  }

  async connectedCallback() {
    // 1. Read Configuration from Desktop Layout JSON attributes
    this.gadgetName = this.getAttribute("gadget-name");
    
    // 2. Initialize Webex Desktop SDK
    try {
      await Desktop.config.init();
      
      // 3. Extract all necessary details including OrgID
      this.agentInfo = {
        agentId: Desktop.agentContact.getAgentId(),
        teamId: Desktop.agentContact.getTeamId(),
        orgId: Desktop.agentContact.getOrgId(), 
        accessToken: await Desktop.actions.getAccessToken(),
        isSupervisor: Desktop.agentStateInfo.isSupervisor()
      };
      
      console.log(`[WxCC Loader] Loaded. User: ${this.agentInfo.agentId} | Supervisor: ${this.agentInfo.isSupervisor}`);
      
      // 4. Load the specific gadget logic
      this.loadGadget(this.gadgetName);
      
    } catch (error) {
      console.error("[WxCC Loader] SDK Init Failed:", error);
      this.shadowRoot.innerHTML = `<div style="color:red; padding:10px;">
        <strong>Error:</strong> Could not initialize Webex SDK. <br/>
        Check console for details.
      </div>`;
    }
  }

  async loadGadget(name) {
    const container = document.createElement('div');
    container.id = 'gadget-container';
    
    // Inject standard CSS
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = 'https://griffindunn.github.io/wxccgadgets/styles/main.css';
    
    this.shadowRoot.appendChild(styleLink);
    this.shadowRoot.appendChild(container);

    try {
      // Dynamic Import: Loads the specific JS file for the requested gadget
      const module = await import(`./gadgets/${name}.js`);
      
      if (module.render) {
        module.render(container, this.agentInfo);
      } else {
        container.innerHTML = `<p>Error: Gadget '${name}' loaded, but 'render' function is missing.</p>`;
      }
    } catch (err) {
      container.innerHTML = `<p style="color:red">Failed to load gadget: ${name}.</p>`;
      console.error(err);
    }
  }
}

// Register the custom element
customElements.define("wxcc-gadget-loader", WxCCGadgetLoader);
