import {
  ActionConfig,
  ActionCallback,
  ActionCallbackMeta,
  ActionResponse,
} from "./interfaces";
import Agent from "./Agent";

class Action {
  name: string;
  private agent!: Agent;

  constructor(private config: ActionConfig, private action: ActionCallback) {
    this.name = config.name;
  }

  async invoke(
    params: { [key: string]: unknown },
    meta: ActionCallbackMeta
  ): Promise<ActionResponse> {
    console.log("Invoking action with params:", params);
    return await this.action(params, meta);
  }

  getInfo(): { [key: string]: unknown } | null {
    if (this.config.disabled) {
      return null;
    }
    const summary: { [key: string]: unknown } = {};
    const actionName = this.config.name;
    summary[actionName] = {
      desc: this.config.description,
      params: this.config.params.map(
        (param: { name: string; desc: string }) =>
          `${param.name} (${param.desc})`
      ),
      examples: this.config.examples,
      required_scopes: this.config.requiredScopes,
    };
    return summary;
  }

  setAgent(agent: Agent) {
    this.agent = agent;
  }

  getAgent() {
    return this.agent;
  }
}


export default Action;
