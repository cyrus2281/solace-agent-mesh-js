import solace from "solclientjs";

export interface BrokerConfig {
  url: string;
  vpn: string;
  username: string;
  password: string;
}

export interface PublishOptions {
  deliveryMode?: solace.MessageDeliveryModeType;
  destinationType?: solace.DestinationType;
  dmqEligible?: boolean;
  priority?: number;
  timeToLive?: number;
  replyToTopic?: string;
  correlationId?: string;
  messageType?: solace.MessageType;
  userProperties?: UserPropertiesMap;
}

export interface PublishStats {
  direct: number;
  persistent: number;
}

export interface SubscribeStats {
  direct: number;
  persistent: number;
  nonPersistent: number;
}

export interface Message {
  payload: string;
  topic: string;
  userProperties: { [key: string]: unknown };
  _extension_uid: string;
  metadata: {
    deliveryMode: solace.MessageDeliveryModeType;
    redelivered: boolean;
    senderId: string | null;
    replyTo: string | null;
    correlationId: string | null;
    ttl: number | null;
    senderTimestamp: number | null;
    receiverTimestamp: number;
    priority: number | null;
    isDMQEligible: boolean;
  };
}

export type UserPropertiesMap = {
  [key: string]: {
    value: unknown;
    type: solace.SDTFieldType;
  };
};

export interface AgentConfig {
  broker: BrokerConfig;
  agent: {
    name: string;
    description: string;
    alwaysOpen?: boolean;
  };
  config?: {
    samNamespace?: string;
    registrationInterval?: number;
    embeddingServiceTopic?: string;
    llmServiceTopic?: string;
  };
}

export interface ActionConfig {
  disabled?: boolean;
  name: string;
  description: string;
  params: {
    name: string;
    type?: string;
    desc: string;
  }[];
  examples?: string[];
  requiredScopes?: string[];
}

export interface ActionResponse {
  message: string;
  error_info?: { [key: string]: unknown };
}

export interface ActionCallbackMeta {
  sessionID: string;
}

export type ActionCallback = (
  params: { [key: string]: unknown },
  meta: ActionCallbackMeta
) => Promise<ActionResponse>;
