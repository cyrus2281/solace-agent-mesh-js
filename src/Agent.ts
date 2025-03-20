import {
  AgentConfig,
  Message,
  ActionCallbackMeta,
  ActionResponse,
  UserPropertiesMap,
} from "./interfaces";
import SolaceManager from "./SolaceManager";
import Action from "./Action";

const DEFAULT_REGISTRATION_INTERVAL = 30000;
const DEFAULT_SAM_NAMESPACE = "";

class Agent {
  actions: Action[] = [];
  config!: AgentConfig;
  broker!: SolaceManager;

  private _registrationInterval: NodeJS.Timeout | null;
  private sam_namespace: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this._registrationInterval = null;
    this.sam_namespace = config.config?.samNamespace || DEFAULT_SAM_NAMESPACE;
  }

  async run() {
    // validate actions
    if (this.actions.length === 0) {
      throw new Error("No actions found.");
    }
    // Connect to broker
    await this.connect(async (isConnected, error: string | Error | null) => {
      if (isConnected) {
        console.log("Successfully connected to the broker.");
        // register agent
        await this.register();

        // start listening
        await this.startListening();
      } else {
        console.error("Connection to the broker failed:", error);
      }
    });
  }

  async connect(
    onConnect: (isConnected: boolean, error: string | null | Error) => void
  ) {
    try {
      console.log("Connecting to the broker...");
      this.broker = new SolaceManager(this.config.broker, 0);
      this.broker.setOnConnectionStateChange(onConnect);
      await this.broker.connect();
      console.log("Connected to the broker.");
    } catch (error) {
      console.error("Failed to connect to the broker:", error);
      onConnect(false, error as Error);
    }
  }

  async publishRegistrationMessage() {
    const registrationTopic = `${this.sam_namespace}solace-agent-mesh/v1/register/agent/${this.config.agent.name}`;

    const agentSummary = this.getAgentSummary();
    try {
      await this.broker.publish(
        registrationTopic,
        JSON.stringify(agentSummary)
      );
      console.debug(`Agent ${this.config.agent.name} registered.`);
    } catch (error) {
      console.error("Failed to register agent:", error);
    }
  }

  async register() {
    // Register the agent
    console.log("Registering the agent on interval...");
    const interval =
      this.config.config?.registrationInterval || DEFAULT_REGISTRATION_INTERVAL;
    await this.publishRegistrationMessage();

    // send registration message every interval
    this._registrationInterval = setInterval(async () => {
      await this.publishRegistrationMessage();
    }, interval);
  }

  async startListening() {
    console.log("Starting to listen for messages...");
    const snakeCaseAgentName = this.config.agent.name
      .replace(/ /g, "_")
      .replace(/-/g, "_")
      .toLowerCase();
    const topic = `${this.sam_namespace}solace-agent-mesh/v1/actionRequest/*/*/${snakeCaseAgentName}/>`;
    console.log("Listening for messages on:", topic);
    this.broker.setOnMessage(this.invoke.bind(this));
    this.broker.subscribe(topic);
  }

  async invoke(message: Message) {
    console.log("Received message:", message);
    let data;
    if (message.topic.includes("solace-agent-mesh/v1/actionRequest")) {
      try {
        data = JSON.parse(message.payload);
      } catch (error) {
        console.error("Failed to parse message:", error);
        return;
      }

      const sessionID = (message.userProperties.session_id as string) || "";
      const meta: ActionCallbackMeta = {
        sessionID: sessionID,
      };
      const agentName = data.agent_name;
      const actionName = data.action_name;
      const params = data.action_params || {};

      if (agentName !== this.config.agent.name) {
        console.warn(`Agent ${agentName} is not registered with this agent.`);
        return;
      }

      const action = this.actions.find((a) => a.name === actionName);
      if (action) {
        const response: ActionResponse = await action.invoke(params, meta);
        const responseTopic = `${this.sam_namespace}solace-agent-mesh/v1/actionResponse/agent/${agentName}/${actionName}`;
        const err = this.broker.publish(
          responseTopic,
          JSON.stringify({
            action_name: actionName,
            action_params: params,
            message: response.message,
            error_info: response.error_info,
            action_list_id: data.action_list_id,
            action_idx: data.action_idx,
            originator: data.originator,
          }),
          {
            userProperties: message.userProperties as UserPropertiesMap,
          }
        );
        if (err) {
          console.error("Failed to publish response:", err);
        }
      } else {
        console.warn(`Action ${actionName} not found.`);
      }
    }
  }

  addAction(action: Action) {
    this.actions.push(action);
  }

  getAgentSummary() {
    return {
      agent_name: this.config.agent.name,
      description: this.config.agent.description,
      always_open: this.config.agent.alwaysOpen || false,
      actions: this.getActions().map((action) => action.getInfo()),
    };
  }

  getActions() {
    return this.actions;
  }

  clearActions() {
    this.actions = [];
  }

  stop() {
    if (this._registrationInterval) clearInterval(this._registrationInterval);
    this.broker.disconnect();
  }
}

export default Agent;
