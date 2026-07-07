import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlock, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { HttpError } from '../shared/http-error';
import {
  ChatMessage,
  ClaudeCompletionRequest,
  ClaudeCompletionResponse
} from './chat.types';

const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
const DEFAULT_MAX_TOKENS = 450;

export interface ClaudeClient {
  complete(request: ClaudeCompletionRequest): Promise<ClaudeCompletionResponse>;
}

export interface ClaudeMessagesGateway {
  create(params: {
    readonly model: string;
    readonly max_tokens: number;
    readonly system: string;
    readonly messages: MessageParam[];
  }): Promise<{
    readonly content: readonly ContentBlock[];
    readonly model: string;
    readonly stop_reason: string | null;
    readonly usage: {
      readonly input_tokens: number;
      readonly output_tokens: number;
    };
  }>;
}

function toMessageParam(message: ChatMessage): MessageParam {
  return { role: message.role, content: message.content };
}

function buildContext(request: ClaudeCompletionRequest): string {
  if (request.context.length === 0) {
    return 'No matching Pusaka knowledge base context was found.';
  }

  return request.context
    .map((entry, index) => {
      const source = `${entry.source.document}#${entry.source.section}`;
      return `[${index + 1}] ${entry.id}\nTitle: ${entry.title}\nSource: ${source}\nContent: ${entry.highlights.join(' ')}`;
    })
    .join('\n\n');
}

function buildSystemPrompt(request: ClaudeCompletionRequest): string {
  return [
    'You are Pusaka support for Willbe, a family resilience planning product.',
    'Answer only from the provided knowledge base context. If context is insufficient, say you do not have enough Pusaka knowledge base context.',
    'Do not provide financial, legal or insurance advice. Do not draft legal documents or recommend investments, policies, wallets or providers.',
    'Keep the answer concise and product-support oriented.',
    request.answerPolicy.disclaimerRequired
      ? 'Include a brief note that the response is product information, not financial, legal or insurance advice.'
      : 'Do not add legalistic disclaimers unless the context requires one.',
    `Knowledge base context:\n${buildContext(request)}`
  ].join('\n\n');
}

function extractText(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

export class AnthropicClaudeClient implements ClaudeClient {
  private readonly messages: ClaudeMessagesGateway;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(options: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    messages?: ClaudeMessagesGateway;
  }) {
    this.messages = options.messages ?? new Anthropic({ apiKey: options.apiKey }).messages;
    this.model = options.model ?? DEFAULT_MODEL;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(request: ClaudeCompletionRequest): Promise<ClaudeCompletionResponse> {
    const messages: MessageParam[] = [
      ...request.history.map(toMessageParam),
      { role: 'user', content: request.userMessage }
    ];
    const message = await this.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: buildSystemPrompt(request),
      messages
    });
    const content = extractText(message.content);

    return {
      content: content || 'I do not have enough Pusaka knowledge base context to answer that.',
      model: message.model,
      stopReason: message.stop_reason ?? undefined,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens
    };
  }
}

export class MissingClaudeClient implements ClaudeClient {
  async complete(_request: ClaudeCompletionRequest): Promise<ClaudeCompletionResponse> {
    throw new HttpError(503, 'Claude provider is not configured');
  }
}

function parseMaxTokens(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const maxTokens = Number(value);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4000) {
    throw new HttpError(503, 'Claude provider is misconfigured');
  }
  return maxTokens;
}

export function createClaudeClientFromEnv(): ClaudeClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new MissingClaudeClient();
  }

  return new AnthropicClaudeClient({
    apiKey,
    model: process.env.ANTHROPIC_MODEL,
    maxTokens: parseMaxTokens(process.env.ANTHROPIC_MAX_TOKENS)
  });
}
