import {
  AnthropicCompatibleLlmClient,
  AnthropicMessagesGateway,
  createLlmClientFromEnv,
  LlmClient,
  MissingLlmClient
} from './llm.client';

export type ClaudeClient = LlmClient;
export type ClaudeMessagesGateway = AnthropicMessagesGateway;

export class AnthropicClaudeClient extends AnthropicCompatibleLlmClient {
  constructor(options: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    messages?: AnthropicMessagesGateway;
  }) {
    super({ provider: 'anthropic', ...options });
  }
}

export class MissingClaudeClient extends MissingLlmClient {
  constructor() {
    super('anthropic');
  }
}

export const createClaudeClientFromEnv = createLlmClientFromEnv;
