export type ChatRole = 'user' | 'assistant';

export type ChatLocale = 'en' | 'zh' | 'ms';

export type ChatProviderName = 'anthropic' | 'deepseek';

export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
}

export interface ChatReplyRequest {
  readonly message: string;
  readonly locale?: ChatLocale;
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

export interface ChatAnswerPolicy {
  readonly responseMode: 'grounded_rag_context_only';
  readonly disclaimerRequired: boolean;
  readonly prohibitedAdvice: readonly ['financial', 'legal', 'insurance'];
}

export interface ChatProviderMetadata {
  readonly name: ChatProviderName;
  readonly model: string;
  readonly stopReason?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface ChatReplyResponse {
  readonly message: string;
  readonly citations: readonly ChatCitation[];
  readonly disclaimerRequired: boolean;
  readonly answerPolicy: ChatAnswerPolicy;
  readonly provider: ChatProviderMetadata;
}
