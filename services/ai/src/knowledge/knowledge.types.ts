export type KnowledgeCategory = 'PRODUCT_DOC' | 'FAQ' | 'REGULATORY_SUMMARY';

export type KnowledgeLocale = 'en' | 'zh' | 'ms';

export interface KnowledgeSource {
  readonly document: string;
  readonly section: string;
}

export interface KnowledgeEntry {
  readonly id: string;
  readonly title: string;
  readonly category: KnowledgeCategory;
  readonly locale: KnowledgeLocale;
  readonly content: string;
  readonly tags: readonly string[];
  readonly source: KnowledgeSource;
  readonly disclaimerRequired: boolean;
  readonly updatedAt: string;
}

export interface KnowledgeListFilters {
  readonly category?: KnowledgeCategory;
  readonly locale?: KnowledgeLocale;
}

export interface KnowledgeSearchRequest extends KnowledgeListFilters {
  readonly query: string;
  readonly limit?: number;
}

export interface KnowledgeSearchResult extends KnowledgeEntry {
  readonly score: number;
  readonly highlights: readonly string[];
}

export interface AnswerPolicy {
  readonly responseMode: 'grounded_rag_context_only';
  readonly disclaimerRequired: boolean;
  readonly prohibitedAdvice: readonly ['financial', 'legal', 'insurance'];
}

export interface KnowledgeSearchResponse {
  readonly query: string;
  readonly results: readonly KnowledgeSearchResult[];
  readonly answerPolicy: AnswerPolicy;
}
