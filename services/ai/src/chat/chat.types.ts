import { AnswerPolicy, KnowledgeSearchResult } from '../knowledge/knowledge.types';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
}

export interface ChatReplyRequest {
  readonly message: string;
  readonly locale?: 'en' | 'zh' | 'ms';
  readonly history?: readonly ChatMessage[];
}

export interface ChatCitation {
  readonly id: string;
  readonly title: string;
  readonly source: {
    readonly document: string;
    readonly section: string;
  };
  readonly score: number;
}

export interface ChatProviderMetadata {
  readonly name: 'claude';
  readonly model: string;
  readonly stopReason?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface ChatReplyResponse {
  readonly message: string;
  readonly citations: readonly ChatCitation[];
  readonly disclaimerRequired: boolean;
  readonly answerPolicy: AnswerPolicy;
  readonly provider: ChatProviderMetadata;
}

export interface ClaudeCompletionRequest {
  readonly userMessage: string;
  readonly history: readonly ChatMessage[];
  readonly context: readonly KnowledgeSearchResult[];
  readonly answerPolicy: AnswerPolicy;
}

export interface ClaudeCompletionResponse {
  readonly content: string;
  readonly model: string;
  readonly stopReason?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}
