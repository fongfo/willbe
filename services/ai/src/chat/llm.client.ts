import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlock, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { HttpError } from '../shared/http-error';
import {
  ChatMessage,
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProviderName,
  PromptCompletionRequest,
  PromptCompletionResponse
} from './chat.types';

const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-latest';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/anthropic';
const DEFAULT_MAX_TOKENS = 450;

export interface LlmClient {
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

export interface PromptLlmClient {
  completePrompt(request: PromptCompletionRequest): Promise<PromptCompletionResponse>;
}

export interface AnthropicMessagesGateway {
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

function buildContext(request: LlmCompletionRequest): string {
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

function buildSystemPrompt(request: LlmCompletionRequest): string {
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

function displayName(provider: LlmProviderName): string {
  return provider === 'deepseek' ? 'DeepSeek' : 'Anthropic';
}

export class AnthropicCompatibleLlmClient implements LlmClient, PromptLlmClient {
  private readonly messages: AnthropicMessagesGateway;
  private readonly provider: LlmProviderName;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(options: {
    provider: LlmProviderName;
    apiKey: string;
    baseURL?: string;
    model?: string;
    maxTokens?: number;
    messages?: AnthropicMessagesGateway;
  }) {
    this.messages = options.messages ?? new Anthropic({
      apiKey: options.apiKey,
      baseURL: options.baseURL
    }).messages;
    this.provider = options.provider;
    this.model = options.model ?? defaultModel(options.provider);
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
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
      provider: this.provider,
      model: message.model,
      stopReason: message.stop_reason ?? undefined,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens
    };
  }

  async completePrompt(request: PromptCompletionRequest): Promise<PromptCompletionResponse> {
    const message = await this.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userMessage }]
    });
    const content = extractText(message.content);

    return {
      content: content || '{}',
      provider: this.provider,
      model: message.model,
      stopReason: message.stop_reason ?? undefined,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens
    };
  }

  toJSON(): { readonly provider: LlmProviderName; readonly model: string; readonly maxTokens: number } {
    return {
      provider: this.provider,
      model: this.model,
      maxTokens: this.maxTokens
    };
  }
}

export class MissingLlmClient implements LlmClient, PromptLlmClient {
  constructor(private readonly provider: LlmProviderName) {}

  async complete(_request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    throw new HttpError(503, `${displayName(this.provider)} provider is not configured`);
  }

  async completePrompt(_request: PromptCompletionRequest): Promise<PromptCompletionResponse> {
    throw new HttpError(503, `${displayName(this.provider)} provider is not configured`);
  }
}

function defaultModel(provider: LlmProviderName): string {
  return provider === 'deepseek' ? DEFAULT_DEEPSEEK_MODEL : DEFAULT_ANTHROPIC_MODEL;
}

function parseMaxTokens(value: string | undefined, provider: LlmProviderName): number | undefined {
  if (!value) {
    return undefined;
  }
  const maxTokens = Number(value);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4000) {
    throw new HttpError(503, `${displayName(provider)} provider is misconfigured`);
  }
  return maxTokens;
}

function parseProvider(value: string | undefined): LlmProviderName {
  if (!value || value === 'anthropic') {
    return 'anthropic';
  }
  if (value === 'deepseek') {
    return 'deepseek';
  }
  throw new HttpError(503, 'AI provider is misconfigured');
}

export function createLlmClientFromEnv(): LlmClient {
  const provider = parseProvider(process.env.AI_PROVIDER);
  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new MissingLlmClient('deepseek');
    }
    return new AnthropicCompatibleLlmClient({
      provider,
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL,
      maxTokens: parseMaxTokens(process.env.DEEPSEEK_MAX_TOKENS, provider)
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new MissingLlmClient('anthropic');
  }
  return new AnthropicCompatibleLlmClient({
    provider,
    apiKey,
    model: process.env.ANTHROPIC_MODEL,
    maxTokens: parseMaxTokens(process.env.ANTHROPIC_MAX_TOKENS, provider)
  });
}

export function createPromptLlmClientFromEnv(): PromptLlmClient {
  return createLlmClientFromEnv() as LlmClient & PromptLlmClient;
}
